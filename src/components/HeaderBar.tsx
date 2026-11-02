import React from 'react';
import { Volume2, VolumeX, Eye, EyeOff, Sparkles, Sun, Moon, CloudRain, Wind, Film } from 'lucide-react';
import { formatTimeOfDay } from '../utils/math';
import { TerrariumState } from '../types/terrarium';

interface HeaderBarProps {
  state: TerrariumState;
  onToggleSound: () => void;
  onToggleCinema: () => void;
  isCinemaMode: boolean;
  onResetEcosystem: () => void;
  onOpenTimelapse: () => void;
  frameCount: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  state,
  onToggleSound,
  onToggleCinema,
  isCinemaMode,
  onResetEcosystem,
  onOpenTimelapse,
  frameCount,
}) => {
  const isNight = state.timeOfDay < 5.5 || state.timeOfDay > 19.5;

  return (
    <header className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-20">
      {/* Title & Ecosystem Badge */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-sm tracking-wide text-neutral-100">AETHERIA</span>
          <span className="text-xs text-neutral-400 font-mono hidden sm:inline">Living Terrarium</span>
        </div>

        {/* Live Ecosystem Metric Badge */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl px-3.5 py-2 flex items-center gap-3 text-xs font-mono text-neutral-300 shadow-lg">
          <div className="flex items-center gap-1.5 text-amber-300">
            {isNight ? <Moon size={14} className="text-indigo-400" /> : <Sun size={14} className="text-amber-400" />}
            <span>{formatTimeOfDay(state.timeOfDay)}</span>
          </div>
          <span className="text-neutral-600">|</span>
          <div className="flex items-center gap-1.5 text-blue-300">
            <CloudRain size={14} />
            <span>{state.humidity}% Humid</span>
          </div>
          <span className="text-neutral-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center gap-1.5 text-teal-300">
            <Wind size={14} />
            <span>{Math.round(state.windStrength * 15)} mph</span>
          </div>
        </div>
      </div>

      {/* Action Tools */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Timelapse Studio Button */}
        <button
          onClick={onOpenTimelapse}
          aria-label="Open timelapse studio"
          title="Open Timelapse Studio"
          className="bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 text-neutral-200 hover:text-white px-3 py-2 rounded-xl transition-colors shadow-lg cursor-pointer flex items-center gap-2 text-xs font-medium"
        >
          <Film size={15} className="text-emerald-400" />
          <span className="hidden sm:inline">Timelapse</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-800">
            {frameCount}
          </span>
        </button>

        {/* Procedural Sound Toggle */}
        <button
          onClick={onToggleSound}
          aria-label={state.soundEnabled ? 'Mute ambient sound' : 'Unmute procedural soundscape'}
          title={state.soundEnabled ? 'Mute Sound' : 'Enable Procedural Soundscape'}
          className={`p-2.5 rounded-xl border transition-colors shadow-lg cursor-pointer ${
            state.soundEnabled
              ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/80'
              : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/90'
          }`}
        >
          {state.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Reset Ecosystem */}
        <button
          onClick={onResetEcosystem}
          aria-label="Regenerate ecosystem seed"
          title="New Random Ecosystem"
          className="bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 text-neutral-300 hover:text-neutral-100 p-2.5 rounded-xl transition-colors shadow-lg cursor-pointer flex items-center gap-1.5 text-xs font-medium"
        >
          <Sparkles size={15} className="text-emerald-400" />
          <span className="hidden sm:inline">Regenerate</span>
        </button>

        {/* Zen Cinema Mode Toggle */}
        <button
          onClick={onToggleCinema}
          aria-label={isCinemaMode ? 'Show control interface' : 'Zen fullscreen view'}
          title={isCinemaMode ? 'Exit Zen Mode (H)' : 'Enter Zen View (H)'}
          className="bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 text-neutral-300 hover:text-neutral-100 p-2.5 rounded-xl transition-colors shadow-lg cursor-pointer"
        >
          {isCinemaMode ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
    </header>
  );
};
