"use client";

import { useEffect, useState } from "react";
import { Wind } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { airQualityAPI } from "@/lib/api";

interface AQData {
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
}

function getAqiColor(aqi: number) {
  const colors: Record<number, string> = {
    1: "text-green-400",
    2: "text-yellow-400",
    3: "text-orange-400",
    4: "text-red-400",
    5: "text-red-700",
  };
  return colors[aqi] || "text-gray-400";
}

function getProgressColor(aqi: number) {
  const colors: Record<number, string> = {
    1: "[&>div]:bg-green-500",
    2: "[&>div]:bg-yellow-500",
    3: "[&>div]:bg-orange-500",
    4: "[&>div]:bg-red-500",
    5: "[&>div]:bg-red-800",
  };
  return colors[aqi] || "";
}

export function AirQualityWidget() {
  const [data, setData] = useState<AQData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    airQualityAPI
      .getCurrent()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-3 w-56 animate-pulse bg-card/80 backdrop-blur-sm border-border/50">
        <div className="h-14 bg-muted rounded" />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="p-3 w-56 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-1.5">
        <Wind className="h-4 w-4 text-green-400" />
        <span className="text-xs font-medium text-muted-foreground">
          Air Quality
        </span>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-lg font-bold ${getAqiColor(data.aqi)}`}>
          {data.category}
        </span>
      </div>
      <Progress
        value={data.aqi * 20}
        className={`h-1.5 ${getProgressColor(data.aqi)}`}
      />
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>PM2.5: {data.pm25} μg/m³</span>
        <span>PM10: {data.pm10} μg/m³</span>
      </div>
    </Card>
  );
}

