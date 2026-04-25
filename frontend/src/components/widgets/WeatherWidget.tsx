"use client";

import { useEffect, useState } from "react";
import { Cloud, Droplets, Wind } from "lucide-react";
import { Card } from "@/components/ui/card";
import { weatherAPI } from "@/lib/api";
import { useAppStore } from "@/lib/store";

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  main: string;
  visibility: number;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const setStoreWeather = useAppStore((s) => s.setWeather);

  useEffect(() => {
    weatherAPI
      .getCurrent()
      .then((res) => {
        setWeather(res.data);
        setStoreWeather(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setStoreWeather]);

  if (loading) {
    return (
      <Card className="p-3 w-56 animate-pulse bg-card/80 backdrop-blur-sm border-border/50">
        <div className="h-14 bg-muted rounded" />
      </Card>
    );
  }

  if (!weather) return null;

  return (
    <Card className="p-3 w-56 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-1.5">
        <Cloud className="h-4 w-4 text-blue-400" />
        <span className="text-xs font-medium text-muted-foreground">
          Weather
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">
              {Math.round(weather.temp)}°
            </span>
            <span className="text-xs text-muted-foreground">C</span>
          </div>
          <p className="text-xs text-muted-foreground capitalize">
            {weather.description}
          </p>
        </div>
        {weather.icon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
            className="w-12 h-12 -mr-1"
          />
        )}
      </div>
      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Droplets className="h-3 w-3" /> {weather.humidity}%
        </span>
        <span className="flex items-center gap-1">
          <Wind className="h-3 w-3" /> {weather.windSpeed}m/s
        </span>
      </div>
    </Card>
  );
}

