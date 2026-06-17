const materialDb = {
  scm420: { label: "SCM420", elastic: 205000, yield: 760, machinability: 0.72 },
  al6061: { label: "AL6061", elastic: 69000, yield: 275, machinability: 1.18 },
  sus304: { label: "SUS304", elastic: 193000, yield: 215, machinability: 0.48 },
  inconel718: { label: "Inconel 718", elastic: 200000, yield: 1030, machinability: 0.28 },
};

const processDb = [
  { id: "turning", label: "정밀 선삭", minTol: 0.015, cost: 1.0, lead: 1.0, fit: ["shaft", "gear"] },
  { id: "milling", label: "정밀 밀링", minTol: 0.025, cost: 1.1, lead: 1.1, fit: ["housing", "bracket"] },
  { id: "boring", label: "보링/리밍", minTol: 0.012, cost: 1.35, lead: 1.25, fit: ["housing"] },
  { id: "grinding", label: "연삭", minTol: 0.004, cost: 2.4, lead: 1.9, fit: ["shaft", "gear"] },
  { id: "honing", label: "호닝", minTol: 0.003, cost: 2.8, lead: 2.2, fit: ["shaft", "housing"] },
  { id: "edm", label: "방전", minTol: 0.008, cost: 2.1, lead: 1.8, fit: ["bracket", "gear"] },
];

const state = {
  result: null,
  cases: JSON.parse(localStorage.getItem("designfit-v2-cases") || "[]"),
};

function $(id) {
  return document.getElementById(id);
}

function fmt(value, digits = 3) {
  return Number(value).toFixed(digits);
}

function getInput() {
  return {
    partType: $("partType").value,
    material: $("material").value,
    currentTolerance: Number($("currentTolerance").value),
    functionalAllowance: Number($("functionalAllowance").value),
    nominalSize: Number($("nominalSize").value),
    spanLength: Number($("spanLength").value),
    loadN: Number($("loadN").value),
    safetyFactor: Number($("safetyFactor").value),
    volume: $("volume").value,
    inspectionLevel: $("inspectionLevel").value,
    designIntent: $("designIntent").value.trim(),
  };
}

function setExample() {
  $("partType").value = "shaft";
  $("material").value = "scm420";
  $("currentTolerance").value = "0.005";
  $("functionalAllowance").value = "0.03";
  $("nominalSize").value = "30";
  $("spanLength").value = "180";
  $("loadN").value = "120";
  $("safetyFactor").value = "1.5";
  $("volume").value = "mass";
  $("inspectionLevel").value = "cmm";
  $("designIntent").value =
    "외경 Ø30 샤프트의 조립 안정성을 유지하면서 원통도와 치수 공차를 완화하여 연삭 공정 없이 관리 가능한지 검토.";
}

function estimateCae(input) {
  const material = materialDb[input.material];
  const diameter = input.nominalSize;
  const length = input.spanLength;
  const radius = diameter / 2;
  const area = Math.PI * radius ** 2;
  const inertia = (Math.PI * diameter ** 4) / 64;
  const bendingMoment = (input.loadN * length) / 4;
  const stress = (bendingMoment * radius) / inertia;
  const deflection = (input.loadN * length ** 3) / (48 * material.elastic * inertia);
  const allowableStress = material.yield / input.safetyFactor;
  const displacementMargin = Math.max(0, input.functionalAllowance - deflection);
  const stressMargin = allowableStress - stress;

  return {
    stress,
    deflection,
    allowableStress,
    displacementMargin,
    stressMargin,
    pass: stressMargin > 0 && displacementMargin > 0,
  };
}

function volumeFactor(volume) {
  if (volume === "mass") return 1.18;
  if (volume === "pilot") return 1.08;
  return 0.95;
}

function inspectionFactor(level) {
  if (level === "gauge") return 0.92;
  if (level === "cmm") return 1.0;
  return 1.08;
}

function costForTolerance(tolerance, materialKey, process) {
  const material = materialDb[materialKey];
  const tightness = Math.max(0.35, process.minTol / tolerance);
  const materialPenalty = 1 / material.machinability;
  return process.cost * materialPenalty * (1 + tightness ** 1.35);
}

function optimize(input) {
  const cae = estimateCae(input);
  const processCandidates = processDb
    .filter((process) => process.fit.includes(input.partType))
    .map((process) => {
      const material = materialDb[input.material];
      const capabilityTol = process.minTol / material.machinability;
      const practicalTol = capabilityTol * volumeFactor(input.volume) * inspectionFactor(input.inspectionLevel);
      const feasible = input.currentTolerance >= capabilityTol || practicalTol <= input.functionalAllowance;
      const costCurrent = costForTolerance(Math.max(input.currentTolerance, 0.001), input.material, process);
      const costPractical = costForTolerance(Math.max(practicalTol, 0.001), input.material, process);
      return {
        ...process,
        capabilityTol,
        practicalTol,
        feasible,
        costCurrent,
        costPractical,
        saving: Math.max(0, 1 - costPractical / costCurrent),
      };
    })
    .sort((a, b) => a.costPractical - b.costPractical);

  const displacementLimit = Math.max(0.001, cae.displacementMargin * 0.7);
  const processLimit = Math.max(...processCandidates.map((process) => process.practicalTol));
  const functionLimit = input.functionalAllowance * 0.65;
  const recommended = Math.max(input.currentTolerance, Math.min(displacementLimit, functionLimit, processLimit));
  const bestProcess = processCandidates.find((p) => p.practicalTol <= recommended * 1.15) || processCandidates[0];
  const costCurrent = costForTolerance(input.currentTolerance, input.material, bestProcess);
  const costRecommended = costForTolerance(recommended, input.material, bestProcess);
  const costSaving = Math.round(Math.max(0, (1 - costRecommended / costCurrent) * 100));
  const marginRatio = recommended / input.functionalAllowance;

  const insights = [
    {
      title: "핵심 판단",
      body:
        recommended > input.currentTolerance * 1.8
          ? `현재 ±${fmt(input.currentTolerance)}mm는 기능 요구 대비 타이트합니다. 1차 검토 기준 ±${fmt(recommended)}mm까지 완화 후보로 볼 수 있습니다.`
          : "현재 공차는 기능 한계에 비교적 가까워 큰 폭의 완화보다 공정/검사 기준 명확화가 우선입니다.",
    },
    {
      title: "공정 영향",
      body: `${bestProcess.label} 기준으로 추천 공차를 적용하면 특수 공정 의존도를 줄이고 공정 선택 폭을 넓힐 수 있습니다.`,
    },
    {
      title: "CAE-lite 주의",
      body: `간이 계산 결과 변위 ${fmt(cae.deflection, 4)}mm, 응력 ${fmt(cae.stress, 1)}MPa입니다. 실제 형상 집중응력은 상세 CAE 또는 실측으로 보정해야 합니다.`,
    },
    {
      title: "AI 연동 포인트",
      body: "생성형 AI는 최적값을 직접 믿고 맡기기보다 계산 근거를 설명하고 협의 문구를 표준화하는 보조 엔진으로 쓰는 것이 안전합니다.",
    },
  ];

  const report = `현재 ${materialDb[input.material].label} ${labelPart(input.partType)}의 ±${fmt(input.currentTolerance)}mm 공차는 기능 허용 범위 ${fmt(input.functionalAllowance)}mm 대비 타이트한 설정으로 판단됩니다. CAE-lite와 공정 능력 기준을 함께 검토한 결과, 1차 협의 후보 공차는 ±${fmt(recommended)}mm입니다. 해당 수준에서는 ${bestProcess.label} 중심으로 공정 선택 폭을 확보할 수 있으며, 예상 제조비 지수는 약 ${costSaving}% 개선 여지가 있습니다. 단, 최종 반영 전에는 실제 조립 기능, 기준면, 검사 재현성, 상세 CAE 또는 샘플 측정 결과로 검증이 필요합니다.`;

  return {
    input,
    cae,
    processCandidates,
    recommended,
    bestProcess,
    costSaving,
    marginRatio,
    insights,
    report,
    createdAt: new Date().toISOString(),
  };
}

function labelPart(part) {
  return {
    shaft: "샤프트",
    housing: "하우징",
    bracket: "브라켓",
    gear: "기어",
  }[part];
}

function render(result) {
  state.result = result;
  $("currentTolView").textContent = `±${fmt(result.input.currentTolerance)}`;
  $("recommendedTolView").textContent = `±${fmt(result.recommended)}`;
  $("costIndexView").textContent = `-${result.costSaving}%`;
  $("marginView").textContent = result.marginRatio < 0.4 ? "충분" : result.marginRatio < 0.7 ? "보통" : "주의";
  $("freedomView").textContent = result.recommended > result.input.currentTolerance * 2 ? "크게 증가" : "일부 증가";
  $("caeView").textContent = result.cae.pass ? "통과" : "검증 필요";
  $("reportText").textContent = result.report;

  $("insightList").innerHTML = result.insights
    .map((item) => `<article class="insight"><strong>${item.title}</strong><p>${item.body}</p></article>`)
    .join("");

  $("processTable").innerHTML = `
    <div class="table-row table-head">
      <span>공정</span><span>관리 가능 공차</span><span>추천 적합성</span><span>비용 개선</span>
    </div>
    ${result.processCandidates
      .map(
        (process) => `
          <div class="table-row">
            <span>${process.label}</span>
            <span>±${fmt(process.practicalTol)}</span>
            <span>${process.practicalTol <= result.recommended * 1.15 ? "적합" : "부담"}</span>
            <span>${Math.round(process.saving * 100)}%</span>
          </div>
        `,
      )
      .join("")}
  `;

  $("caeMetrics").innerHTML = `
    <div><span>예상 변위</span><strong>${fmt(result.cae.deflection, 4)} mm</strong></div>
    <div><span>허용 여유</span><strong>${fmt(result.cae.displacementMargin, 4)} mm</strong></div>
    <div><span>예상 응력</span><strong>${fmt(result.cae.stress, 1)} MPa</strong></div>
    <div><span>허용 응력</span><strong>${fmt(result.cae.allowableStress, 1)} MPa</strong></div>
  `;

  drawCae(result);
}

function drawCae(result) {
  const canvas = $("caeCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#d7e0e8";
  ctx.lineWidth = 1;
  for (let x = 40; x < canvas.width; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, 24);
    ctx.lineTo(x, 220);
    ctx.stroke();
  }

  const baseY = 132;
  ctx.strokeStyle = "#263746";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(70, baseY);
  ctx.bezierCurveTo(220, baseY + result.cae.deflection * 900, 430, baseY + result.cae.deflection * 900, 650, baseY);
  ctx.stroke();

  ctx.fillStyle = "#0f766e";
  ctx.font = "700 16px Segoe UI";
  ctx.fillText("CAE-lite: 단순보 변위/응력 근사", 48, 42);

  ctx.fillStyle = result.cae.pass ? "#0f766e" : "#b42318";
  ctx.beginPath();
  ctx.arc(360, baseY + result.cae.deflection * 900, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "700 13px Segoe UI";
  ctx.fillText(result.cae.pass ? "PASS" : "CHECK", result.cae.pass ? 344 : 338, baseY + result.cae.deflection * 900 + 5);

  ctx.fillStyle = "#667085";
  ctx.font = "13px Segoe UI";
  ctx.fillText("상세 형상, 노치, 열처리 변형은 V2.2 이후 해석 데이터로 보정", 48, 232);
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function run() {
  render(optimize(getInput()));
}

$("optimizerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  run();
});

$("runOptimizer").addEventListener("click", run);

$("copyReport").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("reportText").textContent);
  showToast("협의 초안을 복사했습니다.");
});

$("saveCase").addEventListener("click", () => {
  if (!state.result) run();
  state.cases = [state.result, ...state.cases].slice(0, 20);
  localStorage.setItem("designfit-v2-cases", JSON.stringify(state.cases));
  showToast("V2 검토 케이스를 저장했습니다.");
});

setExample();
run();
