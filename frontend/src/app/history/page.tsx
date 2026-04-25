"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, Wind, Thermometer, Car, Calendar } from "lucide-react";
import { historicalAPI } from "@/lib/api";

export default function HistoryPage() {
  const [airData, setAirData] = useState<Record<string, unknown>[]>([]);
  const [weatherData, setWeatherData] = useState<Record<string, unknown>[]>([]);
  const [trafficData, setTrafficData] = useState<Record<string, unknown>[]>([]);
  const [summary, setSummary] = useState<Record<string, Record<string, number | null>> | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      historicalAPI.getAirQuality(days).catch(() => ({ data: [] })),
      historicalAPI.getWeather(days).catch(() => ({ data: [] })),
      historicalAPI.getTraffic(days).catch(() => ({ data: [] })),
      historicalAPI.getSummary(days).catch(() => ({ data: null })),
    ]).then(([air, weather, traffic, sum]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedAir = (air.data || []).map((d: any) => ({
        time: new Date(d.recordedAt || d.dt * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
        }),
        aqi: d.aqi,
        pm25: d.pm25,
        pm10: d.pm10,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedWeather = (weather.data || []).map((d: any) => ({
        time: new Date(d.recordedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
        }),
        temp: d.temp,
        humidity: d.humidity,
        windSpeed: d.windSpeed,
      }));

      // Aggregate traffic by hour
      const trafficByHour: Record<string, { scores: number[]; count: number }> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (traffic.data || []).forEach((d: any) => {
        const key = new Date(d.recordedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
        });
        if (!trafficByHour[key]) trafficByHour[key] = { scores: [], count: 0 };
        trafficByHour[key].scores.push(d.congestionScore || 0);
        trafficByHour[key].count++;
      });

      const processedTraffic = Object.entries(trafficByHour).map(([time, data]) => ({
        time,
        congestion: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.count),
      }));

      setAirData(processedAir);
      setWeatherData(processedWeather);
      setTrafficData(processedTraffic);
      setSummary(sum.data);
      setLoading(false);
    });
  }, [days]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Historical Data
          </h1>
          <p className="text-muted-foreground">
            Environmental trends and analytics
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <Button
              key={d}
              variant={days === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(d)}
            >
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {loading && (
        <div className="text-center py-8 text-muted-foreground animate-pulse">Loading historical data...</div>
      )}
      {!loading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wind className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">Avg Air Quality</span>
              </div>
              <p className="text-2xl font-bold">
                AQI {summary.airQuality?.avgAqi ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                PM2.5 avg: {summary.airQuality?.avgPm25 ?? "—"} μg/m³ ·{" "}
                {summary.airQuality?.count ?? 0} records
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Thermometer className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium">Avg Temperature</span>
              </div>
              <p className="text-2xl font-bold">
                {summary.weather?.avgTemp ?? "—"}°C
              </p>
              <p className="text-xs text-muted-foreground">
                Humidity avg: {summary.weather?.avgHumidity ?? "—"}% ·{" "}
                {summary.weather?.count ?? 0} records
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Car className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">Avg Congestion</span>
              </div>
              <p className="text-2xl font-bold">
                {summary.traffic?.avgCongestion ?? "—"}%
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.traffic?.count ?? 0} records
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="air" className="space-y-4">
        <TabsList>
          <TabsTrigger value="air" className="gap-1.5">
            <Wind className="h-3.5 w-3.5" /> Air Quality
          </TabsTrigger>
          <TabsTrigger value="weather" className="gap-1.5">
            <Thermometer className="h-3.5 w-3.5" /> Weather
          </TabsTrigger>
          <TabsTrigger value="traffic" className="gap-1.5">
            <Car className="h-3.5 w-3.5" /> Traffic
          </TabsTrigger>
        </TabsList>

        <TabsContent value="air">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Air Quality Index & PM2.5 Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {airData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={airData}>
                    <defs>
                      <linearGradient id="colorPm25" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPm10" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="pm25"
                      stroke="#22c55e"
                      fill="url(#colorPm25)"
                      name="PM2.5"
                    />
                    <Area
                      type="monotone"
                      dataKey="pm10"
                      stroke="#f97316"
                      fill="url(#colorPm10)"
                      name="PM10"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No historical air quality data yet.</p>
                    <p className="text-xs mt-1">
                      Data will accumulate as the system collects it hourly.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weather">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Temperature & Humidity Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weatherData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={weatherData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Temperature (°C)"
                    />
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={false}
                      name="Humidity (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No historical weather data yet.</p>
                    <p className="text-xs mt-1">
                      Data will accumulate as the system collects it hourly.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Traffic Congestion Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trafficData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="congestion"
                      fill="#eab308"
                      radius={[4, 4, 0, 0]}
                      name="Congestion %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No historical traffic data yet.</p>
                    <p className="text-xs mt-1">
                      Data will accumulate as the system collects it every 30 minutes.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

