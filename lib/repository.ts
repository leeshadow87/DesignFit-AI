/**
 * repository.ts
 * localStorage 기반 저장소 구현.
 * 인터페이스를 통해 Supabase/PostgreSQL로 교체 가능.
 */

import type {
  IRepository,
  Project,
  Drawing,
  ExtractedItem,
  ToleranceCase,
  ReviewQuestion,
  Report,
} from "@/types";

const KEYS = {
  projects: "df3:projects",
  drawings: (pid: string) => `df3:drawings:${pid}`,
  items: (did: string) => `df3:items:${did}`,
  cases: (did: string) => `df3:cases:${did}`,
  questions: (cid: string) => `df3:questions:${cid}`,
  reports: (pid: string) => `df3:reports:${pid}`,
  drawingFile: (did: string) => `df3:file:${did}`,
};

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export const repository: IRepository = {
  // Projects
  async getProjects() {
    return load<Project>(KEYS.projects);
  },
  async getProject(id) {
    return (await repository.getProjects()).find((p) => p.id === id) ?? null;
  },
  async saveProject(project) {
    const list = await repository.getProjects();
    const idx = list.findIndex((p) => p.id === project.id);
    if (idx >= 0) list[idx] = project;
    else list.unshift(project);
    save(KEYS.projects, list);
  },
  async deleteProject(id) {
    const list = (await repository.getProjects()).filter((p) => p.id !== id);
    save(KEYS.projects, list);
  },

  // Drawings
  async getDrawings(projectId) {
    return load<Drawing>(KEYS.drawings(projectId));
  },
  async getDrawing(id) {
    const projects = await repository.getProjects();
    for (const p of projects) {
      const drawings = await repository.getDrawings(p.id);
      const d = drawings.find((d) => d.id === id);
      if (d) return d;
    }
    return null;
  },
  async saveDrawing(drawing) {
    const list = await repository.getDrawings(drawing.projectId);
    const idx = list.findIndex((d) => d.id === drawing.id);
    if (idx >= 0) list[idx] = drawing;
    else list.unshift(drawing);
    save(KEYS.drawings(drawing.projectId), list);
  },
  async deleteDrawing(id) {
    const d = await repository.getDrawing(id);
    if (!d) return;
    const list = (await repository.getDrawings(d.projectId)).filter((x) => x.id !== id);
    save(KEYS.drawings(d.projectId), list);
    localStorage.removeItem(KEYS.drawingFile(id));
  },

  // ExtractedItems
  async getExtractedItems(drawingId) {
    return load<ExtractedItem>(KEYS.items(drawingId));
  },
  async saveExtractedItems(items) {
    if (!items.length) return;
    save(KEYS.items(items[0].drawingId), items);
  },
  async updateExtractedItem(item) {
    const list = await repository.getExtractedItems(item.drawingId);
    const idx = list.findIndex((i) => i.id === item.id);
    if (idx >= 0) list[idx] = item;
    save(KEYS.items(item.drawingId), list);
  },

  // ToleranceCases
  async getToleranceCases(drawingId) {
    return load<ToleranceCase>(KEYS.cases(drawingId));
  },
  async saveToleranceCases(cases) {
    if (!cases.length) return;
    save(KEYS.cases(cases[0].drawingId), cases);
  },
  async updateToleranceCase(tc) {
    const list = await repository.getToleranceCases(tc.drawingId);
    const idx = list.findIndex((c) => c.id === tc.id);
    if (idx >= 0) list[idx] = tc;
    save(KEYS.cases(tc.drawingId), list);
  },

  // ReviewQuestions
  async getReviewQuestions(toleranceCaseId) {
    return load<ReviewQuestion>(KEYS.questions(toleranceCaseId));
  },
  async saveReviewQuestion(q) {
    const list = await repository.getReviewQuestions(q.toleranceCaseId);
    const idx = list.findIndex((x) => x.id === q.id);
    if (idx >= 0) list[idx] = q;
    else list.push(q);
    save(KEYS.questions(q.toleranceCaseId), list);
  },

  // Reports
  async getReports(projectId) {
    return load<Report>(KEYS.reports(projectId));
  },
  async saveReport(report) {
    const list = await repository.getReports(report.projectId);
    const idx = list.findIndex((r) => r.id === report.id);
    if (idx >= 0) list[idx] = report;
    else list.unshift(report);
    save(KEYS.reports(report.projectId), list);
  },
};

// Drawing file (base64) 별도 저장 (용량 절약을 위해 분리)
export function saveDrawingFile(drawingId: string, dataUrl: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.drawingFile(drawingId), dataUrl);
}

export function loadDrawingFile(drawingId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.drawingFile(drawingId));
}
