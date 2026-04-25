"use client";

import { useEffect, useState } from "react";
import { Sun, Wind, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { aiAPI } from "@/lib/api";

interface GoOutData {
  score: number;
  weather: { temp: number; description: string; main: string };
  airQuality: { aqi: number; category: string; pm25: number };
  traffic: { avgCongestion: number };
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

function getScoreGradient(score: number): string {
  if (score >= 70) return "from-green-500/20 to-green-600/5";
  if (score >= 40) return "from-yellow-500/20 to-yellow-600/5";
  return "from-red-500/20 to-red-600/5";
}

function getScoreIcon(score: number) {
  if (score >= 70) return Sun;
  if (score >= 40) return Wind;
  return AlertTriangle;
}

export function GoOutScoreWidget() {
  const [data, setData] = useState<GoOutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiAPI
      .getGoOutScore()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-3 w-56 animate-pulse bg-card/80 backdrop-blur-sm border-border/50">
        <div className="h-16 bg-muted rounded" />
      </Card>
    );
  }

  if (!data) return null;

  const Icon = getScoreIcon(data.score);

  return (
    <Card
      className={`p-3 w-56 bg-gradient-to-br ${getScoreGradient(
        data.score
      )} backdrop-blur-sm border-border/50`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${getScoreColor(data.score)}`} />
        <span className="text-xs font-medium text-muted-foreground">
          Go Out Score
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${getScoreColor(data.score)}`}>
          {data.score}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {data.score >= 70
          ? "Great time to go outside!"
          : data.score >= 40
          ? "Decent conditions today"
          : "Consider staying indoors"}
      </p>
    </Card>
  );
}

