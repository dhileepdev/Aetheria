import React from 'react';
import { PlacedPlant } from '../types/terrarium';
import { PLANT_CATALOG } from '../graphics/flora/PlantCatalog';
import { X, Droplets, Trash2, RotateCw, Maximize2 } from 'lucide-react';

interface PlantEditCardProps {
  plant: PlacedPlant;
  onUpdatePlant: (updated: PlacedPlant) => void;
  onRemovePlant: (id: string) => void;
  onClose: () => void;
  onWaterPlant: (id: string) => void;
}

export const PlantEditCard: React.FC<PlantEditCardProps> = ({
  plant,
  onUpdatePlant,
  onRemovePlant,
  onClose,
  onWaterPlant,
}) => {
  const def = PLANT_CATALOG[plant.species];

  return (
    <div className="absolute top-20 right-4 w-80 bg-neutral-900/95 border border-neutral-800 rounded-2xl p-4.5 shadow-2xl z-20 text-neutral-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{def.icon}</span>
          <div>
            <h3 className="font-semibold text-sm text-neutral-100">{def.name}</h3>
            <p className="text-[11px] font-mono text-emerald-400 italic">{def.scientificName}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close plant inspector"
          className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <p className="text-xs text-neutral-400 mt-2.5 leading-relaxed">{def.description}</p>

      {/* Sliders */}
      <div className="mt-3.5 space-y-3">
        {/* Growth Stage */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Maximize2 size={13} className="text-emerald-400" /> Growth Stage
            </span>
            <span className="font-mono text-emerald-300">
              {plant.growthStage <= 0.35 ? 'Sprout' : plant.growthStage <= 0.75 ? 'Budding' : 'Mature'}
            </span>
          </div>
          <input
            type="range"
            min="0.25"
            max="1.2"
            step="0.05"
            value={plant.growthStage}
            onChange={(e) => onUpdatePlant({ ...plant, growthStage: parseFloat(e.target.value) })}
            aria-label="Plant growth stage"
            className="w-full accent-emerald-500 bg-neutral-800 rounded-lg h-1.5 cursor-pointer"
          />
        </div>

        {/* Scale */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-neutral-400">Scale / Size</span>
            <span className="font-mono text-neutral-300">{Math.round(plant.scale * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.5"
            step="0.05"
            value={plant.scale}
            onChange={(e) => onUpdatePlant({ ...plant, scale: parseFloat(e.target.value) })}
            aria-label="Plant scale"
            className="w-full accent-emerald-500 bg-neutral-800 rounded-lg h-1.5 cursor-pointer"
          />
        </div>

        {/* Rotation */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <RotateCw size={13} className="text-emerald-400" /> Rotation
            </span>
            <span className="font-mono text-neutral-300">{Math.round((plant.rotationY / Math.PI) * 180)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.PI * 2}
            step="0.1"
            value={plant.rotationY}
            onChange={(e) => onUpdatePlant({ ...plant, rotationY: parseFloat(e.target.value) })}
            aria-label="Plant rotation"
            className="w-full accent-emerald-500 bg-neutral-800 rounded-lg h-1.5 cursor-pointer"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-800/80">
        <button
          onClick={() => onWaterPlant(plant.id)}
          aria-label="Water plant and boost growth"
          className="flex-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Droplets size={14} className="text-blue-400" />
          Water Plant
        </button>

        <button
          onClick={() => onRemovePlant(plant.id)}
          aria-label="Remove plant from terrarium"
          title="Remove Plant"
          className="bg-neutral-800/80 hover:bg-rose-950/80 border border-neutral-700/60 hover:border-rose-700/60 text-neutral-400 hover:text-rose-300 p-2 rounded-xl transition-colors cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
