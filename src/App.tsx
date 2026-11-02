/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import {
  TerrariumState,
  PlacedPlant,
  PlantSpecies,
  FaunaSpecies,
  FaunaEntity,
} from './types/terrarium';
import { PLANT_CATALOG, DEFAULT_PLANTS } from './graphics/flora/PlantCatalog';
import { calculateSunMoon } from './utils/math';
import { terrariumAudio } from './utils/audio';
import { getGroundHeightAt, SubstrateModel } from './graphics/flora/Substrate';
import { BonsaiTreeModel } from './graphics/flora/BonsaiTree';
import { MushroomClusterModel } from './graphics/flora/MushroomCluster';
import { SucculentModel } from './graphics/flora/Succulents';
import { FernModel } from './graphics/flora/Ferns';
import { OrchidModel } from './graphics/flora/OrchidPlant';
import { PitcherPlantModel } from './graphics/flora/CarnivorousPitcher';
import { RockGeodeModel } from './graphics/flora/RocksAndCrystals';
import { GlassVesselModel } from './graphics/vessel/GlassVessel';
import { AtmosphereSystem } from './graphics/weather/AtmosphereSystem';
import { FaunaManager } from './graphics/fauna/FaunaManager';

import { HeaderBar } from './components/HeaderBar';
import { PlantingBanner } from './components/PlantingBanner';
import { PlantEditCard } from './components/PlantEditCard';
import { FaunaCard } from './components/FaunaCard';
import { ControlDock } from './components/ControlDock';

const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

function createPlantInstance(species: PlantSpecies, scale: number, growth: number): THREE.Group {
  switch (species) {
    case 'bonsai_juniper':
      return new BonsaiTreeModel(scale, growth);
    case 'luminescent_shroom':
      return new MushroomClusterModel(scale, growth);
    case 'rosette_succulent':
      return new SucculentModel(scale, growth);
    case 'sword_fern':
      return new FernModel(scale, growth);
    case 'mini_orchid':
      return new OrchidModel(scale, growth);
    case 'pitcher_plant':
      return new PitcherPlantModel(scale, growth);
    case 'amethyst_geode':
      return new RockGeodeModel(scale, growth);
    default:
      return new SucculentModel(scale, growth);
  }
}

interface PlantNodeProps {
  plant: PlacedPlant;
  isNight: boolean;
  timeOfDay: number;
  windStrength: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const PlantNode: React.FC<PlantNodeProps> = ({
  plant,
  isNight,
  timeOfDay,
  windStrength,
  isSelected,
  onSelect,
}) => {
  const model = useMemo(
    () => createPlantInstance(plant.species, plant.scale, plant.growthStage),
    [plant.species]
  );

  useEffect(() => {
    if (typeof (model as unknown as { applyScaleAndGrowth?: (s: number, g: number) => void }).applyScaleAndGrowth === 'function') {
      (model as unknown as { applyScaleAndGrowth: (s: number, g: number) => void }).applyScaleAndGrowth(
        plant.scale,
        plant.growthStage
      );
    }
  }, [model, plant.scale, plant.growthStage]);

  useEffect(() => {
    if (typeof (model as unknown as { setNightGlow?: (n: boolean, t: number) => void }).setNightGlow === 'function') {
      (model as unknown as { setNightGlow: (n: boolean, t: number) => void }).setNightGlow(isNight, timeOfDay);
    }
  }, [model, isNight, timeOfDay]);

  useFrame(({ clock }) => {
    if (typeof (model as unknown as { updateWind?: (t: number, w: number) => void }).updateWind === 'function') {
      (model as unknown as { updateWind: (t: number, w: number) => void }).updateWind(
        clock.getElapsedTime(),
        windStrength
      );
    }
  });

  const groundY = getGroundHeightAt(plant.x, plant.z);

  return (
    <group
      position={[plant.x, groundY, plant.z]}
      rotation={[0, plant.rotationY, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(plant.id);
      }}
    >
      <primitive object={model} />
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.26, 0.3, 32]} />
          <meshBasicMaterial color="#34d399" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
};

interface TerrariumWorldProps {
  state: TerrariumState;
  faunaManager: FaunaManager;
  onSelectPlant: (id: string | null) => void;
  onSelectFauna: (entity: FaunaEntity | null) => void;
  onPlacePlant: (species: PlantSpecies, x: number, z: number) => void;
}

const TerrariumWorld: React.FC<TerrariumWorldProps> = ({
  state,
  faunaManager,
  onSelectPlant,
  onSelectFauna,
  onPlacePlant,
}) => {
  const { gl, scene, camera, invalidate } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const substrate = useMemo(() => new SubstrateModel(), []);
  const vessel = useMemo(() => new GlassVesselModel(isSoftwareGl), []);
  const atmosphere = useMemo(() => new AtmosphereSystem(), []);

  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; z: number; valid: boolean } | null>(null);

  // Studio environment reflections & fog
  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.fog = new THREE.FogExp2(0x101d28, 0.045);
    pmremGenerator.dispose();
    return () => {
      envTex.dispose();
    };
  }, [gl, scene]);

  const sunData = useMemo(() => calculateSunMoon(state.timeOfDay), [state.timeOfDay]);

  // Sync vessel architecture & materials
  useEffect(() => {
    vessel.buildVessel(state.vesselType);
    vessel.setGlassTint(state.glassTint);
    vessel.setHumidity(state.humidity);
    vessel.setLidProgress(state.lidLiftProgress);
    invalidate();
  }, [vessel, state.vesselType, state.glassTint, state.humidity, state.lidLiftProgress, invalidate]);

  useEffect(() => {
    vessel.setGlassTint(state.glassTint);
    invalidate();
  }, [vessel, state.glassTint, invalidate]);

  useEffect(() => {
    vessel.setHumidity(state.humidity);
    invalidate();
  }, [vessel, state.humidity, invalidate]);

  useEffect(() => {
    vessel.setLidProgress(state.lidLiftProgress);
    invalidate();
  }, [vessel, state.lidLiftProgress, invalidate]);

  // Sync weather particles
  useEffect(() => {
    atmosphere.setWeather(state.weather, sunData.isNight, state.rainIntensity, state.mistDensity);
    if (scene.fog) {
      (scene.fog as THREE.FogExp2).color.set(sunData.groundFogColor);
    }
    invalidate();
  }, [
    atmosphere,
    scene,
    state.weather,
    sunData.isNight,
    sunData.groundFogColor,
    state.rainIntensity,
    state.mistDensity,
    invalidate,
  ]);

  // Camera preset targets
  const targetCameraPos = useRef(new THREE.Vector3(0, 2.0, 5.8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.35, 0));
  const isTransitioningCamera = useRef(false);

  useEffect(() => {
    switch (state.cameraPreset) {
      case 'overview':
        targetCameraPos.current.set(0, 2.0, 5.8);
        targetLookAt.current.set(0, 0.35, 0);
        break;
      case 'macro_flora':
        targetCameraPos.current.set(-0.3, 0.9, 1.9);
        targetLookAt.current.set(-0.2, 0.45, 0.1);
        break;
      case 'ground_level':
        targetCameraPos.current.set(1.4, 0.35, 1.6);
        targetLookAt.current.set(0, 0.3, 0);
        break;
      case 'top_down':
        targetCameraPos.current.set(0.01, 5.6, 0.01);
        targetLookAt.current.set(0, 0.2, 0);
        break;
    }
    if (isSoftwareGl && controlsRef.current) {
      camera.position.copy(targetCameraPos.current);
      controlsRef.current.target.copy(targetLookAt.current);
      controlsRef.current.update();
      isTransitioningCamera.current = false;
    } else {
      isTransitioningCamera.current = true;
    }
    invalidate();
  }, [state.cameraPreset, camera, invalidate]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(0.1, delta);
    const elapsed = clock.getElapsedTime();

    // Smooth camera preset damping
    if (isTransitioningCamera.current && controlsRef.current) {
      const dampFactor = 1 - Math.exp(-4.5 * dt);
      camera.position.lerp(targetCameraPos.current, dampFactor);
      controlsRef.current.target.lerp(targetLookAt.current, dampFactor);
      controlsRef.current.update();
      if (camera.position.distanceTo(targetCameraPos.current) < 0.03) {
        isTransitioningCamera.current = false;
      }
    }

    // Update animated fauna & atmospheric weather particles
    faunaManager.update(dt);
    atmosphere.update(dt, state.windStrength, elapsed);
  });

  const handleSubstrateMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!state.activePlantingSpecies) {
        if (hoverPoint) setHoverPoint(null);
        return;
      }
      e.stopPropagation();
      const pt = e.point;
      const dist = Math.sqrt(pt.x * pt.x + pt.z * pt.z);
      const y = getGroundHeightAt(pt.x, pt.z);
      setHoverPoint({ x: pt.x, y: y + 0.02, z: pt.z, valid: dist < 1.68 });
    },
    [state.activePlantingSpecies, hoverPoint]
  );

  const handleSubstrateClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const pt = e.point;
      const dist = Math.sqrt(pt.x * pt.x + pt.z * pt.z);
      if (state.activePlantingSpecies && dist < 1.68) {
        onPlacePlant(state.activePlantingSpecies, pt.x, pt.z);
        setHoverPoint(null);
        return;
      }
      onSelectPlant(null);
      onSelectFauna(null);
    },
    [state.activePlantingSpecies, onPlacePlant, onSelectPlant, onSelectFauna]
  );

  const handleFaunaClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      let obj: THREE.Object3D | null = e.object;
      while (obj && obj !== faunaManager) {
        if ((obj as unknown as { entity?: FaunaEntity }).entity) {
          const entity = (obj as unknown as { entity: FaunaEntity }).entity;
          faunaManager.interactWith(entity.id);
          onSelectFauna({ ...entity });
          onSelectPlant(null);
          return;
        }
        obj = obj.parent;
      }
    },
    [faunaManager, onSelectFauna, onSelectPlant]
  );

  return (
    <>
      <color attach="background" args={[sunData.skyColor]} />

      {/* OrbitControls for interactive 3D navigation */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping={!isSoftwareGl}
        dampingFactor={0.06}
        autoRotate={!isSoftwareGl && state.autoRotate}
        autoRotateSpeed={0.6}
        minDistance={1.8}
        maxDistance={9.0}
        maxPolarAngle={Math.PI / 2 + 0.08}
        target={[0, 0.35, 0]}
        onStart={() => {
          isTransitioningCamera.current = false;
        }}
      />

      {/* Base Ambient & Hemisphere Studio Lighting */}
      <ambientLight intensity={sunData.ambientIntensity * 0.65} />
      <hemisphereLight args={['#dff0ff', '#1f2e24', sunData.ambientIntensity]} />

      {/* Dynamic Solar & Lunar Directional Key Lights */}
      <directionalLight
        position={sunData.sunPosition}
        intensity={sunData.sunIntensity}
        color={sunData.sunColor}
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={28}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={sunData.moonPosition} intensity={sunData.moonIntensity} color="#7fb2ff" />

      {/* Celestial Orb Sphere (Sun / Moon indicator in sky) */}
      <mesh position={sunData.isNight ? sunData.moonPosition : sunData.sunPosition}>
        <sphereGeometry args={[0.38, 24, 24]} />
        <meshStandardMaterial
          color={sunData.isNight ? '#dbeafe' : sunData.sunColor}
          emissive={sunData.isNight ? '#60a5fa' : sunData.sunColor}
          emissiveIntensity={1.4}
          roughness={0.2}
        />
      </mesh>

      {/* Studio Floor Plane beneath Terrarium Pedestal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.66, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0c131a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Stratified Terrarium Substrate & Moss Bed */}
      <primitive
        object={substrate}
        onPointerMove={handleSubstrateMove}
        onClick={handleSubstrateClick}
      />

      {/* Procedural Placed Flora */}
      <group>
        {state.placedPlants.map((plant) => (
          <PlantNode
            key={plant.id}
            plant={plant}
            isNight={sunData.isNight}
            timeOfDay={state.timeOfDay}
            windStrength={state.windStrength}
            isSelected={state.selectedPlantId === plant.id}
            onSelect={(id) => {
              onSelectPlant(id);
              onSelectFauna(null);
            }}
          />
        ))}
      </group>

      {/* Animated Procedural Fauna */}
      <primitive object={faunaManager} onClick={handleFaunaClick} />

      {/* Placement Ring Preview */}
      {state.activePlantingSpecies && hoverPoint && (
        <mesh position={[hoverPoint.x, hoverPoint.y, hoverPoint.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.23, 32]} />
          <meshBasicMaterial
            color={hoverPoint.valid ? '#48e58a' : '#ef4444'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Atmospheric Particles (Rain, Mist, Spores, Fireflies) */}
      <primitive object={atmosphere} />

      {/* Custom Glass Vessel Architecture */}
      <primitive object={vessel} visible={state.showVessel} />
    </>
  );
};

export default function App() {
  const [state, setState] = useState<TerrariumState>({
    seed: 1042,
    theme: 'temperate',
    floraDensity: 1.0,
    placedPlants: DEFAULT_PLANTS,
    selectedPlantId: null,
    activePlantingSpecies: null,
    activeFaunaList: ['jewel_beetle', 'pygmy_gecko', 'amber_snail', 'spore_moth'],
    selectedFaunaId: null,
    timeOfDay: 10.5,
    timeSpeed: 0,
    autoDayNight: false,
    weather: 'sunny',
    humidity: 68,
    windStrength: 0.35,
    rainIntensity: 0.0,
    mistDensity: 0.3,
    fireflyCount: 35,
    vesselType: 'bell_jar',
    glassTint: 'clear',
    glassOpacity: 0.35,
    lidLiftProgress: 0.0,
    showVessel: true,
    cameraPreset: 'overview',
    autoRotate: false,
    soundEnabled: false,
    soundVolume: 0.35,
  });

  const [selectedFauna, setSelectedFauna] = useState<FaunaEntity | null>(null);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  const faunaManager = useMemo(() => new FaunaManager(), []);

  // Advance day/night solar cycle when timeSpeed > 0
  useEffect(() => {
    if (state.timeSpeed <= 0) return;
    const interval = window.setInterval(() => {
      setState((prev) => ({
        ...prev,
        timeOfDay: (prev.timeOfDay + 0.05 * prev.timeSpeed) % 24,
      }));
    }, 500);
    return () => clearInterval(interval);
  }, [state.timeSpeed]);

  // Refresh selected fauna telemetry periodically
  useEffect(() => {
    if (!selectedFauna) return;
    const interval = window.setInterval(() => {
      const live = faunaManager.getEntities().find((e) => e.id === selectedFauna.id);
      if (live) {
        setSelectedFauna({ ...live });
      }
    }, 400);
    return () => clearInterval(interval);
  }, [selectedFauna, faunaManager]);

  // Sync procedural audio with weather and time
  useEffect(() => {
    const isNight = state.timeOfDay < 5.5 || state.timeOfDay > 19.5;
    terrariumAudio.updateAtmosphere(
      state.windStrength,
      state.weather === 'rain' ? state.rainIntensity : 0,
      isNight
    );
  }, [state.windStrength, state.weather, state.rainIntensity, state.timeOfDay]);

  // Keyboard shortcut 'H' for Zen / Cinema mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'h') {
        setIsCinemaMode((prev) => !prev);
      } else if (e.key === 'Escape') {
        setState((prev) => ({ ...prev, activePlantingSpecies: null, selectedPlantId: null }));
        setSelectedFauna(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleUpdateState = useCallback((partial: Partial<TerrariumState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleToggleSound = useCallback(() => {
    setState((prev) => {
      const next = !prev.soundEnabled;
      terrariumAudio.setEnabled(next);
      return { ...prev, soundEnabled: next };
    });
  }, []);

  const handleStartPlanting = useCallback((species: PlantSpecies) => {
    setState((prev) => ({
      ...prev,
      activePlantingSpecies: prev.activePlantingSpecies === species ? null : species,
      selectedPlantId: null,
    }));
    setSelectedFauna(null);
  }, []);

  const handlePlacePlant = useCallback((species: PlantSpecies, x: number, z: number) => {
    const def = PLANT_CATALOG[species];
    const newPlant: PlacedPlant = {
      id: `plant_${Date.now()}`,
      species,
      name: def.name,
      x,
      z,
      rotationY: Math.random() * Math.PI * 2,
      scale: def.defaultScale,
      growthStage: 0.75,
      waterLevel: 90,
    };
    terrariumAudio.playWaterDrop();
    setState((prev) => ({
      ...prev,
      placedPlants: [...prev.placedPlants, newPlant],
      selectedPlantId: newPlant.id,
      activePlantingSpecies: null,
    }));
  }, []);

  const handleUpdatePlant = useCallback((updated: PlacedPlant) => {
    setState((prev) => ({
      ...prev,
      placedPlants: prev.placedPlants.map((p) => (p.id === updated.id ? updated : p)),
    }));
  }, []);

  const handleRemovePlant = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      placedPlants: prev.placedPlants.filter((p) => p.id !== id),
      selectedPlantId: prev.selectedPlantId === id ? null : prev.selectedPlantId,
    }));
  }, []);

  const handleWaterPlant = useCallback((id: string) => {
    terrariumAudio.playWaterDrop();
    setState((prev) => ({
      ...prev,
      humidity: Math.min(100, prev.humidity + 4),
      placedPlants: prev.placedPlants.map((p) =>
        p.id === id
          ? {
              ...p,
              waterLevel: 100,
              growthStage: Math.min(1.2, Number((p.growthStage + 0.15).toFixed(2))),
            }
          : p
      ),
    }));
  }, []);

  const handleSpawnFauna = useCallback(
    (species: FaunaSpecies) => {
      const entity = faunaManager.spawnSpecies(species);
      if (entity) {
        setSelectedFauna({ ...entity });
        setState((prev) => ({
          ...prev,
          selectedPlantId: null,
          activeFaunaList: [...prev.activeFaunaList, species],
        }));
      }
    },
    [faunaManager]
  );

  const handleFeedFauna = useCallback(
    (id: string) => {
      const updated = faunaManager.feedCreature(id);
      if (updated) {
        setSelectedFauna({ ...updated });
      }
    },
    [faunaManager]
  );

  const handleInteractFauna = useCallback(
    (id: string) => {
      const updated = faunaManager.interactWith(id);
      if (updated) {
        setSelectedFauna({ ...updated });
      }
    },
    [faunaManager]
  );

  const handleFeedAllFauna = useCallback(() => {
    faunaManager.getEntities().forEach((e) => faunaManager.feedCreature(e.id));
    if (selectedFauna) {
      const refreshed = faunaManager.getEntities().find((e) => e.id === selectedFauna.id);
      if (refreshed) setSelectedFauna({ ...refreshed });
    }
  }, [faunaManager, selectedFauna]);

  const handleApplyEcosystemPreset = useCallback((presetKey: string) => {
    if (presetKey === 'zen') {
      setState((prev) => ({
        ...prev,
        theme: 'temperate',
        timeOfDay: 9.5,
        weather: 'sunny',
        humidity: 65,
        glassTint: 'clear',
        placedPlants: DEFAULT_PLANTS,
      }));
    } else if (presetKey === 'night') {
      setState((prev) => ({
        ...prev,
        theme: 'bioluminescent',
        timeOfDay: 22.5,
        weather: 'fireflies',
        humidity: 82,
        glassTint: 'emerald',
        placedPlants: [
          ...DEFAULT_PLANTS,
          {
            id: `shroom_${Date.now()}`,
            species: 'luminescent_shroom',
            name: 'Ghost Bioluminescent Fungi',
            x: -0.3,
            z: 0.85,
            rotationY: 1.1,
            scale: 1.05,
            growthStage: 1.0,
            waterLevel: 95,
          },
        ],
      }));
    } else if (presetKey === 'succulent') {
      setState((prev) => ({
        ...prev,
        theme: 'succulent_desert',
        timeOfDay: 14.0,
        weather: 'sunny',
        humidity: 30,
        glassTint: 'amber',
      }));
    }
  }, []);

  const handleResetEcosystem = useCallback(() => {
    faunaManager.initDefaultCreatures();
    setSelectedFauna(null);
    setState((prev) => ({
      ...prev,
      seed: prev.seed + 1,
      placedPlants: DEFAULT_PLANTS.map((p, i) => ({
        ...p,
        id: `plant_${Date.now()}_${i}`,
        rotationY: Math.random() * Math.PI * 2,
      })),
      selectedPlantId: null,
      activePlantingSpecies: null,
    }));
  }, [faunaManager]);

  const selectedPlant = useMemo(
    () => state.placedPlants.find((p) => p.id === state.selectedPlantId) || null,
    [state.placedPlants, state.selectedPlantId]
  );

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-neutral-950 select-none"
      data-testid="terrarium-viewport"
      data-weather={state.weather}
      data-vessel={state.vesselType}
      data-plant-count={state.placedPlants.length}
    >
      {/* Full-Bleed @react-three/fiber 3D Canvas */}
      <div className="w-full h-full">
        <Canvas
          shadows={!isSoftwareGl}
          dpr={isSoftwareGl ? 1 : [1, 2]}
          frameloop={isSoftwareGl ? 'demand' : 'always'}
          camera={{ position: [0, 2.0, 5.8], fov: 40, near: 0.1, far: 50 }}
          gl={{
            antialias: !isSoftwareGl,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
        >
          <TerrariumWorld
            state={state}
            faunaManager={faunaManager}
            onSelectPlant={(id) => handleUpdateState({ selectedPlantId: id })}
            onSelectFauna={(entity) => setSelectedFauna(entity)}
            onPlacePlant={handlePlacePlant}
          />
        </Canvas>
      </div>

      {/* Top Header Status & Action Bar */}
      <HeaderBar
        state={state}
        onToggleSound={handleToggleSound}
        onToggleCinema={() => setIsCinemaMode((prev) => !prev)}
        isCinemaMode={isCinemaMode}
        onResetEcosystem={handleResetEcosystem}
      />

      {/* Active Planting Instruction Banner */}
      {!isCinemaMode && state.activePlantingSpecies && (
        <PlantingBanner
          activeSpecies={state.activePlantingSpecies}
          onQuickPlace={() => {
            const angle = Math.random() * Math.PI * 2;
            const r = 0.25 + Math.random() * 1.1;
            handlePlacePlant(
              state.activePlantingSpecies!,
              Number((Math.cos(angle) * r).toFixed(2)),
              Number((Math.sin(angle) * r).toFixed(2))
            );
          }}
          onCancel={() => handleUpdateState({ activePlantingSpecies: null })}
        />
      )}

      {/* Selected Plant Inspector & Growth Customizer */}
      {!isCinemaMode && selectedPlant && (
        <PlantEditCard
          plant={selectedPlant}
          onUpdatePlant={handleUpdatePlant}
          onRemovePlant={handleRemovePlant}
          onClose={() => handleUpdateState({ selectedPlantId: null })}
          onWaterPlant={handleWaterPlant}
        />
      )}

      {/* Selected Fauna Telemetry & Interaction Card */}
      {!isCinemaMode && selectedFauna && !selectedPlant && (
        <FaunaCard
          creature={selectedFauna}
          onFeed={handleFeedFauna}
          onInteract={handleInteractFauna}
          onClose={() => setSelectedFauna(null)}
        />
      )}

      {/* Unified Collapsible Bottom Control Dock */}
      {!isCinemaMode && (
        <ControlDock
          state={state}
          onUpdateState={handleUpdateState}
          onStartPlanting={handleStartPlanting}
          onSpawnFauna={handleSpawnFauna}
          onFeedAllFauna={handleFeedAllFauna}
          onApplyEcosystemPreset={handleApplyEcosystemPreset}
          isCollapsed={isDockCollapsed}
          onToggleCollapse={() => setIsDockCollapsed((prev) => !prev)}
          onSelectPlant={(id) => {
            setSelectedFauna(null);
            handleUpdateState({ selectedPlantId: id });
          }}
          faunaEntities={faunaManager.getEntities()}
          onSelectFaunaById={(id) => {
            const found = faunaManager.getEntities().find((e) => e.id === id);
            if (found) {
              handleUpdateState({ selectedPlantId: null });
              setSelectedFauna({ ...found });
            }
          }}
        />
      )}
    </main>
  );
}
