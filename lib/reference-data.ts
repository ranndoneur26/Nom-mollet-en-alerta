import type { IncidentStatus, UrgencyLevel } from "@/types/database.types";

export const STATUS_COLORS: Record<IncidentStatus, string> = {
  moderacio: "#4B3B9E",
  pendent: "#B03A2E",
  estudi: "#C9971E",
  assignada: "#C97B1E",
  tramitacio: "#C97B1E",
  resolta: "#1F7A68",
  tancada: "#1F7A68",
  fora: "#4B4B4E",
  duplicada: "#4B4B4E",
  rebutjada: "#4B4B4E",
};

export const STATUS_ORDER: IncidentStatus[] = [
  "pendent", "estudi", "assignada", "tramitacio", "resolta", "tancada", "fora", "duplicada", "rebutjada", "moderacio",
];

export const FILTERABLE_STATUSES: IncidentStatus[] = [
  "pendent", "estudi", "tramitacio", "resolta", "fora",
];

export const URGENCY_LEVELS: UrgencyLevel[] = ["normal", "important", "urgent", "risc"];

export const SOURCES = [
  { title: "Ajuntament de Mollet del Vallès — web oficial", url: "https://www.molletvalles.cat" },
  { title: "Portal de Transparència de Mollet del Vallès", url: "https://transparencia.molletvalles.cat" },
  { title: "Seu Electrònica de Mollet del Vallès", url: "https://seuelectronica.molletvalles.cat" },
  { title: "Govern Municipal — cartipàs i competències (actualitzat 03/02/2026)", url: "https://www.molletvalles.cat/ca/l-ajuntament/organitzacio-municipal/govern-municipal" },
  { title: "Plànol de barris oficial", url: "https://www.molletvalles.cat/ca/la-ciutat/planol-de-barris" },
  { title: "Informes de queixes i suggeriments", url: "https://transparencia.molletvalles.cat/ca/informacio-publica/serveis-i-tramits/serveis/gestio-de-queixes-i-suggeriments" },
];
