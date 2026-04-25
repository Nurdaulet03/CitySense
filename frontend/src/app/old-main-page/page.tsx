"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useCallback } from "react";
import { MapSidebar } from "@/components/map/MapSidebar";
import { GoOutScoreWidget } from "@/components/widgets/GoOutScoreWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { AirQualityWidget } from "@/components/widgets/AirQualityWidget";
import { ChatWidget } from "@/components/widgets/ChatWidget";
import { AddEventDialog } from "@/components/map/AddEventDialog";
import { AddNoteDialog } from "@/components/map/AddNoteDialog";

const CityMap = dynamic(() => import("@/components/map/CityMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-xl">
      <div className="text-muted-foreground animate-pulse">Loading map...</div>
    </div>
  ),
});

export type PlacingMode = "event" | "note" | null;

export default function OldMainPage() {
  const [placingMode, setPlacingMode] = useState<PlacingMode>(null);
  const [clickedPos, setClickedPos] = useState<{ lat: number; lng: number } | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      <MapSidebar placingMode={placingMode} setPlacingMode={setPlacingMode} />

      <div className="flex-1 relative p-2 lg:p-3">
        {placingMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
            <span className="animate-pulse">Click on the map to place {placingMode === "event" ? "an event" : "a note"}</span>
            <button
              onClick={() => setPlacingMode(null)}
              className="ml-1 hover:bg-white/20 rounded-full h-5 w-5 flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>
        )}

        <Suspense fallback={<div className="h-full bg-muted/50 rounded-xl animate-pulse" />}>
          <CityMap
            key={refreshKey}
            onMapClick={handleMapClick}
            placingMode={!!placingMode}
          />
        </Suspense>

        <div className="absolute top-5 right-5 z-10 flex flex-col gap-3 max-w-xs">
          <GoOutScoreWidget />
          <WeatherWidget />
          <AirQualityWidget />
        </div>

        <ChatWidget />
      </div>

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
