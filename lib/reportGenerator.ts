/**
 * reportGenerator.ts
 * 분석 결과를 PDF·CSV 리포트로 내보낸다.
 * jsPDF / xlsx 라이브러리 사용 (클라이언트 전용)
 */

import type { Report, ReportItem, RiskLevel, RecommendationStatus } from "@/types";
import { riskLabel, statusLabel } from "./toleranceRules";

// ============================================================
// CSV 내보내기
// ============================================================

export function exportCsv(report: Report): void {
  const headers = [
    "공차 원문",
    "공차값",
    "위험도",
    "추천 상태",
    "완화 후보 범위",
    "근거",
    "주의사항",
    "기능 답변",
    "CAE 필요",
    "선임자 검토",
  ];

  const rows = report.items.map((item) => [
    item.rawText,
    item.currentTolerance,
    riskLabel(item.riskLevel),
    statusLabel(item.recommendationStatus),
    item.recommendedRange ?? "",
    item.riskReason,
    item.caution ?? "",
    item.functionAnswer ?? "미답변",
    item.caeRequired ? "필요" : "불필요",
    item.seniorReviewRequired ? "필요" : "불필요",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const bom = "﻿"; // Excel UTF-8 BOM
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `DesignFit_${report.drawingName}_${formatDate(report.generatedAt)}.csv`);
}

// ============================================================
// PDF 내보내기 (동적 import — 서버 사이드 제외)
// ============================================================

export async function exportPdf(report: Report): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // 한국어 지원 — 기본 폰트는 ASCII만 지원하므로 영문 대체 표기
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("DesignFit-AI V3 Tolerance Review Report", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Drawing: ${report.drawingName}`, 14, 26);
  doc.text(`Date: ${formatDate(report.generatedAt)}`, 14, 32);
  doc.text(
    `Summary: Total ${report.summary.totalItems} / Critical ${report.summary.criticalCount} / High ${report.summary.highCount} / Medium ${report.summary.mediumCount}`,
    14,
    38
  );

  const riskColor: Record<RiskLevel, [number, number, number]> = {
    critical: [220, 38, 38],
    high: [234, 88, 12],
    medium: [202, 138, 4],
    low: [22, 163, 74],
  };

  const statusColor: Record<RecommendationStatus, [number, number, number]> = {
    relax_candidate: [22, 163, 74],
    conditional: [202, 138, 4],
    need_check: [234, 88, 12],
    keep: [100, 116, 139],
  };

  autoTable(doc, {
    startY: 44,
    head: [["Raw", "Value", "Risk", "Status", "Range / Reason", "CAE", "Review"]],
    body: report.items.map((item) => [
      item.rawText,
      item.currentTolerance,
      riskLabel(item.riskLevel),
      statusLabel(item.recommendationStatus),
      item.recommendedRange ?? item.riskReason,
      item.caeRequired ? "Y" : "-",
      item.seniorReviewRequired ? "Y" : "-",
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    didParseCell(data) {
      if (data.section === "body") {
        if (data.column.index === 2) {
          const item = report.items[data.row.index];
          data.cell.styles.textColor = riskColor[item.riskLevel] ?? [0, 0, 0];
          data.cell.styles.fontStyle = "bold";
        }
        if (data.column.index === 3) {
          const item = report.items[data.row.index];
          data.cell.styles.textColor = statusColor[item.recommendationStatus] ?? [0, 0, 0];
        }
      }
    },
  });

  doc.save(`DesignFit_${report.drawingName}_${formatDate(report.generatedAt)}.pdf`);
}

// ============================================================
// Report 빌더
// ============================================================

export function buildReport(
  projectId: string,
  drawingId: string,
  drawingName: string,
  items: ReportItem[]
): Report {
  const summary = {
    totalItems: items.length,
    criticalCount: items.filter((i) => i.riskLevel === "critical").length,
    highCount: items.filter((i) => i.riskLevel === "high").length,
    mediumCount: items.filter((i) => i.riskLevel === "medium").length,
    lowCount: items.filter((i) => i.riskLevel === "low").length,
    relaxCandidateCount: items.filter((i) => i.recommendationStatus === "relax_candidate").length,
    keepCount: items.filter((i) => i.recommendationStatus === "keep").length,
    needCheckCount: items.filter((i) => i.recommendationStatus === "need_check").length,
    conditionalCount: items.filter((i) => i.recommendationStatus === "conditional").length,
  };

  return {
    id: `report-${Date.now()}`,
    projectId,
    drawingId,
    drawingName,
    generatedAt: new Date().toISOString(),
    summary,
    items,
  };
}

// ============================================================
// 유틸
// ============================================================

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}
