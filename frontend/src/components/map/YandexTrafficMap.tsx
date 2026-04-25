"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAppStore } from "@/lib/store";
import {
  airQualityAPI,
  trafficAPI,
  eventsAPI,
  communityNotesAPI,
} from "@/lib/api";

/* ─── Types ─── */

interface AqiPoint {
  lat: number;
  lng: number;
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
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

interface TrafficRoad {
  roadName: string;
  congestionScore: number;
  congestionLevel: string;
  speedKmh: number;
  freeFlowSpeedKmh: number;
}

export interface MapLayers {
  traffic: boolean;
  airQuality: boolean;
  events: boolean;
  communityNotes: boolean;
  weather: boolean;
}

/* ─── Helpers ─── */

function getAqiZoneColor(aqi: number): string {
  const colors: Record<number, string> = {
    1: "#22c55e44",
    2: "#eab30844",
    3: "#f9731644",
    4: "#ef444444",
    5: "#7c2d1244",
  };
  return colors[aqi] || "#f9731644";
}

function getAqiStrokeColor(aqi: number): string {
  const colors: Record<number, string> = {
    1: "#22c55e88",
    2: "#eab30888",
    3: "#f9731688",
    4: "#ef444488",
    5: "#7c2d1288",
  };
  return colors[aqi] || "#f9731688";
}

/* ─── Load Yandex Maps script ─── */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ymaps: any;
  }
}

let ymapsLoadPromise: Promise<void> | null = null;

function loadYmaps(): Promise<void> {
  if (ymapsLoadPromise) return ymapsLoadPromise;

  ymapsLoadPromise = new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.ymaps) {
      window.ymaps.ready(resolve);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
    let src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
    if (apiKey) src += `&apikey=${apiKey}`;

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(resolve);
    };
    script.onerror = () => reject(new Error("Failed to load Yandex Maps"));
    document.head.appendChild(script);
  });

  return ymapsLoadPromise;
}

/* ─── Component ─── */

export default function YandexTrafficMap({
  layers,
  onMapClick,
  placingMode,
  onTrafficLoaded,
}: {
  layers: MapLayers;
  onMapClick?: (lat: number, lng: number) => void;
  placingMode?: boolean;
  onTrafficLoaded?: (roads: TrafficRoad[]) => void;
}) {
  const { mapCenter, mapZoom, setAirQuality, setTrafficData } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trafficRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objectsRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  const [aqiGrid, setAqiGrid] = useState<AqiPoint[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [notes, setNotes] = useState<NoteData[]>([]);

  const placingModeRef = useRef(placingMode);
  const onMapClickRef = useRef(onMapClick);
  placingModeRef.current = placingMode;
  onMapClickRef.current = onMapClick;

  /* ── Initialize map ── */
  useEffect(() => {
    let destroyed = false;

    loadYmaps()
      .then(() => {
        if (destroyed || !containerRef.current || mapRef.current) return;

        try {
          const map = new window.ymaps.Map(
            containerRef.current,
            {
              center: [mapCenter[0], mapCenter[1]],
              zoom: mapZoom,
              controls: ["zoomControl", "geolocationControl"],
            },
            {
              suppressMapOpenBlock: true,
            }
          );

          map.events.add("click", (e: { get: (k: string) => number[] }) => {
            if (placingModeRef.current && onMapClickRef.current) {
              const coords = e.get("coords");
              onMapClickRef.current(coords[0], coords[1]);
            }
          });

          mapRef.current = map;
          setReady(true);
        } catch (err) {
          console.error("Failed to initialize Yandex Map:", err);
        }
      })
      .catch((err) => {
        console.error("Failed to load Yandex Maps:", err);
      });

    return () => {
      destroyed = true;
      // Clean up in the correct order: traffic provider first, then geo objects, then map
      try {
        if (trafficRef.current) {
          trafficRef.current.setMap(null);
          trafficRef.current = null;
        }
      } catch {
        /* ignore */
      }
      try {
        if (mapRef.current) {
          objectsRef.current.forEach((obj) => {
            try {
              mapRef.current.geoObjects.remove(obj);
            } catch {
              /* ignore */
            }
          });
          objectsRef.current = [];
          mapRef.current.destroy();
          mapRef.current = null;
        }
      } catch {
        /* ignore */
      }
    };
    // only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Toggle traffic layer ── */
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    try {
      if (layers.traffic && !trafficRef.current) {
        const provider = new window.ymaps.traffic.provider.Actual(
          {},
          { infoLayerShown: true }
        );
        provider.setMap(mapRef.current);
        trafficRef.current = provider;
      } else if (!layers.traffic && trafficRef.current) {
        trafficRef.current.setMap(null);
        trafficRef.current = null;
      }
    } catch (err) {
      console.error("Traffic layer error:", err);
    }
  }, [layers.traffic, ready]);

  /* ── Draw overlays ── */
  useEffect(() => {
    if (!ready || !mapRef.current || !window.ymaps) return;

    try {
      objectsRef.current.forEach((obj) => {
        try {
          mapRef.current.geoObjects.remove(obj);
        } catch {
          /* ignore */
        }
      });
      objectsRef.current = [];
    } catch {
      /* ignore */
    }

    const ymaps = window.ymaps;
    const map = mapRef.current;
    if (!map) return;

    try {
    // AQI circles
    if (layers.airQuality) {
      aqiGrid.forEach((pt) => {
        const circle = new ymaps.Circle(
          [[pt.lat, pt.lng], 2200],
          {
            hintContent: `Воздух: ${pt.category}`,
            balloonContentHeader: "Качество воздуха",
            balloonContentBody: `<div style="font-size:13px;line-height:1.6">
              <b>AQI: ${pt.aqi}</b> — ${pt.category}<br/>
              PM2.5: ${pt.pm25} μg/m³<br/>
              PM10: ${pt.pm10} μg/m³
            </div>`,
          },
          {
            fillColor: getAqiZoneColor(pt.aqi),
            strokeColor: getAqiStrokeColor(pt.aqi),
            strokeWidth: 1.5,
          }
        );
        map.geoObjects.add(circle);
        objectsRef.current.push(circle);
      });
    }

    // Events
    if (layers.events) {
      events.forEach((ev) => {
        const placemark = new ymaps.Placemark(
          [ev.location.lat, ev.location.lng],
          {
            hintContent: ev.title,
            balloonContentHeader: ev.title,
            balloonContentBody: `<div style="font-size:13px;line-height:1.6;max-width:220px">
              <p>${ev.description}</p>
              <p style="color:#888;margin-top:4px">${new Date(ev.startDate).toLocaleDateString("ru-RU", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</p>
              <p style="color:#888">${ev.attendees?.length || 0} участников</p>
            </div>`,
          },
          {
            preset: "islands#violetCircleDotIcon",
          }
        );
        map.geoObjects.add(placemark);
        objectsRef.current.push(placemark);
      });
    }

    // Community notes
    if (layers.communityNotes) {
      notes.forEach((note) => {
        const placemark = new ymaps.Placemark(
          [note.location.lat, note.location.lng],
          {
            hintContent: note.text.substring(0, 50),
            balloonContentHeader: note.text,
            balloonContentBody: `<div style="font-size:12px;color:#888">
              ${note.author?.name || "Аноним"} · ${note.likes?.length || 0} ❤️
            </div>`,
          },
          {
            preset: "islands#blueMessageIcon",
          }
        );
        map.geoObjects.add(placemark);
        objectsRef.current.push(placemark);
      });
    }
    } catch (err) {
      console.error("Overlay render error:", err);
    }
  }, [ready, layers, aqiGrid, events, notes]);

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    const promises = [];

    if (layers.airQuality) {
      promises.push(
        airQualityAPI
          .getGrid()
          .then((res) => {
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
          })
          .catch(() => {})
      );
    } else {
      setAqiGrid([]);
    }

    if (layers.traffic) {
      promises.push(
        trafficAPI
          .getCurrent()
          .then((res) => {
            setTrafficData(res.data);
            onTrafficLoaded?.(res.data);
          })
          .catch(() => {})
      );
    }

    if (layers.events) {
      promises.push(
        eventsAPI
          .getAll()
          .then((res) => setEvents(res.data))
          .catch(() => {})
      );
    } else {
      setEvents([]);
    }

    if (layers.communityNotes) {
      promises.push(
        communityNotesAPI
          .getAll()
          .then((res) => setNotes(res.data))
          .catch(() => {})
      );
    } else {
      setNotes([]);
    }

    await Promise.all(promises);
  }, [layers, setAirQuality, setTrafficData, onTrafficLoaded]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div
      ref={containerRef}
      className={placingMode ? "cursor-crosshair" : ""}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
