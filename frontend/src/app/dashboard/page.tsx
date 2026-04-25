"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  Wind,
  Car,
  Thermometer,
  Clock,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { aiAPI, weatherAPI, airQualityAPI, trafficAPI } from "@/lib/api";

interface Recommendation {
  goOutScore: number;
  summary: string;
  tips: string[];
  bestTimeSlots: { start: string; end: string; score: number; reason: string }[];
  weatherSummary: string;
  airQualitySummary: string;
  trafficSummary: string;
}

interface TrafficPoint {
  roadName: string;
  congestionScore: number;
  congestionLevel: string;
  speedKmh: number;
}

export default function DashboardPage() {
  const [rec, setRec] = useState<Recommendation | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [weather, setWeather] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [airQuality, setAirQuality] = useState<any>(null);
  const [traffic, setTraffic] = useState<TrafficPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      aiAPI.getRecommendation().catch(() => ({ data: null })),
      weatherAPI.getCurrent().catch(() => ({ data: null })),
      airQualityAPI.getCurrent().catch(() => ({ data: null })),
      trafficAPI.getCurrent().catch(() => ({ data: [] })),
    ]).then(([recRes, weatherRes, aqRes, trafficRes]) => {
      setRec(recRes.data);
      setWeather(weatherRes.data);
      setAirQuality(aqRes.data);
      setTraffic(trafficRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const avgCongestion = traffic.length
    ? Math.round(traffic.reduce((s, t) => s + t.congestionScore, 0) / traffic.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">City Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time overview of Almaty conditions
        </p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Go Out Score */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Sun className="h-5 w-5" />
              <span className="text-sm font-medium">Go Out Score</span>
            </div>
            <p className="text-4xl font-bold">{rec?.goOutScore ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">/100 points</p>
          </CardContent>
        </Card>

        {/* Temperature */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Thermometer className="h-5 w-5" />
              <span className="text-sm font-medium">Temperature</span>
            </div>
            <p className="text-4xl font-bold">
              {weather ? `${Math.round(weather.temp)}°` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {weather?.description || "Loading..."}
            </p>
          </CardContent>
        </Card>

        {/* Air Quality */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Wind className="h-5 w-5" />
              <span className="text-sm font-medium">Air Quality</span>
            </div>
            <p className="text-4xl font-bold">
              {airQuality?.category || "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PM2.5: {airQuality?.pm25 ?? "—"} μg/m³
            </p>
          </CardContent>
        </Card>

        {/* Traffic */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Car className="h-5 w-5" />
              <span className="text-sm font-medium">Traffic</span>
            </div>
            <p className="text-4xl font-bold">{avgCongestion}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg congestion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Summary & Best Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI Daily Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">
              {rec?.summary || "No recommendation available yet. Data is being collected."}
            </p>
            {rec?.tips && rec.tips.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Tips for today:</p>
                {rec.tips.map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-primary mt-0.5">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best Time Slots */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Best Times to Go Out
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rec?.bestTimeSlots && rec.bestTimeSlots.length > 0 ? (
              rec.bestTimeSlots.map((slot, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="text-center min-w-[60px]">
                    <p className="text-sm font-semibold">
                      {slot.start} - {slot.end}
                    </p>
                  </div>
                  <div className="flex-1">
                    <Progress
                      value={slot.score}
                      className="h-2 mb-1 [&>div]:bg-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      {slot.reason}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {slot.score}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No time slot data available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5 text-yellow-400" />
            Traffic Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {traffic.slice(0, 6).map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">{t.roadName}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.speedKmh} km/h
                  </p>
                </div>
                <Badge
                  variant={
                    t.congestionLevel === "low"
                      ? "secondary"
                      : t.congestionLevel === "severe"
                      ? "destructive"
                      : "outline"
                  }
                  className="capitalize"
                >
                  {t.congestionLevel}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm font-medium text-blue-400 mb-1">☁️ Weather</p>
          <p className="text-xs text-muted-foreground">
            {rec?.weatherSummary || "—"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-green-400 mb-1">
            🌿 Air Quality
          </p>
          <p className="text-xs text-muted-foreground">
            {rec?.airQualitySummary || "—"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-yellow-400 mb-1">
            🚗 Traffic
          </p>
          <p className="text-xs text-muted-foreground">
            {rec?.trafficSummary || "—"}
          </p>
        </Card>
      </div>
    </div>
  );
}

