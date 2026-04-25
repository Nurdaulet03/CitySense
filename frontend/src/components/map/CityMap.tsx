"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useAppStore } from "@/lib/store";
import {
  airQualityAPI,
  trafficAPI,
  weatherAPI,
  eventsAPI,
  communityNotesAPI,
} from "@/lib/api";

// Fix default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function createAqiIcon(aqi: number, pm25: number) {
  const colorClass: Record<number, string> = {
    1: "aqi-good",
    2: "aqi-fair",
    3: "aqi-moderate",
    4: "aqi-poor",
    5: "aqi-very-poor",
  };
  return L.divIcon({
    className: "",
    html: `<div class="aqi-marker ${colorClass[aqi] || "aqi-moderate"}">${Math.round(pm25)}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function createEventIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#8b5cf6;color:white;font-size:16px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🎉</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function createNoteIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#0ea5e9;color:white;font-size:14px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">📝</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createWeatherIcon(temp: number, icon: string) {
  const bgColor = temp <= 0 ? '#60a5fa' : temp <= 15 ? '#38bdf8' : temp <= 25 ? '#22c55e' : temp <= 35 ? '#f97316' : '#ef4444';
  return L.divIcon({
    className: "",
    html: `<div class="weather-marker" style="background:${bgColor}">
      <img src="https://openweathermap.org/img/wn/${icon}.png" width="24" height="24" alt="" style="margin:-2px 0" />
      <span>${Math.round(temp)}°</span>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}


function MapUpdater() {
  const map = useMap();
  const mapCenter = useAppStore((s) => s.mapCenter);
  const mapZoom = useAppStore((s) => s.mapZoom);

  useEffect(() => {
    map.setView(mapCenter, mapZoom);
  }, [map, mapCenter, mapZoom]);

  return null;
}

function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface AqiPoint {
  lat: number;
  lng: number;
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
}

interface WeatherPoint {
  lat: number;
  lng: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  description: string;
  icon: string;
  main: string;
}


interface EventData {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: { lat: number; lng: number; address?: string };
  startDate: string;
  attendees: string[];
}

interface NoteData {
  _id: string;
  text: string;
  category: string;
  location: { lat: number; lng: number };
  author: { name: string };
  likes: string[];
  createdAt: string;
}

const TILES: Record<string, string> = {
  light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  muted: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

export default function CityMap({
  onMapClick,
  placingMode,
}: {
  onMapClick?: (lat: number, lng: number) => void;
  placingMode?: boolean;
}) {
  const { mapCenter, mapZoom, layers, mapTheme, setAirQuality, setTrafficData } = useAppStore();
  const [aqiGrid, setAqiGrid] = useState<AqiPoint[]>([]);
  const [weatherGrid, setWeatherGrid] = useState<WeatherPoint[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [notes, setNotes] = useState<NoteData[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const promises = [];

      if (layers.airQuality) {
        promises.push(
          airQualityAPI.getGrid().then((res) => {
            setAqiGrid(res.data);
            if (res.data.length > 0) {
              setAirQuality({
                aqi: res.data[0].aqi,
                category: res.data[0].category,
                pm25: res.data[0].pm25,
                pm10: res.data[0].pm10,
                no2: 0,
                so2: 0,
                co: 0,
                o3: 0,
              });
            }
          }).catch(() => {})
        );
      }

      if (layers.weather) {
        promises.push(
          weatherAPI.getGrid().then((res) => {
            setWeatherGrid(res.data);
          }).catch(() => {})
        );
      } else {
        setWeatherGrid([]);
      }

      if (layers.traffic) {
        promises.push(
          trafficAPI.getCurrent().then((res) => {
            setTrafficData(res.data);
          }).catch(() => {})
        );
      }

      if (layers.events) {
        promises.push(
          eventsAPI.getAll().then((res) => setEvents(res.data)).catch(() => {})
        );
      }

      if (layers.communityNotes) {
        promises.push(
          communityNotesAPI.getAll().then((res) => setNotes(res.data)).catch(() => {})
        );
      }

      await Promise.all(promises);
    } catch (err) {
      console.error("Failed to fetch map data:", err);
    }
  }, [layers, setAirQuality, setTrafficData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      className={`h-full w-full rounded-xl ${placingMode ? "cursor-crosshair" : ""}`}
      zoomControl={false}
    >
      <TileLayer
        key={mapTheme}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={TILES[mapTheme]}
      />
      <MapUpdater />
      {placingMode && <MapClickHandler onClick={onMapClick} />}

      {/* Air Quality Layer */}
      {layers.airQuality &&
        aqiGrid.map((point, i) => (
          <Marker
            key={`aqi-${i}`}
            position={[point.lat, point.lng]}
            icon={createAqiIcon(point.aqi, point.pm25)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Air Quality</p>
                <p>AQI: {point.aqi} ({point.category})</p>
                <p>PM2.5: {point.pm25} μg/m³</p>
                <p>PM10: {point.pm10} μg/m³</p>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Weather Layer */}
      {layers.weather &&
        weatherGrid.map((point, i) => (
          <Marker
            key={`weather-${i}`}
            position={[point.lat, point.lng]}
            icon={createWeatherIcon(point.temp, point.icon)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold capitalize">{point.description}</p>
                <p>Temp: {Math.round(point.temp)}°C (feels {Math.round(point.feelsLike)}°C)</p>
                <p>Humidity: {point.humidity}%</p>
                <p>Wind: {point.windSpeed} m/s</p>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Events Layer */}
      {layers.events &&
        events.map((event) => (
          <Marker
            key={`event-${event._id}`}
            position={[event.location.lat, event.location.lng]}
            icon={createEventIcon()}
          >
            <Popup>
              <div className="text-sm max-w-[200px]">
                <p className="font-semibold text-base">{event.title}</p>
                <p className="text-gray-600 mt-1">{event.description}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(event.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs">
                  {event.attendees?.length || 0} attending
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Community Notes Layer */}
      {layers.communityNotes &&
        notes.map((note) => (
          <Marker
            key={`note-${note._id}`}
            position={[note.location.lat, note.location.lng]}
            icon={createNoteIcon()}
          >
            <Popup>
              <div className="text-sm max-w-[200px]">
                <p className="font-medium">{note.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  by {note.author?.name || "Anonymous"} ·{" "}
                  {note.likes?.length || 0} ❤️
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}

