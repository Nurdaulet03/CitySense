"use client";

import { useState } from "react";
import {
  Wind,
  Car,
  Cloud,
  CalendarDays,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sun,
  SunDim,
  Moon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import type { PlacingMode } from "@/app/page";

const layerConfigs = [
  { key: "airQuality" as const, label: "Air Quality", icon: Wind, color: "bg-green-500" },
  { key: "traffic" as const, label: "Traffic", icon: Car, color: "bg-yellow-500" },
  { key: "weather" as const, label: "Weather", icon: Cloud, color: "bg-blue-500" },
  { key: "events" as const, label: "Events", icon: CalendarDays, color: "bg-purple-500" },
  { key: "communityNotes" as const, label: "Community Notes", icon: MessageSquare, color: "bg-cyan-500" },
];

export function MapSidebar({
  placingMode,
  setPlacingMode,
}: {
  placingMode: PlacingMode;
  setPlacingMode: (mode: PlacingMode) => void;
}) {
  const { layers, toggleLayer, mapTheme, cycleMapTheme } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`border-r border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 ${
        collapsed ? "w-12" : "w-64"
      } hidden lg:flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Map Layers</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Layers */}
      <div className="flex-1 p-2 space-y-1">
        {layerConfigs.map((config) => {
          const Icon = config.icon;
          const isActive = layers[config.key];
          return (
            <button
              key={config.key}
              onClick={() => toggleLayer(config.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <div
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  isActive ? config.color : "bg-muted-foreground/30"
                }`}
              />
              {!collapsed && (
                <>
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{config.label}</span>
                  {isActive && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      ON
                    </Badge>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Add actions */}
      {!collapsed && (
        <div className="px-2 space-y-1 pb-2">
          <Separator className="mb-2" />
          <Button
            variant={placingMode === "event" ? "default" : "outline"}
            size="sm"
            className="w-full justify-start gap-2 text-sm"
            onClick={() =>
              setPlacingMode(placingMode === "event" ? null : "event")
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add Event
          </Button>
          <Button
            variant={placingMode === "note" ? "default" : "outline"}
            size="sm"
            className="w-full justify-start gap-2 text-sm"
            onClick={() =>
              setPlacingMode(placingMode === "note" ? null : "note")
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add Note
          </Button>
        </div>
      )}

      {/* Map theme toggle (Light -> Muted -> Dark) */}
      <div className="px-2 pb-2">
        <button
          onClick={cycleMapTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-muted/50"
        >
          <div
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              mapTheme === "dark"
                ? "bg-indigo-500"
                : mapTheme === "muted"
                ? "bg-slate-400"
                : "bg-amber-400"
            }`}
          />
          {!collapsed && (
            <>
              {mapTheme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : mapTheme === "muted" ? (
                <SunDim className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="flex-1 text-left">
                {mapTheme === "dark"
                  ? "Dark Map"
                  : mapTheme === "muted"
                  ? "Muted Map"
                  : "Light Map"}
              </span>
            </>
          )}
        </button>
      </div>

      {!collapsed && (
        <>
          <Separator />
          <div className="p-3 text-xs text-muted-foreground">
            <p>Data refreshes every 5 min</p>
            <p className="mt-1">Click markers for details</p>
          </div>
        </>
      )}
    </div>
  );
}

