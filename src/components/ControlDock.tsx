import React, { useState } from 'react';
import {
  PlantSpecies,
  FaunaSpecies,
  TerrariumState,
  VesselType,
  GlassTint,
  WeatherType,
  CameraPreset,
} from '../types/terrarium';
import { PLANT_CATALOG } from '../graphics/flora/PlantCatalog';
import {
  ChevronDown,
  ChevronUp,
  Sprout,
  Bug,
  Sun,
  CloudRain,
  Cylinder,
  Camera,
  Play,
  Pause,
  FastForward,
  RotateCw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { formatTimeOfDay } from '../utils/math';

interface ControlDockProps {
  state: TerrariumState;
  onUpdateState: (partial: Partial<TerrariumState>) => void;
  onStartPlanting: (species: PlantSpecies) => void;
  onSpawnFauna: (species: FaunaSpecies) => void;
  onFeedAllFauna: () => void;
  onApplyEcosystemPreset: (presetKey: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectPlant?: (id: string) => void;
  faunaEntities?: { id: string; name: string; species: FaunaSpecies; state: string }[];
  onSelectFaunaById?: (id: string) => void;
}

type TabType = 'flora' | 'fauna' | 'lighting' | 'weather' | 'vessel' | 'camera';

export const ControlDock: React.FC<ControlDockProps> = ({
  state,
  onUpdateState,
  onStartPlanting,
  onSpawnFauna,
  onFeedAllFauna,
  onApplyEcosystemPreset,
  isCollapsed,
  onToggleCollapse,
  onSelectPlant,
  faunaEntities = [],
  onSelectFaunaById,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('flora');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'flora', label: 'Flora', icon: <Sprout size={15} /> },
    { id: 'fauna', label: 'Fauna', icon: <Bug size={15} /> },
    { id: 'lighting', label: 'Lighting', icon: <Sun size={15} /> },
    { id: 'weather', label: 'Weather', icon: <CloudRain size={15} /> },
    { id: 'vessel', label: 'Vessel', icon: <Cylinder size={15} /> },
    { id: 'camera', label: 'Camera', icon: <Camera size={15} /> },
  ];

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 w-[94vw] max-w-4xl z-30 transition-transform duration-300 ease-out select-none ${
        isCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse/Expand Bar */}
      <div className="flex justify-center mb-1">
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Show control dock' : 'Hide control dock'}
          className="bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white px-4 py-1.5 rounded-t-xl text-xs font-medium flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp size={14} />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              <span>Hide Controls</span>
            </>
          )}
        </button>
      </div>

      {/* Main Solid Container (NO backdrop-filter) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-3.5 sm:p-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 pb-3 border-b border-neutral-800 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={`${tab.label} tab`}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        <div className="pt-3 min-h-[108px] flex items-center">
          {/* TAB 1: FLORA LANDSCAPING */}
          {activeTab === 'flora' && (
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Select a plant species to place into the terrarium:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApplyEcosystemPreset('zen')}
                    className="hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Zen Preset
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => onApplyEcosystemPreset('night')}
                    className="hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Bioluminescent
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => onApplyEcosystemPreset('succulent')}
                    className="hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Desert
                  </button>
                </div>
              </div>

              {/* Plant species buttons */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {(Object.keys(PLANT_CATALOG) as PlantSpecies[]).map((species) => {
                  const def = PLANT_CATALOG[species];
                  const isPlacing = state.activePlantingSpecies === species;
                  return (
                    <button
                      key={species}
                      onClick={() => onStartPlanting(species)}
                      aria-label={`Plant ${def.name}`}
                      title={def.description}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isPlacing
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/30'
                          : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-xl mb-1">{def.icon}</span>
                      <span className="text-[11px] font-medium leading-tight line-clamp-1">{def.name.split(' ')[0]}</span>
                      <span className="text-[9px] text-neutral-500">{def.category}</span>
                    </button>
                  );
                })}
              </div>

              {/* Placed Plants Quick-Select Strip */}
              {state.placedPlants.length > 0 && onSelectPlant && (
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] text-neutral-500 whitespace-nowrap mr-1">
                    In Terrarium ({state.placedPlants.length}):
                  </span>
                  {state.placedPlants.map((p) => {
                    const def = PLANT_CATALOG[p.species];
                    const selected = state.selectedPlantId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => onSelectPlant(p.id)}
                        aria-label={`Inspect ${p.name}`}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                          selected
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-medium'
                            : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <span>{def.icon}</span>
                        <span>{def.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FAUNA SANCTUARY */}
          {activeTab === 'fauna' && (
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Spawn or interact with animated terrarium creatures:</span>
                <button
                  onClick={onFeedAllFauna}
                  aria-label="Feed all terrarium creatures"
                  className="bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-200 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Feed All Creatures
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'jewel_beetle', name: 'Jewel Scarab', icon: '🪲', desc: 'Carapace walks & feeds' },
                  { id: 'pygmy_gecko', name: 'Pygmy Gecko', icon: '🦎', desc: 'Climbing & tail swishing' },
                  { id: 'amber_snail', name: 'Amber Snail', icon: '🐌', desc: 'Retractable eyestalks' },
                  { id: 'spore_moth', name: 'Spore Moth', icon: '🦋', desc: 'Fluttering wing flight' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onSpawnFauna(f.id as FaunaSpecies)}
                    aria-label={`Spawn ${f.name}`}
                    className="flex items-center gap-3 p-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <span className="text-2xl">{f.icon}</span>
                    <div>
                      <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                        <span>{f.name}</span>
                        <span className="text-[10px] text-emerald-400">+Spawn</span>
                      </div>
                      <p className="text-[10px] text-neutral-400">{f.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {faunaEntities.length > 0 && onSelectFaunaById && (
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] text-neutral-500 whitespace-nowrap mr-1">
                    Active Fauna ({faunaEntities.length}):
                  </span>
                  {faunaEntities.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelectFaunaById(c.id)}
                      aria-label={`Inspect creature ${c.name}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 whitespace-nowrap transition-colors cursor-pointer"
                    >
                      <span>{c.name}</span>
                      <span className="text-[10px] text-emerald-400 capitalize">({c.state})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIGHTING & TIME */}
          {activeTab === 'lighting' && (
            <div className="w-full space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-neutral-200 font-mono">
                    Time: {formatTimeOfDay(state.timeOfDay)}
                  </span>
                  <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                    {[
                      { speed: 0, label: <Pause size={12} />, title: 'Pause' },
                      { speed: 1, label: <Play size={12} />, title: 'Normal 1x' },
                      { speed: 5, label: '5x', title: 'Fast 5x' },
                      { speed: 20, label: <FastForward size={12} />, title: 'Hyper 20x' },
                    ].map((sp) => (
                      <button
                        key={sp.speed}
                        onClick={() => onUpdateState({ timeSpeed: sp.speed })}
                        title={sp.title}
                        aria-label={sp.title}
                        className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                          state.timeSpeed === sp.speed
                            ? 'bg-neutral-800 text-emerald-400 font-bold'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 text-xs">
                  {[
                    { h: 6.0, label: 'Dawn' },
                    { h: 12.0, label: 'Noon' },
                    { h: 18.0, label: 'Sunset' },
                    { h: 0.0, label: 'Midnight' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => onUpdateState({ timeOfDay: preset.h })}
                      className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-2.5 py-1 rounded-lg text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.1"
                  value={state.timeOfDay}
                  onChange={(e) => onUpdateState({ timeOfDay: parseFloat(e.target.value) })}
                  aria-label="Solar time of day"
                  className="w-full accent-amber-500 bg-neutral-950 rounded-lg h-2 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>12 AM</span>
                  <span>6 AM (Dawn)</span>
                  <span>12 PM (Noon)</span>
                  <span>6 PM (Dusk)</span>
                  <span>12 AM</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WEATHER & ATMOSPHERE */}
          {activeTab === 'weather' && (
            <div className="w-full space-y-3">
              {/* Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'sunny', label: 'Sunny Breeze', icon: '☀️', hum: 40, wind: 0.35, rain: 0 },
                  { id: 'mist', label: 'Rainforest Mist', icon: '🌫️', hum: 85, wind: 0.2, rain: 0 },
                  { id: 'rain', label: 'Gentle Rain', icon: '🌧️', hum: 95, wind: 0.5, rain: 0.7 },
                  { id: 'fireflies', label: 'Firefly Night', icon: '✨', hum: 60, wind: 0.15, rain: 0 },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() =>
                      onUpdateState({
                        weather: w.id as WeatherType,
                        humidity: w.hum,
                        windStrength: w.wind,
                        rainIntensity: w.rain,
                      })
                    }
                    aria-label={`Set weather to ${w.label}`}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-colors cursor-pointer ${
                      state.weather === w.id
                        ? 'bg-neutral-800 border-emerald-500/80 text-emerald-300'
                        : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <span className="text-lg">{w.icon}</span>
                    <span className="text-xs font-medium">{w.label}</span>
                  </button>
                ))}
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs text-neutral-400 mb-1">
                    <span>Humidity</span>
                    <span className="font-mono text-neutral-200">{state.humidity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={state.humidity}
                    onChange={(e) => onUpdateState({ humidity: parseInt(e.target.value) })}
                    aria-label="Humidity percentage"
                    className="w-full accent-blue-500 bg-neutral-950 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-neutral-400 mb-1">
                    <span>Wind Breeze</span>
                    <span className="font-mono text-neutral-200">{Math.round(state.windStrength * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={state.windStrength}
                    onChange={(e) => onUpdateState({ windStrength: parseFloat(e.target.value) })}
                    aria-label="Wind strength"
                    className="w-full accent-teal-500 bg-neutral-950 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-neutral-400 mb-1">
                    <span>Rain Intensity</span>
                    <span className="font-mono text-neutral-200">{Math.round(state.rainIntensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={state.rainIntensity}
                    onChange={(e) =>
                      onUpdateState({
                        rainIntensity: parseFloat(e.target.value),
                        weather: parseFloat(e.target.value) > 0 ? 'rain' : state.weather,
                      })
                    }
                    aria-label="Rain intensity"
                    className="w-full accent-indigo-500 bg-neutral-950 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GLASS VESSEL */}
          {activeTab === 'vessel' && (
            <div className="w-full space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'bell_jar', label: 'Bell Jar Cloche', desc: 'Classic dome & finial' },
                  { id: 'wardian_geo', label: 'Wardian Geodesic', desc: 'Faceted solder seams' },
                  { id: 'hex_pagoda', label: 'Hex Pagoda', desc: 'Greenhouse ribs' },
                  { id: 'sphere_bowl', label: 'Sphere Bio-Bowl', desc: 'Open circular top' },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => onUpdateState({ vesselType: v.id as VesselType })}
                    aria-label={`Select ${v.label}`}
                    className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                      state.vesselType === v.id
                        ? 'bg-neutral-800 border-emerald-500/80 text-emerald-300'
                        : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <div className="text-xs font-semibold">{v.label}</div>
                    <div className="text-[10px] text-neutral-500">{v.desc}</div>
                  </button>
                ))}
              </div>

              {/* Tint & Lid controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Glass Finish:</span>
                  {[
                    { id: 'clear', label: 'Clear', color: 'bg-neutral-200' },
                    { id: 'emerald', label: 'Emerald', color: 'bg-emerald-400' },
                    { id: 'amber', label: 'Amber', color: 'bg-amber-400' },
                    { id: 'smoky', label: 'Smoky', color: 'bg-neutral-600' },
                  ].map((tint) => (
                    <button
                      key={tint.id}
                      onClick={() => onUpdateState({ glassTint: tint.id as GlassTint })}
                      aria-label={`Glass tint ${tint.label}`}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                        state.glassTint === tint.id
                          ? 'bg-neutral-800 border-neutral-600 text-white font-medium'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${tint.color}`} />
                      <span>{tint.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs text-neutral-400 whitespace-nowrap">Lift Lid:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={state.lidLiftProgress}
                    onChange={(e) => onUpdateState({ lidLiftProgress: parseFloat(e.target.value) })}
                    aria-label="Lid lift elevation"
                    className="w-32 accent-emerald-500 bg-neutral-950 rounded-lg h-1.5 cursor-pointer"
                  />
                  <button
                    onClick={() => onUpdateState({ showVessel: !state.showVessel })}
                    aria-label="Toggle vessel visibility"
                    className="text-xs px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                  >
                    {state.showVessel ? 'Hide Glass' : 'Show Glass'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CAMERA */}
          {activeTab === 'camera' && (
            <div className="w-full space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'overview', label: 'Ecosystem Overview', desc: 'Full vessel perspective' },
                  { id: 'macro_flora', label: 'Macro Flora Close-up', desc: 'Focus on bonsai & shrooms' },
                  { id: 'ground_level', label: 'Ground Insect Eye', desc: 'Low-angle beetle perspective' },
                  { id: 'top_down', label: 'Top-Down Specimen', desc: 'Plan view canopy map' },
                ].map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => onUpdateState({ cameraPreset: cam.id as CameraPreset })}
                    aria-label={`Camera view ${cam.label}`}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      state.cameraPreset === cam.id
                        ? 'bg-neutral-800 border-emerald-500/80 text-emerald-300'
                        : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <div className="text-xs font-semibold">{cam.label}</div>
                    <div className="text-[10px] text-neutral-500">{cam.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                <span>Drag with mouse / touch to orbit 3D view • Scroll wheel to zoom</span>
                <button
                  onClick={() => onUpdateState({ autoRotate: !state.autoRotate })}
                  aria-label="Toggle camera auto rotate"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs cursor-pointer ${
                    state.autoRotate
                      ? 'bg-emerald-950 border-emerald-700/60 text-emerald-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <RotateCw size={13} />
                  <span>Auto-Rotate {state.autoRotate ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
