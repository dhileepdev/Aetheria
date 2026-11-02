import React from 'react';
import { PlantSpecies } from '../types/terrarium';
import { PLANT_CATALOG } from '../graphics/flora/PlantCatalog';
import { X, Check } from 'lucide-react';

interface PlantingBannerProps {
  activeSpecies: PlantSpecies;
  onQuickPlace: () => void;
  onCancel: () => void;
}

export const PlantingBanner: React.FC<PlantingBannerProps> = ({
  activeSpecies,
  onQuickPlace,
  onCancel,
}) => {
  const def = PLANT_CATALOG[activeSpecies];

  return (
    <div className="absolute top-18 inset-x-0 flex justify-center pointer-events-none z-20 px-4">
      <div className="bg-emerald-950/95 border border-emerald-500/50 text-emerald-100 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 pointer-events-auto max-w-xl">
        <span className="text-2xl">{def.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-emerald-200">Planting: {def.name}</span>
            <span className="text-xs bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/50">
              {def.category}
            </span>
          </div>
          <p className="text-xs text-emerald-300/80 truncate">Click anywhere on the 3D moss bed to plant</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onQuickPlace}
            aria-label="Place plant at open spot"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Check size={14} />
            Place Here
          </button>
          <button
            onClick={onCancel}
            aria-label="Cancel plant placement"
            className="bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 border border-emerald-700/50 transition-colors cursor-pointer"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
