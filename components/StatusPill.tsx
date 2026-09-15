import type { IncidentStatus } from "@/types/database.types";
import { STATUS_COLORS } from "@/lib/reference-data";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function StatusPill({ status, dict }: { status: IncidentStatus; dict: Dictionary }) {
  return (
    <span className="status-pill" style={{ background: STATUS_COLORS[status] }}>
      {dict.status[status]}
    </span>
  );
}
