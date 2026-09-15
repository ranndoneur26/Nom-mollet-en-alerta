"use client";
import dynamic from "next/dynamic";

export const MapPicker = dynamic(() => import("./MapPicker").then((m) => m.MapPicker), {
  ssr: false,
  loading: () => <div style={{ height: 220, borderRadius: 6, border: "1px solid var(--gris-vora)", marginTop: 8 }} />,
});
