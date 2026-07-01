"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Brain,
  Calculator,
  CheckCircle2,
  Database,
  FileSearch,
  GitBranch,
  Layers3,
  Play,
  Ruler,
  ShieldAlert,
  Upload,
} from "lucide-react";
import {
  calculateDimensionRange,
  calculateFit,
  calculateStackup,
  evaluateAssemblyImpact,
  type DimensionInput,
} from "@/lib/calculationEngine";

const initialDimensions: DimensionInput[] = [
  { id: "a", label: "Bracket width A", nominal: 42, plus: 0.02, minus: 0.02, functional: true },
  { id: "b", label: "Spacer B", nominal: 18, plus: 0.03, minus: 0.01, functional: true },
  { id: "c", label: "Cover gap C", nominal: 12, plus: 0.05, minus: 0.03, functional: false },
];

const modules = [
  { label: "공차 완화 후보", value: "5", desc: "타이트 공차와 조건부 완화 항목", icon: Ruler },
  { label: "계산 결과", value: "3", desc: "치수 범위, 누적, 간극/간섭", icon: Calculator },
  { label: "어셈블리 연결", value: "2", desc: "단품-상위 조립 관계", icon: GitBranch },
  { label: "CAE 필요", value: "2", desc: "하중/회전/씰링 영향 항목", icon: BadgeCheck },
];

const process = [
  "단품 도면 등록",
  "어셈블리 정보 연결",
  "AI 추출값 검증",
  "공차 계산 실행",
  "완화/보류/CAE 분류",
  "검토 리포트 생성",
];

export default function DashboardClient() {
  const [dimensions, setDimensions] = useState<DimensionInput[]>(initialDimensions);
  const [hasAssembly, setHasAssembly] = useState(true);
  const [linkedChain, setLinkedChain] = useState(true);
  const [loadRelated, setLoadRelated] = useState(false);
  const [rotatingOrSealing, setRotatingOrSealing] = useState(true);

  const ranges = useMemo(() => dimensions.map(calculateDimensionRange), [dimensions]);
  const stackup = useMemo(() => calculateStackup(dimensions), [dimensions]);
  const fit = useMemo(
    () =>
      calculateFit({
        holeNominal: 18,
        holePlus: 0.018,
        holeMinus: 0,
        shaftNominal: 17.99,
        shaftPlus: 0.006,
        shaftMinus: 0.006,
      }),
    []
  );
  const assembly = useMemo(
    () =>
      evaluateAssemblyImpact({
        hasAssemblyDrawing: hasAssembly,
        linkedToFunctionalChain: linkedChain,
        loadRelated,
        rotatingOrSealing,
      }),
    [hasAssembly, linkedChain, loadRelated, rotatingOrSealing]
  );

  function updateDimension(id: string, key: keyof DimensionInput, value: string | boolean) {
    setDimensions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: typeof value === "boolean" ? value : Number(value),
            }
          : item
      )
    );
  }

  function resetSampleCalculation() {
    setDimensions(initialDimensions);
    setHasAssembly(true);
    setLinkedChain(true);
    setLoadRelated(false);
    setRotatingOrSealing(true);
  }

  return (
    <div className="min-h-screen bg-[var(--df-bg)]">
      <header className="border-b border-slate-200 bg-white px-4 py-5 lg:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-5xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--df-green)]">
              DesignFit-AI V6 Calculation Console
            </p>
            <h1 className="df-heading mt-2 max-w-5xl text-2xl font-black leading-tight text-slate-950 lg:text-3xl 2xl:text-4xl">
              단품 공차를 어셈블리 영향까지 계산해 완화 후보를 분류합니다.
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 lg:text-base">
              V6는 도면 OCR 리포트가 아니라 공차 계산 모듈이 중심입니다. AI가 추출한 값은 사용자가 검증하고,
              계산 엔진이 치수 범위, 공차 누적, 간극/간섭, 상위 조립 영향, CAE 필요 여부를 분리해 보여줍니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/projects/new" className="df-button">
              <Upload size={15} />
              도면 등록
            </Link>
            <button className="df-button-primary" onClick={resetSampleCalculation}>
              <Play size={15} />
              샘플 계산 실행
            </button>
          </div>
        </div>
      </header>

      <main className="grid gap-5 p-4 lg:p-8">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.22fr)_minmax(420px,.78fr)]">
          <div className="df-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">부품-어셈블리 연계 검토</h2>
                <p className="mt-1 text-sm text-slate-500">
                  단품 도면의 공차가 상위 조립 간극, 간섭, 기능 치수 체인에 주는 영향을 분리합니다.
                </p>
              </div>
              <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                계산모듈 적용
              </span>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_310px]">
              <div className="technical-grid rounded-lg border border-slate-200 bg-white p-4">
                <div className="relative min-h-[430px] rounded border-2 border-slate-900 bg-white/80">
                  <DrawingPreview />
                  <Marker className="left-[39%] top-[38%] h-[10%] w-[15%]" tone="red" label="H7" />
                  <Marker className="left-[20%] top-[62%] h-[8%] w-[20%]" tone="orange" label="누적" />
                  <Marker className="right-[18%] top-[55%] h-[12%] w-[13%]" tone="blue" label="CAE" />
                  <div className="absolute bottom-3 left-3 max-w-[78%] rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-relaxed text-amber-900">
                    단품 도면만 있으면 최종 완화 확정 금지. 상위 조립 정보가 연결되어야 계산 검토로 전환됩니다.
                  </div>
                </div>
              </div>

              <div className="grid content-start gap-3">
                {modules.map(({ label, value, desc, icon: Icon }) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-slate-500">{label}</p>
                        <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
                      </div>
                      <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                        <Icon size={21} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="df-card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-lg font-black text-slate-950">V6 판단 결과</h2>
              <p className="mt-1 text-sm text-slate-500">
                AI 추출값, 사용자 검증값, 계산 결과를 분리해 표시합니다.
              </p>
            </div>
            <div className="grid gap-4 p-5">
              <ResultCard
                tone={assembly.reviewStatus === "cae-required" ? "red" : assembly.reviewStatus === "assembly-info-required" ? "orange" : "green"}
                title={assembly.label}
                meta="어셈블리 영향"
                body={assembly.reason}
              />
              <ResultCard
                tone={stackup.status === "cae-required" ? "red" : stackup.status === "review" ? "orange" : "green"}
                title={`Worst Case ${stackup.min.toFixed(3)} ~ ${stackup.max.toFixed(3)} mm`}
                meta={`누적 폭 ${stackup.width.toFixed(3)} mm`}
                body={stackup.reason}
              />
              <ResultCard
                tone={fit.riskLevel === "critical" ? "red" : fit.riskLevel === "high" ? "orange" : "blue"}
                title={`간극 ${fit.minClearance.toFixed(3)} ~ ${fit.maxClearance.toFixed(3)} mm`}
                meta={fit.condition === "interference" ? "간섭" : fit.condition === "transition" ? "전이 끼워맞춤" : "간극 끼워맞춤"}
                body={fit.reason}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,.9fr)]">
          <div className="df-card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-lg font-black text-slate-950">공차 계산 입력</h2>
              <p className="mt-1 text-sm text-slate-500">
                AI 추출값을 그대로 쓰지 않고, 사용자가 검증한 값만 계산에 반영합니다.
              </p>
            </div>
            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="text-left text-xs font-black uppercase text-slate-500">
                  <tr>
                    <th className="border-b border-slate-200 px-3 py-2">치수</th>
                    <th className="border-b border-slate-200 px-3 py-2">기준값</th>
                    <th className="border-b border-slate-200 px-3 py-2">상한</th>
                    <th className="border-b border-slate-200 px-3 py-2">하한</th>
                    <th className="border-b border-slate-200 px-3 py-2">계산 범위</th>
                    <th className="border-b border-slate-200 px-3 py-2">기능 치수</th>
                  </tr>
                </thead>
                <tbody>
                  {dimensions.map((item, index) => {
                    const range = ranges[index];
                    return (
                      <tr key={item.id}>
                        <td className="border-b border-slate-100 px-3 py-3 font-bold text-slate-900">{item.label}</td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          <NumberField value={item.nominal} onChange={(value) => updateDimension(item.id, "nominal", value)} />
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          <NumberField value={item.plus} onChange={(value) => updateDimension(item.id, "plus", value)} />
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          <NumberField value={item.minus} onChange={(value) => updateDimension(item.id, "minus", value)} />
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs">
                          {range.min.toFixed(3)} ~ {range.max.toFixed(3)}
                          <span className="ml-2 text-slate-400">폭 {range.width.toFixed(3)}</span>
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          <input
                            type="checkbox"
                            checked={item.functional}
                            onChange={(event) => updateDimension(item.id, "functional", event.target.checked)}
                            className="h-4 w-4 accent-emerald-700"
                            aria-label="기능 치수 여부"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="df-card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-lg font-black text-slate-950">상위 조립 검증 조건</h2>
              <p className="mt-1 text-sm text-slate-500">
                단품 도면만으로는 완화 확정 금지. 어셈블리 관계를 입력해야 합니다.
              </p>
            </div>
            <div className="grid gap-3 p-5">
              <Toggle label="상위 어셈블리 도면/관계 정보 있음" checked={hasAssembly} onChange={setHasAssembly} />
              <Toggle label="기능 치수 체인에 포함됨" checked={linkedChain} onChange={setLinkedChain} />
              <Toggle label="하중/강도/변형 영향 있음" checked={loadRelated} onChange={setLoadRelated} />
              <Toggle label="회전/씰링/압입/슬라이딩 관련" checked={rotatingOrSealing} onChange={setRotatingOrSealing} />
            </div>
          </div>
        </section>

        <section className="df-card overflow-hidden">
          <div className="grid gap-4 p-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--df-green)]">V6 Architecture</p>
              <h2 className="df-heading mt-2 text-xl font-black text-slate-950">V6는 AI 리포트 앱이 아니라 공차 계산 SaaS입니다.</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                AI는 추출과 설명을 돕고, 계산 엔진은 검증 가능한 값만 사용합니다. 최종 판단은 설계자와 승인권자가 합니다.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Scope icon={<FileSearch size={18} />} title="AI 추출값" desc="도면 문자, 치수, 공차, 재질, 주석 후보를 추출합니다." />
              <Scope icon={<Database size={18} />} title="검증 입력값" desc="사용자가 확인한 값만 계산 엔진에 전달합니다." />
              <Scope icon={<Calculator size={18} />} title="계산 결과값" desc="상한/하한, 누적, 간극/간섭, CAE 필요 여부를 구조화합니다." />
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="df-card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-lg font-black text-slate-950">V6 검토 흐름</h2>
              <p className="mt-1 text-sm text-slate-500">부품-어셈블리 연계 계산을 전제로 한 MVP 흐름입니다.</p>
            </div>
            <div className="grid gap-2 p-5 md:grid-cols-6">
              {process.map((step, index) => (
                <div key={step} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="font-mono text-xs font-black text-emerald-700">0{index + 1}</p>
                  <p className="mt-2 text-sm font-black text-slate-900">{step}</p>
                  {index < process.length - 1 && <ArrowRight className="mt-3 hidden text-slate-300 md:block" size={16} />}
                </div>
              ))}
            </div>
          </div>

          <div className="df-card p-5">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-emerald-700" />
              <h2 className="font-black text-slate-950">판단 원칙</h2>
            </div>
            <div className="mt-4 grid gap-3 text-sm leading-relaxed text-slate-600">
              <Principle text="AI 추출값과 계산 결과값을 반드시 분리합니다." />
              <Principle text="단품 도면만 있으면 완화 확정이 아니라 어셈블리 정보 필요로 표시합니다." />
              <Principle text="하중, 회전, 씰링, 변형 영향 항목은 CAE/시험 필요로 분류합니다." />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 flex-shrink-0 text-amber-700" />
            <div>
              <p className="font-black text-amber-900">시제품 공개 범위</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                현재 버전은 공개 샘플 도면 검증용입니다. 실제 고객 도면, 보안 도면, 사내 도번, 업체명,
                프로젝트명은 권한 관리와 비공개 저장 구조가 붙기 전까지 업로드하지 마세요.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function NumberField({ value, onChange }: { value: number; onChange: (value: string) => void }) {
  return (
    <input
      type="number"
      step="0.001"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-24 rounded border border-slate-200 px-2 font-mono text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
    />
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-emerald-700" />
    </label>
  );
}

function ResultCard({ tone, title, meta, body }: { tone: "red" | "orange" | "blue" | "green"; title: string; meta: string; body: string }) {
  const toneClass = {
    red: "border-red-200 bg-red-50 text-red-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="text-xs font-black">{meta}</p>
      <p className="mt-1 text-lg font-black">{title}</p>
      <p className="mt-2 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function Scope({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-white text-emerald-700">{icon}</div>
      <p className="font-black text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
    </div>
  );
}

function Principle({ text }: { text: string }) {
  return (
    <div className="flex gap-2">
      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-700" />
      <p>{text}</p>
    </div>
  );
}

function Marker({ className, tone, label }: { className: string; tone: "red" | "orange" | "blue"; label: string }) {
  const color =
    tone === "red"
      ? "border-red-600 bg-red-500/10 text-red-700"
      : tone === "orange"
        ? "border-orange-500 bg-orange-500/10 text-orange-700"
        : "border-blue-600 bg-blue-500/10 text-blue-700";
  return (
    <div className={`absolute rounded border-2 ${color} ${className}`}>
      <span className="absolute -top-6 left-0 min-w-12 rounded bg-white px-2 py-0.5 text-center text-[10px] font-black shadow-sm">
        {label}
      </span>
    </div>
  );
}

function DrawingPreview() {
  return (
    <svg viewBox="0 0 920 620" className="h-full w-full" aria-label="assembly-linked drawing preview">
      <defs>
        <marker id="arrow-v6" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#111827" />
        </marker>
      </defs>
      <rect x="18" y="18" width="884" height="584" fill="none" stroke="#111827" strokeWidth="1.5" />
      <text x="35" y="44" fontSize="12" fontWeight="700">PART + ASSEMBLY TOLERANCE CALCULATION SAMPLE</text>
      <rect x="115" y="190" width="310" height="190" rx="18" fill="#eef4f6" stroke="#111827" strokeWidth="1.4" />
      <circle cx="205" cy="285" r="46" fill="white" stroke="#111827" />
      <circle cx="333" cy="285" r="38" fill="white" stroke="#111827" />
      <text x="180" y="288" fontSize="12" fontWeight="700">DATUM B</text>
      <text x="312" y="288" fontSize="12" fontWeight="700">DATUM C</text>
      <line x1="145" y1="390" x2="395" y2="390" stroke="#111827" strokeWidth="1.4" />
      <text x="230" y="410" fontSize="11" fontWeight="700">DATUM A</text>
      <line x1="420" y1="232" x2="610" y2="210" stroke="#111827" markerEnd="url(#arrow-v6)" />
      <line x1="420" y1="290" x2="610" y2="290" stroke="#111827" markerEnd="url(#arrow-v6)" />
      <line x1="420" y1="345" x2="610" y2="365" stroke="#111827" markerEnd="url(#arrow-v6)" />
      <g transform="translate(610 180)">
        <rect width="210" height="35" fill="white" stroke="#111827" />
        <text x="8" y="22" fontSize="11" fontWeight="700">POSITION DIA 0.025 A|B|C</text>
        <rect y="62" width="190" height="35" fill="white" stroke="#111827" />
        <text x="8" y="84" fontSize="11" fontWeight="700">DIA 18.000 H7</text>
        <rect y="126" width="230" height="35" fill="white" stroke="#111827" />
        <text x="8" y="148" fontSize="11" fontWeight="700">CLEARANCE STACK A+B+C</text>
      </g>
      <g transform="translate(52 500)">
        <rect width="270" height="72" fill="none" stroke="#111827" />
        <text x="12" y="22" fontSize="10" fontWeight="700">CALCULATION NOTES</text>
        <text x="12" y="42" fontSize="9">1. VERIFIED INPUTS ONLY.</text>
        <text x="12" y="56" fontSize="9">2. ASSEMBLY LINK REQUIRED FOR FINAL RELAXATION.</text>
      </g>
      <g transform="translate(640 500)">
        <rect width="210" height="72" fill="none" stroke="#111827" />
        <line x1="72" y1="0" x2="72" y2="72" stroke="#111827" />
        <text x="12" y="42" fontSize="11" fontWeight="700">DF-V6</text>
        <text x="84" y="42" fontSize="11">STACKUP REVIEW</text>
      </g>
    </svg>
  );
}
