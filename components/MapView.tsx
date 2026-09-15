"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { IncidentStatus } from "@/types/database.types";
import { STATUS_COLORS } from "@/lib/reference-data";

// NOTA: aquest component només s'ha d'importar amb `next/dynamic(..., { ssr: false })`
// des de la pàgina que el faci servir, ja que Leaflet accedeix a `window` en carregar-se.

export interface MapIncident {
  id: string;
  title: string;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
}

export function MapView({
  incidents,
  onMarkerClick,
  center = [41.5395, 2.2131],
  zoom = 14,
}: {
  incidents: MapIncident[];
  onMarkerClick: (id: string) => void;
  center?: [number, number];
  zoom?: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const clusterGroup = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView(center, zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapInstance.current);
      clusterGroup.current = (L as any).markerClusterGroup();
      mapInstance.current.addLayer(clusterGroup.current);
    }
    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!clusterGroup.current) return;
    clusterGroup.current.clearLayers();
    incidents.forEach((inc) => {
      const color = STATUS_COLORS[inc.status];
      const icon = L.divIcon({
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></div>`,
        className: "",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = L.marker([inc.latitude, inc.longitude], { icon });
      marker.bindTooltip(inc.title, { direction: "top" });
      marker.on("click", () => onMarkerClick(inc.id));
      clusterGroup.current.addLayer(marker);
    });
  }, [incidents, onMarkerClick]);

  return <div ref={mapRef} style={{ height: 480, borderRadius: 6, border: "1px solid var(--gris-vora)" }} />;
}
