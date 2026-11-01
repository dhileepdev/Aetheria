export type VesselType = 'bell_jar' | 'wardian_geo' | 'hex_pagoda' | 'sphere_bowl';

export type GlassTint = 'clear' | 'emerald' | 'amber' | 'smoky';

export type EcosystemTheme = 'temperate' | 'bioluminescent' | 'succulent_desert' | 'prehistoric';

export type WeatherType = 'sunny' | 'rain' | 'mist' | 'fireflies';

export type CameraPreset = 'overview' | 'macro_flora' | 'ground_level' | 'top_down';

export type PlantSpecies = 
  | 'bonsai_juniper'
  | 'luminescent_shroom'
  | 'rosette_succulent'
  | 'sword_fern'
  | 'mini_orchid'
  | 'pitcher_plant'
  | 'amethyst_geode';

export interface PlacedPlant {
  id: string;
  species: PlantSpecies;
  name: string;
  x: number;
  z: number;
  rotationY: number;
  scale: number; // 0.6 to 1.5
  growthStage: number; // 0.2 (sprout) to 1.0 (mature)
  tintColor?: string;
  waterLevel: number; // 0 to 100
}

export type FaunaSpecies = 'jewel_beetle' | 'pygmy_gecko' | 'amber_snail' | 'spore_moth';

export type FaunaState = 'wandering' | 'eating' | 'resting' | 'alert';

export interface FaunaEntity {
  id: string;
  species: FaunaSpecies;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  state: FaunaState;
  hunger: number; // 0 to 100
  energy: number; // 0 to 100
  favoriteFood: string;
  scientificName: string;
  speed: number;
  targetX: number;
  targetZ: number;
  stateTimer: number;
}

export interface TerrariumState {
  // Ecosystem & Flora
  seed: number;
  theme: EcosystemTheme;
  floraDensity: number;
  placedPlants: PlacedPlant[];
  selectedPlantId: string | null;
  activePlantingSpecies: PlantSpecies | null; // When non-null, user is placing this plant
  
  // Fauna
  activeFaunaList: FaunaSpecies[];
  selectedFaunaId: string | null;

  // Day / Night & Lighting
  timeOfDay: number; // 0.0 to 24.0 hours
  timeSpeed: number; // 0, 1, 5, 20
  autoDayNight: boolean;

  // Weather & Atmosphere
  weather: WeatherType;
  humidity: number; // 0 to 100
  windStrength: number; // 0 to 1.0
  rainIntensity: number; // 0 to 1.0
  mistDensity: number; // 0 to 1.0
  fireflyCount: number; // 0 to 60

  // Vessel Architecture
  vesselType: VesselType;
  glassTint: GlassTint;
  glassOpacity: number;
  lidLiftProgress: number; // 0 (closed) to 1.0 (lifted)
  showVessel: boolean;

  // Camera & Interaction
  cameraPreset: CameraPreset;
  autoRotate: boolean;

  // Sound
  soundEnabled: boolean;
  soundVolume: number;
}

export interface SunMoonData {
  sunPosition: [number, number, number];
  moonPosition: [number, number, number];
  sunIntensity: number;
  moonIntensity: number;
  sunColor: string;
  skyColor: string;
  groundFogColor: string;
  ambientIntensity: number;
  isNight: boolean;
}

export interface PlantDefinition {
  species: PlantSpecies;
  name: string;
  scientificName: string;
  description: string;
  category: 'Tree' | 'Mushroom' | 'Succulent' | 'Fern' | 'Flower' | 'Carnivorous' | 'Mineral';
  defaultScale: number;
  icon: string;
  lightPreference: string;
  waterPreference: string;
}
