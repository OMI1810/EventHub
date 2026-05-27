"use client";

import "@arcgis/core/assets/esri/themes/dark/main.css";
import Graphic from "@arcgis/core/Graphic";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import { useEffect, useRef } from "react";

interface ArcGisPointMapProps {
  cordinatX: number | null;
  cordinatY: number | null;
}

export function ArcGisPointMap({ cordinatX, cordinatY }: ArcGisPointMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (!containerRef.current || viewRef.current) return;

    const map = new Map({
      basemap: "streets-navigation-vector",
    });

    viewRef.current = new MapView({
      container: containerRef.current,
      map,
      center: [39.7213763, 47.2230368],
      zoom: 10,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;

    if (!view || cordinatX === null || cordinatY === null) return;

    const pointGraphic = new Graphic({
      geometry: {
        type: "point",
        longitude: cordinatX,
        latitude: cordinatY,
      },
      symbol: {
        type: "simple-marker",
        color: "#ef4444",
        size: 12,
        outline: {
          color: "#ffffff",
          width: 2,
        },
      },
    });

    view.graphics.removeAll();
    view.graphics.add(pointGraphic);
    void view.goTo({ center: [cordinatX, cordinatY], zoom: 15 });
  }, [cordinatX, cordinatY]);

  return (
    <div className="grid gap-2">
      <p className="text-sm text-zinc-300">Карта</p>
      <div className="h-72 overflow-hidden rounded-md border border-zinc-700 bg-zinc-950">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      {cordinatX === null || cordinatY === null ? (
        <p className="text-xs text-zinc-500">
          Выберите адрес из подсказок, чтобы поставить точку на карте.
        </p>
      ) : null}
    </div>
  );
}
