/**
 * SHREEJI 3D CAD REAL ESTATE PLOT VIEWER ENGINE
 * Standalone High-Performance WebGL Digital Twin Architecture
 */

(function () {
  "use strict";

  const THREE = window.THREE;
  const OrbitControls = THREE.OrbitControls;
  const GLTFLoader = THREE.GLTFLoader;

  if (!THREE || !OrbitControls || !GLTFLoader) {
    console.error("Three.js or required 3D loaders not loaded.");
    const statusEl = document.getElementById("loader-status");
    if (statusEl) statusEl.textContent = "Error: 3D WebGL libraries failed to initialize.";
    return;
  }

  /* ==========================================================================
     GLOBAL VIEWER STATE
     ========================================================================== */
  const state = {
    currentProjectId: "nagavaladiya",
    projectData: null,
    model: null,
    satellitePlane: null,
    plots: new Map(), // name/id -> mesh
    plotMetadata: new Map(), // name/id -> metadata
    selectedMesh: null,
    hoveredMesh: null,
    activeFilter: null,
    statusColoringEnabled: true,
    satelliteLayerEnabled: true,
    is2DView: false,
    unitMode: "yd2", // 'yd2', 'm2', 'ft2'
    defaultCameraPos: new THREE.Vector3(0, 180, 220),
    defaultCameraTarget: new THREE.Vector3(0, 0, 0),
  };

  /* Status Colors */
  const STATUS_COLORS = {
    110: { name: "Sold", hex: 0xef4444, css: "#EF4444", text: "Sold / Booked" },
    111: { name: "Builder", hex: 0xebc04b, css: "#EBC04B", text: "Builder / Construction" },
    112: { name: "Available", hex: 0x00e676, css: "#00E676", text: "Available for Booking" }
  };

  /* ==========================================================================
     THREE.JS SCENE SETUP
     ========================================================================== */
  const container = document.getElementById("canvas-container");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b14);

  const camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    1,
    8000
  );
  camera.position.copy(state.defaultCameraPos);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.05; // Prevent dipping below ground
  controls.minDistance = 25;
  controls.maxDistance = 1200;
  controls.target.copy(state.defaultCameraTarget);

  /* Lighting */
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
  sunLight.position.set(150, 300, 150);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 1000;
  sunLight.shadow.bias = -0.0005;
  const d = 250;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  scene.add(sunLight);

  const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.4);
  scene.add(hemiLight);

  /* Ground Grid Helper */
  const gridHelper = new THREE.GridHelper(800, 40, 0x1d63ff, 0x1e293b);
  gridHelper.position.y = -0.3;
  scene.add(gridHelper);

  /* Raycasting */
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-999, -999);
  let isDragging = false;
  let pointerDownPos = { x: 0, y: 0 };

  /* ==========================================================================
     PROJECT LOADING PIPELINE
     ========================================================================== */
  async function loadProject(projectId) {
    state.currentProjectId = projectId;
    showLoader(true, `Loading ${projectId === "nagavaladiya" ? "Nagavaladiya (Survey 374)" : "Nakshatra"} AutoCAD 3D Layout...`);

    if (state.model) {
      scene.remove(state.model);
      state.model = null;
    }
    if (state.satellitePlane) {
      scene.remove(state.satellitePlane);
      state.satellitePlane = null;
    }
    state.plots.clear();
    state.plotMetadata.clear();
    closePlotCard();

    try {
      let data = null;

      // 1. Check embedded memory objects
      if (projectId === "nagavaladiya") {
        data = window.PROJECT_NAGAVALADIYA || window.EMBEDDED_PROJECT_NAGAVALADIYA;
      } else if (projectId === "nakshatra") {
        const raw = window.PROJECT_NAKSHATRA || window.EMBEDDED_PROJECT_NAKSHATRA;
        data = raw?.data || raw;
      }

      // 2. Fallback to local JSON files
      if (!data) {
        const jsonPath = `./projects/${projectId}.json`;
        const res = await fetch(jsonPath);
        if (res.ok) {
          data = await res.json();
          if (data && data.data) data = data.data;
        }
      }

      if (!data) {
        throw new Error(`Project dataset '${projectId}' could not be loaded.`);
      }

      state.projectData = data;
      updateUIWithProjectData(data);
      await load3DAssets(data);
      updateStatusLegendCounts();

      showLoader(false);
    } catch (err) {
      console.error("Error loading project:", err);
      showLoader(true, `Failed to load project: ${err.message}`);
    }
  }

  function updateUIWithProjectData(data) {
    const p = data.project || {};
    document.getElementById("header-project-name").textContent = p.name || "Commercial Master Layout";
    document.getElementById("header-location-text").textContent = p.location || "Kutch, Gujarat";
    document.getElementById("header-location-link").href = p.locationLink || "#";
    document.getElementById("header-plots-count").textContent = `${data.plots ? data.plots.length : 0} Master Plots`;

    if (data.plots) {
      data.plots.forEach((meta) => {
        state.plotMetadata.set(String(meta.id), meta);
        state.plotMetadata.set(String(meta.name), meta);
      });
    }
  }

  function load3DAssets(data) {
    return new Promise((resolve, reject) => {
      // 1. Satellite Basemap Texture Plane
      const textureLoader = new THREE.TextureLoader();
      const textureSource = window.EMBEDDED_TEXTURE_DATA_URI || data.project?.mapOverlayImage || "./assets/textures/map_overlay.webp";

      textureLoader.load(
        textureSource,
        (satTexture) => {
          satTexture.encoding = THREE.sRGBEncoding;
          const planeGeo = new THREE.PlaneGeometry(360, 260);
          const planeMat = new THREE.MeshBasicMaterial({
            map: satTexture,
            transparent: true,
            opacity: 0.88,
            depthWrite: false,
          });
          const plane = new THREE.Mesh(planeGeo, planeMat);
          plane.rotation.x = -Math.PI / 2;
          plane.position.y = -0.1;
          scene.add(plane);
          state.satellitePlane = plane;
        },
        undefined,
        (err) => console.warn("Satellite texture could not be loaded, continuing without sat plane:", err)
      );

      // 2. 3D GLTF/GLB Extruded Mesh Model
      const gltfLoader = new GLTFLoader();

      const onModelParsed = (gltf) => {
        const root = gltf.scene;
        state.model = root;

        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            const extraName = child.userData?.name || (child.userData?.gltfExtensions && child.userData.gltfExtensions.name) || "";
            const rawPlotName = extraName || child.name || "";
            const plotName = String(rawPlotName).replace(/^Plot_?/i, "").replace(/^Mesh_?/i, "").trim();
            const fallbackName = String(child.name || "").replace(/^Plot_?/i, "").replace(/^Mesh_?/i, "").trim();

            const meta = state.plotMetadata.get(plotName) || 
                         state.plotMetadata.get(fallbackName) || 
                         state.plotMetadata.get(String(child.name));

            // Discern whether this mesh is an actual plot or background roads/curbs/infrastructure
            const isNumericPlot = !isNaN(parseInt(plotName, 10)) && parseInt(plotName, 10) >= 1 && parseInt(plotName, 10) <= 200;
            const isPlotsChild = child.parent && (child.parent.name === "_Plots" || child.parent.name === "Plots");
            const isPlotMesh = !!meta || isPlotsChild || isNumericPlot;

            if (isPlotMesh) {
              const displayName = (meta && meta.name) ? String(meta.name) : (plotName || fallbackName || child.name);
              const statusId = meta ? meta.statusId : 112;

              child.userData = {
                isPlot: true,
                plotName: displayName,
                statusId: statusId,
                meta: meta,
                originalMaterial: child.material,
              };

              const statusConfig = STATUS_COLORS[statusId] || STATUS_COLORS[112];
              const plotMat = new THREE.MeshStandardMaterial({
                color: statusConfig.hex,
                roughness: 0.35,
                metalness: 0.15,
                emissive: 0x000000,
              });
              child.material = plotMat;

              state.plots.set(String(displayName), child);
              if (plotName && plotName !== displayName) state.plots.set(String(plotName), child);
              if (fallbackName && fallbackName !== displayName) state.plots.set(String(fallbackName), child);
            } else {
              // Context terrain, road, boundary wall
              child.userData = { isPlot: false };
              child.material = new THREE.MeshStandardMaterial({
                color: 0x1a2436,
                roughness: 0.85,
                metalness: 0.1,
              });
            }
          }
        });

        // Center model geometry in view
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        root.position.sub(center);

        scene.add(root);

        // Adjust camera to fit bounding sphere
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const radius = sphere.radius;
        state.defaultCameraPos.set(0, radius * 1.35, radius * 1.55);
        state.defaultCameraTarget.set(0, 0, 0);

        resetCameraHome();
        resolve();
      };

      // Check embedded base64 GLB
      const b64 = window.EMBEDDED_MODEL_B64 || window.EMBEDDED_MODEL_BASE64;
      if (b64) {
        try {
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

          gltfLoader.parse(bytes.buffer, "", onModelParsed, (err) => {
            console.warn("Failed parsing embedded model base64, falling back to GLB file:", err);
            fallbackFileLoad();
          });
          return;
        } catch (e) {
          console.warn("Error decoding embedded model, using file fallback:", e);
        }
      }

      fallbackFileLoad();

      function fallbackFileLoad() {
        const glbPath = data.project?.baseGlb || "./assets/models/SM_Base_Model.glb";
        gltfLoader.load(
          glbPath,
          onModelParsed,
          (progress) => {
            if (progress.total > 0) {
              const pct = Math.round((progress.loaded / progress.total) * 100);
              const fill = document.getElementById("loader-fill");
              if (fill) fill.style.width = `${pct}%`;
            }
          },
          (err) => {
            console.error("GLTF Loader failed:", err);
            reject(err);
          }
        );
      }
    });
  }

  /* ==========================================================================
     INVENTORY & STATUS FILTERING
     ========================================================================== */
  function updateStatusLegendCounts() {
    let available = 0, sold = 0, builder = 0;
    state.plots.forEach((mesh) => {
      const s = mesh.userData.statusId;
      if (s === 110) sold++;
      else if (s === 111) builder++;
      else available++;
    });

    document.getElementById("count-available").textContent = available;
    document.getElementById("count-builder").textContent = builder;
    document.getElementById("count-sold").textContent = sold;
  }

  function applyStatusFilter(filterStatusId) {
    state.activeFilter = filterStatusId;

    document.querySelectorAll(".legend-item").forEach((el) => {
      const fid = parseInt(el.getAttribute("data-filter"), 10);
      if (filterStatusId && fid === filterStatusId) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });

    state.plots.forEach((mesh) => {
      if (!filterStatusId) {
        mesh.visible = true;
      } else {
        mesh.visible = mesh.userData.statusId === filterStatusId;
      }
    });
  }

  function toggleStatusColoring(enabled) {
    state.statusColoringEnabled = enabled;
    const btn = document.getElementById("btn-status-coloring");
    btn.classList.toggle("active", enabled);

    state.plots.forEach((mesh) => {
      if (enabled) {
        const s = mesh.userData.statusId || 112;
        mesh.material.color.setHex(STATUS_COLORS[s]?.hex || 0x00e676);
      } else {
        mesh.material.color.setHex(0xe2e8f0); // Clean CAD neutral white
      }
    });
  }

  function toggleSatelliteLayer(enabled) {
    state.satelliteLayerEnabled = enabled;
    const btn = document.getElementById("btn-satellite-layer");
    btn.classList.toggle("active", enabled);

    if (state.satellitePlane) {
      state.satellitePlane.visible = enabled;
    }
  }

  /* ==========================================================================
     PLOT SELECTION & FLY-TO
     ========================================================================== */
  function selectPlot(plotName) {
    const mesh = state.plots.get(String(plotName));
    if (!mesh) return;

    if (state.selectedMesh && state.selectedMesh !== mesh) {
      if (state.statusColoringEnabled) {
        const s = state.selectedMesh.userData.statusId || 112;
        state.selectedMesh.material.color.setHex(STATUS_COLORS[s]?.hex || 0x00e676);
      } else {
        state.selectedMesh.material.color.setHex(0xe2e8f0);
      }
      state.selectedMesh.material.emissive.setHex(0x000000);
    }

    state.selectedMesh = mesh;
    mesh.material.color.setHex(0x00d2ff); // High-contrast glowing cyan
    mesh.material.emissive.setHex(0x005577);

    openPlotCard(mesh);

    // Smooth Camera Fly-To via GSAP
    const bbox = new THREE.Box3().setFromObject(mesh);
    const center = bbox.getCenter(new THREE.Vector3());

    if (window.gsap) {
      window.gsap.to(controls.target, {
        x: center.x,
        y: center.y,
        z: center.z,
        duration: 1.1,
        ease: "power2.inOut",
      });

      const dist = Math.max(bbox.getSize(new THREE.Vector3()).length() * 2.8, 55);
      window.gsap.to(camera.position, {
        x: center.x + (state.is2DView ? 0 : dist * 0.7),
        y: center.y + (state.is2DView ? dist * 1.5 : dist * 0.9),
        z: center.z + (state.is2DView ? 0.1 : dist * 0.7),
        duration: 1.1,
        ease: "power2.inOut",
      });
    } else {
      controls.target.copy(center);
      camera.position.set(center.x + 60, center.y + 70, center.z + 60);
    }
  }

  function openPlotCard(mesh) {
    const card = document.getElementById("plot-card-drawer");
    const meta = mesh.userData.meta || {};
    const statusId = mesh.userData.statusId || 112;
    const statusConfig = STATUS_COLORS[statusId] || STATUS_COLORS[112];

    const plotName = mesh.userData.plotName || "Plot";
    document.getElementById("card-plot-name").textContent = `Plot #${plotName}`;

    // Status Banner
    const banner = document.getElementById("card-status-banner");
    const statusDot = document.getElementById("card-status-dot");
    const statusText = document.getElementById("card-status-text");

    banner.style.background = `${statusConfig.css}20`;
    banner.style.borderColor = `${statusConfig.css}60`;
    banner.style.color = statusConfig.css;
    statusDot.style.background = statusConfig.css;
    statusText.textContent = statusConfig.text;

    // Dimensions & Facing
    document.getElementById("card-plot-dimensions").textContent = meta.dimensions || "Surveyed Boundary";
    document.getElementById("card-plot-facing").textContent = meta.facing || "Prime Facing";
    document.getElementById("card-plot-road").textContent = meta.roadWidth || "40 Ft Main Avenue";

    // Area Calculation
    updatePlotCardArea(meta);

    // Pricing
    const rate = meta.ratePerYd ? `₹${Number(meta.ratePerYd).toLocaleString("en-IN")}` : "Upon Request";
    const total = meta.totalPrice ? `₹${Number(meta.totalPrice).toLocaleString("en-IN")}` : "Upon Request";
    document.getElementById("card-plot-rate").textContent = rate;
    document.getElementById("card-plot-total").textContent = total;

    // WhatsApp Action Link (Phase 3: +91 98257 99754)
    const waPhone = "919825799754";
    const projectName = document.getElementById("header-project-name").textContent;
    const waText = encodeURIComponent(
      `🏛️ *SHREEJI REAL ESTATE CONSULTANT*\n*New Commercial Plot Inquiry via 3D Map*\n----------------------------------------\n📍 *Project:* ${projectName}\n📐 *Plot Number:* #${plotName}\n📊 *Status:* ${statusConfig.name}\n💰 *Estimated Value:* ${total}\n----------------------------------------\nPlease share master plan layout, survey details & schedule site visit.`
    );
    const waBtn = document.getElementById("btn-card-whatsapp");
    waBtn.href = `https://wa.me/${waPhone}?text=${waText}`;
    waBtn.onclick = function() {
      // Non-blocking telemetry dispatch log
      try {
        fetch("/api/v1/dispatch/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: "3D Map Visitor",
            clientPhone: waPhone,
            messageType: "3d_map_plot_inquiry",
            propertyRef: `Plot #${plotName} - ${projectName}`,
            messageText: `Inquiry on Plot #${plotName} (${projectName})`
          })
        }).catch(() => {});
      } catch (e) {}
    };

    card.classList.add("open");
  }

  function updatePlotCardArea(meta) {
    const areaEl = document.getElementById("card-plot-area");
    if (!areaEl) return;

    const areaM2 = meta ? (meta.area || 180) : 180;
    let formatted = "";

    if (state.unitMode === "yd2") {
      const yd2 = Math.round(areaM2 * 1.19599);
      formatted = `${yd2} Sq.Yards (${Math.round(areaM2)} m²)`;
    } else if (state.unitMode === "ft2") {
      const ft2 = Math.round(areaM2 * 10.7639);
      formatted = `${ft2.toLocaleString("en-IN")} Sq.Feet`;
    } else {
      formatted = `${Math.round(areaM2)} Sq.Meters`;
    }

    areaEl.textContent = formatted;
  }

  function closePlotCard() {
    const card = document.getElementById("plot-card-drawer");
    card.classList.remove("open");

    if (state.selectedMesh) {
      if (state.statusColoringEnabled) {
        const s = state.selectedMesh.userData.statusId || 112;
        state.selectedMesh.material.color.setHex(STATUS_COLORS[s]?.hex || 0x00e676);
      } else {
        state.selectedMesh.material.color.setHex(0xe2e8f0);
      }
      state.selectedMesh.material.emissive.setHex(0x000000);
      state.selectedMesh = null;
    }
  }

  /* ==========================================================================
     CAMERA & VIEW MODES
     ========================================================================== */
  function toggle2D3DView() {
    state.is2DView = !state.is2DView;
    const btn = document.getElementById("btn-view-mode");
    btn.classList.toggle("active", state.is2DView);
    btn.querySelector(".btn-text").textContent = state.is2DView ? "2D" : "3D";

    const targetY = state.is2DView ? 300 : state.defaultCameraPos.y;
    const targetZ = state.is2DView ? 0.1 : state.defaultCameraPos.z;

    if (window.gsap) {
      window.gsap.to(camera.position, {
        x: 0,
        y: targetY,
        z: targetZ,
        duration: 1.2,
        ease: "power2.inOut",
      });
      window.gsap.to(controls.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.2,
        ease: "power2.inOut",
      });
    } else {
      camera.position.set(0, targetY, targetZ);
      controls.target.set(0, 0, 0);
    }
  }

  function alignCompassNorth() {
    const radius = camera.position.distanceTo(controls.target);
    const targetY = camera.position.y;

    if (window.gsap) {
      window.gsap.to(camera.position, {
        x: controls.target.x,
        y: targetY,
        z: controls.target.z + (state.is2DView ? 0.1 : radius),
        duration: 0.8,
        ease: "power2.out",
      });
    } else {
      camera.position.set(controls.target.x, targetY, controls.target.z + radius);
    }
  }

  function resetCameraHome() {
    closePlotCard();
    if (window.gsap) {
      window.gsap.to(camera.position, {
        x: state.defaultCameraPos.x,
        y: state.defaultCameraPos.y,
        z: state.defaultCameraPos.z,
        duration: 1.2,
        ease: "power2.inOut",
      });
      window.gsap.to(controls.target, {
        x: state.defaultCameraTarget.x,
        y: state.defaultCameraTarget.y,
        z: state.defaultCameraTarget.z,
        duration: 1.2,
        ease: "power2.inOut",
      });
    } else {
      camera.position.copy(state.defaultCameraPos);
      controls.target.copy(state.defaultCameraTarget);
    }
  }

  /* Unit Toggle */
  function cycleUnitMode() {
    const modes = ["yd2", "ft2", "m2"];
    const labels = { yd2: "Sq.Yds", ft2: "Sq.Ft", m2: "Sq.M" };
    const idx = (modes.indexOf(state.unitMode) + 1) % modes.length;
    state.unitMode = modes[idx];
    document.getElementById("unit-label").textContent = labels[state.unitMode];

    if (state.selectedMesh) {
      updatePlotCardArea(state.selectedMesh.userData.meta);
    }
  }

  /* ==========================================================================
     SEARCH & AUTOCOMPLETE
     ========================================================================== */
  function setupSearch() {
    const searchInput = document.getElementById("plot-search-input");
    const clearBtn = document.getElementById("search-clear-btn");
    const suggestionsBox = document.getElementById("search-suggestions-box");

    searchInput.addEventListener("input", (e) => {
      const val = e.target.value.trim().toLowerCase();
      clearBtn.classList.toggle("active", val.length > 0);

      if (!val) {
        suggestionsBox.classList.remove("open");
        suggestionsBox.innerHTML = "";
        return;
      }

      const matches = [];
      state.plots.forEach((mesh, name) => {
        if (name.toLowerCase().includes(val)) {
          matches.push(name);
        }
      });

      suggestionsBox.innerHTML = "";
      if (matches.length === 0) {
        suggestionsBox.innerHTML = '<div class="suggestion-item"><span>No matching plots</span></div>';
      } else {
        matches.slice(0, 8).forEach((name) => {
          const mesh = state.plots.get(name);
          const s = mesh?.userData.statusId || 112;
          const config = STATUS_COLORS[s] || STATUS_COLORS[112];

          const item = document.createElement("div");
          item.className = "suggestion-item";
          item.innerHTML = `
            <span><strong>Plot #${name}</strong></span>
            <span class="sugg-status" style="background:${config.css}25; color:${config.css};">${config.name}</span>
          `;
          item.addEventListener("click", () => {
            selectPlot(name);
            suggestionsBox.classList.remove("open");
            searchInput.value = `Plot #${name}`;
          });
          suggestionsBox.appendChild(item);
        });
      }
      suggestionsBox.classList.add("open");
    });

    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearBtn.classList.remove("active");
      suggestionsBox.classList.remove("open");
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-hud-container")) {
        suggestionsBox.classList.remove("open");
      }
    });
  }

  /* ==========================================================================
     RAYCASTING (HOVER & CLICK DETECTION)
     ========================================================================== */
  function setupRaycasting() {
    renderer.domElement.addEventListener("pointerdown", (e) => {
      isDragging = false;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener("pointermove", (e) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 5) isDragging = true;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Hover logic
      raycaster.setFromCamera(mouse, camera);
      const plotMeshes = Array.from(new Set(state.plots.values())).filter((m) => m.visible && m.userData?.isPlot);
      const intersects = raycaster.intersectObjects(plotMeshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        if (state.hoveredMesh !== hitMesh) {
          if (state.hoveredMesh && state.hoveredMesh !== state.selectedMesh) {
            state.hoveredMesh.material.emissive.setHex(0x000000);
          }
          state.hoveredMesh = hitMesh;
          if (hitMesh !== state.selectedMesh) {
            hitMesh.material.emissive.setHex(0x334466);
          }
          container.style.cursor = "pointer";
        }
      } else {
        if (state.hoveredMesh && state.hoveredMesh !== state.selectedMesh) {
          state.hoveredMesh.material.emissive.setHex(0x000000);
        }
        state.hoveredMesh = null;
        container.style.cursor = "default";
      }
    });

    renderer.domElement.addEventListener("pointerup", (e) => {
      if (isDragging) return; // Prevent selection when panning/rotating camera
      if (e.button !== 0) return; // Only left click

      raycaster.setFromCamera(mouse, camera);
      const plotMeshes = Array.from(new Set(state.plots.values())).filter((m) => m.visible && m.userData?.isPlot);
      const intersects = raycaster.intersectObjects(plotMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        selectPlot(hit.userData.plotName);
      }
    });
  }

  /* ==========================================================================
     BOOKING MODAL HANDLER
     ========================================================================== */
  function setupBookingModal() {
    const modal = document.getElementById("cadBookingModal");
    const backdrop = document.getElementById("bookingModalBackdrop");
    const closeBtn = document.getElementById("btnCloseBookingModal");
    const cancelBtn = document.getElementById("btnCancelBookingModal");
    const bookBtn = document.getElementById("btn-card-book");
    const confirmBtn = document.getElementById("btnConfirmBookingInterest");
    const summary = document.getElementById("modalSelectedSummary");

    bookBtn?.addEventListener("click", () => {
      if (!state.selectedMesh) return;
      const meta = state.selectedMesh.userData.meta || {};
      const plotName = state.selectedMesh.userData.plotName || "Selected";
      const total = meta.totalPrice ? `₹${Number(meta.totalPrice).toLocaleString("en-IN")}` : "Upon Request";

      summary.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
          <strong style="color:#FFF;">Plot #${plotName}</strong>
          <span style="color:#00D2FF; font-weight:700;">${total}</span>
        </div>
        <div style="font-size:0.8rem; color:#94A3B8;">
          Project: ${document.getElementById("header-project-name").textContent}<br>
          Dimensions: ${meta.dimensions || "Standard Layout"} • ${meta.facing || "Prime Facing"}
        </div>
      `;

      const kycPortalBtn = document.getElementById("btnProceedToKycPortal");
      if (kycPortalBtn) {
        const pNum = encodeURIComponent(plotName);
        const pProj = encodeURIComponent(state.currentProjectId);
        const pPrice = encodeURIComponent(total);
        const pArea = encodeURIComponent(document.getElementById("card-plot-area")?.textContent || "182.5 Sq.Yds");
        kycPortalBtn.href = `../portal.html?plot=${pNum}&project=${pProj}&price=${pPrice}&area=${pArea}`;
      }

      modal.hidden = false;
    });

    const closeModal = () => { modal.hidden = true; };
    backdrop?.addEventListener("click", closeModal);
    closeBtn?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);

    confirmBtn?.addEventListener("click", () => {
      const waBtn = document.getElementById("btn-card-whatsapp");
      if (waBtn && waBtn.href) {
        window.open(waBtn.href, "_blank", "noopener,noreferrer");
      }
      closeModal();
    });
  }

  /* ==========================================================================
     UI EVENT BINDINGS
     ========================================================================== */
  function setupUI() {
    document.getElementById("btn-view-mode").addEventListener("click", toggle2D3DView);
    document.getElementById("btn-satellite-layer").addEventListener("click", () => toggleSatelliteLayer(!state.satelliteLayerEnabled));
    document.getElementById("btn-status-coloring").addEventListener("click", () => toggleStatusColoring(!state.statusColoringEnabled));
    document.getElementById("btn-unit-mode").addEventListener("click", cycleUnitMode);
    document.getElementById("btn-camera-home").addEventListener("click", resetCameraHome);
    document.getElementById("compass-btn").addEventListener("click", alignCompassNorth);
    document.getElementById("btn-close-plot-card").addEventListener("click", closePlotCard);

    // Project Switcher
    const projectSelect = document.getElementById("project-select");
    projectSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "regalfarms") {
        window.open("https://regalfarms.vercel.app/", "_blank", "noopener,noreferrer");
        projectSelect.value = state.currentProjectId;
        return;
      }
      loadProject(val);
    });

    // Legend items filter
    document.querySelectorAll(".legend-item").forEach((item) => {
      item.addEventListener("click", () => {
        const fid = parseInt(item.getAttribute("data-filter"), 10);
        if (state.activeFilter === fid) {
          applyStatusFilter(null); // Toggle off filter
        } else {
          applyStatusFilter(fid);
        }
      });
    });

    document.getElementById("btn-clear-filter").addEventListener("click", () => {
      applyStatusFilter(null);
    });

    // Responsive resize
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    setupSearch();
    setupRaycasting();
    setupBookingModal();
  }

  function showLoader(show, text) {
    const screen = document.getElementById("loader-screen");
    const status = document.getElementById("loader-status");
    if (!screen) return;
    if (show) {
      screen.classList.remove("hidden");
      if (status && text) status.textContent = text;
    } else {
      screen.classList.add("hidden");
    }
  }

  /* ==========================================================================
     RENDER & COMPASS ANIMATION LOOP
     ========================================================================== */
  function animate() {
    requestAnimationFrame(animate);

    controls.update();

    // Rotate compass dial dynamically with camera azimuth
    if (controls.getAzimuthalAngle) {
      const angle = controls.getAzimuthalAngle();
      const dial = document.getElementById("compass-dial");
      if (dial) {
        dial.style.transform = `rotate(${-angle * (180 / Math.PI)}deg)`;
      }
    }

    renderer.render(scene, camera);
  }

  // Boot Engine
  setupUI();
  loadProject("nagavaladiya");
  animate();
})();
