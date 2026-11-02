'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { CombinedPlot, PlotStatus } from '@/types';
import { allPlots, SVG_WIDTH, SVG_HEIGHT, AMENITY_COLORS, DEFAULT_PLOT_FILL, STATUS_COLORS } from '@/data/plotHelper';
import { RotateCcw } from 'lucide-react';

interface ThreeDViewerProps {
  selectedPlot: CombinedPlot | null;
  onSelectPlot: (plot: CombinedPlot | null) => void;
  statusColorsEnabled: boolean;
  filterStatus: PlotStatus | 'all';
}

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({
  selectedPlot,
  onSelectPlot,
  statusColorsEnabled,
  filterStatus,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPlotName, setHoveredPlotName] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());

  const reset3DView = useCallback(() => {
    if (!controlsRef.current || !cameraRef.current) return;
    controlsRef.current.target.set(0, 0, 0);
    cameraRef.current.position.set(0, 220, 260);
    controlsRef.current.update();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);
    scene.fog = new THREE.FogExp2(0x333333, 0.0015);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      1,
      2000
    );
    camera.position.set(0, 220, 260);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 30;
    controls.maxDistance = 600;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    sunLight.position.set(120, 250, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 800;
    const d = 180;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(800, 800);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Extrude Plots
    const loader = new SVGLoader();
    const plotGroup = new THREE.Group();
    meshMapRef.current.clear();

    const offsetX = -SVG_WIDTH / 2;
    const offsetY = -SVG_HEIGHT / 2;

    allPlots.forEach((plot) => {
      try {
        const svgData = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${plot.d}" /></svg>`);
        
        svgData.paths.forEach((pathObj) => {
          const shapes = SVGLoader.createShapes(pathObj);
          
          shapes.forEach((shape) => {
            const isAmenity = plot.metadata.type === 'amenity';
            const extrudeHeight = isAmenity ? 3.0 : 1.2;

            const geometry = new THREE.ExtrudeGeometry(shape, {
              depth: extrudeHeight,
              bevelEnabled: false,
            });

            const lowerLabel = (plot.metadata.plotNumber || '').toLowerCase();
            const amenityColorHex = AMENITY_COLORS[lowerLabel];

            let colorStr = DEFAULT_PLOT_FILL; // #EDE0C8
            if (amenityColorHex) {
              colorStr = amenityColorHex;
            } else if (statusColorsEnabled) {
              colorStr = STATUS_COLORS[plot.metadata.status] || DEFAULT_PLOT_FILL;
            }

            const material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(colorStr),
              roughness: 0.7,
              metalness: 0.1,
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            mesh.rotation.x = Math.PI / 2;
            mesh.position.set(offsetX, extrudeHeight, offsetY);
            
            mesh.userData = {
              plotId: plot.id,
              plot: plot,
            };

            meshMapRef.current.set(plot.id, mesh);
            plotGroup.add(mesh);
          });
        });
      } catch (err) {
        console.error('Error extruding plot in 3D:', plot.id, err);
      }
    });

    scene.add(plotGroup);

    // Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(plotGroup.children);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const p = hit.userData?.plot as CombinedPlot;
        if (p && !p.metadata.isCommonArea) {
          setHoveredPlotName(`${p.metadata.title}`);
          container.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredPlotName(null);
      container.style.cursor = 'default';
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(plotGroup.children);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const p = hit.userData?.plot as CombinedPlot;
        if (p && !p.metadata.isCommonArea) {
          onSelectPlot(p);
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [statusColorsEnabled, onSelectPlot]);

  // Smoothly animate camera to selected plot in 3D
  useEffect(() => {
    meshMapRef.current.forEach((mesh, id) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (selectedPlot?.id === id) {
        mat.emissive = new THREE.Color(0x2e86f5);
        mat.emissiveIntensity = 0.5;

        // Smoothly adjust OrbitControls target to parcel center
        if (controlsRef.current && cameraRef.current) {
          const targetX = selectedPlot.stats.centerX - SVG_WIDTH / 2;
          const targetZ = selectedPlot.stats.centerY - SVG_HEIGHT / 2;
          controlsRef.current.target.set(targetX, 0, targetZ);
        }
      } else {
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0;
      }
    });

    if (!selectedPlot && controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
    }
  }, [selectedPlot]);

  return (
    <div className="relative w-full h-full bg-[#333333] overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* 3D Reset View Button */}
      <div className="absolute left-4 bottom-4 z-30">
        <button
          type="button"
          onClick={reset3DView}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(40,40,40,0.95)] hover:bg-[rgba(70,70,70,1)] border border-[rgba(120,120,120,0.45)] text-white shadow-xl active:scale-95"
          title="Reset 3D View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
