"use client";

import dynamic from "next/dynamic";

export const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div style={{ height: 480, borderRadius: 6, border: "1px solid var(--gris-vora)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gris-mig)", fontSize: 13.5 }}>
      Carregant mapa…
    </div>
  ),
});

export type { MapIncident } from "./MapView";
