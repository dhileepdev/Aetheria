import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraPreset, FaunaEntity, PlacedPlant, PlantSpecies, TerrariumState } from '../types/terrarium';
import { calculateSunMoon } from '../utils/math';
import { getGroundHeightAt, SubstrateModel } from './flora/Substrate';
import { BonsaiTreeModel } from './flora/BonsaiTree';
import { MushroomClusterModel } from './flora/MushroomCluster';
import { SucculentModel } from './flora/Succulents';
import { FernModel } from './flora/Ferns';
import { OrchidModel } from './flora/OrchidPlant';
import { PitcherPlantModel } from './flora/CarnivorousPitcher';
import { RockGeodeModel } from './flora/RocksAndCrystals';
import { GlassVesselModel } from './vessel/GlassVessel';
import { AtmosphereSystem } from './weather/AtmosphereSystem';
import { FaunaManager } from './fauna/FaunaManager';

export class TerrariumScene {
  public container: HTMLElement;
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public controls!: OrbitControls;

  public isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private isDisposed: boolean = false;

  // Scene Components
  public substrate!: SubstrateModel;
  public vessel!: GlassVesselModel;
  public atmosphere!: AtmosphereSystem;
  public faunaManager!: FaunaManager;
  public plantGroup!: THREE.Group;
  public plantModels: Map<string, THREE.Group> = new Map();

  // Lighting
  private keySunLight!: THREE.DirectionalLight;
  private moonLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Placement Preview Indicator
  private placementIndicator!: THREE.Mesh;
  public isPlantingMode: boolean = false;
  public activePlantingSpecies: PlantSpecies | null = null;
  public pendingPlacementCoord: { x: number; z: number } | null = null;

  // Camera transition targets
  private targetCameraPos = new THREE.Vector3(0, 1.8, 5.2);
  private targetLookAt = new THREE.Vector3(0, 0.7, 0);

  // Callbacks
  private onPlantSelect?: (plantId: string | null) => void;
  private onFaunaSelect?: (entity: FaunaEntity | null) => void;
  private onPlacePlantConfirm?: (species: PlantSpecies, x: number, z: number) => void;

  // Scratch objects
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(
    container: HTMLElement,
    callbacks: {
      onPlantSelect?: (plantId: string | null) => void;
      onFaunaSelect?: (entity: FaunaEntity | null) => void;
      onPlacePlantConfirm?: (species: PlantSpecies, x: number, z: number) => void;
    }
  ) {
    this.container = container;
    this.onPlantSelect = callbacks.onPlantSelect;
    this.onFaunaSelect = callbacks.onFaunaSelect;
    this.onPlacePlantConfirm = callbacks.onPlacePlantConfirm;

    this.initHardwareProbe();
    this.initRenderer();
    this.initScene();
    this.initCameraAndControls();
    this.initLighting();
    this.initEnvironment();
    this.initModels();
    this.initEvents();
    this.startLoop();
  }

  private initHardwareProbe() {
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();
  }

  private initRenderer() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x101d28, 0.045);
  }

  private initCameraAndControls() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    this.camera.position.set(0, 1.8, 5.2);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.maxDistance = 9.0;
    this.controls.minDistance = 1.8;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.08; // Allow viewing slightly from below pedestal
    this.controls.target.set(0, 0.7, 0);
  }

  private initLighting() {
    // 1. Sun Directional Key Light
    this.keySunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    this.keySunLight.position.set(6, 12, 6);
    this.keySunLight.castShadow = !this.isSoftwareGl;
    this.keySunLight.shadow.mapSize.width = 1024;
    this.keySunLight.shadow.mapSize.height = 1024;
    this.keySunLight.shadow.camera.near = 0.5;
    this.keySunLight.shadow.camera.far = 28;
    this.keySunLight.shadow.camera.left = -3;
    this.keySunLight.shadow.camera.right = 3;
    this.keySunLight.shadow.camera.top = 3;
    this.keySunLight.shadow.camera.bottom = -3;
    this.keySunLight.shadow.bias = -0.0005;
    this.keySunLight.shadow.normalBias = 0.02;
    this.scene.add(this.keySunLight);

    // 2. Moon Directional Light
    this.moonLight = new THREE.DirectionalLight(0x7fb2ff, 0.4);
    this.moonLight.position.set(-6, -2, -6);
    this.scene.add(this.moonLight);

    // 3. Hemisphere Fill Light
    this.hemiLight = new THREE.HemisphereLight(0xdff0ff, 0x1f2e24, 0.65);
    this.scene.add(this.hemiLight);
  }

  private initEnvironment() {
    // Procedural Studio Environment for realistic metallic & glass specular reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();
  }

  private initModels() {
    // 1. Ground Substrate
    this.substrate = new SubstrateModel();
    this.scene.add(this.substrate);

    // 2. Glass Vessel
    this.vessel = new GlassVesselModel(this.isSoftwareGl);
    this.scene.add(this.vessel);

    // 3. Atmosphere & Weather System
    this.atmosphere = new AtmosphereSystem();
    this.scene.add(this.atmosphere);

    // 4. Placed Plants Group
    this.plantGroup = new THREE.Group();
    this.scene.add(this.plantGroup);

    // 5. Fauna Manager
    this.faunaManager = new FaunaManager((entity) => {
      if (this.onFaunaSelect) this.onFaunaSelect(entity);
    });
    this.scene.add(this.faunaManager);

    // 6. Placement Indicator Ring
    const indicatorGeo = new THREE.RingGeometry(0.18, 0.22, 32);
    indicatorGeo.rotateX(-Math.PI / 2);
    const indicatorMat = new THREE.MeshBasicMaterial({
      color: 0x48e58a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    this.placementIndicator = new THREE.Mesh(indicatorGeo, indicatorMat);
    this.placementIndicator.position.y = 0.2;
    this.scene.add(this.placementIndicator);
  }

  public syncPlacedPlants(plants: PlacedPlant[]) {
    // Remove deleted plants
    const currentIds = new Set(plants.map((p) => p.id));
    for (const [id, model] of this.plantModels.entries()) {
      if (!currentIds.has(id)) {
        this.plantGroup.remove(model);
        this.plantModels.delete(id);
      }
    }

    // Add or update plants
    plants.forEach((plant) => {
      let model = this.plantModels.get(plant.id);
      if (!model) {
        model = this.createPlantModel(plant.species, plant.scale, plant.growthStage);
        model.name = plant.id;
        this.plantGroup.add(model);
        this.plantModels.set(plant.id, model);
      } else {
        // Update scale & growth
        if (typeof (model as any).applyScaleAndGrowth === 'function') {
          (model as any).applyScaleAndGrowth(plant.scale, plant.growthStage);
        }
      }

      // Update position flush with ground
      const groundY = getGroundHeightAt(plant.x, plant.z);
      model.position.set(plant.x, groundY, plant.z);
      model.rotation.y = plant.rotationY;
    });
  }

  private createPlantModel(species: PlantSpecies, scale: number, growth: number): THREE.Group {
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

  public syncState(state: TerrariumState) {
    // Day / Night Sun & Moon calculations
    const sunData = calculateSunMoon(state.timeOfDay);

    this.keySunLight.position.set(...sunData.sunPosition);
    this.keySunLight.intensity = sunData.sunIntensity;
    this.keySunLight.color.set(sunData.sunColor);

    this.moonLight.position.set(...sunData.moonPosition);
    this.moonLight.intensity = sunData.moonIntensity;

    this.hemiLight.intensity = sunData.ambientIntensity;
    if (this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).color.set(sunData.groundFogColor);
    }

    // Sync plant bioluminescence
    for (const model of this.plantModels.values()) {
      if (typeof (model as any).setNightGlow === 'function') {
        (model as any).setNightGlow(sunData.isNight, state.timeOfDay);
      }
    }

    // Weather & Atmosphere
    this.atmosphere.setWeather(state.weather, sunData.isNight, state.rainIntensity, state.mistDensity);

    // Vessel & Glass
    this.vessel.setGlassTint(state.glassTint);
    this.vessel.setHumidity(state.humidity);
    this.vessel.setLidProgress(state.lidLiftProgress);
    this.vessel.visible = state.showVessel;

    // Controls
    this.controls.autoRotate = state.autoRotate;

    // Active planting mode indicator
    this.isPlantingMode = state.activePlantingSpecies !== null;
    this.activePlantingSpecies = state.activePlantingSpecies;
    (this.placementIndicator.material as THREE.MeshBasicMaterial).opacity = this.isPlantingMode ? 0.8 : 0.0;
  }

  public setCameraPreset(preset: CameraPreset) {
    switch (preset) {
      case 'overview':
        this.targetCameraPos.set(0, 1.8, 5.2);
        this.targetLookAt.set(0, 0.7, 0);
        break;
      case 'macro_flora':
        this.targetCameraPos.set(-0.3, 0.9, 1.9);
        this.targetLookAt.set(-0.2, 0.45, 0.1);
        break;
      case 'ground_level':
        this.targetCameraPos.set(1.4, 0.35, 1.6);
        this.targetLookAt.set(0, 0.3, 0);
        break;
      case 'top_down':
        this.targetCameraPos.set(0.01, 5.6, 0.01);
        this.targetLookAt.set(0, 0.2, 0);
        break;
    }
  }

  private initEvents() {
    window.addEventListener('resize', this.onResize);
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerdown', this.onPointerDown);
  }

  private onResize = () => {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onPointerMove = (e: MouseEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // In planting mode, track mouse across ground substrate
    if (this.isPlantingMode && this.substrate) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObject(this.substrate.mossMesh, false);
      if (hits.length > 0) {
        const hit = hits[0].point;
        const dist = Math.sqrt(hit.x * hit.x + hit.z * hit.z);
        if (dist < 1.7) {
          const y = getGroundHeightAt(hit.x, hit.z);
          this.placementIndicator.position.set(hit.x, y + 0.02, hit.z);
          this.pendingPlacementCoord = { x: hit.x, z: hit.z };
          (this.placementIndicator.material as THREE.MeshBasicMaterial).color.setHex(0x48e58a);
        } else {
          // Out of bounds
          (this.placementIndicator.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
        }
      }
    }
  };

  private onPointerDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // Left click only

    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. If in plant placement mode, place plant!
    if (this.isPlantingMode && this.activePlantingSpecies && this.pendingPlacementCoord) {
      const { x, z } = this.pendingPlacementCoord;
      const dist = Math.sqrt(x * x + z * z);
      if (dist < 1.7) {
        if (this.onPlacePlantConfirm) {
          this.onPlacePlantConfirm(this.activePlantingSpecies, x, z);
        }
        return;
      }
    }

    // 2. Check Fauna Interaction
    const faunaHits = this.raycaster.intersectObjects(this.faunaManager.getRaycastTargets(), true);
    if (faunaHits.length > 0) {
      let current: THREE.Object3D | null = faunaHits[0].object;
      while (current && current.parent && current !== this.faunaManager) {
        if ((current as any).entity) {
          const creatureEntity = (current as any).entity as FaunaEntity;
          this.faunaManager.interactWith(creatureEntity.id);
          if (this.onFaunaSelect) this.onFaunaSelect(creatureEntity);
          return;
        }
        current = current.parent;
      }
    }

    // 3. Check Plant Picking
    const plantHits = this.raycaster.intersectObjects(this.plantGroup.children, true);
    if (plantHits.length > 0) {
      let current: THREE.Object3D | null = plantHits[0].object;
      while (current && current.parent && current.parent !== this.plantGroup) {
        current = current.parent;
      }
      if (current && current.name) {
        if (this.onPlantSelect) this.onPlantSelect(current.name);
        return;
      }
    }

    // If clicked empty ground
    if (this.onPlantSelect) this.onPlantSelect(null);
    if (this.onFaunaSelect) this.onFaunaSelect(null);
  };

  private startLoop() {
    let lastTime = performance.now();
    let clockTime = 0;

    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.isDisposed) return;

      const now = performance.now();
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      clockTime += delta;

      // Smooth camera interpolation towards targets
      if (!this.controls.state || this.controls.state === -1) {
        this.camera.position.lerp(this.targetCameraPos, Math.min(1, delta * 3.5));
        this.controls.target.lerp(this.targetLookAt, Math.min(1, delta * 3.5));
      }

      this.controls.update();

      // Update fauna
      this.faunaManager.update(delta);

      // Update atmosphere particles
      this.atmosphere.update(delta, 0.4, clockTime);

      // Update fern wind sway
      for (const model of this.plantModels.values()) {
        if (typeof (model as any).updateWind === 'function') {
          (model as any).updateWind(clockTime, 0.5);
        }
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  public dispose() {
    this.isDisposed = true;
    if (this.isSoftwareGl) {
      clearTimeout(this.frameId);
    } else {
      cancelAnimationFrame(this.frameId);
    }

    window.removeEventListener('resize', this.onResize);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerdown', this.onPointerDown);

    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
