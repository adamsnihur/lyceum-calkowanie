/**
 * Lyceum Explainer: Rachunek Całkowy (0 -> Zaawansowany)
 * Główny Silnik Interaktywny i Wizualizacyjny (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Inicjalizacja KaTeX Auto-Render
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false
    });
  }

  // 2. Setup Sticky Sidebar IntersectionObserver
  setupSidebarNavigation();

  // 3. Moduł 1: Pętla Motion 60 FPS
  initHeroMotionLoop();

  // 4. Moduł 2: Laboratorium Sum Riemanna
  initRiemannLab();

  // 5. Moduł 3: Wizualizator Luki Darboux
  initDarbouxVisualizer();

  // 6. Moduł 4: Badanie Zbieżności Plotly & Tabela
  initConvergenceBenchmark();

  // 7. Moduł 5: Demonstrator Lebesgue vs Riemann
  initLebesgueDemonstrator();

  // 8. Moduł 7: Quiz Diagnostyczny
  initQuizModule();

  // 9. Moduł 8: Kopiowanie Kodu
  initCodeCopyButton();
});

/* ==========================================================================
   NAWIGACJA TOC (INTERSECTION OBSERVER)
   ========================================================================== */
function setupSidebarNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = Array.from(navLinks).map(link => {
    const id = link.getAttribute("href").replace("#", "");
    return document.getElementById(id);
  }).filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          if (link.getAttribute("href") === `#${entry.target.id}`) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
      }
    });
  }, {
    rootMargin: "-20% 0px -60% 0px",
    threshold: 0
  });

  sections.forEach(sec => observer.observe(sec));
}

/* ==========================================================================
   MODUŁ 1: DYNAMICZNA PĘTLA MOTION 60 FPS (CANVAS)
   ========================================================================== */
function initHeroMotionLoop() {
  const canvas = document.getElementById("heroMotionCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const btnToggle = document.getElementById("btnToggleMotion");
  const btnReset = document.getElementById("btnResetMotion");
  const selFunc = document.getElementById("selMotionFunc");
  const rngMaxN = document.getElementById("rngMotionMaxN");
  const rngSpeed = document.getElementById("rngMotionSpeed");
  const lblMaxNVal = document.getElementById("lblMotionMaxNVal");
  const lblSpeedVal = document.getElementById("lblMotionSpeedVal");
  const lblN = document.getElementById("lblMotionN");
  const lblVal = document.getElementById("lblMotionVal");
  const lblFps = document.getElementById("lblMotionFps");

  let isPlaying = true;
  let animFrameId = null;
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTimer = 0;

  let currentN = 6;
  let targetN = 6;
  let maxN = parseInt(rngMaxN.value, 10) || 64;
  let speedMultiplier = parseInt(rngSpeed.value, 10) || 2;
  let direction = 1;
  let pulseTimer = 0;

  // Definicje funkcji i ich analitycznych całek na [0, 2]
  const funcs = {
    parabola: {
      f: (x) => x * x,
      int: 8.0 / 3.0,
      domain: [0, 2],
      rangeY: [0, 4.2]
    },
    sinus: {
      f: (x) => Math.sin(x) + 1.2,
      int: 1 - Math.cos(2) + 1.2 * 2,
      domain: [0, 2],
      rangeY: [0, 2.5]
    },
    wielomian: {
      f: (x) => -0.5 * Math.pow(x, 3) + 2 * x + 1.5,
      int: -0.5 * (16 / 4) + 2 * (4 / 2) + 1.5 * 2, // -2 + 4 + 3 = 5
      domain: [0, 2],
      rangeY: [0, 4.5]
    },
    gauss: {
      f: (x) => 2.5 * Math.exp(-x * x),
      int: 2.5 * 0.882081, // ~ 2.2052
      domain: [0, 2],
      rangeY: [0, 2.8]
    }
  };

  rngMaxN.addEventListener("input", (e) => {
    maxN = parseInt(e.target.value, 10);
    lblMaxNVal.textContent = `N = ${maxN}`;
  });

  rngSpeed.addEventListener("input", (e) => {
    speedMultiplier = parseInt(e.target.value, 10);
    lblSpeedVal.textContent = `${speedMultiplier}x`;
  });

  btnToggle.addEventListener("click", () => {
    isPlaying = !isPlaying;
    btnToggle.textContent = isPlaying ? "Zatrzymaj Pętlę" : "Wznów Pętlę";
    if (isPlaying) {
      lastTime = performance.now();
      loop();
    }
  });

  btnReset.addEventListener("click", () => {
    currentN = 4;
    direction = 1;
  });

  function loop(now = performance.now()) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    // FPS calculation
    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
      const fps = Math.round(frameCount / fpsTimer);
      if (lblFps) lblFps.textContent = fps;
      frameCount = 0;
      fpsTimer = 0;
    }

    if (isPlaying) {
      pulseTimer += dt * speedMultiplier;
      if (pulseTimer >= 0.08) {
        pulseTimer = 0;
        currentN += direction;
        if (currentN >= maxN) {
          direction = -1;
        } else if (currentN <= 4) {
          direction = 1;
        }
      }
    }

    renderMotionScene(currentN);

    if (isPlaying) {
      animFrameId = requestAnimationFrame(loop);
    }
  }

  function renderMotionScene(N) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const fObj = funcs[selFunc.value] || funcs.parabola;
    const [a, b] = fObj.domain;
    const [minY, maxY] = fObj.rangeY;

    const padLeft = 60;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 50;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const mapX = (x) => padLeft + ((x - a) / (b - a)) * plotW;
    const mapY = (y) => padTop + plotH - ((y - minY) / (maxY - minY)) * plotH;

    // Tło siatki
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= 4; gx++) {
      const vx = a + (gx / 4) * (b - a);
      const px = mapX(vx);
      ctx.beginPath();
      ctx.moveTo(px, padTop);
      ctx.lineTo(px, padTop + plotH);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "11px 'JetBrains Mono'";
      ctx.fillText(vx.toFixed(1), px - 10, padTop + plotH + 20);
    }

    for (let gy = 0; gy <= 4; gy++) {
      const vy = minY + (gy / 4) * (maxY - minY);
      const py = mapY(vy);
      ctx.beginPath();
      ctx.moveTo(padLeft, py);
      ctx.lineTo(padLeft + plotW, py);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "11px 'JetBrains Mono'";
      ctx.fillText(vy.toFixed(1), padLeft - 35, py + 4);
    }

    // 1. Rysowanie prostokątów Riemanna (Midpoint)
    const dx = (b - a) / N;
    let currentSum = 0;

    for (let i = 0; i < N; i++) {
      const xi = a + i * dx;
      const xNext = xi + dx;
      const xMid = (xi + xNext) / 2;
      const yVal = fObj.f(xMid);
      currentSum += yVal * dx;

      const px1 = mapX(xi);
      const px2 = mapX(xNext);
      const pyTop = mapY(yVal);
      const pyBottom = mapY(0);

      // Gradient słupka
      const grad = ctx.createLinearGradient(0, pyTop, 0, pyBottom);
      grad.addColorStop(0, "rgba(37, 99, 235, 0.45)");
      grad.addColorStop(1, "rgba(30, 58, 138, 0.15)");

      ctx.fillStyle = grad;
      ctx.fillRect(px1, pyTop, px2 - px1, pyBottom - pyTop);

      ctx.strokeStyle = "rgba(96, 165, 250, 0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px1, pyTop, px2 - px1, pyBottom - pyTop);
    }

    // 2. Rysowanie ciągłej krzywej f(x)
    ctx.beginPath();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    const steps = 300;
    for (let s = 0; s <= steps; s++) {
      const x = a + (s / steps) * (b - a);
      const y = fObj.f(x);
      const px = mapX(x);
      const py = mapY(y);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 3. Poświata krzywej
    ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Aktualizacja wskaźników tekstowych
    if (lblN) lblN.textContent = N;
    if (lblVal) lblVal.textContent = currentSum.toFixed(4);
  }

  // Start loop
  loop();
}

/* ==========================================================================
   MODUŁ 2: LABORATORIUM SUM RIEMANNA
   ========================================================================== */
function initRiemannLab() {
  const canvas = document.getElementById("riemannLabCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const sliderN = document.getElementById("sliderRiemannN");
  const sliderB = document.getElementById("sliderRiemannB");
  const lblNVal = document.getElementById("lblRiemannNVal");
  const lblBVal = document.getElementById("lblRiemannBVal");

  const kpiTrue = document.getElementById("kpiRiemannTrue");
  const kpiApprox = document.getElementById("kpiRiemannApprox");
  const kpiErr = document.getElementById("kpiRiemannErr");
  const kpiErrPct = document.getElementById("kpiRiemannErrPct");

  const methodBtns = document.querySelectorAll(".riemann-method-btn");
  let currentMethod = "left";

  methodBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      methodBtns.forEach(b => {
        b.classList.remove("bg-white", "text-blue-600", "shadow-sm");
        b.classList.add("text-slate-600");
      });
      btn.classList.add("bg-white", "text-blue-600", "shadow-sm");
      btn.classList.remove("text-slate-600");
      currentMethod = btn.dataset.method;
      renderLab();
    });
  });

  sliderN.addEventListener("input", (e) => {
    lblNVal.textContent = `N = ${e.target.value}`;
    renderLab();
  });

  sliderB.addEventListener("input", (e) => {
    const val = (parseInt(e.target.value, 10) / 10).toFixed(1);
    lblBVal.textContent = `b = ${val}`;
    renderLab();
  });

  // Funkcja: f(x) = x^2 na [0, b]
  const f = (x) => x * x;

  function renderLab() {
    const N = parseInt(sliderN.value, 10);
    const b = parseFloat(sliderB.value) / 10.0;
    const a = 0.0;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padLeft = 60;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 45;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const maxY = Math.max(f(b) * 1.15, 1.0);
    const mapX = (x) => padLeft + ((x - a) / (b - a)) * plotW;
    const mapY = (y) => padTop + plotH - (y / maxY) * plotH;

    // Siatka i osie
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const vx = a + (i / 4) * (b - a);
      const px = mapX(vx);
      ctx.beginPath();
      ctx.moveTo(px, padTop);
      ctx.lineTo(px, padTop + plotH);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "11px 'JetBrains Mono'";
      ctx.fillText(vx.toFixed(2), px - 12, padTop + plotH + 20);
    }

    const dx = (b - a) / N;
    let approxSum = 0;

    // Obliczanie sumy i rysowanie
    for (let i = 0; i < N; i++) {
      const xi = a + i * dx;
      const xNext = xi + dx;
      let evalX = xi;

      if (currentMethod === "left") evalX = xi;
      else if (currentMethod === "right") evalX = xNext;
      else if (currentMethod === "midpoint") evalX = (xi + xNext) / 2;

      const px1 = mapX(xi);
      const px2 = mapX(xNext);
      const py0 = mapY(0);

      if (currentMethod === "trapezoid") {
        const y1 = f(xi);
        const y2 = f(xNext);
        const trapVal = ((y1 + y2) / 2) * dx;
        approxSum += trapVal;

        const py1 = mapY(y1);
        const py2 = mapY(y2);

        ctx.fillStyle = "rgba(59, 130, 246, 0.35)";
        ctx.beginPath();
        ctx.moveTo(px1, py0);
        ctx.lineTo(px1, py1);
        ctx.lineTo(px2, py2);
        ctx.lineTo(px2, py0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        const yVal = f(evalX);
        approxSum += yVal * dx;
        const pyTop = mapY(yVal);

        ctx.fillStyle = "rgba(37, 99, 235, 0.35)";
        ctx.fillRect(px1, pyTop, px2 - px1, py0 - pyTop);

        ctx.strokeStyle = "#93c5fd";
        ctx.lineWidth = 1;
        ctx.strokeRect(px1, pyTop, px2 - px1, py0 - pyTop);
      }
    }

    // Ciągła krzywa analityczna
    ctx.beginPath();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    const steps = 200;
    for (let s = 0; s <= steps; s++) {
      const x = a + (s / steps) * (b - a);
      const y = f(x);
      const px = mapX(x);
      const py = mapY(y);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // KPI
    const trueVal = Math.pow(b, 3) / 3.0;
    const absErr = Math.abs(approxSum - trueVal);
    const relErr = (absErr / trueVal) * 100;

    if (kpiTrue) kpiTrue.textContent = trueVal.toFixed(5);
    if (kpiApprox) kpiApprox.textContent = approxSum.toFixed(5);
    if (kpiErr) kpiErr.textContent = absErr.toFixed(5);
    if (kpiErrPct) kpiErrPct.textContent = `${relErr.toFixed(2)} %`;
  }

  renderLab();
}

/* ==========================================================================
   MODUŁ 3: WIZUALIZATOR LUKI DARBOUX
   ========================================================================== */
function initDarbouxVisualizer() {
  const canvas = document.getElementById("darbouxCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const sliderN = document.getElementById("sliderDarbouxN");
  const lblN = document.getElementById("lblDarbouxN");
  const lblGap = document.getElementById("lblDarbouxGap");

  sliderN.addEventListener("input", (e) => {
    lblN.textContent = `N = ${e.target.value} przedziałów`;
    renderDarboux();
  });

  // Funkcja: f(x) = sin(x) + 0.5x na [0, 3]
  const f = (x) => Math.sin(x) + 0.5 * x;
  const a = 0.0;
  const b = 3.0;

  function renderDarboux() {
    const N = parseInt(sliderN.value, 10);
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padLeft = 50;
    const padRight = 30;
    const padTop = 25;
    const padBottom = 35;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const maxY = 3.2;
    const mapX = (x) => padLeft + ((x - a) / (b - a)) * plotW;
    const mapY = (y) => padTop + plotH - (y / maxY) * plotH;

    const dx = (b - a) / N;
    let lowerSum = 0;
    let upperSum = 0;

    for (let i = 0; i < N; i++) {
      const xi = a + i * dx;
      const xNext = xi + dx;

      // Szukanie min i max w przedziale
      let m_i = Infinity;
      let M_i = -Infinity;
      for (let sub = 0; sub <= 20; sub++) {
        const xTest = xi + (sub / 20) * dx;
        const val = f(xTest);
        if (val < m_i) m_i = val;
        if (val > M_i) M_i = val;
      }

      lowerSum += m_i * dx;
      upperSum += M_i * dx;

      const px1 = mapX(xi);
      const px2 = mapX(xNext);
      const py0 = mapY(0);
      const pyLow = mapY(m_i);
      const pyUp = mapY(M_i);

      // Suma dolna (zielona)
      ctx.fillStyle = "rgba(5, 150, 105, 0.4)";
      ctx.fillRect(px1, pyLow, px2 - px1, py0 - pyLow);

      // Luka Darboux (czerwona)
      ctx.fillStyle = "rgba(225, 29, 72, 0.35)";
      ctx.fillRect(px1, pyUp, px2 - px1, pyLow - pyUp);

      // Krawędzie
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.strokeRect(px1, pyUp, px2 - px1, py0 - pyUp);
    }

    // Ciągła krzywa
    ctx.beginPath();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    for (let s = 0; s <= 200; s++) {
      const x = a + (s / 200) * (b - a);
      const y = f(x);
      const px = mapX(x);
      const py = mapY(y);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const gap = upperSum - lowerSum;
    if (lblGap) lblGap.textContent = `Luka Darboux: ${gap.toFixed(4)}`;
  }

  renderDarboux();
}

/* ==========================================================================
   MODUŁ 4: BADANIE ZBIEŻNOŚCI PLOTLY & TABELA
   ========================================================================== */
function initConvergenceBenchmark() {
  const container = document.getElementById("convergencePlotDiv");
  const tableBody = document.getElementById("convergenceTableBody");
  if (!container || !tableBody) return;

  const f = (x) => Math.sin(x);
  const a = 0.0;
  const b = Math.PI;
  const trueVal = 2.0;

  const nValues = [4, 8, 16, 32, 64, 128];
  const leftErrors = [];
  const trapErrors = [];
  const simpErrors = [];

  let tableHtml = "";

  nValues.forEach(n => {
    const dx = (b - a) / n;
    const x = [];
    const y = [];
    for (let i = 0; i <= n; i++) {
      const xi = a + i * dx;
      x.push(xi);
      y.push(f(xi));
    }

    // Lewa suma
    let leftSum = 0;
    for (let i = 0; i < n; i++) leftSum += y[i] * dx;
    const errLeft = Math.abs(leftSum - trueVal);
    leftErrors.push(errLeft);

    // Trapez
    let trapSum = 0;
    for (let i = 0; i < n; i++) trapSum += (y[i] + y[i + 1]) / 2 * dx;
    const errTrap = Math.abs(trapSum - trueVal);
    trapErrors.push(errTrap);

    // Simpson
    let simpSum = 0;
    if (n % 2 === 0) {
      let sOdd = 0;
      let sEven = 0;
      for (let i = 1; i < n; i += 2) sOdd += y[i];
      for (let i = 2; i < n; i += 2) sEven += y[i];
      simpSum = (dx / 3.0) * (y[0] + y[n] + 4 * sOdd + 2 * sEven);
    }
    const errSimp = Math.abs(simpSum - trueVal);
    simpErrors.push(errSimp);

    tableHtml += `
      <tr>
        <td class="p-2 font-bold text-slate-800">N = ${n}</td>
        <td class="p-2">${leftSum.toFixed(5)} <span class="text-rose-500 text-[10px]">(${errLeft.toExponential(1)})</span></td>
        <td class="p-2">${trapSum.toFixed(5)} <span class="text-amber-500 text-[10px]">(${errTrap.toExponential(1)})</span></td>
        <td class="p-2 text-emerald-600 font-bold">${simpSum.toFixed(6)} <span class="text-[10px]">(${errSimp.toExponential(1)})</span></td>
        <td class="p-2 text-slate-400">2.000000</td>
      </tr>
    `;
  });

  tableBody.innerHTML = tableHtml;

  // Wykres Plotly w skali log-log
  const traceLeft = {
    x: nValues,
    y: leftErrors,
    name: "Suma Lewa O(N⁻¹)",
    mode: "lines+markers",
    line: { color: "#e11d48", width: 2.5 }
  };

  const traceTrap = {
    x: nValues,
    y: trapErrors,
    name: "Trapez O(N⁻²)",
    mode: "lines+markers",
    line: { color: "#d97706", width: 2.5 }
  };

  const traceSimp = {
    x: nValues,
    y: simpErrors,
    name: "Simpson O(N⁻⁴)",
    mode: "lines+markers",
    line: { color: "#059669", width: 3 }
  };

  const layout = {
    margin: { t: 30, r: 25, b: 40, l: 55 },
    xaxis: {
      type: "log",
      title: "Liczba podziałów (N)",
      gridcolor: "#e2e8f0"
    },
    yaxis: {
      type: "log",
      title: "Błąd bezwzględny |I_num - I_true|",
      gridcolor: "#e2e8f0"
    },
    legend: {
      orientation: "h",
      x: 0.1,
      y: 1.15
    },
    paper_bgcolor: "transparent",
    plot_bgcolor: "#ffffff"
  };

  Plotly.newPlot(container, [traceLeft, traceTrap, traceSimp], layout, { responsive: true, displayModeBar: false });
}

/* ==========================================================================
   MODUŁ 5: DEMONSTRATOR LEBESGUE VS RIEMANN
   ========================================================================== */
function initLebesgueDemonstrator() {
  const canvas = document.getElementById("lebesgueCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const btnRiemann = document.getElementById("btnModeRiemann");
  const btnLebesgue = document.getElementById("btnModeLebesgue");
  const explText = document.getElementById("lebesgueExplText");

  let mode = "riemann";

  btnRiemann.addEventListener("click", () => {
    mode = "riemann";
    btnRiemann.classList.add("bg-white", "text-blue-600", "shadow-sm", "font-semibold");
    btnRiemann.classList.remove("text-slate-600");
    btnLebesgue.classList.remove("bg-white", "text-blue-600", "shadow-sm", "font-semibold");
    btnLebesgue.classList.add("text-slate-600");
    explText.innerHTML = "<strong>Widok Riemanna:</strong> Pionowe słupki sumują pole wzdłuż osi $X$. Dla funkcji poszarpanych wysokość słupka staje się nieokreślona.";
    render();
  });

  btnLebesgue.addEventListener("click", () => {
    mode = "lebesgue";
    btnLebesgue.classList.add("bg-white", "text-blue-600", "shadow-sm", "font-semibold");
    btnLebesgue.classList.remove("text-slate-600");
    btnRiemann.classList.remove("bg-white", "text-blue-600", "shadow-sm", "font-semibold");
    btnRiemann.classList.add("text-slate-600");
    explText.innerHTML = "<strong>Widok Lebesgue'a:</strong> Poziome pasma tną oś $Y$. Mierzymy długość zbioru argumentów $E_k$, dla których $f(x) \\in [y_k, y_{k+1})$.";
    render();
  });

  function render() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padLeft = 60;
    const padRight = 40;
    const padTop = 30;
    const padBottom = 40;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const f = (x) => Math.sin(x * 1.5) * 1.2 + 1.6;
    const a = 0.0;
    const b = 4.0;
    const maxY = 3.2;

    const mapX = (x) => padLeft + (x / b) * plotW;
    const mapY = (y) => padTop + plotH - (y / maxY) * plotH;

    if (mode === "riemann") {
      // Słupki pionowe
      const N = 12;
      const dx = b / N;
      for (let i = 0; i < N; i++) {
        const xi = i * dx;
        const yVal = f(xi + dx / 2);
        const px1 = mapX(xi);
        const px2 = mapX(xi + dx);
        const pyTop = mapY(yVal);
        const py0 = mapY(0);

        ctx.fillStyle = "rgba(37, 99, 235, 0.3)";
        ctx.fillRect(px1, pyTop, px2 - px1, py0 - pyTop);
        ctx.strokeStyle = "#60a5fa";
        ctx.strokeRect(px1, pyTop, px2 - px1, py0 - pyTop);
      }
    } else {
      // Pasma poziome Lebesgue'a
      const M = 6;
      const dy = maxY / M;
      for (let j = 0; j < M; j++) {
        const yj = j * dy;
        const pyBottom = mapY(yj);
        const pyTop = mapY(yj + dy);

        // Poziome pasmo w tle
        ctx.fillStyle = j % 2 === 0 ? "rgba(79, 70, 229, 0.2)" : "rgba(99, 102, 241, 0.1)";
        ctx.fillRect(padLeft, pyTop, plotW, pyBottom - pyTop);
        ctx.strokeStyle = "rgba(165, 180, 252, 0.5)";
        ctx.strokeRect(padLeft, pyTop, plotW, pyBottom - pyTop);

        // Rzut przeciwobrazu na oś X
        ctx.fillStyle = "#818cf8";
        ctx.fillRect(padLeft, mapY(0) + 5, plotW, 3);
      }
    }

    // Ciągła krzywa
    ctx.beginPath();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    for (let s = 0; s <= 200; s++) {
      const x = (s / 200) * b;
      const y = f(x);
      const px = mapX(x);
      const py = mapY(y);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  render();
}

/* ==========================================================================
   MODUŁ 7: QUIZ DIAGNOSTYCZNY
   ========================================================================== */
function initQuizModule() {
  const container = document.getElementById("quizContainer");
  const scoreText = document.getElementById("quizScoreText");
  if (!container || !scoreText) return;

  const questions = [
    {
      q: "1. Co geometrycznie reprezentuje całka oznaczona $\\int_a^b f(x) dx$, gdy na pewnym przedziale funkcja przyjmuje wartości ujemne?",
      options: [
        "Zwykłe pole figur bez względu na znak (wartość bezwzględną).",
        "Pole ze znakiem (pole nad osią X minus pole pod osią X).",
        "Wartość zawsze równą zero ze względu na symetrię.",
        "Długość łuku wykresu funkcji na przedziale [a, b]."
      ],
      correct: 1,
      explanation: "Całka oznaczona to pole zorientowane (ze znakiem): obszary leżące nad osią OX dodają się dodatnio, natomiast obszary pod osią OX wchodzą do sumy z ujemnym znakiem."
    },
    {
      q: "2. Na mocy Pierwszego Twierdzenia Rachunku Całkowego (FTC I) i reguły łańcuchowej, ile wynosi pochodna funkcji $G(x) = \\int_0^{x^2} \\cos(t) dt$?",
      options: [
        "$\\cos(x^2)$",
        "$2x \\cdot \\cos(x^2)$",
        "$\\sin(x^2)$",
        "$2x \\cdot \\sin(x^2)$"
      ],
      correct: 1,
      explanation: "Zgodnie z regułą łańcuchowej różniczkowania całki ze zmienną granicą: $\\frac{d}{dx} \\int_0^{u(x)} f(t)dt = f(u(x)) \\cdot u'(x) = \\cos(x^2) \\cdot 2x$."
    },
    {
      q: "3. Dlaczego funkcja Dirichleta $\\mathbf{1}_{\\mathbb{Q}}(x)$ na $[0, 1]$ nie jest całkowalna w sensie Riemanna, a jest w sensie Lebesgue'a?",
      options: [
        "W każdym podziale Riemanna suma dolna to 0, a górna to 1 (luka nigdy nie maleje), natomiast zbiór liczb wymiernych ma miarę Lebesgue'a 0.",
        "Funkcja ta ma nieskończoną całkę niewłaściwą.",
        "Lebesgue używa wzoru Simpsona, który omija liczby niewymierne.",
        "Funkcja Dirichleta przyjmuje wyłącznie liczby urojone."
      ],
      correct: 0,
      explanation: "Zbiór liczb wymiernych $\\mathbb{Q}$ jest przeliczalny, więc jego miara Lebesgue'a wynosi zero $\\mu(\\mathbb{Q}) = 0$. Zatem całka Lebesgue'a wynosi $1 \\cdot 0 + 0 \\cdot 1 = 0$. Dla Riemanna kresy dolne to zawsze 0, a górne 1, więc luka Darboux to stale 1."
    },
    {
      q: "4. Jaka jest geometryczna geneza wzoru na całkowanie przez części $\\int u dv = uv - \\int v du$?",
      options: [
        "Podział koła na nieskończoną liczbę wycinków kołowych.",
        "Pole prostokąta $u \\times v$ jako suma dwóch uzupełniających się rzutów krzywej na obie osie.",
        "Rzut stereograficzny sfery Riemanna na płaszczyznę zespoloną.",
        "Obrót trapezu wokół osi symetrii."
      ],
      correct: 1,
      explanation: "W płaszczyźnie $(u, v)$ całkowite pole prostokąta o narożniku $(u, v)$ wynosi $u \\cdot v$. Krzywa $v(u)$ dzieli go na pole pod krzywą $\\int v du$ oraz pole po prawej stronie krzywej $\\int u dv$."
    },
    {
      q: "5. Co w uogólnionym twierdzeniu Stokesa $\\int_{\\partial \\Omega} \\omega = \\int_{\\Omega} d\\omega$ oznacza symbol $\\partial \\Omega$?",
      options: [
        "Pochodną cząstkową objętości bryły.",
        "Zorientowany brzeg (granicę) rozmaitości $\\Omega$.",
        "Wektor gradientu pola grawitacyjnego.",
        "Zbiór punktów skupienia w nieskończoności."
      ],
      correct: 1,
      explanation: "Symbol $\\partial \\Omega$ to zorientowany brzeg rozmaitości $\\Omega$ (np. końce przedziału w 1D, zamknięta krzywa w 2D, czy zamknięta powierzchnia w 3D)."
    }
  ];

  let score = 0;
  const answered = new Set();

  container.innerHTML = "";

  questions.forEach((qObj, qIdx) => {
    const qCard = document.createElement("div");
    qCard.className = "p-5 bg-white border border-slate-200 rounded-xl space-y-3";

    const title = document.createElement("div");
    title.className = "font-bold text-slate-900 text-sm";
    title.innerHTML = qObj.q;
    qCard.appendChild(title);

    const optList = document.createElement("div");
    optList.className = "grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1";

    qObj.options.forEach((optText, optIdx) => {
      const optBtn = document.createElement("button");
      optBtn.id = `q_${qIdx}_opt_${optIdx}`;
      optBtn.className = "quiz-option text-left p-3 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white hover:bg-slate-50 transition";
      optBtn.innerHTML = optText;

      optBtn.addEventListener("click", () => {
        if (answered.has(qIdx)) return;
        answered.add(qIdx);

        const expDiv = document.getElementById(`q_${qIdx}_exp`);
        if (optIdx === qObj.correct) {
          optBtn.classList.add("correct");
          score++;
        } else {
          optBtn.classList.add("incorrect");
          const correctBtn = document.getElementById(`q_${qIdx}_opt_${qObj.correct}`);
          if (correctBtn) correctBtn.classList.add("correct");
        }

        // Disable all buttons in this question
        qObj.options.forEach((_, idx) => {
          const b = document.getElementById(`q_${qIdx}_opt_${idx}`);
          if (b) b.classList.add("disabled");
        });

        if (expDiv) expDiv.classList.remove("hidden");
        scoreText.textContent = `${score} / ${questions.length}`;
      });

      optList.appendChild(optBtn);
    });

    qCard.appendChild(optList);

    // Wyjaśnienie
    const expDiv = document.createElement("div");
    expDiv.id = `q_${qIdx}_exp`;
    expDiv.className = "hidden p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed";
    expDiv.innerHTML = `<strong>Wyjaśnienie:</strong> ${qObj.explanation}`;
    qCard.appendChild(expDiv);

    container.appendChild(qCard);
  });
}

/* ==========================================================================
   MODUŁ 8: KOPIOWANIE KODU DO SCHOWKA
   ========================================================================== */
function initCodeCopyButton() {
  const btn = document.getElementById("btnCopyCode");
  const snippet = document.getElementById("pythonCodeSnippet");
  if (!btn || !snippet) return;

  btn.addEventListener("click", () => {
    navigator.clipboard.writeText(snippet.innerText).then(() => {
      const originalText = btn.innerHTML;
      btn.innerHTML = "<span>✅</span> Skopiowano!";
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }).catch(err => {
      console.error("Błąd kopiowania:", err);
    });
  });
}
