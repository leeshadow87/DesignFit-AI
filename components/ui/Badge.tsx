import type { RiskLevel, RecommendationStatus } from "@/types";
import { riskLabel, statusLabel } from "@/lib/toleranceRules";

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold badge-${level}`}>
      {riskLabel(level)}
    </span>
  );
}

export function StatusBadge({ status }: { status: RecommendationStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold status-${status}`}>
      {statusLabel(status)}
    </span>
  );
}
