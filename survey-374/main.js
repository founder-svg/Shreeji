import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

/* ======================
   CONSTANTS
====================== */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let siteContent = {
  whatsapp: {
    phone: "919825799754",
    message: "Hello Shreeji Real Estate, I am interested in Survey 374 Nagavaladiya plots."
  },
  instagram: {
    url: "https://www.instagram.com/regal_group_kutch/"
  },
  instagramUrl: "https://www.instagram.com/regal_group_kutch/",
  info: {
    title: "Survey 374 - Nagavaladiya 3D Master Layout",
    tagline: "Premium Countryside Living & Plotted Master Layout ✨",
    description: "Revenue Survey No. 374, Nagavaladiya, Ta. Anjar, Kutch. RERA-approved master layout featuring wide internal roads, designer entrance arch, landscaped gardens, and high capital growth.",
    location: "State Highway 6, Nagavaladiya, Anjar / Gandhidham Region, Kutch, Gujarat",
    amenities: "Grand Arch Gate, Landscaped Gardens, Kids Play Area, Wide Asphalt Roads, 24/7 Security Cabin, Underground Utilities",
    developer: "Shreeji Real Estate & Regal Group"
  },
  brochure: {
    url: "./media/brochure_1793904406706_Regal_Farm_.pdf",
    filename: "374_Nagavaladiya_Brochure.pdf",
    uploadedAt: "2026-11-05T18:46:46.766Z"
  },
  gallery: [
    { id: "g_1", url: "./media/gallery_1793902296322_1001132651.png", title: "Regal Farm Grand View" },
    { id: "g_2", url: "./media/gallery_1793902327504_1001132653.png", title: "Top View of Entry" },
    { id: "g_3", url: "./media/gallery_1793902368366_1001132652.png", title: "Elegance Pavilion" },
    { id: "g_4", url: "./media/gallery_1793902413839_1001132650.png", title: "Attractive Fountain" },
    { id: "g_5", url: "./media/gallery_1793902445091_1001132654.png", title: "Front Gate Elevation" },
    { id: "g_6", url: "./media/gallery_1793902500684_1001132655.png", title: "Luxury Curve Landscape" },
    { id: "img_1793902637426_frgx", url: "./media/gallery_1793902637401_1000915126.jpg", title: "First Look Masterplan" }
  ],
  websiteLive: true
};

async function loadSiteContent() {
  try {
    const res = await fetch("/api/content", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object") {
        if (typeof data.websiteLive === "boolean") {
          liveSiteControl = data.websiteLive;
          applySiteAccessState();
        }
        const resolvedInstaUrl = typeof data.instagramUrl === "string"
          ? data.instagramUrl
          : (typeof data.instagram?.url === "string" ? data.instagram.url : (siteContent.instagramUrl || ""));

        siteContent = {
          ...siteContent,
          ...data,
          whatsapp: { ...siteContent.whatsapp, ...(data.whatsapp || {}) },
          instagram: { url: resolvedInstaUrl },
          instagramUrl: resolvedInstaUrl,
          info: { ...siteContent.info, ...(data.info || {}) },
          brochure: { ...siteContent.brochure, ...(data.brochure || {}) },
          gallery: Array.isArray(data.gallery) ? data.gallery : siteContent.gallery
        };
      }
    }
  } catch (err) {
    console.warn("Could not load dynamic site content, using default values:", err);
  }
}
loadSiteContent();

const SEARCH_SELECT_DELAY_MS = 200;



/* ======================
   FILL PATH COLORS
====================== */
const PURPLE_FILL_IDS = new Set(["hotel", "132", "path132", "path132commercialhotel"]);
const NON_SALE_FILL_COLOR = 0x59b94c;
const PURPLE_FILL_COLOR = 0xb58ad8;
const NON_SALE_PLOT_IDS = new Set([
  "clubhouse",
  "cafegarden",
  "commonplot940",
  "kidsplay",
  "kidsarea",
  "garden",
  "garden1",
  "garden2",
  "garden3",
  "garden4",
  "garden5",
]);
const AMENITY_FILL_COLORS = Object.freeze({
  clubhouse: 0x59b94c,
  cafegarden: 0x59b94c,
  commonplot940: 0x59b94c,
  kidsplay: 0x59b94c,
  kidsarea: 0x59b94c,
  garden: 0x59b94c,
  garden1: 0x59b94c,
  garden2: 0x59b94c,
  garden3: 0x59b94c,
  garden4: 0x59b94c,
  garden5: 0x59b94c,
});
const AMENITY_TEXTURE_SPECS = Object.freeze({});

/* ======================
   REGAL FARMS GEOGRAPHIC CONSTANTS
====================== */
const REGAL_GEO = {
  center: {
    lng: 69.96751569738975,
    lat: 22.96024639048939,
  },
  bounds: {
    west: 69.96415159774169,
    east: 69.97091188701854,
    north: 22.96249606808901,
    south: 22.95799671288977,
  },
  contentBounds: {
    west: 69.96638719973356,
    east: 69.96864419504593,
    south: 22.95820174679758,
    north: 22.96229103418120,
  },
  rotation: 13.75068950653076,
  latitudeSpan: 0.0044993551992398295,
  longitudeSpan: 0.006760289276854792,
  svg: {
    minX: 20.3404,
    maxX: 194.4679,
    minY: 0.0162,
    maxY: 296.3448,
    width: 174.1275,
    height: 296.3286,
    centerX: 107.4042,
    centerY: 148.1805,
  },
  initialZoom: 16.2,
};
const REGAL_LAYOUT_SCALE = 0.91;

/* ======================
   SCENE
====================== */
const scene = new THREE.Scene();
scene.background = null; // Transparent in satellite mode

/* ======================
   RENDERER (FIXED)
====================== */
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);

/* ✓ CRITICAL */
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.domElement.id = "three-canvas";
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
renderer.domElement.style.zIndex = "1";
renderer.domElement.style.pointerEvents = "none";

document.body.appendChild(renderer.domElement);

/* ======================
   CAMERAS (3D + 2D ORTHO)
====================== */
// Perspective camera for 3D OrbitControls mode
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  5000,
);

// Orthographic camera for 2D Mapbox Satellite mode
const orthographicCamera = new THREE.OrthographicCamera(
  -window.innerWidth / 2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  -window.innerHeight / 2,
  -2000,
  2000,
);
orthographicCamera.position.set(0, 0, 100);
orthographicCamera.lookAt(0, 0, 0);

let activeCamera = orthographicCamera; // Default to 2D satellite mode
let is3DMode = false;

/* ======================
   CONTROLS
====================== */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = true;
controls.enableZoom = true;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
controls.touches.ONE = THREE.TOUCH.PAN;
controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
controls.enabled = false; // Disabled by default in satellite mode

/* ======================
   GROUPS
====================== */
const svgGroup = new THREE.Group();
scene.add(svgGroup);
window.svgGroup = svgGroup;

const layoutContainer = new THREE.Group();
svgGroup.add(layoutContainer);

const DIMENSION_MIN_ZOOM = 17.6;
const SELECT_ZOOM_3D = 20.0;
const SELECT_ZOOM_2D = 20.0;
let isCameraZoomingToPlot = false;
let isCameraMoving = false;
let zoomMoveEndHandler = null;

const selectionOutlineGroup = new THREE.Group();
selectionOutlineGroup.visible = false;
scene.add(selectionOutlineGroup);
window.selectionOutlineGroup = selectionOutlineGroup;

const dimensionLabelsGroup = new THREE.Group();
dimensionLabelsGroup.visible = false;
scene.add(dimensionLabelsGroup);
window.dimensionLabelsGroup = dimensionLabelsGroup;

const dimensionGroup = new THREE.Group();
dimensionGroup.visible = false;
scene.add(dimensionGroup);
window.dimensionGroup = dimensionGroup;

const statusGroup = new THREE.Group();
statusGroup.scale.y = -1;
statusGroup.visible = false;
window.statusGroup = statusGroup;

const statusMeshes = [];
window.statusMeshes = statusMeshes;

const STATUS_WIPE_BOUNDS = {
  minX: 8.0,
  maxX: 200.0,
  feather: 2.5,
  duration: 1000,
};

const statusWipeUniforms = {
  uWipeStart: { value: 8.0 },
  uWipeEnd: { value: 8.0 },
  uFeather: { value: 2.5 },
};
window.statusWipeUniforms = statusWipeUniforms;

function applyStatusWipeShader(material) {
  material.customProgramCacheKey = () => "statusWipeShader";
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWipeStart = statusWipeUniforms.uWipeStart;
    shader.uniforms.uWipeEnd = statusWipeUniforms.uWipeEnd;
    shader.uniforms.uFeather = statusWipeUniforms.uFeather;

    // Use aSvgX (original SVG x, baked at mesh creation) instead of position.x.
    // syncOverlayToMapbox() overwrites position.x with screen-pixel coordinates on
    // every map move, which breaks the wipe bounds (8–200 SVG units). aSvgX is a
    // separate attribute that is never touched by the sync loop, so it always holds
    // the correct SVG x value for the wipe smoothstep.
    shader.vertexShader = `
      attribute float aSvgX;
      varying float vSvgX;
      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vSvgX = aSvgX;`
    );

    shader.fragmentShader = `
      uniform float uWipeStart;
      uniform float uWipeEnd;
      uniform float uFeather;
      varying float vSvgX;
      ${shader.fragmentShader}
    `.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
       float inStart = smoothstep(uWipeStart - uFeather, uWipeStart, vSvgX);
       float inEnd = 1.0 - smoothstep(uWipeEnd, uWipeEnd + uFeather, vSvgX);
       float wipeAlpha = inStart * inEnd;
       if (wipeAlpha <= 0.001) discard;
       gl_FragColor.a *= wipeAlpha;`
    );
  };
}

let statusWipeAnimation = null;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function startStatusWipe(turnOn) {
  const minX = STATUS_WIPE_BOUNDS.minX;
  const maxX = STATUS_WIPE_BOUNDS.maxX;
  const duration = STATUS_WIPE_BOUNDS.duration;

  statusGroup.visible = true;

  if (turnOn) {
    const startEndVal = Math.max(minX, Math.min(maxX, statusWipeUniforms.uWipeEnd.value));
    const targetEndVal = maxX;
    const startStartVal = statusWipeUniforms.uWipeStart.value;
    const targetStartVal = minX;

    const dist = Math.abs(targetEndVal - startEndVal) / (maxX - minX);
    const animDuration = Math.max(300, duration * (dist > 0.05 ? dist : 1.0));

    statusWipeAnimation = {
      turnOn: true,
      startTime: performance.now(),
      duration: animDuration,
      startEndVal,
      targetEndVal,
      startStartVal,
      targetStartVal,
    };
  } else {
    const startVal = Math.max(minX, statusWipeUniforms.uWipeStart.value);
    const targetVal = Math.max(startVal, statusWipeUniforms.uWipeEnd.value);

    const dist = Math.abs(targetVal - startVal) / (maxX - minX);
    const animDuration = Math.max(300, duration * (dist > 0.05 ? dist : 1.0));

    statusWipeAnimation = {
      turnOn: false,
      startTime: performance.now(),
      duration: animDuration,
      startStartVal: startVal,
      targetStartVal: targetVal,
    };
  }
}

function updateStatusWipeAnimation(now) {
  if (!statusWipeAnimation) return;
  const anim = statusWipeAnimation;
  const elapsed = now - anim.startTime;
  const progress = Math.min(1.0, elapsed / anim.duration);
  const eased = easeInOutCubic(progress);

  if (anim.turnOn) {
    statusWipeUniforms.uWipeEnd.value = THREE.MathUtils.lerp(anim.startEndVal, anim.targetEndVal, eased);
    statusWipeUniforms.uWipeStart.value = THREE.MathUtils.lerp(anim.startStartVal, anim.targetStartVal, eased);

    if (progress >= 1.0) {
      statusWipeUniforms.uWipeStart.value = STATUS_WIPE_BOUNDS.minX;
      statusWipeUniforms.uWipeEnd.value = STATUS_WIPE_BOUNDS.maxX;
      statusWipeAnimation = null;
    }
  } else {
    statusWipeUniforms.uWipeStart.value = THREE.MathUtils.lerp(anim.startStartVal, anim.targetStartVal, eased);

    if (progress >= 1.0) {
      statusWipeUniforms.uWipeStart.value = STATUS_WIPE_BOUNDS.minX;
      statusWipeUniforms.uWipeEnd.value = STATUS_WIPE_BOUNDS.minX;
      statusGroup.visible = false;
      statusWipeAnimation = null;
    }
  }
}
window.startStatusWipe = startStatusWipe;

const plotLabelsGroup = new THREE.Group();
plotLabelsGroup.scale.y = -1;
let outlineGroup = null;

/* ======================
   LOADERS
====================== */
const loader = new SVGLoader();

/* ======================
   INTERACTION
====================== */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const plotMeshes = [];
window.plotMeshes = plotMeshes;

let panZoomAnimation = null;
let introAnimation = null;
let resetViewAnimation = null;
let lastSelectedMesh = null;
let defaultCameraState = null;
let searchSelectTimeoutId = null;

/* ======================
   UI ACTIONS
====================== */
const GALLERY_MANIFEST_PATH = "./gallery/manifest.json";
const PLOT_AREAS_CSV_PATH = "./plot_areas.csv";
const PLOT_DIMENSIONS_CSV_PATHS = ["./plot_data.csv"];
const PLOT_DIMENSIONS_BY_SVGID_PATH = "./plot_dimensions_by_svg_id.json";
const SITE_CONTROL_STORAGE_KEY = "siteAccessControlV1";
const DEFAULT_PLOT_STATUS = "available";
const DEFAULT_SITE_ENABLED = true;

const PLOT_STATUS_COLORS = {
  available: 0x1e88e5,
  sold: 0xe53935,
  construction: 0xf9a825,
};

const uiPanel = document.querySelector(".ui-bottom-panel");
const whatsappBtn = document.querySelector(".js-whatsapp-btn");
const instagramBtn = document.querySelector(".js-instagram-btn");
const statusToggle = document.querySelector(".js-status-toggle");
const statusLegend = document.querySelector(".js-status-legend");
const twoDButton = document.querySelector(".js-2d-btn");
const mapBtn = document.querySelector(".js-map-btn");
const homeBtn = document.querySelector(".js-home-btn");
const shareBtn = document.querySelector(".js-share-btn");
const galleryBtn = document.querySelector(".js-gallery-btn");
const gpsBtn = document.querySelector(".js-gps-btn");
const brochureBtn = document.querySelector(".js-brochure-btn");
const infoBtn = document.querySelector(".js-info-btn");
const locateBtn = document.querySelector(".js-locate-btn");
const searchPill = document.querySelector(".ui-search-pill");
const searchInput = document.querySelector(".ui-search-input");

const modalBackdrop = document.getElementById("uiModalBackdrop");
const modalTitle = document.getElementById("uiModalTitle");
const modalBody = document.getElementById("uiModalBody");
const modalCloseBtn = document.querySelector(".ui-modal-close");

let statusModeEnabled = statusToggle?.getAttribute("aria-pressed") === "true";
let plotStatuses = {};
let plotAreasById = new Map();
let plotDimensionsById = new Map();
let plotDimensionsBySvgId = {}; // keyed by raw SVG path id
const plotLabelStates = [];
const PLOT_LABEL_ANIMATION_SPEED = 0.14;

let map = null;
let mapboxToken = null;
let originalLayoutProjection = null;

function getMetersPerDegree() {
  const latRad = REGAL_GEO.center.lat * (Math.PI / 180);
  return {
    lat: 111320,
    lng: 111320 * Math.cos(latRad),
  };
}

const REGAL_GEO_METERS = (() => {
  const metersPerDegree = getMetersPerDegree();
  const bounds = REGAL_GEO.contentBounds;
  return {
    metersPerSvgX: (((bounds.east - bounds.west) * metersPerDegree.lng) / REGAL_GEO.svg.width) * REGAL_LAYOUT_SCALE,
    metersPerSvgY: (((bounds.north - bounds.south) * metersPerDegree.lat) / REGAL_GEO.svg.height) * REGAL_LAYOUT_SCALE,
    metersPerDegree,
  };
})();

function layoutWorldToLngLat(worldX, worldY) {
  const rotationRad = REGAL_GEO.rotation * (Math.PI / 180);
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  const east = worldX * REGAL_GEO_METERS.metersPerSvgX;
  const north = worldY * REGAL_GEO_METERS.metersPerSvgY;
  const rotatedEast = east * cos - north * sin;
  const rotatedNorth = east * sin + north * cos;

  return [
    REGAL_GEO.center.lng + rotatedEast / REGAL_GEO_METERS.metersPerDegree.lng,
    REGAL_GEO.center.lat + rotatedNorth / REGAL_GEO_METERS.metersPerDegree.lat,
  ];
}

function projectLayoutWorldToScreen(worldPoint) {
  const pixel = map.project(layoutWorldToLngLat(worldPoint.x, worldPoint.y));
  return new THREE.Vector3(
    pixel.x - window.innerWidth / 2,
    window.innerHeight / 2 - pixel.y,
    worldPoint.z,
  );
}

function getOriginalMeshWorldCenter(mesh) {
  if (!mesh) return null;

  if (mesh.userData?.sourceWorldCenter) {
    return mesh.userData.sourceWorldCenter.clone();
  }

  const box = new THREE.Box3().setFromObject(mesh);
  if (box.isEmpty()) return null;
  return box.getCenter(new THREE.Vector3());
}

function captureOriginalLayoutProjection() {
  svgGroup.position.set(0, 0, 0);
  svgGroup.scale.set(1, 1, 1);
  svgGroup.rotation.set(0, 0, 0);
  svgGroup.updateMatrixWorld(true);

  const geometries = [];
  const capturedGeometries = new WeakSet();
  const sprites = [];

  svgGroup.traverse((object) => {
    if (object.isSprite) {
      sprites.push({
        object,
        worldPosition: object.getWorldPosition(new THREE.Vector3()),
        localPosition: object.position.clone(),
        localScale: object.scale.clone(),
        localRotation: object.material.rotation || 0,
      });
      return;
    }

    const geometry = object.geometry;
    const position = geometry?.getAttribute?.("position");
    if (!position || capturedGeometries.has(geometry)) return;

    capturedGeometries.add(geometry);

    const localPositions = new Float32Array(position.array);
    const worldPositions = [];
    for (let i = 0; i < position.count; i += 1) {
      const worldPosition = new THREE.Vector3(
        position.getX(i),
        position.getY(i),
        position.getZ(i),
      );
      worldPosition.applyMatrix4(object.matrixWorld);
      worldPositions.push(worldPosition);
    }

    geometries.push({
      object,
      geometry,
      localPositions,
      worldPositions,
    });
  });

  originalLayoutProjection = { geometries, sprites };

  plotMeshes.forEach((mesh) => {
    const sourceWorldCenter = new THREE.Box3()
      .setFromObject(mesh)
      .getCenter(new THREE.Vector3());
    mesh.userData.sourceWorldCenter = sourceWorldCenter;
    mesh.userData.sourceLngLat = layoutWorldToLngLat(
      sourceWorldCenter.x,
      sourceWorldCenter.y,
    );
  });

  window.layoutWorldToLngLat = layoutWorldToLngLat;
  window.projectLayoutWorldToScreen = projectLayoutWorldToScreen;
}

function restoreOriginalLayoutProjection() {
  if (!originalLayoutProjection) return;

  originalLayoutProjection.geometries.forEach((record) => {
    const position = record.geometry.getAttribute("position");
    position.array.set(record.localPositions);
    position.needsUpdate = true;
    record.geometry.computeBoundingSphere();
    record.geometry.computeBoundingBox();
  });

  originalLayoutProjection.sprites.forEach((record) => {
    record.object.position.copy(record.localPosition);
    record.object.scale.copy(record.localScale);
  });
}

function syncOverlayToMapbox() {
  if (!map || !originalLayoutProjection) return;

  svgGroup.position.set(0, 0, 0);
  svgGroup.scale.set(1, 1, 1);
  svgGroup.rotation.set(0, 0, 0);
  svgGroup.updateMatrixWorld(true);

  originalLayoutProjection.geometries.forEach((record) => {
    record.object.updateMatrixWorld(true);
    const inverseWorld = new THREE.Matrix4().copy(record.object.matrixWorld).invert();
    const position = record.geometry.getAttribute("position");

    for (let i = 0; i < position.count; i += 1) {
      const projected = projectLayoutWorldToScreen(record.worldPositions[i]);
      projected.applyMatrix4(inverseWorld);
      position.setXYZ(i, projected.x, projected.y, projected.z);
    }

    position.needsUpdate = true;
    record.geometry.computeBoundingSphere();
    record.geometry.computeBoundingBox();
  });

  originalLayoutProjection.sprites.forEach((record) => {
    const projected = projectLayoutWorldToScreen(record.worldPosition);
    const parentInverse = new THREE.Matrix4()
      .copy(record.object.parent.matrixWorld)
      .invert();
    const localPosition = projected.clone().applyMatrix4(parentInverse);
    record.object.position.copy(localPosition);

    const projectedX = projectLayoutWorldToScreen(
      record.worldPosition.clone().add(new THREE.Vector3(1, 0, 0)),
    );
    const projectedY = projectLayoutWorldToScreen(
      record.worldPosition.clone().add(new THREE.Vector3(0, 1, 0)),
    );

    if (record.object.userData.isNumberPlot || record.object.userData.isCommercialPlot) {
      // Anchor to map plane: scale along rotated layout axes so numbers tilt and perspective-scale with ground in 3D
      const localRot = record.localRotation || 0;
      const u = new THREE.Vector3(Math.cos(localRot), Math.sin(localRot), 0);
      const v = new THREE.Vector3(-Math.sin(localRot), Math.cos(localRot), 0);
      const pU = projectLayoutWorldToScreen(record.worldPosition.clone().add(u));
      const pV = projectLayoutWorldToScreen(record.worldPosition.clone().add(v));
      const scaleXPerUnit = Math.max(0.001, projected.distanceTo(pU));
      const scaleYPerUnit = Math.max(0.001, projected.distanceTo(pV));

      const projectedScaleX = record.localScale.x * scaleXPerUnit;
      const projectedScaleY = record.localScale.y * scaleYPerUnit;
      record.object.scale.set(projectedScaleX, projectedScaleY, record.localScale.z);
      record.object.userData.mapProjectedBaseScaleX = projectedScaleX;
      record.object.userData.mapProjectedBaseScaleY = projectedScaleY;
      record.object.userData.mapProjectedPixelScale = (scaleXPerUnit + scaleYPerUnit) / 2;
      record.object.userData.scaleYPerUnit = scaleYPerUnit;

      const screenAngle = Math.atan2(pU.y - projected.y, pU.x - projected.x);
      record.object.material.rotation = screenAngle;
    } else {
      const pixelScale = Math.max(
        0.001,
        (projected.distanceTo(projectedX) + projected.distanceTo(projectedY)) / 2,
      );
      const projectedScaleX = record.localScale.x * pixelScale;
      const projectedScaleY = record.localScale.y * pixelScale;
      record.object.scale.set(projectedScaleX, projectedScaleY, record.localScale.z);
      record.object.userData.mapProjectedBaseScaleX = projectedScaleX;
      record.object.userData.mapProjectedBaseScaleY = projectedScaleY;
      record.object.userData.mapProjectedPixelScale = pixelScale;

      const dx = projectedX.x - projected.x;
      const dy = projectedX.y - projected.y;
      record.object.material.rotation = Math.atan2(dy, dx) + (record.localRotation || 0);
    }
  });

  if (window.slabGroup) {
    const currentPitch = map.getPitch();
    const slabProgress = Math.sin((currentPitch * Math.PI) / 180);
    window.slabGroup.visible = currentPitch > 5;
    window.slabGroup.position.set(0, -slabProgress * 3.5, -0.2);
  }

  if (lastSelectedMesh) {
    updateSelectionOutline(lastSelectedMesh);
    if (!isCameraMoving && !isCameraZoomingToPlot && map.getZoom() >= DIMENSION_MIN_ZOOM) {
      updateDimensionLabels(lastSelectedMesh);
    } else {
      dimensionLabelsGroup.visible = false;
    }
  }
}

// Default verified Mapbox satellite token (fallback for static hosting / GitHub Pages)
let DEFAULT_MAPBOX_TOKEN = (typeof atob === 'function')
  ? atob('cGsuZXlKMUlqb2ljMkZ0WVhsaFozSmhkMkZzSWl3aVlTSTZJbU50ZFdwaVpXcHZNVEZuWnpBeWQzTnBZV1JyZURCNWVXVWlmUS5sMmpmX1d0c3ludXNoTi1TamdqazRB')
  : '';

// High-Resolution Google Earth Hybrid Satellite & Esri World Imagery Style (100% Free, Zero Rate-Limits / Never 429)
const GOOGLE_EARTH_SATELLITE_STYLE = {
  version: 8,
  sources: {
    "google-satellite": {
      type: "raster",
      tiles: [
        "https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
        "https://mt1.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
        "https://mt2.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
        "https://mt3.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution: "© Google Earth Imagery"
    },
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© Esri World Imagery"
    }
  },
  layers: [
    {
      id: "satellite-layer",
      type: "raster",
      source: "google-satellite",
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

async function initializeMapbox() {
  try {
    let config = {};
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        config = await res.json().catch(() => ({}));
      }
    } catch (_) {
      // Static host or offline fallback
    }

    mapboxToken = config.mapboxToken || DEFAULT_MAPBOX_TOKEN;
    if (!mapboxToken) mapboxToken = DEFAULT_MAPBOX_TOKEN;

    if (typeof mapboxgl === "undefined") {
      console.error("[Mapbox] mapboxgl library not loaded");
      return;
    }

    const chosenStyle = (config.useMapboxStyle && mapboxToken)
      ? "mapbox://styles/mapbox/satellite-streets-v12"
      : GOOGLE_EARTH_SATELLITE_STYLE;

    mapboxgl.accessToken = mapboxToken;
    map = new mapboxgl.Map({
      container: "map",
      style: chosenStyle,
      center: [REGAL_GEO.center.lng, REGAL_GEO.center.lat],
      zoom: REGAL_GEO.initialZoom,
      bearing: 0,
      pitch: 0,
      attributionControl: false,
      antialias: true,
      maxPitch: 80,
      dragRotate: true,
      touchPitch: true,
    });
    window.map = map;

    map.on("error", (e) => {
      if (e && (e.status === 429 || (e.error && e.error.status === 429))) {
        console.warn("[Mapbox] Quota reached, seamlessly engaging Google Earth Satellite basemap");
        try {
          if (map && map.getStyle() !== GOOGLE_EARTH_SATELLITE_STYLE) {
            map.setStyle(GOOGLE_EARTH_SATELLITE_STYLE);
          }
        } catch (_) {}
      }
    });

    function configureMapboxLabels() {
      if (!map) return;
      try {
        // 1. Administrative & Locality labels (Villages, towns, localities)
        if (map.getLayer("settlement-subdivision-label")) {
          map.setLayerZoomRange("settlement-subdivision-label", 10, 24);
          map.setPaintProperty("settlement-subdivision-label", "text-halo-width", 1.5);
          map.setPaintProperty("settlement-subdivision-label", "text-halo-color", "rgba(0, 0, 0, 0.85)");
        }
        if (map.getLayer("settlement-minor-label")) {
          map.setLayerZoomRange("settlement-minor-label", 8, 24);
          map.setPaintProperty("settlement-minor-label", "text-halo-width", 1.5);
          map.setPaintProperty("settlement-minor-label", "text-halo-color", "rgba(0, 0, 0, 0.85)");
        }
        if (map.getLayer("settlement-major-label")) {
          map.setLayerZoomRange("settlement-major-label", 2, 24);
          map.setPaintProperty("settlement-major-label", "text-halo-width", 1.5);
          map.setPaintProperty("settlement-major-label", "text-halo-color", "rgba(0, 0, 0, 0.85)");
        }

        // 2. Transportation labels (Highways, roads, streets, shields)
        if (map.getLayer("road-label")) {
          map.setPaintProperty("road-label", "text-halo-width", 1.5);
          map.setPaintProperty("road-label", "text-halo-color", "rgba(0, 0, 0, 0.85)");
        }

        // 3. POI labels (Temples, schools, hospitals, petrol pumps, businesses, landmarks)
        if (map.getLayer("poi-label")) {
          map.setLayerZoomRange("poi-label", 11, 24);
          map.setPaintProperty("poi-label", "text-halo-width", 1.5);
          map.setPaintProperty("poi-label", "text-halo-color", "rgba(0, 0, 0, 0.85)");
          map.setPaintProperty("poi-label", "icon-opacity", [
            "step",
            ["zoom"],
            0.85,
            14,
            1.0,
          ]);
        }

        // 4. Transit labels (Railway stations, stops)
        if (map.getLayer("transit-label")) {
          map.setLayerZoomRange("transit-label", 10, 24);
        }      } catch (err) {
        console.warn("[Mapbox] Label configuration note:", err);
      }
    }

    function addSubtleGroundGrid() {
      if (!map || map.getSource("regal-ground-grid")) return;
      const minLng = REGAL_GEO.bounds.west - 0.006;
      const maxLng = REGAL_GEO.bounds.east + 0.006;
      const minLat = REGAL_GEO.bounds.south - 0.005;
      const maxLat = REGAL_GEO.bounds.north + 0.005;

      const stepLng = 0.0008;
      const stepLat = 0.0007;
      const features = [];

      for (let lng = minLng; lng <= maxLng; lng += stepLng) {
        features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [lng, minLat],
              [lng, maxLat],
            ],
          },
        });
      }

      for (let lat = minLat; lat <= maxLat; lat += stepLat) {
        features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [minLng, lat],
              [maxLng, lat],
            ],
          },
        });
      }

      try {
        map.addSource("regal-ground-grid", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features,
          },
        });

        map.addLayer({
          id: "regal-ground-grid-layer",
          type: "line",
          source: "regal-ground-grid",
          paint: {
            "line-color": "#ffffff",
            "line-opacity": 0.08,
            "line-width": 0.8,
          },
        });
      } catch (err) {
        console.warn("[Mapbox] Ground grid note:", err);
      }
    }

    function addRoadCorridorsLayer() {
      if (!map || map.getSource("regal-roads")) return;
      try {
        map.addSource("regal-roads", {
          type: "geojson",
          data: "./data/roads.geojson",
        });

        const beforeLayerId = map.getLayer("regal-ground-grid-layer")
          ? "regal-ground-grid-layer"
          : undefined;

        map.addLayer(
          {
            id: "regal-roads-layer",
            type: "fill",
            source: "regal-roads",
            paint: {
              "fill-color": "#26282b",
              "fill-opacity": 0.95,
            },
          },
          beforeLayerId,
        );

        // BEGIN_CENTERLINES
        // Road centerlines + width labels (auto-generated by generate_centerlines.mjs)
        if (!map.getSource("regal-centerlines")) {
          map.addSource("regal-centerlines", {
            type: "geojson",
            data: "./data/roads-centerlines.geojson",
          });
          map.addLayer({
            id: "regal-centerlines-layer",
            type: "line",
            source: "regal-centerlines",
            layout: {
              "line-cap": "butt",
              "line-join": "round",
            },
            paint: {
              "line-color": "#ffffff",
              "line-width": 1.2,
              "line-opacity": 0.65,
              "line-dasharray": [5, 7],
            },
          });
          map.addLayer({
            id: "regal-road-labels-layer",
            type: "symbol",
            source: "regal-centerlines",
            layout: {
              "symbol-placement": "line",
              "text-field": ["get", "label"],
              "text-size": 11,
              "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
              "text-rotation-alignment": "map",
              "text-pitch-alignment": "viewport",
              "text-max-angle": 25,
              "symbol-spacing": 280,
              "text-keep-upright": true,
              "text-letter-spacing": 0.05,
            },
            paint: {
              "text-color": "#c8c8c8",
              "text-opacity": 0.8,
              "text-halo-width": 0,
            },
          });
        }
        // END_CENTERLINES
      } catch (err) {
        console.warn("[Mapbox] Roads layer note:", err);
      }
    }

    map.on("style.load", () => {
      configureMapboxLabels();
      addSubtleGroundGrid();
      addRoadCorridorsLayer();
      syncOverlayToMapbox();
    });

    map.on("load", () => {
      configureMapboxLabels();
      addSubtleGroundGrid();
      addRoadCorridorsLayer();
      syncOverlayToMapbox();
      update3DButtonState();
      updateCompassWidget();
    });

    map.on("render", () => {
      syncOverlayToMapbox();
    });

    map.on("movestart", () => {
      isCameraMoving = true;
      if (dimensionLabelsGroup) {
        dimensionLabelsGroup.visible = false;
      }
    });

    map.on("move", () => {
      syncOverlayToMapbox();
      update3DButtonState();
      updateCompassWidget();
    });

    map.on("moveend", () => {
      isCameraMoving = false;
      if (!isCameraZoomingToPlot && lastSelectedMesh) {
        if (map.getZoom() >= DIMENSION_MIN_ZOOM) {
          updateDimensionLabels(lastSelectedMesh);
        } else {
          dimensionLabelsGroup.visible = false;
        }
      }
    });

    map.on("zoom", () => {
      if (lastSelectedMesh) {
        if (map.getZoom() < DIMENSION_MIN_ZOOM || isCameraMoving || isCameraZoomingToPlot) {
          dimensionLabelsGroup.visible = false;
        } else {
          updateDimensionLabels(lastSelectedMesh);
        }
      }
    });

    map.on("pitch", () => {
      update3DButtonState();
    });

    map.on("rotate", () => {
      updateCompassWidget();
    });

    map.on("resize", () => {
      syncOverlayToMapbox();
    });

    map.on("click", (e) => {
      handlePlotRaycast(e.originalEvent.clientX, e.originalEvent.clientY);
    });

    map.on("mousemove", (e) => {
      const isOverPlot = isSelectablePlotAt(
        e.originalEvent.clientX,
        e.originalEvent.clientY,
      );
      map.getCanvas().style.cursor = isOverPlot ? "pointer" : "";
    });

    map.on("mouseout", () => {
      if (map) map.getCanvas().style.cursor = "";
    });
  } catch (err) {
    console.error("[Mapbox] Initialization error:", err);
  }
}

function update3DButtonState() {
  if (!twoDButton || !map) return;
  const currentPitch = map.getPitch();
  const is3D = currentPitch > 15;
  is3DMode = is3D;

  const img = twoDButton.querySelector("img");
  if (img) {
    img.src = is3D ? "./icons/2d.png" : "./icons/3d.png";
    img.alt = is3D ? "2D" : "3D";
  }
  twoDButton.setAttribute(
    "aria-label",
    is3D ? "Toggle 2D view" : "Toggle 3D view",
  );
  twoDButton.setAttribute(
    "title",
    is3D ? "Toggle 2D view" : "Toggle 3D view",
  );
  twoDButton.setAttribute("aria-pressed", String(is3D));
}

function updateCompassWidget() {
  const dial = document.querySelector(".js-compass-dial");
  if (!dial || !map) return;
  const bearing = map.getBearing();
  dial.style.transform = `rotate(${-bearing}deg)`;
}

function toggle3DMode(targetEnabled) {
  if (!map) return;
  const currentPitch = map.getPitch();
  const willBe3D = typeof targetEnabled === "boolean" ? targetEnabled : currentPitch < 15;
  const targetPitch = willBe3D ? 58 : 0;

  map.easeTo({
    pitch: targetPitch,
    duration: 1000,
    easing: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
    essential: true,
  });
}

function updateStatusLegendVisibility() {
  if (!statusLegend) return;
  statusLegend.classList.toggle("is-visible", statusModeEnabled);
  statusLegend.setAttribute("aria-hidden", String(!statusModeEnabled));
}

updateStatusLegendVisibility();

function normalizePlotStatus(status) {
  if (status === "sold") return "sold";
  if (status === "construction") return "construction";
  return "available";
}

function normalizeSearchKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const textureCache = new Map();

function createKidsPlayTexture() {
  const size = 180;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Base sandy ground.
  ctx.fillStyle = "#c9b07b";
  ctx.fillRect(0, 0, size, size);

  // Subtle grain.
  for (let i = 0; i < 260; i += 1) {
    const r = Math.random() * 1.5 + 0.3;
    const x = Math.random() * size;
    const y = Math.random() * size;
    const a = Math.random() * 0.12 + 0.04;
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Trees (low-poly canopy + shadow).
  const treeCount = 5;
  for (let i = 0; i < treeCount; i += 1) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const canopyR = Math.random() * 10 + 12;
    const angleStep = (Math.PI * 2) / 7;
    const g = 120 + Math.floor(Math.random() * 40);
    ctx.fillStyle = `rgb(90, ${g}, 70)`;
    ctx.beginPath();
    for (let j = 0; j < 7; j += 1) {
      const ang = j * angleStep;
      const r = canopyR * (0.65 + Math.random() * 0.5);
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.arc(cx, cy + canopyR * 0.2, canopyR * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgb(160, 160, 160)";
    ctx.beginPath();
    ctx.arc(cx, cy + canopyR * 0.8, canopyR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Kids slide icon.
  const slideX = size * 0.18;
  const slideY = size * 0.68;
  const slideW = size * 0.28;
  const slideH = size * 0.18;
  ctx.fillStyle = "rgba(80, 80, 80, 0.7)";
  ctx.fillRect(slideX + slideW * 0.6, slideY - slideH * 0.3, slideW * 0.3, slideH * 0.9);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(slideX, slideY);
  ctx.lineTo(slideX + slideW * 0.85, slideY + slideH * 0.2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(slideX + slideW * 0.15, slideY - slideH * 0.3, 6, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createBoxCricketTexture() {
  const width = 1024;
  const height = 640;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Field base with gentle gradient.
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#9cc453");
  grad.addColorStop(0.55, "#93bf4b");
  grad.addColorStop(1, "#8ab742");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle grass texture.
  for (let i = 0; i < 1400; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const len = 6 + Math.random() * 10;
    const angle = (Math.random() * Math.PI) / 2 - Math.PI / 4;
    const alpha = 0.05 + Math.random() * 0.08;
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Pitch block.
  const pitchW = width * 0.42;
  const pitchH = height * 0.16;
  const pitchX = (width - pitchW) / 2;
  const pitchY = height * 0.48;
  const pitchGrad = ctx.createLinearGradient(pitchX, pitchY, pitchX + pitchW, pitchY);
  pitchGrad.addColorStop(0, "#e4d2a8");
  pitchGrad.addColorStop(0.5, "#ecdcb7");
  pitchGrad.addColorStop(1, "#e4d2a8");
  ctx.fillStyle = pitchGrad;
  ctx.fillRect(pitchX, pitchY, pitchW, pitchH);

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3;
  ctx.strokeRect(pitchX, pitchY, pitchW, pitchH);

  // Crease lines.
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pitchX + pitchW * 0.1, pitchY + pitchH * 0.1);
  ctx.lineTo(pitchX + pitchW * 0.1, pitchY + pitchH * 0.9);
  ctx.moveTo(pitchX + pitchW * 0.9, pitchY + pitchH * 0.1);
  ctx.lineTo(pitchX + pitchW * 0.9, pitchY + pitchH * 0.9);
  ctx.stroke();

  // Title.
  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 92px Arial";
  ctx.fillText("BOX CRICKET", width / 2, height * 0.38);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.center.set(0.5, 0.5);
  texture.rotation = (35 * Math.PI) / 180;
  texture.needsUpdate = true;
  return texture;
}

function createTennisCourtTexture() {
  const width = 1024;
  const height = 640;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Court base with soft gradient.
  const baseGrad = ctx.createLinearGradient(0, 0, width, height);
  baseGrad.addColorStop(0, "#2f8f3f");
  baseGrad.addColorStop(0.6, "#2a8739");
  baseGrad.addColorStop(1, "#247f33");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // Court rectangle.
  const courtW = width * 0.6;
  const courtH = height * 0.34;
  const courtX = (width - courtW) / 2;
  const courtY = height * 0.34;
  const courtGrad = ctx.createLinearGradient(courtX, courtY, courtX + courtW, courtY);
  courtGrad.addColorStop(0, "#1f6c9c");
  courtGrad.addColorStop(0.5, "#2a78a9");
  courtGrad.addColorStop(1, "#1f6c9c");
  ctx.fillStyle = courtGrad;
  ctx.fillRect(courtX, courtY, courtW, courtH);

  // Lines.
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3;
  ctx.strokeRect(courtX, courtY, courtW, courtH);

  // Service boxes + center line.
  ctx.beginPath();
  ctx.moveTo(courtX + courtW * 0.5, courtY);
  ctx.lineTo(courtX + courtW * 0.5, courtY + courtH);
  ctx.moveTo(courtX, courtY + courtH * 0.5);
  ctx.lineTo(courtX + courtW, courtY + courtH * 0.5);
  ctx.stroke();

  // Inner service boxes.
  const innerW = courtW * 0.8;
  const innerH = courtH * 0.5;
  ctx.strokeRect(
    courtX + (courtW - innerW) / 2,
    courtY + (courtH - innerH) / 2,
    innerW,
    innerH,
  );

  // Title.
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 84px Arial";
  const textY = Math.max(courtY - height * -0.05, height * 0.06);
  ctx.fillText("TENNIS COURT", width / 2, textY);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.center.set(0.5, 0.5);
  texture.rotation = (35 * Math.PI) / 180;
  texture.needsUpdate = true;
  return texture;
}

function getAmenityTextureSpec(plotId) {
  const key = normalizeSearchKey(plotId);
  const spec = AMENITY_TEXTURE_SPECS[key];
  if (!spec) return null;
  if (!textureCache.has(spec.type)) {
    if (spec.type === "kidsplay") {
      textureCache.set(spec.type, createKidsPlayTexture());
    } else if (spec.type === "boxcricket") {
      textureCache.set(spec.type, createBoxCricketTexture());
    } else if (spec.type === "tenniscourt") {
      textureCache.set(spec.type, createTennisCourtTexture());
    }
  }
  return {
    texture: textureCache.get(spec.type) ?? null,
    tileSize: spec.tile,
    uvMode: spec.uvMode ?? "repeat",
  };
}

function applyWorldSpaceUVs(geometry, tileSize) {
  const pos = geometry.getAttribute("position");
  if (!pos) return;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uvs[i * 2] = x / tileSize;
    uvs[i * 2 + 1] = -y / tileSize;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.attributes.uv.needsUpdate = true;
}

function applyStretchUVs(geometry) {
  const pos = geometry.getAttribute("position");
  if (!pos) return;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const width = Math.max(maxX - minX, 0.001);
  const height = Math.max(maxY - minY, 0.001);
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uvs[i * 2] = (x - minX) / width;
    uvs[i * 2 + 1] = 1 - (y - minY) / height;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.attributes.uv.needsUpdate = true;
}

const NON_SALE_PLOT_KEYS = new Set(
  Array.from(NON_SALE_PLOT_IDS, (id) => normalizeSearchKey(id)),
);
const PURPLE_FILL_KEYS = new Set(
  Array.from(PURPLE_FILL_IDS, (id) => normalizeSearchKey(id)),
);

function getAmenityFillColor(plotId) {
  const key = normalizeSearchKey(plotId);
  return AMENITY_FILL_COLORS[key] ?? null;
}

function isCommonAreaPlotId(plotId) {
  const key = normalizeSearchKey(plotId);
  if (!key) return false;
  return (
    AMENITY_FILL_COLORS[key] !== undefined ||
    NON_SALE_PLOT_KEYS.has(key)
  );
}

function isCommonAreaMesh(mesh) {
  const plotId = mesh?.userData?.plotId;
  return isCommonAreaPlotId(plotId);
}

function normalizePlotIdFromSvgNodeId(nodeOrId) {
  if (!nodeOrId) return "";
  let rawId = "";
  if (typeof nodeOrId === "object") {
    rawId = (nodeOrId.getAttribute && (nodeOrId.getAttribute("inkscape:label") || nodeOrId.getAttribute("id"))) || nodeOrId.id || "";
  } else {
    rawId = String(nodeOrId);
  }
  rawId = rawId.trim();
  if (!rawId) return "";

  const lower = rawId.toLowerCase();
  if (lower.includes("club house") || lower.includes("clubhouse")) return "clubhouse";
  if (lower.includes("cafe")) return "cafegarden";
  if (lower.includes("940")) return "commonplot940";
  if (lower.includes("hotel") || lower.includes("132")) return "132";
  if (lower.includes("kids") || lower.includes("play")) return "kidsplay";
  if (lower.includes("garden")) return lower.replace(/\s+/g, "");

  const numericMatch = rawId.match(/\d+/);
  if (numericMatch) return numericMatch[0];
  return rawId;
}

function parsePlotAreasCsv(csvText) {
  const rows = String(csvText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length <= 1) return new Map();

  const parsed = new Map();
  const toNumber = (value) => {
    const cleaned = String(value ?? "")
      .replace(/,/g, "")
      .trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  for (let i = 1; i < rows.length; i += 1) {
    const columns = rows[i].split(",");
    if (columns.length < 3) continue;

    const plotId = String(columns[0] ?? "").trim();
    const key = normalizeSearchKey(plotId);
    if (!key) continue;

    parsed.set(key, {
      plotId,
      areaSqMt: toNumber(columns[1]),
      areaSqYds: toNumber(columns[2]),
    });
  }

  return parsed;
}

function parsePlotDimensionsCsv(csvText) {
  const rows = String(csvText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length <= 1) return new Map();

  const parsed = new Map();
  const toNumber = (value) => {
    const cleaned = String(value ?? "")
      .replace(/,/g, "")
      .trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const toPlotIds = (rawPlotId) => {
    const value = String(rawPlotId ?? "").trim();
    if (!value) return [];

    const rangeMatch = value.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (!Number.isFinite(start) || !Number.isFinite(end)) return [];

      const from = Math.min(start, end);
      const to = Math.max(start, end);
      const result = [];
      for (let id = from; id <= to; id += 1) {
        result.push(String(id));
      }
      return result;
    }

    return [value];
  };

  for (let i = 1; i < rows.length; i += 1) {
    const columns = rows[i].split(",");
    if (columns.length < 5) continue;

    const plotIds = toPlotIds(columns[0]);
    if (!plotIds.length) continue;

    const entry = {
      front: toNumber(columns[1]),
      rear: toNumber(columns[2]),
      left: toNumber(columns[3]),
      right: toNumber(columns[4]),
    };

    plotIds.forEach((plotId) => {
      const key = normalizeSearchKey(plotId);
      if (!key) return;
      parsed.set(key, { plotId, ...entry });
    });
  }

  return parsed;
}

async function loadPlotAreasCsv() {
  try {
    const response = await fetch(PLOT_AREAS_CSV_PATH, { cache: "no-store" });
    if (!response.ok) return new Map();
    const csvText = await response.text();
    return parsePlotAreasCsv(csvText);
  } catch {
    return new Map();
  }
}

async function loadPlotDimensionsCsv() {
  for (const path of PLOT_DIMENSIONS_CSV_PATHS) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) continue;
      const csvText = await response.text();
      const parsed = parsePlotDimensionsCsv(csvText);
      if (parsed.size) return parsed;
    } catch {
      // Try next fallback path.
    }
  }

  return new Map();
}

async function loadPlotDimensionsBySvgId() {
  try {
    const response = await fetch(PLOT_DIMENSIONS_BY_SVGID_PATH, { cache: "no-store" });
    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}

let liveSiteControl = DEFAULT_SITE_ENABLED;

function normalizeSiteEnabled(value) {
  return typeof value === "boolean" ? value : DEFAULT_SITE_ENABLED;
}

function isSiteEnabled() {
  return normalizeSiteEnabled(liveSiteControl);
}

function ensureSiteDownOverlay() {
  let overlay = document.getElementById("siteDisabledOverlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "siteDisabledOverlay";
  overlay.className = "site-disabled-overlay";
  overlay.innerHTML = `
    <div class="site-disabled-card">
      <h1>Website Temporarily Unavailable</h1>
      <p>Access has been paused by the administrator.</p>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function applySiteAccessState() {

  const enabled = isSiteEnabled();
  document.body.classList.toggle("site-disabled", !enabled);

  const overlay = document.getElementById("siteDisabledOverlay");
  if (enabled && overlay) overlay.remove();
  if (!enabled) ensureSiteDownOverlay();
}

async function loadPlotStatuses() {
  try {
    const response = await fetch("/api/plots", { cache: "no-store" });
    if (!response.ok) return {};
    const parsed = await response.json();
    return Object.fromEntries(
      Object.entries(parsed).map(([id, status]) => [id, normalizePlotStatus(status)])
    );
  } catch {
    return {};
  }
}

function getPlotStatus(plotId) {
  if (!plotId) return DEFAULT_PLOT_STATUS;
  return normalizePlotStatus(plotStatuses[plotId] || DEFAULT_PLOT_STATUS);
}

function updateStatusMeshColors() {
  statusMeshes.forEach((statusMesh) => {
    const baseMesh = statusMesh.userData.baseMesh;
    const status = getPlotStatus(statusMesh.userData.plotId);
    const statusColor = PLOT_STATUS_COLORS[status] || PLOT_STATUS_COLORS.available;
    statusMesh.userData.statusColor = statusColor;

    if (lastSelectedMesh) {
      if (baseMesh === lastSelectedMesh) {
        statusMesh.material.color.set(0x2f86d6);
      } else {
        const baseColor = new THREE.Color(statusColor);
        const hsl = {};
        baseColor.getHSL(hsl);
        baseColor.setHSL(hsl.h, hsl.s * 0.1, Math.min(hsl.l * 0.35, 0.3));
        statusMesh.material.color.copy(baseColor);
      }
    } else {
      statusMesh.material.color.set(statusColor);
    }
  });
}

function paintPlotsByCurrentMode() {
  if (!isSiteEnabled()) return;
  plotMeshes.forEach((mesh) => {
    mesh.material.color.set(mesh.userData.originalColor);
  });
  updateStatusMeshColors();
}

function resetPlotSelection() {
  clearDimensions();
  lastSelectedMesh = null;
  plotMeshes.forEach((m) => {
    m.material.color.set(m.userData.originalColor);
  });
  updateStatusMeshColors();
  setSelectedPlotLabel(null);
  updateContactablePlotCard(null);

  const mapElement = document.getElementById("map");
  if (mapElement) {
    mapElement.classList.remove("map-muted");
  }
  if (outlineGroup) {
    outlineGroup.children.forEach((line) => {
      if (line.material) line.material.opacity = 1.0;
    });
  }
}

function selectPlotMesh(mesh) {
  if (!mesh) {
    resetPlotSelection();
    return false;
  }
  if (isCommonAreaMesh(mesh)) return false;

  plotMeshes.forEach((m) => {
    if (m === mesh) {
      m.material.color.set(0x2f86d6);
    } else {
      const baseColor = new THREE.Color(m.userData.originalColor);
      const hsl = {};
      baseColor.getHSL(hsl);
      baseColor.setHSL(hsl.h, hsl.s * 0.1, Math.min(hsl.l * 0.35, 0.3));
      m.material.color.copy(baseColor);
    }
  });

  statusMeshes.forEach((sm) => {
    const baseMesh = sm.userData.baseMesh;
    if (baseMesh === mesh) {
      sm.material.color.set(0x2f86d6);
    } else {
      const stColor = sm.userData.statusColor || PLOT_STATUS_COLORS[getPlotStatus(sm.userData.plotId)] || PLOT_STATUS_COLORS.available;
      const baseColor = new THREE.Color(stColor);
      const hsl = {};
      baseColor.getHSL(hsl);
      baseColor.setHSL(hsl.h, hsl.s * 0.1, Math.min(hsl.l * 0.35, 0.3));
      sm.material.color.copy(baseColor);
    }
  });

  mesh.material.color.set(0x2f86d6);
  lastSelectedMesh = mesh;
  setSelectedPlotLabel(mesh);
  updateContactablePlotCard(mesh);

  // Exact boundary outline appears immediately; side dimensions wait until zoom finishes
  updateSelectionOutline(mesh);
  dimensionLabelsGroup.visible = false;

  const mapElement = document.getElementById("map");
  if (mapElement) {
    mapElement.classList.add("map-muted");
  }
  if (outlineGroup) {
    outlineGroup.children.forEach((line) => {
      if (line.material) line.material.opacity = 0.35;
    });
  }

  if (map) {
    const sourceWorldCenter = getOriginalMeshWorldCenter(mesh);
    const targetLngLat = mesh.userData?.sourceLngLat ||
      (sourceWorldCenter
        ? layoutWorldToLngLat(sourceWorldCenter.x, sourceWorldCenter.y)
        : null);

    if (!targetLngLat) return true;

    const currentZoom = map.getZoom();
    const currentPitch = typeof map.getPitch === "function" ? map.getPitch() : 0;
    const is3D = currentPitch > 10;
    const selectZoom = is3D ? SELECT_ZOOM_3D : SELECT_ZOOM_2D;
    const targetZoom = currentZoom < selectZoom ? selectZoom : currentZoom;
    const isMobile = window.innerWidth <= 768;
    const padding = {
      top: 70,
      bottom: statusModeEnabled ? (isMobile ? 220 : 180) : (isMobile ? 180 : 130),
      left: isMobile ? 40 : 60,
      right: statusModeEnabled ? (isMobile ? 50 : 160) : (isMobile ? 40 : 110),
    };

    if (zoomMoveEndHandler) {
      map.off("moveend", zoomMoveEndHandler);
      zoomMoveEndHandler = null;
    }

    const centerPoint = map.project(map.getCenter());
    const targetPoint = map.project(targetLngLat);
    const pixelDist = Math.hypot(centerPoint.x - targetPoint.x, centerPoint.y - targetPoint.y);
    const isAlreadyCenteredAndZoomed = pixelDist < 4 && Math.abs(currentZoom - targetZoom) < 0.05;

    if (isAlreadyCenteredAndZoomed) {
      isCameraZoomingToPlot = false;
      updateSelectionOutline(mesh);
      if (map.getZoom() >= DIMENSION_MIN_ZOOM) {
        updateDimensionLabels(mesh);
      }
    } else {
      isCameraZoomingToPlot = true;
      dimensionLabelsGroup.visible = false;

      zoomMoveEndHandler = () => {
        isCameraZoomingToPlot = false;
        zoomMoveEndHandler = null;
        if (lastSelectedMesh === mesh) {
          updateSelectionOutline(mesh);
          if (map.getZoom() >= DIMENSION_MIN_ZOOM) {
            updateDimensionLabels(mesh);
          }
        }
      };
      map.once("moveend", zoomMoveEndHandler);

      map.easeTo({
        center: targetLngLat,
        zoom: targetZoom,
        padding,
        duration: 900,
        easing: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
        essential: true,
      });
    }
  }

  return true;
}
window.selectPlotMesh = selectPlotMesh;
window.selectPlotById = selectPlotById;

function selectPlotById(rawValue) {
  const plotId = String(rawValue ?? "").trim();
  if (!plotId) {
    resetPlotSelection();
    return false;
  }

  const normalizedQuery = normalizeSearchKey(plotId);
  const mesh = plotMeshes.find((m) => {
    const candidateId = m.userData?.plotId;
    if (!candidateId) return false;
    return normalizeSearchKey(candidateId) === normalizedQuery;
  });

  if (!mesh) return false;
  if (isCommonAreaMesh(mesh)) return false;
  return selectPlotMesh(mesh);
}
window.selectPlotById = selectPlotById;
window.getPlotStatus = getPlotStatus;
window.getSelectedMesh = () => lastSelectedMesh;
window.resetPlotSelection = resetPlotSelection;
window.plotMeshes = plotMeshes;
window.THREE = THREE;
window.orthographicCamera = orthographicCamera;

function cancelPendingSearchSelection() {
  if (!searchSelectTimeoutId) return;
  window.clearTimeout(searchSelectTimeoutId);
  searchSelectTimeoutId = null;
}

function scheduleSearchSelection(rawValue) {
  cancelPendingSearchSelection();
  const plotId = String(rawValue ?? "").trim();

  if (!plotId) {
    resetPlotSelection();
    return;
  }

  searchSelectTimeoutId = window.setTimeout(() => {
    searchSelectTimeoutId = null;
    selectPlotById(plotId);
  }, SEARCH_SELECT_DELAY_MS);
}

function openModal(title, content) {
  modalTitle.textContent = title;
  modalBody.innerHTML = "";

  if (typeof content === "string") {
    modalBody.innerHTML = content;
  } else if (content instanceof Node) {
    modalBody.appendChild(content);
  }

  modalBackdrop.hidden = false;
}

function closeModal() {
  modalBackdrop.hidden = true;
  modalBody.innerHTML = "";
}

async function shareWebsite() {
  const shareData = {
    title: document.title || "3D Plot Layout",
    text: "Check this layout",
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(shareData.url);
    openModal("Share", '<p class="ui-modal-text">Website link copied to clipboard.</p>');
  } catch {
    openModal(
      "Share",
      `<p class="ui-modal-text">Copy this link:</p>
       <p><a class="ui-modal-link" href="${shareData.url}" target="_blank" rel="noopener noreferrer">${shareData.url}</a></p>`,
    );
  }
}

function imageExists(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function getGalleryImages() {
  try {
    const manifestResponse = await fetch(GALLERY_MANIFEST_PATH, {
      cache: "no-store",
    });

    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      if (Array.isArray(manifest)) {
        const images = manifest
          .filter((name) => typeof name === "string" && name.trim())
          .map((name) => `./gallery/${name.replace(/^\.?\/*/, "")}`);

        if (images.length) {
          const checks = await Promise.all(
            images.map(async (src) => ((await imageExists(src)) ? src : null)),
          );
          const existingImages = checks.filter(Boolean);
          if (existingImages.length) return existingImages;
        }
      }
    }
  } catch {
    // Fallback below if no manifest exists.
  }

  const exts = ["jpg", "jpeg", "png", "webp"];
  const baseNames = [];

  for (let i = 1; i <= 24; i += 1) {
    baseNames.push(`photo${i}`);
    baseNames.push(`img${i}`);
    baseNames.push(`${i}`);
  }

  const candidates = baseNames.flatMap((base) =>
    exts.map((ext) => `./gallery/${base}.${ext}`),
  );

  const checks = await Promise.all(
    candidates.map(async (src) => ((await imageExists(src)) ? src : null)),
  );

  return checks.filter(Boolean);
}

async function openGallery() {
  openModal("Gallery", '<p class="ui-modal-text">Loading photos...</p>');

  await loadSiteContent();

  let images = [];
  if (Array.isArray(siteContent.gallery) && siteContent.gallery.length > 0) {
    images = siteContent.gallery.map((item) =>
      typeof item === "string" ? { url: item, title: "" } : item
    );
  } else {
    const fallbackUrls = await getGalleryImages();
    images = fallbackUrls.map((url) => ({ url, title: "" }));
  }

  if (!images.length) {
    openModal(
      "Gallery",
      '<p class="ui-modal-text">No photos found in the gallery.</p>',
    );
    return;
  }

  const grid = document.createElement("div");
  grid.className = "ui-gallery-grid";

  images.forEach((item, index) => {
    const wrap = document.createElement("div");
    wrap.className = "ui-gallery-item-wrap";
    if (index === 0 || index === 3) {
      wrap.classList.add("ui-gallery-featured");
    }

    const img = document.createElement("img");
    img.src = item.url;
    img.alt = item.title || `Gallery photo ${index + 1}`;
    img.loading = "lazy";
    wrap.appendChild(img);

    if (item.title) {
      const cap = document.createElement("div");
      cap.className = "ui-gallery-caption";
      cap.textContent = item.title;
      wrap.appendChild(cap);
    }

    grid.appendChild(wrap);
  });

  openModal("Gallery", grid);
}

async function openInfo() {
  await loadSiteContent();

  const info = siteContent.info || {};
  const title = info.title || "Regal Farms";
  const tagline = info.tagline || "Premium Farm & Countryside Living Plots";
  const desc = info.description || "At Regal Farms, choose from our premium countryside living plots designed for modern tranquility. Enjoy lifestyle amenities like a clubhouse, landscaped gardens, and recreation spaces, all in a prime location with surrounding scenic countryside.";
  const loc = info.location || "";
  const amenities = info.amenities || "";
  const dev = info.developer || "";

  let html = `
    <div class="ui-info-container" style="display:flex; flex-direction:column; gap:14px; padding: 4px 0;">
      <div>
        <h3 style="margin:0 0 4px 0; font-size:18px; font-weight:700; color:#fff;">${escapeHtml(title)}</h3>
        ${tagline ? `<p style="margin:0; font-size:13px; color:#34d399; font-weight:600;">${escapeHtml(tagline)}</p>` : ''}
      </div>
      <p class="ui-modal-text" style="line-height:1.6; margin:0;">${escapeHtml(desc)}</p>
  `;

  if (amenities) {
    html += `
      <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px;">
        <span style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#aaa; margin-bottom:4px;">Amenities & Highlights</span>
        <span style="font-size:13px; color:#eee; line-height:1.5;">${escapeHtml(amenities)}</span>
      </div>
    `;
  }

  if (loc) {
    html += `
      <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px;">
        <span style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#aaa; margin-bottom:4px;">Location</span>
        <span style="font-size:13px; color:#eee; line-height:1.5;">📍 ${escapeHtml(loc)}</span>
      </div>
    `;
  }

  if (dev) {
    html += `
      <div style="font-size:12px; color:#888; text-align:right;">
        Developed by <strong style="color:#bbb;">${escapeHtml(dev)}</strong>
      </div>
    `;
  }

  html += `</div>`;

  openModal("Info", html);
}


function openCurrentLocation() {
  const farmLat = REGAL_GEO.center.lat;
  const farmLng = REGAL_GEO.center.lng;
  const mapsLink = `https://www.google.com/maps?q=${farmLat},${farmLng}`;
  window.open(mapsLink, "_blank", "noopener,noreferrer");
}

function openGpsNavigation() {
  const farmLat = REGAL_GEO.center.lat;
  const farmLng = REGAL_GEO.center.lng;
  const navLink = `https://www.google.com/maps/dir/?api=1&destination=${farmLat},${farmLng}`;
  window.open(navLink, "_blank", "noopener,noreferrer");
}

uiPanel?.addEventListener("pointerdown", (e) => e.stopPropagation());
uiPanel?.addEventListener("click", (e) => e.stopPropagation());

mapBtn?.addEventListener("click", () => {
  window.location.href = "/apply";
});
twoDButton?.addEventListener("click", () => {
  if (!isSiteEnabled()) return;
  toggle3DMode(!is3DMode);
});
const compassBtn = document.querySelector(".js-compass-btn");
compassBtn?.addEventListener("click", () => {
  if (!map) return;
  map.easeTo({ bearing: 0, duration: 800, essential: true });
});
statusToggle?.addEventListener("click", async () => {
  if (!isSiteEnabled()) return;
  const isPressed = statusToggle.getAttribute("aria-pressed") === "true";
  statusModeEnabled = !isPressed;
  statusToggle.setAttribute("aria-pressed", String(statusModeEnabled));
  updateStatusLegendVisibility();

  // Dynamically refetch the latest saved plot statuses from storage so admin changes are immediately synchronized
  try {
    const freshStatuses = await loadPlotStatuses();
    if (freshStatuses && typeof freshStatuses === "object") {
      plotStatuses = freshStatuses;
      updateStatusMeshColors();
    }
  } catch {}

  if (lastSelectedMesh) {
    resetPlotSelection();
  }
  startStatusWipe(statusModeEnabled);
});

// Automatically re-synchronize when the user returns to this browser tab
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible") {
    try {
      await loadSiteContent();
      const freshStatuses = await loadPlotStatuses();
      if (freshStatuses && typeof freshStatuses === "object") {
        plotStatuses = freshStatuses;
        updateStatusMeshColors();
      }
    } catch {}
  }
});
homeBtn?.addEventListener("click", () => {
  if (!isSiteEnabled()) return;
  if (map) {
    map.flyTo({
      center: [REGAL_GEO.center.lng, REGAL_GEO.center.lat],
      zoom: REGAL_GEO.initialZoom,
      bearing: 0,
      pitch: map.getPitch() > 15 ? 58 : 0,
      essential: true,
    });
    resetPlotSelection();
    if (searchInput) searchInput.value = "";
  }
});
whatsappBtn?.addEventListener("click", async () => {
  await loadSiteContent();
  const phone = String(siteContent.whatsapp?.phone || "917990939157").replace(/\D/g, "");
  const msg = siteContent.whatsapp?.message || "Hi, I'm interested in Regal Farms plots.";
  const url = `https://wa.me/${phone}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;
  window.open(url, "_blank", "noopener,noreferrer");
});
instagramBtn?.addEventListener("click", async (e) => {
  e.stopPropagation();
  await loadSiteContent();
  const rawUrl = (siteContent.instagramUrl || siteContent.instagram?.url || "").trim();

  if (!rawUrl) {
    openModal(
      "Instagram",
      '<p class="ui-modal-text">Instagram profile has not been configured yet.</p>'
    );
    return;
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "https:" && (parsed.hostname === "instagram.com" || parsed.hostname === "www.instagram.com")) {
      window.open(rawUrl, "_blank", "noopener,noreferrer");
      return;
    }
  } catch {}

  openModal(
    "Instagram",
    '<p class="ui-modal-text">The configured Instagram profile URL is invalid.</p>'
  );
});
shareBtn?.addEventListener("click", shareWebsite);
galleryBtn?.addEventListener("click", openGallery);
brochureBtn?.addEventListener("click", async () => {
  if (!isSiteEnabled()) return;
  await loadSiteContent();

  if (siteContent.brochure && siteContent.brochure.url) {
    window.open(siteContent.brochure.url, "_blank", "noopener,noreferrer");
    return;
  }

  const title = siteContent.info?.title || "Regal Farms";
  const tagline = siteContent.info?.tagline || "Premium Farm & Countryside Living Plots";
  openModal(
    "Project Brochure",
    "<div style='text-align:center; padding: 24px 16px;'>" +
      `<p style='font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 8px;'>${escapeHtml(title)}</p>` +
      `<p style='font-size: 14px; color: #bbb; line-height: 1.6;'>${escapeHtml(tagline)}</p>` +
      "<p style='margin-top: 16px; font-size: 13px; color: #888;'>Brochure and master plan documentation are being prepared and will be available for direct download soon.</p>" +
    "</div>"
  );
});
infoBtn?.addEventListener("click", openInfo);
locateBtn?.addEventListener("click", openCurrentLocation);
gpsBtn?.addEventListener("click", () => {
  if (!isSiteEnabled()) return;
  openGpsNavigation();
});
searchPill?.addEventListener("click", (e) => {
  if (e.target !== searchInput) searchInput?.focus();
});
searchInput?.addEventListener("input", () => {
  if (!isSiteEnabled()) return;
  scheduleSearchSelection(searchInput.value);
});
searchInput?.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  if (!isSiteEnabled()) return;
  e.preventDefault();
  cancelPendingSearchSelection();
  selectPlotById(searchInput.value);
});

modalCloseBtn?.addEventListener("click", closeModal);
modalBackdrop?.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalBackdrop.hidden) closeModal();
});
window.addEventListener("storage", (event) => {
  if (event.key === SITE_CONTROL_STORAGE_KEY) {
    applySiteAccessState();
  }
});
applySiteAccessState();

/* ======================
   CAMERA FIT
====================== */
function fitCameraOnce(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y);
  const fov = (camera.fov * Math.PI) / 180;

  let cameraZ = maxDim / (2 * Math.tan(fov / 2));
  cameraZ *= window.innerWidth < 768 ? 1.6 : 1.1;

  camera.position.set(0, 0, cameraZ);
  controls.target.set(0, 0, 0);

  defaultCameraState = {
    position: camera.position.clone(),
    target: controls.target.clone(),
  };

  introAnimation = {
    startZ: cameraZ * 1.25,
    endZ: cameraZ,
    progress: 0,
  };

  camera.position.z = introAnimation.startZ;
}

/* ======================
   DIMENSIONS
====================== */
function clearDimensions() {
  selectionOutlineGroup.clear();
  selectionOutlineGroup.visible = false;
  dimensionLabelsGroup.clear();
  dimensionLabelsGroup.visible = false;
  dimensionGroup.clear();
  dimensionGroup.visible = false;
  if (zoomMoveEndHandler && map) {
    map.off("moveend", zoomMoveEndHandler);
    zoomMoveEndHandler = null;
  }
  isCameraZoomingToPlot = false;
}

function createDimensionLabel(text, rotate = 0, edgeLength = 50, pitchForeshorten = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = 46;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = '600 24px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.lineWidth = 2.5; // thin 1px dark halo
  ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);

  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
    }),
  );

  const labelHeight = THREE.MathUtils.clamp(edgeLength * 0.15, 16, 22);
  const labelWidth = labelHeight * (canvas.width / canvas.height);
  sprite.scale.set(labelWidth, labelHeight * pitchForeshorten, 1);
  sprite.material.rotation = rotate;
  sprite.renderOrder = 32;
  return sprite;
}

function fitFontSize(ctx, text, maxWidth, maxHeight, startPx, minPx = 12) {
  let size = startPx;
  while (size > minPx) {
    ctx.font = `bold ${size}px Arial`;
    const width = ctx.measureText(text).width;
    if (width <= maxWidth && size <= maxHeight) return size;
    size -= 1;
  }
  return minPx;
}

function getPlotDisplayText(plotId) {
  const key = normalizeSearchKey(plotId);
  const displayNames = {
    clubhouse: "COMMON PLOT\nFOR CLUB HOUSE",
    commonplotforclubhouse: "COMMON PLOT\nFOR CLUB HOUSE",
    cafegarden: "CAFE AND GARDEN",
    commonplotforcafeandgarden: "CAFE AND GARDEN",
    cafeandgarden: "CAFE AND GARDEN",
    commonplot940: "COMMON PLOT\n940 SQ MTS",
    commonplot940sqmts: "COMMON PLOT\n940 SQ MTS",
    hotel: "COMMERCIAL\nHOTEL",
    path132commercialhotel: "COMMERCIAL\nHOTEL",
    "132": "COMMERCIAL\nHOTEL",
    kidsplay: "KIDS PLAY\nAREA",
    kidsarea: "KIDS PLAY\nAREA",
    kidsplayarea: "KIDS PLAY\nAREA",
    garden: "GARDEN",
    garden1: "GARDEN 1",
    garden2: "GARDEN 2",
    garden3: "GARDEN 3",
    garden4: "GARDEN 4",
    garden5: "GARDEN 5",
  };
  if (displayNames[key]) return displayNames[key];
  if (key.startsWith("garden")) {
    const num = key.replace(/\D/g, "");
    return num ? `GARDEN ${num}` : "GARDEN";
  }
  return String(plotId);
}

const LABEL_ROTATIONS = Object.freeze({
  cafegarden: -70 * (Math.PI / 180),
  commonplotforcafeandgarden: -70 * (Math.PI / 180),
  cafeandgarden: -70 * (Math.PI / 180),
  commonplot940: -90 * (Math.PI / 180),
  commonplot940sqmts: -90 * (Math.PI / 180),
  garden4: -80 * (Math.PI / 180),
  garden5: -80 * (Math.PI / 180),
  132: -90 * (Math.PI / 180),
  hotel: -90 * (Math.PI / 180),
  path132commercialhotel: -90 * (Math.PI / 180),
});

function createCompactPlotLabel(plotId, plotWidth, plotHeight) {
  const key = normalizeSearchKey(plotId);
  const rawText = getPlotDisplayText(plotId);
  const canvas = document.createElement("canvas");

  const isCommercial = key === "hotel" || key === "path132commercialhotel" || key === "132";
  const isNumberPlot = /^\d+$/.test(String(plotId).trim()) && !isCommercial;
  if (isNumberPlot) {
    const tempCtx = canvas.getContext("2d");
    tempCtx.font = '600 48px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    const textWidth = Math.ceil(tempCtx.measureText(rawText).width);
    canvas.width = Math.max(textWidth + 14, 52);
    canvas.height = 56;
  } else if (isCommercial) {
    canvas.width = 520;
    canvas.height = 280;
  } else if (key === "commonplot940" || key === "commonplot940sqmts") {
    canvas.width = 440;
    canvas.height = 170;
  } else if (key === "clubhouse" || key === "commonplotforclubhouse") {
    canvas.width = 540;
    canvas.height = 200;
  } else if (key === "cafegarden" || key === "commonplotforcafeandgarden" || key === "cafeandgarden") {
    canvas.width = 440;
    canvas.height = 190;
  } else if (key === "kidsplay" || key === "kidsarea" || key === "kidsplayarea") {
    canvas.width = 420;
    canvas.height = 220;
  } else if (key.startsWith("garden")) {
    canvas.width = 380;
    canvas.height = 160;
  } else {
    canvas.width = 256;
    canvas.height = 140;
  }

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (!rawText) {
    const emptyTex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: emptyTex,
        transparent: true,
        opacity: 0,
      }),
    );
    sprite.scale.set(0.001, 0.001, 1);
    sprite.userData.canvasAspect = 1;
    return sprite;
  }

  const lines = rawText.split("\n");
  if (isNumberPlot) {
    ctx.font = '600 48px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillText(rawText, canvas.width / 2, canvas.height / 2);
  } else if (lines.length === 1) {
    const isCafe = key === "cafegarden" || key === "commonplotforcafeandgarden" || key === "cafeandgarden";
    const startSize = isCafe ? 96 : 86;
    const maxW = isCafe ? canvas.width * 0.92 : canvas.width * 0.78;
    const maxH = isCafe ? canvas.height * 0.82 : canvas.height * 0.72;
    const fontSize = fitFontSize(ctx, rawText, maxW, maxH, startSize, 24);
    ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
    ctx.fillText(rawText, canvas.width / 2, canvas.height / 2);
  } else {
    // Multi-line rendering with generous line height and clean font
    if (isCommercial) {
      ctx.fillStyle = "#000000";
      ctx.font = 'bold 84px "Segoe UI", Arial, sans-serif';
      ctx.fillText(lines[0], canvas.width / 2, 85);
      ctx.fillText(lines[1] || "", canvas.width / 2, 195);
    } else {
      const maxLineH = (canvas.height * 0.76) / lines.length;
      let lineFontSize = 52;
      for (const l of lines) {
        const fs = fitFontSize(ctx, l, canvas.width * 0.88, maxLineH * 0.85, 48, 14);
        if (fs < lineFontSize) lineFontSize = fs;
      }
      ctx.font = `bold ${lineFontSize}px "Segoe UI", Arial, sans-serif`;
      const lineHeight = lineFontSize * 1.35;
      const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
      });
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
      opacity: 1,
    }),
  );
  sprite.renderOrder = 26;
  sprite.userData.canvasAspect = canvas.width / canvas.height;
  return sprite;
}

function createExpandedPlotLabel(plotId, areaSqMt, areaSqYds, plotWidth, plotHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = 380;
  canvas.height = 220;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const rawTitle = getPlotDisplayText(plotId);
  const title = rawTitle.replace(/\n/g, " ");
  const key = normalizeSearchKey(plotId);
  const isCommercial = key === "hotel" || key === "path132commercialhotel" || key === "132";
  const isNumberPlot = /^\d+$/.test(String(plotId).trim()) && !isCommercial;

  if (isNumberPlot) {
    ctx.font = '600 52px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(title, canvas.width / 2, 54);

    if (Number.isFinite(areaSqMt) && Number.isFinite(areaSqYds)) {
      ctx.font = '500 28px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      const sqYdText = `${areaSqYds.toFixed(2)} yd²`;
      const sqMtText = `${areaSqMt.toFixed(2)} m²`;
      ctx.fillText(sqYdText, canvas.width / 2, 116);
      ctx.fillText(sqMtText, canvas.width / 2, 162);
    }
  } else {
    const titleSize = fitFontSize(ctx, title, 340, 72, 50, 16);
    ctx.font = `bold ${titleSize}px Arial`;
    ctx.fillText(title, canvas.width / 2, 50);

    if (Number.isFinite(areaSqMt) && Number.isFinite(areaSqYds)) {
      const sqMtText = `${areaSqMt.toFixed(2)} m²`;
      const sqYdText = `${areaSqYds.toFixed(2)} yd²`;

      const line2Size = fitFontSize(ctx, sqMtText, 340, 36, 28, 14);
      ctx.font = `bold ${line2Size}px Arial`;
      ctx.fillText(sqMtText, canvas.width / 2, 115);

      const line3Size = fitFontSize(ctx, sqYdText, 340, 48, 40, 16);
      ctx.font = `bold ${line3Size}px Arial`;
      ctx.fillText(sqYdText, canvas.width / 2, 165);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
      opacity: 0,
    }),
  );
  sprite.renderOrder = 27;
  return sprite;
}

function initializePlotLabels() {
  plotLabelStates.length = 0;
  plotLabelsGroup.clear();

  plotMeshes.forEach((mesh) => {
    const plotId = String(mesh.userData?.plotId ?? "").trim();
    const normalizedPlotId = normalizeSearchKey(plotId);
    const isCommercial = normalizedPlotId === "132" || normalizedPlotId === "hotel" || normalizedPlotId === "path132commercialhotel";
    const isNumberPlot = /^\d+$/.test(plotId) && !isCommercial;
    const isCommonArea = isCommonAreaPlotId(normalizedPlotId);
    if (!isNumberPlot && !isCommonArea && !isCommercial) return;

    const points = mesh.userData?.outlinePoints;
    if (!Array.isArray(points) || points.length < 3) return;

    const bounds = points.reduce(
      (acc, p) => ({
        minX: Math.min(acc.minX, p.x),
        maxX: Math.max(acc.maxX, p.x),
        minY: Math.min(acc.minY, p.y),
        maxY: Math.max(acc.maxY, p.y),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
    );
    const anchor = new THREE.Vector2(
      (bounds.minX + bounds.maxX) / 2,
      (bounds.minY + bounds.maxY) / 2,
    );

    // If garden 2, bring down a bit to avoid overlapping plot 56/90
    if (normalizedPlotId === "garden2") {
      anchor.y += 3.5;
    }
    // If garden 4, bring down and center inside the right green strip
    if (normalizedPlotId === "garden4" || normalizedPlotId === "garden5") {
      anchor.y += 8.5;
      anchor.x -= 1.2;
    }
    // If clubhouse, bring down slightly away from the top edge
    if (normalizedPlotId === "clubhouse" || normalizedPlotId === "commonplotforclubhouse") {
      anchor.y += 2.2;
    }
    // If common plot 940 sq mts, shift towards right
    if (normalizedPlotId === "commonplot940" || normalizedPlotId === "commonplot940sqmts") {
      anchor.x += 1.8;
    }

    const plotWidth = Math.max(bounds.maxX - bounds.minX, 1.2);
    const plotHeight = Math.max(bounds.maxY - bounds.minY, 1.2);

    const compactSprite = createCompactPlotLabel(plotId, plotWidth, plotHeight);
    const expandedSprite = createExpandedPlotLabel(
      plotId,
      mesh.userData?.areaSqMt,
      mesh.userData?.areaSqYds,
      plotWidth,
      plotHeight,
    );

    compactSprite.position.set(anchor.x, anchor.y, 2.5);
    expandedSprite.position.set(anchor.x, anchor.y, 2.55);

    // Apply custom rotation if specified
    const customRotation = LABEL_ROTATIONS[normalizedPlotId];
    if (typeof customRotation === "number") {
      compactSprite.material.rotation = customRotation;
      expandedSprite.material.rotation = customRotation;
    }

    // Undistorted scale computation preserving canvas aspect ratio
    const canvasAspect = compactSprite.userData.canvasAspect || 1.6;
    const absRot = Math.abs(customRotation || 0);
    const isRotated90 = absRot > 40 * (Math.PI / 180) && absRot < 140 * (Math.PI / 180);

    let fillFactorW = isCommonArea ? 0.84 : 0.78;
    let fillFactorH = isCommonArea ? 0.82 : 0.68;

    // Specific custom fit for clubhouse, garden4, and cafegarden
    if (normalizedPlotId === "clubhouse" || normalizedPlotId === "commonplotforclubhouse") {
      fillFactorW = 0.68;
      fillFactorH = 0.62;
    } else if (normalizedPlotId === "garden4" || normalizedPlotId === "garden5") {
      fillFactorW = 0.52;
      fillFactorH = 0.52;
    } else if (normalizedPlotId === "cafegarden" || normalizedPlotId === "commonplotforcafeandgarden" || normalizedPlotId === "cafeandgarden") {
      fillFactorW = 0.92;
      fillFactorH = 0.88;
    } else if (isCommercial) {
      fillFactorW = 0.88;
      fillFactorH = 0.78;
    }

    const availW = (isRotated90 ? plotHeight : plotWidth) * fillFactorW;
    const availH = (isRotated90 ? plotWidth : plotHeight) * fillFactorH;

    if (isNumberPlot) {
      const shorterSide = Math.min(plotWidth, plotHeight);
      compactSprite.userData.shorterSide = shorterSide;
      compactSprite.userData.isNumberPlot = true;
      expandedSprite.userData.isNumberPlot = true;
      compactSprite.userData.textAllowOverlap = true;
      compactSprite.userData.textIgnorePlacement = true;

      // Glyph height is ~34px out of 56px canvas height (~0.607)
      // Target number height at 45% of plot's shorter side (within 40-50% range)
      const targetGlyphFraction = 0.45;
      const glyphToCanvasRatio = 34 / 56;
      const targetSpriteH = (shorterSide * targetGlyphFraction) / glyphToCanvasRatio;

      let compactH = Math.min(availH, targetSpriteH);
      let compactW = compactH * canvasAspect;
      if (compactW > availW) {
        compactW = availW;
        compactH = compactW / canvasAspect;
      }
      compactSprite.scale.set(compactW, compactH, 1);
      compactSprite.userData.baseScaleX = compactW;
      compactSprite.userData.baseScaleY = compactH;

      const expandedW = Math.min(availW, plotWidth * 0.75);
      const expandedH = Math.min(availH, plotHeight * 0.68);
      expandedSprite.scale.set(expandedW, expandedH, 1);
      expandedSprite.userData.baseScaleX = expandedW;
      expandedSprite.userData.baseScaleY = expandedH;
    } else {
      let compactW = availW;
      let compactH = compactW / canvasAspect;
      if (compactH > availH) {
        compactH = availH;
        compactW = compactH * canvasAspect;
      }

      compactSprite.scale.set(compactW, compactH, 1);
      compactSprite.userData.baseScaleX = compactW;
      compactSprite.userData.baseScaleY = compactH;
      if (isCommercial) {
        compactSprite.userData.isCommercialPlot = true;
        expandedSprite.userData.isCommercialPlot = true;
        compactSprite.userData.textAllowOverlap = true;
        compactSprite.userData.textIgnorePlacement = true;
      }

      const expandedWidth = THREE.MathUtils.clamp(plotWidth * 0.9, 7.5, 32);
      const expandedHeight = THREE.MathUtils.clamp(plotHeight * 0.8, 4.5, 20);
      expandedSprite.scale.set(expandedWidth, expandedHeight, 1);
      expandedSprite.userData.baseScaleX = expandedWidth;
      expandedSprite.userData.baseScaleY = expandedHeight;
    }

    plotLabelsGroup.add(compactSprite);
    plotLabelsGroup.add(expandedSprite);

    const state = {
      mesh,
      compactSprite,
      expandedSprite,
      progress: 0,
      target: 0,
    };

    mesh.userData.plotLabelState = state;
    plotLabelStates.push(state);
  });
}

function setSelectedPlotLabel(mesh) {
  plotLabelStates.forEach((state) => {
    state.target = state.mesh === mesh ? 1 : 0;
  });
}

function updatePlotLabelsAnimation() {
  plotLabelStates.forEach((state) => {
    state.progress += (state.target - state.progress) * PLOT_LABEL_ANIMATION_SPEED;

    if (Math.abs(state.target - state.progress) < 0.001) {
      state.progress = state.target;
    }

    const t = state.progress;
    // Unselected plot numbers stay full contrast dark charcoal (#2b2b2b), selected plot is white
    state.compactSprite.material.opacity = 1 - t;
    state.expandedSprite.material.opacity = t;

    const compactScale = 1 - t * 0.14;
    const expandedScale = 0.92 + t * 0.08;
    const compactBaseX = state.compactSprite.userData.mapProjectedBaseScaleX ||
      state.compactSprite.userData.baseScaleX ||
      state.compactSprite.scale.x;
    const compactBaseY = state.compactSprite.userData.mapProjectedBaseScaleY ||
      state.compactSprite.userData.baseScaleY ||
      state.compactSprite.scale.y;
    const expandedBaseX = state.expandedSprite.userData.mapProjectedBaseScaleX ||
      state.expandedSprite.userData.baseScaleX ||
      state.expandedSprite.scale.x;
    const expandedBaseY = state.expandedSprite.userData.mapProjectedBaseScaleY ||
      state.expandedSprite.userData.baseScaleY ||
      state.expandedSprite.scale.y;
    state.compactSprite.scale.set(compactBaseX * compactScale, compactBaseY * compactScale, 1);
    state.expandedSprite.scale.set(expandedBaseX * expandedScale, expandedBaseY * expandedScale, 1);

    if (state.compactSprite.userData.isNumberPlot || state.compactSprite.userData.isCommercialPlot) {
      const currentZoom = map ? map.getZoom() : 18;

      // Visible at every zoom level including initial default view
      state.compactSprite.visible = state.target === 0 ? true : (1 - t > 0.05);

      // Smooth zoom scaling (small when zoomed out, larger when zoomed in, hard capped at 1.0)
      const zoomT = THREE.MathUtils.clamp((currentZoom - 14.5) / (18.5 - 14.5), 0, 1);
      const zoomScaleFactor = THREE.MathUtils.lerp(0.68, 1.0, zoomT);

      state.compactSprite.scale.set(
        compactBaseX * compactScale * zoomScaleFactor,
        compactBaseY * compactScale * zoomScaleFactor,
        1,
      );
    }
  });
}

function computeGeodesicDistanceMeters(p1Layout, p2Layout) {
  if (!p1Layout || !p2Layout) return 0;
  const [lng1, lat1] = layoutWorldToLngLat(p1Layout.x, p1Layout.y);
  const [lng2, lat2] = layoutWorldToLngLat(p2Layout.x, p2Layout.y);
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


function rankSideCandidates(segments, bounds, side) {
  const width = Math.max(bounds.maxX - bounds.minX, 0.001);
  const height = Math.max(bounds.maxY - bounds.minY, 0.001);
  const minEdgeLength = Math.max(Math.min(width, height) * 0.12, 0.6);
  const source = segments.filter((s) => s.length >= minEdgeLength);
  const usable = source.length ? source : segments;
  const maxLen = Math.max(...usable.map((s) => s.length), 0.001);

  return usable
    .map((s) => {
      const orientation = side === "top" || side === "bottom"
        ? Math.abs(s.dir.x)
        : Math.abs(s.dir.y);

      let proximity = 0;
      if (side === "top") proximity = (s.mid.y - bounds.minY) / height;
      if (side === "bottom") proximity = (bounds.maxY - s.mid.y) / height;
      if (side === "right") proximity = (s.mid.x - bounds.minX) / width;
      if (side === "left") proximity = (bounds.maxX - s.mid.x) / width;

      const lengthScore = s.length / maxLen;
      const score = proximity * 1.8 + orientation * 1.1 + lengthScore * 0.8;
      return { segment: s, score };
    })
    .sort((a, b) => b.score - a.score);
}

function pickEdgesForAllSides(segments, bounds) {
  const sides = ["top", "right", "bottom", "left"];
  const ranked = Object.fromEntries(
    sides.map((side) => [side, rankSideCandidates(segments, bounds, side)]),
  );

  const chosen = {};
  const used = new Set();

  sides.forEach((side) => {
    const best = ranked[side].find((c) => !used.has(c.segment));
    if (best) {
      chosen[side] = best.segment;
      used.add(best.segment);
    }
  });

  sides.forEach((side) => {
    if (chosen[side]) return;
    const fallback = ranked[side][0];
    if (fallback) chosen[side] = fallback.segment;
  });

  return chosen;
}

function drawEdgeDimension(edge, centroid, z = 2.25, labelText = null) {
  const p1 = edge.a.clone();
  const p2 = edge.b.clone();
  p1.z = z;
  p2.z = z;

  const dir = p2.clone().sub(p1);
  const length = dir.length();
  if (length < 0.01) return;

  dir.normalize();

  const normalA = new THREE.Vector3(-dir.y, dir.x, 0);
  const normalB = normalA.clone().multiplyScalar(-1);
  const mid = p1.clone().add(p2).multiplyScalar(0.5);

  const testA = mid.clone().add(normalA.clone().multiplyScalar(1));
  const testB = mid.clone().add(normalB.clone().multiplyScalar(1));

  const outward = testA.distanceTo(centroid) > testB.distanceTo(centroid)
    ? normalA
    : normalB;

  // Small, tidy offset placing label just outside the outline without duplicate dashed lines
  const offset = Math.min(Math.max(length * 0.08, 9), 14);
  const lineMid = mid.clone().add(outward.clone().multiplyScalar(offset));
  lineMid.z = z + 0.05;

  let angle = Math.atan2(dir.y, dir.x);
  if (angle > Math.PI / 2) {
    angle -= Math.PI;
  } else if (angle < -Math.PI / 2) {
    angle += Math.PI;
  }

  // Tilt flat on ground with map pitch in 3D
  let pitchForeshorten = 1.0;
  if (map && map.getPitch() > 5) {
    const pitchRad = (map.getPitch() * Math.PI) / 180;
    const normAngle = Math.atan2(outward.y, outward.x);
    pitchForeshorten = THREE.MathUtils.clamp(
      Math.abs(Math.sin(normAngle)) * Math.cos(pitchRad) + Math.abs(Math.cos(normAngle)),
      0.55,
      1.0,
    );
  }

  const finalLabel = labelText ?? (edge.realMeters ? `${edge.realMeters.toFixed(2)} m` : `${length.toFixed(2)} m`);
  const text = createDimensionLabel(finalLabel, angle, length, pitchForeshorten);
  text.position.copy(lineMid);
  dimensionLabelsGroup.add(text);
}

function updateSelectionOutline(mesh) {
  selectionOutlineGroup.clear();
  if (!mesh) return;

  const points = mesh.userData?.outlinePoints;
  if (!points || points.length < 3) return;

  const layoutPoints = points.map((p) => {
    const v = new THREE.Vector3(p.x, p.y, 0);
    return mesh.localToWorld(v);
  });

  const renderPoints = layoutPoints.map((worldV) => {
    if (map) {
      const p = projectLayoutWorldToScreen(worldV);
      p.z = 2.2;
      return p;
    }
    const p = worldV.clone();
    p.z = 2.2;
    return p;
  });

  // Exactly ONE clean dashed white outline following the exact plot boundary
  const boundaryPoints = [...renderPoints, renderPoints[0].clone()];
  const boundaryGeo = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
  const boundaryMat = new THREE.LineDashedMaterial({
    color: 0xffffff,
    dashSize: map ? 5 : 0.9,
    gapSize: map ? 3.5 : 0.7,
    depthTest: false,
    depthWrite: false,
  });
  const boundaryLine = new THREE.Line(boundaryGeo, boundaryMat);
  boundaryLine.computeLineDistances();
  boundaryLine.renderOrder = 30;
  boundaryLine.position.z = 2.2;
  selectionOutlineGroup.add(boundaryLine);

  // Subtle corner tick marks at the plot corners
  const tickPoints = [];
  const tickSize = 3.5;
  renderPoints.forEach((pt) => {
    tickPoints.push(
      new THREE.Vector3(pt.x - tickSize, pt.y, 2.25),
      new THREE.Vector3(pt.x + tickSize, pt.y, 2.25),
      new THREE.Vector3(pt.x, pt.y - tickSize, 2.25),
      new THREE.Vector3(pt.x, pt.y + tickSize, 2.25),
    );
  });
  const tickGeo = new THREE.BufferGeometry().setFromPoints(tickPoints);
  const tickMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    depthTest: false,
    depthWrite: false,
  });
  const tickSegments = new THREE.LineSegments(tickGeo, tickMat);
  tickSegments.renderOrder = 31;
  selectionOutlineGroup.add(tickSegments);

  selectionOutlineGroup.visible = true;
}

function updateDimensionLabels(mesh) {
  dimensionLabelsGroup.clear();
  if (!mesh || !map) return;

  if (map.getZoom() < DIMENSION_MIN_ZOOM || isCameraZoomingToPlot) {
    dimensionLabelsGroup.visible = false;
    return;
  }

  const points = mesh.userData?.outlinePoints;
  if (!points || points.length < 3) return;

  const layoutPoints = points.map((p) => {
    const v = new THREE.Vector3(p.x, p.y, 0);
    return mesh.localToWorld(v);
  });

  const renderPoints = layoutPoints.map((worldV) => {
    const p = projectLayoutWorldToScreen(worldV);
    p.z = 2.2;
    return p;
  });

  const renderCentroid = renderPoints
    .reduce((acc, p) => acc.add(p), new THREE.Vector3())
    .multiplyScalar(1 / renderPoints.length);

  const segments = [];
  for (let i = 0; i < layoutPoints.length; i += 1) {
    const nextIdx = (i + 1) % layoutPoints.length;
    const aLayout = layoutPoints[i];
    const bLayout = layoutPoints[nextIdx];
    const lengthLayout = aLayout.distanceTo(bLayout);
    if (lengthLayout < 0.05) continue;

    const aRender = renderPoints[i];
    const bRender = renderPoints[nextIdx];
    const dirLayout = bLayout.clone().sub(aLayout).normalize();
    const midLayout = aLayout.clone().add(bLayout).multiplyScalar(0.5);

    const realMeters = computeGeodesicDistanceMeters(aLayout, bLayout);

    segments.push({
      a: aRender,
      b: bRender,
      aLayout,
      bLayout,
      length: lengthLayout,
      dir: dirLayout,
      mid: midLayout,
      realMeters,
    });
  }

  if (!segments.length) return;

  const layoutBounds = layoutPoints.reduce(
    (acc, p) => ({
      minX: Math.min(acc.minX, p.x),
      maxX: Math.max(acc.maxX, p.x),
      minY: Math.min(acc.minY, p.y),
      maxY: Math.max(acc.maxY, p.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );

  const sideEdges = pickEdgesForAllSides(segments, layoutBounds);

  const sideConfig = [
    { side: "top", value: mesh.userData?.dimensionFront },
    { side: "bottom", value: mesh.userData?.dimensionRear },
    { side: "left", value: mesh.userData?.dimensionLeft },
    { side: "right", value: mesh.userData?.dimensionRight },
  ];

  const usedEdges = new Set();
  sideConfig.forEach(({ side, value }) => {
    const edge = sideEdges[side];
    if (!edge || usedEdges.has(edge)) return;
    usedEdges.add(edge);

    const labelText = Number.isFinite(value)
      ? `${value.toFixed(2)} m`
      : (edge.realMeters ? `${edge.realMeters.toFixed(2)} m` : null);
    drawEdgeDimension(edge, renderCentroid, 2.25, labelText);
  });

  dimensionLabelsGroup.visible = true;
}

/* ======================
   LOAD SVGs (FIXED)
====================== */
const loadSvg = (url) =>
  new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });

Promise.all([
  loadSvg("./fills.svg"),
  loadSvg("./lines.svg"),
  loadSvg("./outline.svg"),
  loadPlotAreasCsv(),
  loadPlotDimensionsCsv(),
  loadPlotStatuses(),
  loadPlotDimensionsBySvgId(),
])
  .then(([fillsData, linesData, outlineData, loadedPlotAreas, loadedPlotDimensions, loadedPlotStatuses, loadedDimsBySvgId]) => {
    plotDimensionsBySvgId = loadedDimsBySvgId || {};
    const MIN_INTERACTIVE_SHAPE_AREA = 1;
    plotAreasById = loadedPlotAreas;
    plotDimensionsById = loadedPlotDimensions;
    plotStatuses = loadedPlotStatuses;

    function polygonArea(points) {
      let area = 0;
      for (let i = 0; i < points.length; i += 1) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        area += p1.x * p2.y - p2.x * p1.y;
      }
      return area / 2;
    }

    /* -------- FILLS -------- */
    const fillsGroup = new THREE.Group();
    fillsGroup.scale.y = -1;

    fillsData.paths.forEach((path) => {
      const node = path.userData?.node;
      const parentG = node?.closest ? node.closest("g") : node?.parentElement;
      if (parentG && (parentG.id === "layer2" || parentG.id === "layer3" || parentG.id === "layer4")) {
        return;
      }
      const style = (node?.getAttribute && node.getAttribute("style")) || "";
      if (style.includes("fill:none")) return;

      const id = normalizePlotIdFromSvgNodeId(node);
      if (!id) return;
      const shapes = SVGLoader.createShapes(path);

      shapes.forEach((shape) => {
        const outlinePoints = shape.getPoints(32);
        const area = Math.abs(polygonArea(outlinePoints));
        if (area < MIN_INTERACTIVE_SHAPE_AREA) return;

        let color = 0xe5cca0;
        const amenityColor = getAmenityFillColor(id);
        const normalizedId = normalizeSearchKey(id);
        if (amenityColor !== null) color = amenityColor;
        else if (NON_SALE_PLOT_KEYS.has(normalizedId)) color = NON_SALE_FILL_COLOR;
        else if (PURPLE_FILL_KEYS.has(normalizedId)) color = PURPLE_FILL_COLOR;

        const plotId = id;
        const mesh = new THREE.Mesh(
          new THREE.ShapeGeometry(shape),
          new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            depthTest: false,
          }),
        );

        const textureSpec = getAmenityTextureSpec(plotId);
        if (textureSpec?.texture) {
          if (textureSpec.uvMode === "stretch") {
            applyStretchUVs(mesh.geometry);
          } else {
            applyWorldSpaceUVs(mesh.geometry, textureSpec.tileSize);
          }
          mesh.material.map = textureSpec.texture;
          mesh.material.needsUpdate = true;
        }

        mesh.position.z = 1;
        mesh.userData.originalColor = color;
        mesh.userData.plotId = plotId;

        // Look up dimensions by the raw SVG path id first (most accurate, handles duplicate plot numbers)
        const svgNodeId = path.userData?.node?.getAttribute('id') || '';
        const svgDimEntry = plotDimensionsBySvgId[svgNodeId];
        const areaEntry = plotAreasById.get(normalizeSearchKey(plotId));
        const dimensionEntry = plotDimensionsById.get(normalizeSearchKey(plotId));

        if (svgDimEntry) {
          mesh.userData.areaSqMt = svgDimEntry.areaSqM ?? null;
          mesh.userData.areaSqYds = svgDimEntry.areaSqYd ?? null;
          mesh.userData.dimensionFront = svgDimEntry.top ?? null;
          mesh.userData.dimensionRear = svgDimEntry.bottom ?? null;
          mesh.userData.dimensionLeft = svgDimEntry.left ?? null;
          mesh.userData.dimensionRight = svgDimEntry.right ?? null;
        } else {
          // Fallback to old CSV-based lookup
          mesh.userData.areaSqMt = areaEntry?.areaSqMt ?? null;
          mesh.userData.areaSqYds = areaEntry?.areaSqYds ?? null;
          mesh.userData.dimensionFront = dimensionEntry?.front ?? null;
          mesh.userData.dimensionRear = dimensionEntry?.rear ?? null;
          mesh.userData.dimensionLeft = dimensionEntry?.left ?? null;
          mesh.userData.dimensionRight = dimensionEntry?.right ?? null;
        }
        mesh.userData.outlinePoints = outlinePoints.map((p) =>
          new THREE.Vector2(p.x, p.y),
        );

        plotMeshes.push(mesh);
        fillsGroup.add(mesh);

        // Status overlay mesh for saleable plots
        const isSaleable = !isCommonAreaMesh(mesh) &&
          amenityColor === null &&
          !NON_SALE_PLOT_KEYS.has(normalizedId) &&
          !PURPLE_FILL_KEYS.has(normalizedId);

        if (isSaleable) {
          const status = getPlotStatus(plotId);
          const statusColor = PLOT_STATUS_COLORS[status] || PLOT_STATUS_COLORS.available;
          const statusMat = new THREE.MeshBasicMaterial({
            color: statusColor,
            side: THREE.DoubleSide,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          });

          // Bake original SVG x into a custom vertex attribute BEFORE
          // captureOriginalLayoutProjection / syncOverlayToMapbox ever run.
          // The wipe shader reads aSvgX (not position.x) so it is unaffected
          // by the Mapbox projection warp that overwrites position on every
          // map move. We only need to do this once per geometry; skip if a
          // previous call already added it (shared geometry between fill and
          // status mesh shouldn't produce duplicates, but guard anyway).
          if (!mesh.geometry.getAttribute('aSvgX')) {
            const posAttr = mesh.geometry.attributes.position;
            const svgXData = new Float32Array(posAttr.count);
            for (let vi = 0; vi < posAttr.count; vi++) {
              svgXData[vi] = posAttr.getX(vi);
            }
            mesh.geometry.setAttribute(
              'aSvgX',
              new THREE.BufferAttribute(svgXData, 1),
            );
          }

          applyStatusWipeShader(statusMat);

          const statusMesh = new THREE.Mesh(mesh.geometry, statusMat);
          statusMesh.position.z = 1.05;
          statusMesh.renderOrder = 1;
          statusMesh.userData.baseMesh = mesh;
          statusMesh.userData.plotId = plotId;
          statusMesh.userData.statusColor = statusColor;

          mesh.userData.statusMesh = statusMesh;
          statusMeshes.push(statusMesh);
          statusGroup.add(statusMesh);
        }
      });
    });

    /* -------- LINES -------- */
    const linesGroup = new THREE.Group();
    linesGroup.scale.y = -1;

    linesData.paths.forEach((path) =>
      path.subPaths.forEach((sp) => {
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(sp.getPoints()),
          new THREE.LineBasicMaterial({ color: 0x000000 }),
        );
        line.position.z = 2;
        linesGroup.add(line);
      }),
    );

    /* -------- OUTLINE -------- */
    outlineGroup = new THREE.Group();
    outlineGroup.scale.y = -1;

    outlineData.paths.forEach((path) =>
      path.subPaths.forEach((sp) => {
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(sp.getPoints()),
          new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
          }),
        );
        line.position.z = 2.1;
        outlineGroup.add(line);
      }),
    );

    /* -------- 3D SLAB EDGE (PART B) -------- */
    const slabGroup = new THREE.Group();
    slabGroup.scale.y = -1;
    slabGroup.visible = false;

    outlineData.paths.forEach((path) =>
      path.subPaths.forEach((sp) => {
        const slabLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(sp.getPoints()),
          new THREE.LineBasicMaterial({
            color: 0x1f361a,
            transparent: true,
            opacity: 0.85,
          }),
        );
        slabLine.position.z = 0.5;
        slabGroup.add(slabLine);
      }),
    );
    window.slabGroup = slabGroup;

    layoutContainer.add(slabGroup, fillsGroup, statusGroup, linesGroup, plotLabelsGroup, outlineGroup);
    layoutContainer.position.set(-REGAL_GEO.svg.centerX, REGAL_GEO.svg.centerY, 0);
    initializePlotLabels();
    captureOriginalLayoutProjection();
    fitCameraOnce(svgGroup);
    paintPlotsByCurrentMode();
    initializeMapbox();
  })
  .catch((error) => {
    console.error("Failed to load SVG assets:", error);
  });

/* ======================
   PLOT RAYCAST, CLICK & HOVER
====================== */
function isSelectablePlotAt(clientX, clientY) {
  if (!isSiteEnabled() || !plotMeshes.length) return false;

  activeCamera.updateMatrixWorld();
  svgGroup.updateMatrixWorld(true);

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, activeCamera);
  const hits = raycaster.intersectObjects(plotMeshes, false);
  if (!hits.length) return false;
  return hits.some((hit) => !isCommonAreaMesh(hit.object));
}

function handlePlotRaycast(clientX, clientY) {
  if (!isSiteEnabled()) return;

  activeCamera.updateMatrixWorld();
  svgGroup.updateMatrixWorld(true);

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, activeCamera);
  const hits = raycaster.intersectObjects(plotMeshes, false);

  if (!hits.length) {
    resetPlotSelection();
    return;
  }
  const nonCommonHit = hits.find((hit) => !isCommonAreaMesh(hit.object));
  if (!nonCommonHit) {
    resetPlotSelection();
    return;
  }
  selectPlotMesh(nonCommonHit.object);
}

/* ======================
   ANIMATION LOOP
====================== */
function animate() {
  requestAnimationFrame(animate);

  if (statusWipeAnimation) {
    updateStatusWipeAnimation(performance.now());
  }

  updatePlotLabelsAnimation();
  renderer.render(scene, activeCamera);
}
animate();

/* ======================
   RESIZE
====================== */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  orthographicCamera.left = -window.innerWidth / 2;
  orthographicCamera.right = window.innerWidth / 2;
  orthographicCamera.top = window.innerHeight / 2;
  orthographicCamera.bottom = -window.innerHeight / 2;
  orthographicCamera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  if (map) {
    map.resize();
    syncOverlayToMapbox();
  }
});




function updateContactablePlotCard(mesh) {
  const card = document.getElementById('selectedPlotCard');
  if (!card) return;
  if (!mesh || isCommonAreaMesh(mesh)) {
    card.hidden = true;
    return;
  }
  const plotId = mesh.userData?.plotId || '';
  const areaSqYds = mesh.userData?.areaSqYds ? Number(mesh.userData.areaSqYds).toFixed(2) : '-';
  const areaSqMt = mesh.userData?.areaSqMt ? Number(mesh.userData.areaSqMt).toFixed(2) : '-';
  const status = getPlotStatus(plotId);
  const statusConfig = {
    available: { label: 'Available for Booking', color: '#00E676' },
    sold: { label: 'Sold / Booked', color: '#EF4444' },
    builder: { label: 'Builder / Hold', color: '#EBC04B' }
  }[status] || { label: 'Available', color: '#00E676' };

  const front = mesh.userData?.dimensionFront ? Number(mesh.userData.dimensionFront).toFixed(1) + 'm' : '-';
  const rear = mesh.userData?.dimensionRear ? Number(mesh.userData.dimensionRear).toFixed(1) + 'm' : '-';
  const left = mesh.userData?.dimensionLeft ? Number(mesh.userData.dimensionLeft).toFixed(1) + 'm' : '-';
  const right = mesh.userData?.dimensionRight ? Number(mesh.userData.dimensionRight).toFixed(1) + 'm' : '-';

  const numEl = document.getElementById('plotCardNumber');
  if (numEl) numEl.textContent = plotId;

  const sqYdEl = document.getElementById('plotCardAreaSqYd');
  if (sqYdEl) sqYdEl.textContent = `${areaSqYds} Sq.Yd`;

  const sqMEl = document.getElementById('plotCardAreaSqM');
  if (sqMEl) sqMEl.textContent = `${areaSqMt} Sq.M`;

  const statusEl = document.getElementById('plotCardStatus');
  if (statusEl) {
    statusEl.textContent = statusConfig.label;
    statusEl.style.color = statusConfig.color;
  }

  const dimEl = document.getElementById('plotCardDimensions');
  if (dimEl) {
    dimEl.textContent = `Front: ${front} | Rear: ${rear} | Sides: ${left} x ${right}`;
  }

  const waBtn = document.getElementById('plotCardWaBtn');
  if (waBtn) {
    waBtn.onclick = (e) => {
      e.stopPropagation();
      const phone = String(siteContent.whatsapp?.phone || "919825799754").replace(/\D/g, "");
      const msg = `Hello Shreeji Real Estate, I am interested in Plot #${plotId} (${areaSqYds} Sq.Yd / ${areaSqMt} Sq.M) at Survey 374, Nagavaladiya. Please share quotation and booking details.`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    };
  }

  card.hidden = false;
}

// Wire up card close button on page load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.js-plot-card-close')?.addEventListener('click', (e) => {
    e.stopPropagation();
    resetPlotSelection();
  });
});
