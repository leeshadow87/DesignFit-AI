const state = {
  currentResult: null,
  history: JSON.parse(localStorage.getItem("designfit-history") || "[]"),
};

const labels = {
  partType: {
    shaft: "샤프트",
    housing: "하우징",
    bracket: "브라켓",
    gear: "기어",
    weldment: "판금/용접품",
    aero: "항공 엔진 부품",
  },
  material: {
    scm: "SCM420 / 합금강",
    aluminum: "알루미늄",
    carbon: "탄소강",
    stainless: "스테인리스",
    titanium: "티타늄",
    inconel: "인코넬",
  },
  process: {
    turning: "선삭",
    milling: "밀링",
    boring: "보링",
    grinding: "연삭",
    honing: "호닝",
    edm: "방전",
    welding: "용접",
  },
  inspection: {
    general: "일반 측정기",
    cmm: "CMM",
    gauge: "전용 게이지",
    vision: "비전 검사",
  },
};

const sampleInputs = [
  {
    title: "SCM420 정밀 샤프트",
    summary: "Ø30 외경, 원통도 0.005, 선삭 후 연삭 검토",
    values: {
      partType: "shaft",
      material: "scm",
      process: "turning",
      inspection: "cmm",
      dimTolerance: 0.01,
      geoTolerance: 0.005,
      gdtInput: "원통도 0.005, Datum A 기준 동심도 관리",
      concern: "연삭 공정 추가 없이 안정적 양산 관리가 가능한지 검토하고 싶습니다.",
    },
  },
  {
    title: "알루미늄 박육 하우징",
    summary: "보링 기준면, 평면도 0.03, 클램핑 변형 우려",
    values: {
      partType: "housing",
      material: "aluminum",
      process: "boring",
      inspection: "cmm",
      dimTolerance: 0.03,
      geoTolerance: 0.03,
      gdtInput: "평면도 0.03, 위치도 0.05, Datum A/B/C 기준",
      concern: "얇은 벽 두께 때문에 가공 변형과 검사 재현성이 걱정됩니다.",
    },
  },
  {
    title: "용접 브라켓",
    summary: "용접 후 가공, 위치도 0.1, 전용 게이지 검사",
    values: {
      partType: "weldment",
      material: "carbon",
      process: "welding",
      inspection: "gauge",
      dimTolerance: 0.1,
      geoTolerance: 0.1,
      gdtInput: "용접 후 홀 위치도 0.1, 기준면 가공",
      concern: "용접 변형 보정 여유와 검사 기준이 충분한지 확인하고 싶습니다.",
    },
  },
  {
    title: "인코넬 항공 부품",
    summary: "난삭재 밀링, 윤곽도 0.02, 납기 리스크",
    values: {
      partType: "aero",
      material: "inconel",
      process: "milling",
      inspection: "cmm",
      dimTolerance: 0.02,
      geoTolerance: 0.02,
      gdtInput: "윤곽도 0.02, 표면조도 Ra 0.8, Datum A 기준",
      concern: "난삭재 조건에서 공구 마모와 검사 시간이 납기에 미치는 영향을 보고 싶습니다.",
    },
  },
];

const gdtAnswers = [
  {
    q: "위치도 0.02는 왜 제조 리스크가 있나요?",
    a: "위치도는 홀 자체를 뚫는 난이도보다 Datum 설정, 치공구 기준, 검사 재현성이 함께 움직입니다. 실제 가공 기준과 도면 Datum이 다르면 CMM 측정값은 맞아도 조립 현장에서 어긋날 수 있어 기준면 일치 여부를 먼저 확인해야 합니다.",
  },
  {
    q: "원통도 0.005는 어떤 공정이 필요할까요?",
    a: "일반 선삭만으로 안정 관리하기에는 타이트한 수준입니다. 소재, 길이, 열처리 여부에 따라 연삭, 호닝, 전용 검사구가 필요할 수 있습니다. 기능상 필수 요구가 아니라면 0.01에서 0.02 수준 완화 가능성을 생산기술팀과 협의하는 것이 좋습니다.",
  },
  {
    q: "평면도 요구는 언제 과도해지나요?",
    a: "넓은 면적, 박육 형상, 클램핑 변형이 있는 부품에서 평면도 요구가 과도해지기 쉽습니다. 실제 밀착 기능이 필요한 구역과 단순 기준면을 분리하고, 검사 기준과 조립 기준이 같은지 확인해야 합니다.",
  },
  {
    q: "Datum 설정을 검토할 때 무엇을 봐야 하나요?",
    a: "첫째 실제 가공에서 잡는 면인지, 둘째 조립 기능과 연결되는 면인지, 셋째 검사자가 반복 재현할 수 있는 면인지 봐야 합니다. 세 기준이 서로 다르면 설계팀, 생산기술팀, 품질팀 사이에서 해석 차이가 생깁니다.",
  },
];

function byId(id) {
  return document.getElementById(id);
}

function getInput() {
  return {
    partType: byId("partType").value,
    material: byId("material").value,
    process: byId("process").value,
    inspection: byId("inspection").value,
    dimTolerance: Number(byId("dimTolerance").value || 0),
    geoTolerance: Number(byId("geoTolerance").value || 0),
    gdtInput: byId("gdtInput").value.trim(),
    concern: byId("concern").value.trim(),
  };
}

function setInput(values) {
  Object.entries(values).forEach(([key, value]) => {
    const element = byId(key);
    if (element) element.value = value;
  });
}

function levelFromScore(score) {
  if (score >= 72) return { text: "높음", className: "high" };
  if (score >= 48) return { text: "보통", className: "medium" };
  return { text: "낮음", className: "low" };
}

function gradeMetric(value) {
  if (value >= 74) return "높음";
  if (value >= 50) return "보통";
  return "낮음";
}

function analyze(input) {
  let score = 26;
  let manufacturing = 28;
  let inspection = 24;
  let eco = 20;
  const reasons = [];
  const improvements = [];

  const tightDim = input.dimTolerance <= 0.01;
  const tightGeo = input.geoTolerance <= 0.01;

  if (tightDim) {
    score += 12;
    manufacturing += 10;
    reasons.push("치수 공차가 0.01 이하로 설정되어 공정 산포 관리 부담이 큽니다.");
    improvements.push("기능상 필수 치수와 관리 치수를 분리해 완화 가능 범위를 확인하세요.");
  }

  if (tightGeo) {
    score += 18;
    inspection += 18;
    eco += 8;
    reasons.push("형상/위치 공차가 타이트해 검사 재현성과 치공구 기준 설정이 중요합니다.");
    improvements.push("Datum이 실제 가공 기준과 일치하는지 생산기술팀과 먼저 맞추는 것이 좋습니다.");
  }

  if (["titanium", "inconel", "stainless"].includes(input.material)) {
    score += input.material === "inconel" ? 18 : 12;
    manufacturing += 16;
    reasons.push(`${labels.material[input.material]}은 공구 마모, 열 변형, 절삭 조건 관리 리스크가 큽니다.`);
    improvements.push("절삭 조건, 공구 수명, 검사 리드타임을 별도 검토 항목으로 분리하세요.");
  }

  if (["grinding", "honing", "edm"].includes(input.process)) {
    score += 10;
    manufacturing += 12;
    reasons.push(`${labels.process[input.process]} 공정은 정밀도 확보에 유리하지만 원가와 리드타임 증가 가능성이 있습니다.`);
  }

  if (input.process === "welding") {
    score += 14;
    manufacturing += 10;
    eco += 10;
    reasons.push("용접 변형과 후가공 기준 불명확성이 위치 정밀도 리스크를 키울 수 있습니다.");
    improvements.push("용접 후 기준면 가공 순서와 변형 보정 여유를 도면 검토 때 명시하세요.");
  }

  if (input.partType === "housing") {
    score += 8;
    inspection += 10;
    reasons.push("하우징류는 클램핑 변형과 보링 기준 불일치가 자주 발생합니다.");
  }

  if (input.partType === "shaft" && tightGeo) {
    score += 8;
    manufacturing += 8;
    reasons.push("샤프트의 원통도/동심도 요구는 열처리 변형과 센터 기준 관리가 함께 검토되어야 합니다.");
  }

  if (input.inspection === "cmm") {
    inspection += 10;
    reasons.push("CMM 검사는 기준 설정이 명확하지 않으면 측정 재현성 이슈가 생길 수 있습니다.");
  }

  const gdtText = input.gdtInput.toLowerCase();
  if (/(원통도|동심도|동축도|위치도|윤곽도|평면도)/.test(gdtText)) {
    score += 8;
    inspection += 8;
    improvements.push("GD&T 요구를 기능 목적, 가공 기준, 검사 기준으로 나누어 설명 자료를 준비하세요.");
  }

  score = Math.min(96, Math.max(18, Math.round(score)));
  manufacturing = Math.min(96, Math.round(Math.max(manufacturing, score - 8)));
  inspection = Math.min(96, Math.round(Math.max(inspection, score - 12)));
  eco = Math.min(92, Math.round(Math.max(eco + score * 0.35, score - 18)));

  const level = levelFromScore(score);
  const possibleRelaxedGeo = input.geoTolerance <= 0.01 ? "0.01~0.02" : `${Math.max(input.geoTolerance, 0.02).toFixed(3)} 이상`;
  const title =
    level.text === "높음"
      ? "정밀 공차와 제조 조건이 겹친 고위험 검토"
      : level.text === "보통"
        ? "일부 조건 확인이 필요한 중간 리스크 검토"
        : "현 조건에서는 관리 가능한 설계 검토";

  const summary =
    level.text === "높음"
      ? `${labels.process[input.process]} 기준에서 ${labels.material[input.material]} ${labels.partType[input.partType]} 조건은 공차, 검사, ECO 협의가 함께 필요한 수준입니다.`
      : level.text === "보통"
        ? "제조 가능성은 있으나 기준면, 검사 방식, 기능상 필수 공차 여부를 확인하면 리스크를 낮출 수 있습니다."
        : "현재 입력 조건은 큰 제조 리스크가 낮은 편이며, 표준 체크리스트 수준의 검토로 관리할 수 있습니다.";

  const consultText = `현재 ${labels.partType[input.partType]} 도면의 주요 요구사항(${input.gdtInput || "공차 조건"})은 ${labels.process[input.process]} 및 ${labels.inspection[input.inspection]} 기준에서 ${level.text} 리스크로 판단됩니다. 기능상 필수 요구가 아니라면 형상/위치 공차를 ${possibleRelaxedGeo} 수준으로 완화 가능한지 검토 부탁드립니다. 특히 Datum 기준과 실제 가공/검사 기준의 일치 여부를 함께 확인하면 원가 및 리드타임 증가 가능성을 줄일 수 있습니다.`;

  const cards = [
    {
      title: "제조 리스크",
      body: reasons[0] || "현재 조건에서는 일반 공정 기준의 제조 리스크가 낮은 편입니다.",
    },
    {
      title: "공차 적정성",
      body: tightDim || tightGeo ? "공차가 기능 요구 대비 과도한지 확인이 필요합니다. 조립 기준, 검사 기준, 품질 이력에 따라 완화 가능성을 검토하세요." : "공차 수준은 과도하게 타이트하지 않습니다. 다만 기능 목적과 검사 기준은 기록해 두는 것이 좋습니다.",
    },
    {
      title: "개선 제안",
      body: improvements[0] || "도면 검토 전 부품 기능, 기준면, 검사 방식을 한 문장으로 정리해 협의하면 수정 횟수를 줄일 수 있습니다.",
    },
    {
      title: "확인 질문",
      body: "이 공차가 조립 기능상 필수인지, 검사 편의상 요구인지, 과거 불량 이력 때문에 추가된 것인지 확인하세요.",
    },
  ];

  return {
    input,
    score,
    level,
    title,
    summary,
    manufacturing: gradeMetric(manufacturing),
    inspection: gradeMetric(inspection),
    eco: gradeMetric(eco),
    cards,
    consultText,
    createdAt: new Date().toISOString(),
  };
}

function renderResult(result) {
  state.currentResult = result;
  byId("riskScore").textContent = result.score;
  byId("scoreRing").style.background = `conic-gradient(${result.level.className === "high" ? "#b42318" : result.level.className === "medium" ? "#c77916" : "#0f766e"} 0 ${result.score}%, #edf1f4 ${result.score}% 100%)`;

  const riskLevel = byId("riskLevel");
  riskLevel.textContent = result.level.text;
  riskLevel.className = `status-pill ${result.level.className}`;

  byId("riskTitle").textContent = result.title;
  byId("riskSummary").textContent = result.summary;
  byId("manufacturingMetric").textContent = result.manufacturing;
  byId("inspectionMetric").textContent = result.inspection;
  byId("ecoMetric").textContent = result.eco;
  byId("consultText").textContent = result.consultText;

  byId("analysisList").innerHTML = result.cards
    .map((card) => `<article class="analysis-card"><strong>${card.title}</strong><p>${card.body}</p></article>`)
    .join("");

  drawPartCanvas(result.score);
}

function drawPartCanvas(score = 78) {
  const canvas = byId("partCanvas");
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#c8d3dc";
  ctx.lineWidth = 1;
  for (let x = 22; x < width; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, height - 20);
    ctx.stroke();
  }

  const y = height / 2;
  const riskColor = score >= 72 ? "#b42318" : score >= 48 ? "#c77916" : "#0f766e";
  ctx.fillStyle = "#d7e1e7";
  ctx.fillRect(82, y - 26, 360, 52);
  ctx.fillStyle = "#aebdca";
  ctx.fillRect(36, y - 16, 84, 32);
  ctx.fillRect(410, y - 16, 104, 32);

  ctx.strokeStyle = "#51606c";
  ctx.lineWidth = 2;
  ctx.strokeRect(82, y - 26, 360, 52);
  ctx.strokeRect(36, y - 16, 84, 32);
  ctx.strokeRect(410, y - 16, 104, 32);

  ctx.strokeStyle = riskColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(270, y, 36, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = riskColor;
  ctx.font = "700 15px Segoe UI";
  ctx.fillText(`Risk ${score}`, 234, y + 5);

  ctx.fillStyle = "#17202a";
  ctx.font = "700 14px Segoe UI";
  ctx.fillText("Datum A", 38, 42);
  ctx.fillText("GD&T Zone", 232, 42);
  ctx.fillText("Inspection", 420, 42);

  ctx.fillStyle = "#667085";
  ctx.font = "12px Segoe UI";
  ctx.fillText("가공 기준", 38, 62);
  ctx.fillText("공차/형상 관리", 232, 62);
  ctx.fillText("CMM/게이지", 420, 62);
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function renderSamples() {
  byId("sampleGrid").innerHTML = sampleInputs
    .map(
      (sample, index) => `
        <article class="sample-card">
          <strong>${sample.title}</strong>
          <p>${sample.summary}</p>
          <button class="ghost-button" data-sample="${index}" type="button">불러오기</button>
        </article>
      `,
    )
    .join("");
}

function renderQuestions() {
  byId("questionBank").innerHTML = gdtAnswers
    .map(
      (item, index) => `
        <button class="question-button ${index === 0 ? "active" : ""}" data-question="${index}" type="button">${item.q}</button>
      `,
    )
    .join("");
}

function renderHistory() {
  if (!state.history.length) {
    byId("historyList").innerHTML = `<div class="empty-state">아직 저장된 검토 결과가 없습니다.</div>`;
    return;
  }

  byId("historyList").innerHTML = state.history
    .map((item, index) => {
      const date = new Date(item.createdAt).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
      return `
        <article class="history-item">
          <div>
            <strong>${labels.partType[item.input.partType]} · ${item.level.text} 리스크 · ${item.score}/100</strong>
            <p>${date} · ${item.input.gdtInput || "요구사항 미입력"}</p>
          </div>
          <button class="ghost-button" data-history="${index}" type="button">열기</button>
        </article>
      `;
    })
    .join("");
}

function switchPanel(panelName) {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === panelName);
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${panelName}`);
  });
}

function runAndRender() {
  const result = analyze(getInput());
  renderResult(result);
  switchPanel("review");
  showToast("DFM 분석 결과를 갱신했습니다.");
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest(".nav-item");
  if (nav) switchPanel(nav.dataset.panel);

  const sampleButton = event.target.closest("[data-sample]");
  if (sampleButton) {
    const sample = sampleInputs[Number(sampleButton.dataset.sample)];
    setInput(sample.values);
    renderResult(analyze(getInput()));
    switchPanel("review");
    showToast("샘플 조건을 불러왔습니다.");
  }

  const questionButton = event.target.closest("[data-question]");
  if (questionButton) {
    const index = Number(questionButton.dataset.question);
    document.querySelectorAll(".question-button").forEach((button) => button.classList.remove("active"));
    questionButton.classList.add("active");
    byId("gdtQuestion").textContent = gdtAnswers[index].q;
    byId("gdtAnswer").textContent = gdtAnswers[index].a;
  }

  const historyButton = event.target.closest("[data-history]");
  if (historyButton) {
    const item = state.history[Number(historyButton.dataset.history)];
    setInput(item.input);
    renderResult(item);
    switchPanel("review");
    showToast("저장된 검토를 열었습니다.");
  }
});

byId("reviewForm").addEventListener("submit", (event) => {
  event.preventDefault();
  runAndRender();
});

byId("runAnalysisTop").addEventListener("click", runAndRender);

byId("loadShaft").addEventListener("click", () => {
  setInput(sampleInputs[0].values);
  renderResult(analyze(getInput()));
  showToast("샤프트 예시를 적용했습니다.");
});

byId("resetForm").addEventListener("click", () => {
  setInput(sampleInputs[0].values);
  renderResult(analyze(getInput()));
});

byId("copyConsult").addEventListener("click", async () => {
  await navigator.clipboard.writeText(byId("consultText").textContent);
  showToast("협의 문구를 복사했습니다.");
});

byId("saveResult").addEventListener("click", () => {
  if (!state.currentResult) return;
  state.history = [state.currentResult, ...state.history].slice(0, 10);
  localStorage.setItem("designfit-history", JSON.stringify(state.history));
  renderHistory();
  showToast("검토 결과를 저장했습니다.");
});

byId("printResult").addEventListener("click", () => {
  window.print();
});

renderSamples();
renderQuestions();
renderHistory();
renderResult(analyze(getInput()));
