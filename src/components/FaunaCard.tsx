import React from 'react';
import { FaunaEntity } from '../types/terrarium';
import { X, Utensils, Zap, Sparkles } from 'lucide-react';

interface FaunaCardProps {
  creature: FaunaEntity;
  onFeed: (id: string) => void;
  onInteract: (id: string) => void;
  onClose: () => void;
}

export const FaunaCard: React.FC<FaunaCardProps> = ({
  creature,
  onFeed,
  onInteract,
  onClose,
}) => {
  const getSpeciesIcon = () => {
    switch (creature.species) {
      case 'jewel_beetle':
        return '🪲';
      case 'pygmy_gecko':
        return '🦎';
      case 'amber_snail':
        return '🐌';
      case 'spore_moth':
        return '🦋';
      default:
        return '🦗';
    }
  };

  const getStateBadge = () => {
    switch (creature.state) {
      case 'wandering':
        return { label: 'Wandering', color: 'bg-blue-900/60 text-blue-300 border-blue-700/50' };
      case 'eating':
        return { label: 'Feeding', color: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50' };
      case 'resting':
        return { label: 'Resting', color: 'bg-purple-900/60 text-purple-300 border-purple-700/50' };
      case 'alert':
        return { label: 'Alert / Startled', color: 'bg-amber-900/60 text-amber-300 border-amber-700/50' };
    }
  };

  const badge = getStateBadge();

  return (
    <div className="absolute top-20 right-4 w-80 bg-neutral-900/95 border border-neutral-800 rounded-2xl p-4.5 shadow-2xl z-20 text-neutral-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{getSpeciesIcon()}</span>
          <div>
            <h3 className="font-semibold text-sm text-neutral-100">{creature.name}</h3>
            <p className="text-[11px] font-mono text-emerald-400 italic">{creature.scientificName}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close creature inspector"
          className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* State & Food */}
      <div className="mt-3 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400">Current Behavior</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Hunger Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Utensils size={12} className="text-amber-400" /> Satiety
            </span>
            <span className="font-mono text-neutral-300">{100 - Math.round(creature.hunger)}%</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, 100 - creature.hunger)}%` }}
            />
          </div>
        </div>

        {/* Energy Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Zap size={12} className="text-emerald-400" /> Energy
            </span>
            <span className="font-mono text-neutral-300">{Math.round(creature.energy)}%</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, creature.energy)}%` }}
            />
          </div>
        </div>

        <div className="bg-neutral-950/60 rounded-xl p-2.5 border border-neutral-800/60 text-xs">
          <span className="text-neutral-400 block mb-0.5">Favorite Diet:</span>
          <span className="text-neutral-200">{creature.favoriteFood}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-800/80">
        <button
          onClick={() => onFeed(creature.id)}
          aria-label="Feed creature fresh food"
          className="flex-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-200 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Utensils size={14} className="text-amber-400" />
          Feed Snack
        </button>

        <button
          onClick={() => onInteract(creature.id)}
          aria-label="Interact with creature"
          className="flex-1 bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles size={14} className="text-teal-400" />
          Poke / Interact
        </button>
      </div>
    </div>
  );
};
