import { create } from 'zustand';
import { authAPI } from './api';

interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    notifications: boolean;
    favoriteLocations: { name: string; lat: number; lng: number }[];
    interests: string[];
    healthSensitive: boolean;
    commuteMode: string;
  };
  city: string;
  defaultLocation: { lat: number; lng: number };
}

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDeg: number;
  clouds: number;
  visibility: number;
  description: string;
  icon: string;
  main: string;
}

interface AirQualityData {
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

interface TrafficPoint {
  location: { lat: number; lng: number };
  roadName: string;
  congestionScore: number;
  congestionLevel: string;
  speedKmh: number;
  freeFlowSpeedKmh: number;
}

interface MapLayers {
  airQuality: boolean;
  traffic: boolean;
  weather: boolean;
  events: boolean;
  communityNotes: boolean;
}

interface AppState {
  // Auth — session is stored in MongoDB, not localStorage
  user: User | null;
  authLoading: boolean;
  setUser: (user: User | null) => void;
  loadAuth: () => Promise<void>;
  logout: () => Promise<void>;

  // Map
  mapCenter: [number, number];
  mapZoom: number;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  layers: MapLayers;
  toggleLayer: (layer: keyof MapLayers) => void;

  // Data
  weather: WeatherData | null;
  airQuality: AirQualityData | null;
  trafficData: TrafficPoint[];
  setWeather: (data: WeatherData) => void;
  setAirQuality: (data: AirQualityData) => void;
  setTrafficData: (data: TrafficPoint[]) => void;

  // UI
  mapTheme: 'light' | 'muted' | 'dark';
  cycleMapTheme: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
}

const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT || '43.238949');
const DEFAULT_LNG = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG || '76.945465');

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  authLoading: true,
  setUser: (user) => set({ user }),

  /**
   * Load current user from the server session.
   * The browser sends the httpOnly cookie automatically;
   * the server looks up the session in MongoDB and returns the user.
   */
  loadAuth: async () => {
    set({ authLoading: true });
    try {
      const res = await authAPI.getMe();
      set({ user: res.data.user, authLoading: false });
    } catch {
      set({ user: null, authLoading: false });
    }
  },

  /**
   * Destroy session on server (removes it from MongoDB)
   * and clear local state.
   */
  logout: async () => {
    try {
      await authAPI.logout();
    } catch {
      // Even if request fails, clear local state
    }
    set({ user: null });
  },

  // Map
  mapCenter: [DEFAULT_LAT, DEFAULT_LNG],
  mapZoom: 13,
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  layers: {
    airQuality: true,
    traffic: true,
    weather: true,
    events: true,
    communityNotes: true,
  },
  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),

  // Data
  weather: null,
  airQuality: null,
  trafficData: [],
  setWeather: (data) => set({ weather: data }),
  setAirQuality: (data) => set({ airQuality: data }),
  setTrafficData: (data) => set({ trafficData: data }),

  // UI
  mapTheme: 'muted',
  cycleMapTheme: () =>
    set((state) => {
      const order: Array<'light' | 'muted' | 'dark'> = ['light', 'muted', 'dark'];
      const next = order[(order.indexOf(state.mapTheme) + 1) % order.length];
      return { mapTheme: next };
    }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
}));
