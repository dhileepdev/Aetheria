import { WeatherType } from './terrarium';

export interface TimelapseFrame {
  id: string;
  timestamp: number;
  timeOfDay: number;
  dataUrl: string;
  plantCount: number;
  weather: WeatherType;
  label: string;
}

export interface TimelapseConfig {
  autoCapture: boolean;
  intervalSeconds: number; // 5, 10, 30, 60
  maxFrames: number; // 30, 60, 100
  solarStepCapture: boolean; // Auto capture when time of day changes by >= 1 hour
}
