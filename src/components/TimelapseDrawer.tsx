import React, { useState, useEffect, useRef } from 'react';
import { TimelapseFrame, TimelapseConfig } from '../types/timelapse';
import { downloadFrameAsPng, exportInteractiveHtmlTimelapse, downloadFramesAsJson } from '../utils/timelapse';
import {
  X,
  Play,
  Pause,
  Camera,
  Film,
  Download,
  Trash2,
  Clock,
  Sparkles,
  RefreshCw,
  Sliders,
  Maximize2,
  FileCode,
  FileImage,
} from 'lucide-react';

interface TimelapseDrawerProps {
  frames: TimelapseFrame[];
  config: TimelapseConfig;
  isOpen: boolean;
  onClose: () => void;
  onCaptureFrame: (label?: string) => void;
  onRunSolarSequence: () => void;
  onRunGrowthSequence: () => void;
  onDeleteFrame: (id: string) => void;
  onClearAllFrames: () => void;
  onUpdateConfig: (partial: Partial<TimelapseConfig>) => void;
  isRecordingSequence: boolean;
}

export const TimelapseDrawer: React.FC<TimelapseDrawerProps> = ({
  frames,
  config,
  isOpen,
  onClose,
  onCaptureFrame,
  onRunSolarSequence,
  onRunGrowthSequence,
  onDeleteFrame,
  onClearAllFrames,
  onUpdateConfig,
  isRecordingSequence,
}) => {
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2); // 1 = 2fps, 2 = 5fps, 4 = 10fps
  const [activeTab, setActiveTab] = useState<'visualizer' | 'gallery' | 'settings'>('visualizer');

  const playbackTimerRef = useRef<number | null>(null);

  // Keep frame index valid when frames change
  useEffect(() => {
    if (frames.length === 0) {
      setActiveFrameIndex(0);
      setIsPlaying(false);
    } else if (activeFrameIndex >= frames.length) {
      setActiveFrameIndex(frames.length - 1);
    }
  }, [frames.length, activeFrameIndex]);

  // Handle Playback Loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      return;
    }

    const fps = playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 5 : 10;
    const intervalMs = 1000 / fps;

    playbackTimerRef.current = window.setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % frames.length);
    }, intervalMs);

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    };
  }, [isPlaying, frames.length, playbackSpeed]);

  if (!isOpen) return null;

  const currentFrame = frames[activeFrameIndex] || null;

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-700/50 text-emerald-400">
              <Film size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                Ecosystem Timelapse Studio
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {frames.length} Frame{frames.length === 1 ? '' : 's'}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">Record, playback, and export 3D terrarium history</p>
            </div>
          </div>

          {/* Action Tabs & Close */}
          <div className="flex items-center gap-2">
            <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                onClick={() => setActiveTab('visualizer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'visualizer'
                    ? 'bg-neutral-800 text-emerald-400 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Player
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'gallery'
                    ? 'bg-neutral-800 text-emerald-400 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Gallery ({frames.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-neutral-800 text-emerald-400 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Settings
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close timelapse studio"
              className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: VISUALIZER / PLAYER */}
          {activeTab === 'visualizer' && (
            <div className="space-y-5">
              {/* Screen / Display Area */}
              <div className="relative w-full aspect-video bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-inner flex items-center justify-center group">
                {currentFrame ? (
                  <>
                    <img
                      src={currentFrame.dataUrl}
                      alt={currentFrame.label}
                      className="w-full h-full object-contain"
                    />
                    {/* Badge Overlay */}
                    <div className="absolute top-4 left-4 bg-neutral-900/90 border border-neutral-700/80 px-3.5 py-1.5 rounded-xl text-xs font-mono text-emerald-300 shadow-lg flex items-center gap-2">
                      <Clock size={13} className="text-emerald-400" />
                      <span>{currentFrame.label}</span>
                    </div>

                    <div className="absolute top-4 right-4 bg-neutral-900/90 border border-neutral-700/80 px-3.5 py-1.5 rounded-xl text-xs font-mono text-neutral-300 shadow-lg">
                      Frame {activeFrameIndex + 1} of {frames.length}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8 text-neutral-500 space-y-3">
                    <Camera size={40} className="mx-auto text-neutral-600" />
                    <div>
                      <p className="text-sm font-medium text-neutral-300">No Timelapse Frames Captured Yet</p>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                        Snap instant 3D screenshots or record automated solar/growth sequences to visualize history.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Player Controls & Scrubber */}
              {frames.length > 0 && (
                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/80 space-y-3">
                  <input
                    type="range"
                    min="0"
                    max={frames.length - 1}
                    value={activeFrameIndex}
                    onChange={(e) => setActiveFrameIndex(parseInt(e.target.value))}
                    aria-label="Timelapse scrubber timeline"
                    className="w-full accent-emerald-500 bg-neutral-800 rounded-lg h-2 cursor-pointer"
                  />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    {/* Play / Speed */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        aria-label={isPlaying ? 'Pause playback' : 'Play timelapse animation'}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-md"
                      >
                        {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                        <span>{isPlaying ? 'Pause' : 'Play Animation'}</span>
                      </button>

                      <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
                        {[
                          { speed: 1, label: '1x' },
                          { speed: 2, label: '2x' },
                          { speed: 4, label: '4x' },
                        ].map((sp) => (
                          <button
                            key={sp.speed}
                            onClick={() => setPlaybackSpeed(sp.speed)}
                            className={`px-2.5 py-1 rounded-lg font-mono cursor-pointer transition-colors ${
                              playbackSpeed === sp.speed
                                ? 'bg-neutral-800 text-emerald-300 font-bold'
                                : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                          >
                            {sp.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Single frame actions */}
                    {currentFrame && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadFrameAsPng(currentFrame)}
                          className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileImage size={14} />
                          <span>Download Frame</span>
                        </button>
                        <button
                          onClick={() => onDeleteFrame(currentFrame.id)}
                          className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 rounded-xl transition-colors cursor-pointer"
                          title="Delete current frame"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Record Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => onCaptureFrame('Manual Snapshot')}
                  disabled={isRecordingSequence}
                  className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 p-3.5 rounded-2xl text-left transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
                    <Camera size={16} />
                    <span>Snap Snapshot</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-tight">
                    Instant 3D WebGL render capture of current terrarium view
                  </p>
                </button>

                <button
                  onClick={onRunSolarSequence}
                  disabled={isRecordingSequence}
                  className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 p-3.5 rounded-2xl text-left transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
                    <Sparkles size={16} />
                    <span>{isRecordingSequence ? 'Recording...' : '24h Solar Sequence'}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-tight">
                    Auto-steps through 24h day/night cycle and records 12 frames
                  </p>
                </button>

                <button
                  onClick={onRunGrowthSequence}
                  disabled={isRecordingSequence}
                  className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 p-3.5 rounded-2xl text-left transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs mb-1">
                    <Maximize2 size={16} />
                    <span>Growth Sequence</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-tight">
                    Simulates growth stages from sprout to mature foliage
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {frames.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Film size={36} className="mx-auto mb-2 text-neutral-600" />
                  <p className="text-sm font-medium text-neutral-300">No frames in gallery</p>
                  <p className="text-xs mt-1">Use the Snap button or run automated sequences to collect history.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="text-xs text-neutral-400 font-mono">Total Frames: {frames.length}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportInteractiveHtmlTimelapse(frames)}
                        className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileCode size={14} />
                        <span>Export HTML Player</span>
                      </button>
                      <button
                        onClick={() => downloadFramesAsJson(frames)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download size={14} />
                        <span>Export JSON</span>
                      </button>
                      <button
                        onClick={onClearAllFrames}
                        className="bg-neutral-900 hover:bg-rose-950 border border-neutral-800 hover:border-rose-700/60 text-neutral-400 hover:text-rose-300 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                        <span>Clear All</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {frames.map((f, idx) => (
                      <div
                        key={f.id}
                        onClick={() => {
                          setActiveFrameIndex(idx);
                          setActiveTab('visualizer');
                        }}
                        className={`group relative bg-neutral-950 border rounded-2xl overflow-hidden cursor-pointer transition-all ${
                          activeFrameIndex === idx
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="aspect-video w-full bg-neutral-900">
                          <img src={f.dataUrl} alt={f.label} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2.5">
                          <div className="text-[11px] font-semibold text-neutral-200 truncate">{f.label}</div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                            {new Date(f.timestamp).toLocaleTimeString()}
                          </div>
                        </div>

                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFrameAsPng(f);
                            }}
                            aria-label="Download image frame"
                            className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-xl shadow cursor-pointer"
                            title="Download PNG"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFrame(f.id);
                            }}
                            aria-label="Delete image frame"
                            className="p-2 bg-neutral-900 hover:bg-rose-950 text-rose-300 rounded-xl shadow cursor-pointer"
                            title="Delete frame"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-5 max-w-lg mx-auto py-2">
              <div className="bg-neutral-950 p-4.5 rounded-2xl border border-neutral-800 space-y-4">
                <h3 className="font-semibold text-sm text-neutral-200 flex items-center gap-2">
                  <Sliders size={16} className="text-emerald-400" />
                  Auto-Capture Interval Recorder
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-neutral-200">Enable Periodic Auto-Capture</div>
                    <div className="text-[11px] text-neutral-400">Captures a frame automatically while app is open</div>
                  </div>
                  <button
                    onClick={() => onUpdateConfig({ autoCapture: !config.autoCapture })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      config.autoCapture
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {config.autoCapture ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-800">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Capture Interval</span>
                    <span className="font-mono text-emerald-300">{config.intervalSeconds} seconds</span>
                  </div>
                  <div className="flex gap-2">
                    {[5, 10, 30, 60].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => onUpdateConfig({ intervalSeconds: sec })}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                          config.intervalSeconds === sec
                            ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 font-bold'
                            : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-800">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Max Frame Buffer Limit</span>
                    <span className="font-mono text-neutral-200">{config.maxFrames} frames</span>
                  </div>
                  <div className="flex gap-2">
                    {[30, 60, 100].map((maxF) => (
                      <button
                        key={maxF}
                        onClick={() => onUpdateConfig({ maxFrames: maxF })}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                          config.maxFrames === maxF
                            ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 font-bold'
                            : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                        }`}
                      >
                        {maxF}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Export Formats Callout */}
              <div className="bg-neutral-950 p-4.5 rounded-2xl border border-neutral-800 text-xs space-y-2">
                <span className="font-semibold text-neutral-200 block">Standalone Export Options</span>
                <p className="text-neutral-400 leading-relaxed">
                  Export your full 3D history as an offline interactive HTML Player file that can be opened in any web browser without server setup, or export raw JSON logs.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
