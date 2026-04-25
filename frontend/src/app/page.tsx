"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useCallback, useEffect } from "react";
import {
  Car,
  Wind,
  Cloud,
  CalendarDays,
  MessageSquare,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Droplets,
  Thermometer,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatWidget } from "@/components/widgets/ChatWidget";
import { AddEventDialog } from "@/components/map/AddEventDialog";
import { AddNoteDialog } from "@/components/map/AddNoteDialog";
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary";
import { weatherAPI, airQualityAPI, aiAPI } from "@/lib/api";
import type { MapLayers } from "@/components/map/YandexTrafficMap";

const YandexTrafficMap = dynamic(
  () => import("@/components/map/YandexTrafficMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span className="text-muted-foreground text-sm">
            Загрузка карты...
          </span>
        </div>
      </div>
    ),
  }
);

/* ─── Types ─── */

interface TrafficRoad {
  congestionScore: number;
  congestionLevel: string;
  roadName: string;
}

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

interface AqiData {
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
}

interface GoOutData {
  score: number;
}

export type PlacingMode = "event" | "note" | null;

/* ─── Helpers ─── */

function computeTrafficScore(roads: TrafficRoad[]): number {
  if (roads.length === 0) return 0;
  const avg =
    roads.reduce((sum, r) => sum + r.congestionScore, 0) / roads.length;
  return Math.round((avg / 100) * 10);
}

function getScoreColor(score: number): string {
  if (score <= 3) return "#22c55e";
  if (score <= 5) return "#eab308";
  if (score <= 7) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score <= 2) return "Свободно";
  if (score <= 4) return "Небольшие затруднения";
  if (score <= 6) return "Затруднения";
  if (score <= 8) return "Пробки";
  return "Серьёзные пробки";
}

/* ─── Page ─── */

export default function HomePage() {
  const [layers, setLayers] = useState<MapLayers>({
    traffic: true,
    airQuality: false,
    events: true,
    communityNotes: true,
    weather: false,
  });

  const [trafficScore, setTrafficScore] = useState(0);
  const [trafficRoads, setTrafficRoads] = useState<TrafficRoad[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aqi, setAqi] = useState<AqiData | null>(null);
  const [goOut, setGoOut] = useState<GoOutData | null>(null);

  const [placingMode, setPlacingMode] = useState<PlacingMode>(null);
  const [clickedPos, setClickedPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  useEffect(() => {
    weatherAPI
      .getCurrent()
      .then((res) => setWeather(res.data))
      .catch(() => {});
    airQualityAPI
      .getCurrent()
      .then((res) => setAqi(res.data))
      .catch(() => {});
    aiAPI
      .getGoOutScore()
      .then((res) => setGoOut(res.data))
      .catch(() => {});
  }, []);

  const toggleLayer = (key: keyof MapLayers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTrafficLoaded = useCallback((roads: TrafficRoad[]) => {
    setTrafficRoads(roads);
    setTrafficScore(computeTrafficScore(roads));
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!placingMode) return;
      setClickedPos({ lat, lng });
      if (placingMode === "event") setEventDialogOpen(true);
      if (placingMode === "note") setNoteDialogOpen(true);
      setPlacingMode(null);
    },
    [placingMode]
  );

  const handleCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  const layerConfigs: {
    key: keyof MapLayers;
    label: string;
    icon: typeof Car;
    activeColor: string;
  }[] = [
    { key: "traffic", label: "Пробки", icon: Car, activeColor: "bg-red-500" },
    {
      key: "airQuality",
      label: "Воздух",
      icon: Wind,
      activeColor: "bg-green-500",
    },
    {
      key: "events",
      label: "События",
      icon: CalendarDays,
      activeColor: "bg-purple-500",
    },
    {
      key: "communityNotes",
      label: "Заметки",
      icon: MessageSquare,
      activeColor: "bg-cyan-500",
    },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* ── Placing mode banner ── */}
      {placingMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium shadow-xl flex items-center gap-2">
          <span className="animate-pulse">
            Нажмите на карту чтобы{" "}
            {placingMode === "event"
              ? "добавить событие"
              : "оставить комментарий"}
          </span>
          <button
            onClick={() => setPlacingMode(null)}
            className="ml-1 hover:bg-white/20 rounded-full h-5 w-5 flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Yandex Map ── */}
      <MapErrorBoundary>
        <Suspense
          fallback={
            <div className="h-full bg-background flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">
                Загрузка...
              </div>
            </div>
          }
        >
          <YandexTrafficMap
            key={refreshKey}
            layers={layers}
            onMapClick={handleMapClick}
            placingMode={!!placingMode}
            onTrafficLoaded={handleTrafficLoaded}
          />
        </Suspense>
      </MapErrorBoundary>

      {/* ── Traffic Score Badge (top-left) ── */}
      <div className="absolute top-4 left-4 z-[500]">
        <button
          onClick={() => setPanelOpen((p) => !p)}
          className="traffic-score-badge"
          style={{ borderColor: getScoreColor(trafficScore) }}
        >
          <div
            className="traffic-score-number"
            style={{ color: getScoreColor(trafficScore) }}
          >
            {trafficScore}
          </div>
          <div className="traffic-score-details">
            <span className="traffic-score-label">Баллов</span>
            <span className="traffic-score-desc">
              {getScoreLabel(trafficScore)}
            </span>
          </div>
          {panelOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {panelOpen && trafficRoads.length > 0 && (
          <Card className="mt-2 p-3 bg-card/95 backdrop-blur-md border-border/50 shadow-xl max-h-[300px] overflow-y-auto w-72">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Дороги Алматы
            </p>
            <div className="space-y-2">
              {trafficRoads
                .sort((a, b) => b.congestionScore - a.congestionScore)
                .map((road, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        background:
                          road.congestionScore <= 30
                            ? "#22c55e"
                            : road.congestionScore <= 55
                            ? "#eab308"
                            : road.congestionScore <= 75
                            ? "#f97316"
                            : "#ef4444",
                      }}
                    />
                    <span className="text-sm flex-1 truncate">
                      {road.roadName}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {road.congestionScore}%
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>

      {/* ── Layer Toggles (left side) ── */}
      <div className="absolute top-24 left-4 z-[500] flex flex-col gap-1.5">
        {layerConfigs.map((cfg) => {
          const Icon = cfg.icon;
          const active = layers[cfg.key];
          return (
            <button
              key={cfg.key}
              onClick={() => toggleLayer(cfg.key)}
              className={`layer-toggle-btn ${active ? "layer-toggle-active" : ""}`}
              title={cfg.label}
            >
              <div
                className={`w-2 h-2 rounded-full ${active ? cfg.activeColor : "bg-muted-foreground/30"}`}
              />
              <Icon className="h-4 w-4" />
              <span className="text-xs">{cfg.label}</span>
              {active ? (
                <Eye className="h-3 w-3 ml-auto opacity-60" />
              ) : (
                <EyeOff className="h-3 w-3 ml-auto opacity-40" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Add Event/Note FAB (bottom-left) ── */}
      <div className="absolute bottom-24 left-4 z-[500]">
        <div className="relative">
          {addMenuOpen && (
            <div className="absolute bottom-14 left-0 flex flex-col gap-2 animate-in">
              <Button
                size="sm"
                variant={placingMode === "event" ? "default" : "secondary"}
                className="gap-2 shadow-lg whitespace-nowrap"
                onClick={() => {
                  setPlacingMode(placingMode === "event" ? null : "event");
                  setAddMenuOpen(false);
                }}
              >
                <CalendarDays className="h-4 w-4" />
                Событие
              </Button>
              <Button
                size="sm"
                variant={placingMode === "note" ? "default" : "secondary"}
                className="gap-2 shadow-lg whitespace-nowrap"
                onClick={() => {
                  setPlacingMode(placingMode === "note" ? null : "note");
                  setAddMenuOpen(false);
                }}
              >
                <MessageSquare className="h-4 w-4" />
                Комментарий
              </Button>
            </div>
          )}
          <Button
            onClick={() => setAddMenuOpen((o) => !o)}
            className="h-12 w-12 rounded-full shadow-xl"
            size="icon"
          >
            {addMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* ── Right Side Info Widgets ── */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2.5 max-w-[220px]">
        {/* Go Out Score */}
        {goOut && (
          <Card className="info-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                Go Out
              </span>
              <span
                className={`text-2xl font-bold ${
                  goOut.score >= 70
                    ? "text-green-400"
                    : goOut.score >= 40
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {goOut.score}
                <span className="text-xs text-muted-foreground font-normal">
                  /100
                </span>
              </span>
            </div>
          </Card>
        )}

        {/* Weather */}
        {weather && (
          <Card className="info-card">
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-muted-foreground font-medium">
                Погода
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-0.5">
                  <Thermometer className="h-3.5 w-3.5 text-orange-400 mr-1" />
                  <span className="text-xl font-bold">
                    {Math.round(weather.temp)}°
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                  {weather.description}
                </p>
              </div>
              {weather.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                  className="w-11 h-11 -mr-1"
                />
              )}
            </div>
            <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3" /> {weather.humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Wind className="h-3 w-3" /> {weather.windSpeed}м/с
              </span>
            </div>
          </Card>
        )}

        {/* Air Quality */}
        {aqi && (
          <Card className="info-card">
            <div className="flex items-center gap-2 mb-1">
              <Wind className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs text-muted-foreground font-medium">
                Воздух
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-bold ${
                  aqi.aqi <= 2
                    ? "text-green-400"
                    : aqi.aqi <= 3
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {aqi.category}
              </span>
              <button
                onClick={() => toggleLayer("airQuality")}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  layers.airQuality
                    ? "bg-green-500/20 text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {layers.airQuality ? "На карте" : "Показать"}
              </button>
            </div>
            <div className="flex justify-between mt-1 text-[11px] text-muted-foreground">
              <span>PM2.5: {aqi.pm25}</span>
              <span>PM10: {aqi.pm10}</span>
            </div>
          </Card>
        )}
      </div>

      {/* ── Chat ── */}
      <ChatWidget />

      {/* ── Dialogs ── */}
      {clickedPos && (
        <>
          <AddEventDialog
            open={eventDialogOpen}
            onOpenChange={setEventDialogOpen}
            location={clickedPos}
            onCreated={handleCreated}
          />
          <AddNoteDialog
            open={noteDialogOpen}
            onOpenChange={setNoteDialogOpen}
            location={clickedPos}
            onCreated={handleCreated}
          />
        </>
      )}
    </div>
  );
}
