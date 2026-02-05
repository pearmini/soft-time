import * as d3 from "d3";
import {render} from "./render.js";

const size = 300;
const count = 5;
const values = (count, start = 0, end = 1) => d3.range(count).map((i) => start + ((end - start) * i) / (count - 1));
const reverse = (fn) => (t) => fn(1 - t);

let lightMode = false;
const isLight = () => lightMode;

const darkPalettes = {
  inferno: values(count, 0.3, 1).map(d3.interpolateInferno),
  viridis: values(count, 0.1, 1).map(d3.interpolateViridis),
  cubehelix: values(count, 0.25, 0.8).map(d3.interpolateCubehelixDefault),
  rurd: values(count, 0.2, 1).map(reverse(d3.interpolatePuRd)),
  pubugn: values(count, 0.1, 1).map(d3.interpolatePlasma),
  ylorrd: values(count, 0, 1).map(reverse(d3.interpolateYlOrRd)),
  // Custom palettes
  utc: ["#4033CC", "#CB20D7", "#FC460F", "#F4D92B", "#FFFAA5"],
  cet: ["#AB1170", "#E066AD", "#DAADEA", "#C7D7B7", "#EDFFF5"],
  cst: ["#526EA0", "#AB99BE", "#CCA4D2", "#ACCFF3", "#ADFEF3"],
};

const lightPalettes = {
  orrd: values(count, 0.3, 1).map(d3.interpolateOrRd),
  viridis: values(count).map(reverse(d3.interpolateViridis)),
  ylg: values(count, 0.3, 1).map(d3.interpolateYlGn),
  ylgnbu: values(count, 0.2, 1).map(d3.interpolateYlGnBu),
  pubugn: values(count, 0.3, 1).map(d3.interpolatePuBuGn),
  rdpu: values(count, 0.3, 1).map(d3.interpolateRdPu),
  // Custom palettes
  utc: ["#F6C78E", "#FF8861", "#CE6A85", "#985277", "#4C648A"],
  est: ["#D7D68E", "#A3B680", "#7C8157", "#C36872", "#A14B50"],
  cst: ["#F6DDEA", "#D7B9D5", "#ADA7C9", "#90A8C3", "#51A3BF"],
};

const timezones = [
  {tz: "UTC", name: "UTC"},
  {tz: "GMT", name: "GMT"},
  {tz: "America/New_York", name: "EST"},
  {tz: "America/Los_Angeles", name: "PST"},
  {tz: "Europe/Paris", name: "CET"},
  {tz: "Asia/Shanghai", name: "CST"},
];

const darkColors = ["utc", "inferno", "viridis", "cubehelix", "cet", "cst"];
const lightColors = ["utc", "viridis", "est", "ylgnbu", "pubugn", "cst"];

// Generate seeds once per page load; reused when controls change
const seeds = timezones.map(() => Math.random() * 1000);

let clockNodes = [];

function getPalettes() {
  return isLight() ? lightPalettes : darkPalettes;
}

function getColorKeys() {
  return isLight() ? lightColors : darkColors;
}

function getBackground() {
  return isLight() ? "#fafafa" : "black";
}

function renderClocks(scheme, showTime, blur = 2) {
  clockNodes.forEach((node) => {
    if (node.cleanup) node.cleanup();
    node.remove();
  });
  clockNodes = [];

  const palettes = getPalettes();
  const colorKeys = getColorKeys();
  const background = getBackground();

  const container = document.querySelector(".clocks");
  timezones.forEach(({tz, name}, i) => {
    const colors = palettes[colorKeys[i]];
    const node = render({
      size,
      seed: seeds[i],
      count,
      colors,
      timezone: tz,
      timezoneName: name,
      showTime,
      scheme,
      background,
      blur,
    });
    container.appendChild(node);
    clockNodes.push(node);
  });
}

function buildControls() {
  const app = document.getElementById("app");
  document.documentElement.classList.toggle("light", isLight());
  document.body.classList.toggle("light", isLight());

  const menuBtn = document.createElement("button");
  menuBtn.className = "menu-btn";
  menuBtn.type = "button";
  menuBtn.setAttribute("aria-label", "Open menu");
  menuBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  `;

  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";

  const sidebarInner = document.createElement("div");
  sidebarInner.className = "sidebar__inner";

  const sidebarTitle = document.createElement("h2");
  sidebarTitle.className = "sidebar__title";
  sidebarTitle.textContent = "Soft Time";

  const controls = document.createElement("div");
  controls.className = "controls";

  const urlParams = new URLSearchParams(window.location.search);
  const ipadMode = urlParams.get("ipad") === "true";
  const showTimeInitial = ipadMode ? false : urlParams.get("time") !== "false";

  controls.innerHTML = `
    <div class="control-row" role="group" aria-labelledby="scheme-legend">
      <span id="scheme-legend" class="control-legend">Fill</span>
      <label><input type="radio" name="scheme" value="Gradient" checked /> Gradient</label>
      <label><input type="radio" name="scheme" value="Solid" /> Solid</label>
      <label><input type="radio" name="scheme" value="None" /> None</label>
    </div>
    <div class="control-row" role="group" aria-labelledby="theme-legend">
      <span id="theme-legend" class="control-legend">Theme</span>
      <label><input type="radio" name="theme" value="Dark" ${!isLight() ? "checked" : ""} /> Dark</label>
      <label><input type="radio" name="theme" value="Light" ${isLight() ? "checked" : ""} /> Light</label>
    </div>
    <div class="control-row" role="group" aria-labelledby="time-legend">
      <span id="time-legend" class="control-legend">Display Time</span>
      <label><input type="checkbox" name="time" ${showTimeInitial ? "checked" : ""} ${
    ipadMode ? "disabled" : ""
  } /></label>
    </div>
  `;

  const sidebarCloseBtn = document.createElement("button");
  sidebarCloseBtn.className = "sidebar-close-btn";
  sidebarCloseBtn.type = "button";
  sidebarCloseBtn.setAttribute("aria-label", "Close menu");
  sidebarCloseBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;

  const sidebarHeader = document.createElement("div");
  sidebarHeader.className = "sidebar__header";
  sidebarHeader.appendChild(sidebarTitle);
  sidebarHeader.appendChild(sidebarCloseBtn);

  const sidebarDescription = document.createElement("div");
  sidebarDescription.className = "sidebar__description";
  sidebarDescription.innerHTML = `
    <p><em>Soft Time</em> presents six custom-designed, time zone–specific clock faces (UTC, GMT, EST, PST, CET, and CST) displayed together. These six time zones span key longitudinal zones and represent major cultural and economic centers, conveying a sense of global temporal flow. Each clock face is composed of moving gradient circles that shift continuously, allowing multiple time zones to be experienced simultaneously.</p>
    <p>The design is intended for integration into a physical digital watch, with the current presentation focusing on the on-screen experience. Rather than representing time directly, the constantly changing colors create a more sensual sense of temporal flow, inviting viewers to experience time as something fluid, playful, and continuously unfolding.</p>
    <hr class="sidebar__divider" />
    <h3 class="sidebar__section-title">About the Creators</h3>
    <p><strong>Bairui Su</strong> is a creative toolmaker interested in creative coding, data visualization and interactive systems. His work tries to make coding more accessible and playful.</p>
    <p><strong>Julia Xu</strong> works with motion, material, and the digital. Her work creates spaces where time and attention drift, revealing quiet connections and the subtle rhythms of shared experience.</p>
  `;

  sidebarInner.appendChild(sidebarHeader);
  sidebarInner.appendChild(controls);
  sidebarInner.appendChild(sidebarDescription);
  sidebar.appendChild(sidebarInner);

  const clocks = document.createElement("div");
  clocks.className = "clocks" + (ipadMode ? " clocks--ipad" : "");

  const schemeBtnGroup = document.createElement("div");
  schemeBtnGroup.className = "scheme-btn-group";
  schemeBtnGroup.setAttribute("role", "radiogroup");
  schemeBtnGroup.setAttribute("aria-label", "Fill type");
  const schemes = [
    {
      value: "Gradient",
      icon: `<svg class="scheme-btn__icon scheme-btn__icon--gradient" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="6" opacity="0.3"/><circle cx="12" cy="12" r="4" opacity="0.6"/><circle cx="12" cy="12" r="8"/></svg>`,
    },
    {
      value: "Solid",
      icon: `<svg class="scheme-btn__icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="currentColor" stroke="currentColor"/></svg>`,
    },
    {
      value: "None",
      icon: `<svg class="scheme-btn__icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/></svg>`,
    },
  ];
  schemes.forEach(({value, icon}) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "scheme-btn";
    btn.dataset.scheme = value;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.innerHTML = `
      <span class="scheme-btn__icon-wrap">${icon}</span>
      <span class="scheme-btn__label">${value}</span>
    `;
    schemeBtnGroup.appendChild(btn);
  });

  const themeBtnGroup = document.createElement("div");
  themeBtnGroup.className = "theme-btn-group";
  themeBtnGroup.setAttribute("role", "radiogroup");
  themeBtnGroup.setAttribute("aria-label", "Color theme");
  const themes = [
    {
      value: "Dark",
      icon: `<svg class="theme-btn__icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    },
    {
      value: "Light",
      icon: `<svg class="theme-btn__icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    },
  ];
  themes.forEach(({value, icon}) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-btn";
    btn.dataset.theme = value;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.innerHTML = `
      <span class="theme-btn__icon-wrap">${icon}</span>
      <span class="theme-btn__label">${value}</span>
    `;
    themeBtnGroup.appendChild(btn);
  });

  const controlsColumn = document.createElement("div");
  controlsColumn.className = "controls-column" + (ipadMode ? " controls-column--visible" : "");
  controlsColumn.appendChild(schemeBtnGroup);
  controlsColumn.appendChild(themeBtnGroup);

  const clocksRow = document.createElement("div");
  clocksRow.className = "clocks-row";
  if (ipadMode) {
    clocksRow.style.marginBottom = "100px";
  }
  clocksRow.appendChild(clocks);
  clocksRow.appendChild(controlsColumn);

  const topBar = document.createElement("div");
  topBar.className = "top-bar";
  topBar.appendChild(menuBtn);
  if (ipadMode) menuBtn.classList.add("menu-btn--hidden");

  app.appendChild(topBar);
  app.appendChild(clocksRow);

  const sidebarOverlay = document.createElement("div");
  sidebarOverlay.className = "sidebar-overlay";
  sidebarOverlay.setAttribute("aria-hidden", "true");

  const layout = document.createElement("div");
  layout.className = "layout";
  layout.appendChild(sidebarOverlay);
  layout.appendChild(app);
  layout.appendChild(sidebar);
  document.body.appendChild(layout);

  function closeSidebar() {
    sidebar.classList.remove("sidebar--open");
    layout.classList.remove("layout--sidebar-open");
    sidebarOverlay.classList.remove("sidebar-overlay--visible");
    sidebarOverlay.setAttribute("aria-hidden", "true");
  }

  menuBtn.addEventListener("click", () => {
    sidebar.classList.add("sidebar--open");
    layout.classList.add("layout--sidebar-open");
    sidebarOverlay.classList.add("sidebar-overlay--visible");
    sidebarOverlay.setAttribute("aria-hidden", "false");
  });

  sidebarCloseBtn.addEventListener("click", closeSidebar);

  sidebarOverlay.addEventListener("click", () => {
    if (sidebar.classList.contains("sidebar--open")) {
      closeSidebar();
    }
  });

  let scheme = "Gradient";
  let showTime = showTimeInitial;
  const blur = 2;

  function updateThemeButtons() {
    themeBtnGroup.querySelectorAll(".theme-btn").forEach((btn) => {
      const isActive = btn.dataset.theme === (lightMode ? "Light" : "Dark");
      btn.classList.toggle("theme-btn--active", isActive);
      btn.setAttribute("aria-checked", isActive ? "true" : "false");
    });
  }

  function updateSchemeButtons() {
    schemeBtnGroup.querySelectorAll(".scheme-btn").forEach((btn) => {
      const isActive = btn.dataset.scheme === scheme;
      btn.classList.toggle("scheme-btn--active", isActive);
      btn.setAttribute("aria-checked", isActive ? "true" : "false");
    });
  }

  const schemeBtns = schemeBtnGroup.querySelectorAll(".scheme-btn");
  schemeBtns.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      scheme = btn.dataset.scheme;
      controls.querySelector(`input[name="scheme"][value="${scheme}"]`).checked = true;
      updateSchemeButtons();
      renderClocks(scheme, showTime, blur);
    });
    btn.addEventListener("keydown", (e) => {
      let nextIndex = index;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = Math.min(index + 1, schemeBtns.length - 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = Math.max(index - 1, 0);
      }
      if (nextIndex !== index) {
        const nextBtn = schemeBtns[nextIndex];
        scheme = nextBtn.dataset.scheme;
        controls.querySelector(`input[name="scheme"][value="${scheme}"]`).checked = true;
        updateSchemeButtons();
        renderClocks(scheme, showTime, blur);
        nextBtn.focus();
      }
    });
  });

  const themeBtns = themeBtnGroup.querySelectorAll(".theme-btn");
  themeBtns.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      lightMode = btn.dataset.theme === "Light";
      document.documentElement.classList.toggle("light", lightMode);
      document.body.classList.toggle("light", lightMode);
      controls.querySelector(`input[name="theme"][value="${lightMode ? "Light" : "Dark"}"]`).checked = true;
      updateThemeButtons();
      renderClocks(scheme, showTime, blur);
    });
    btn.addEventListener("keydown", (e) => {
      let nextIndex = index;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = Math.min(index + 1, themeBtns.length - 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = Math.max(index - 1, 0);
      }
      if (nextIndex !== index) {
        const nextBtn = themeBtns[nextIndex];
        lightMode = nextBtn.dataset.theme === "Light";
        document.documentElement.classList.toggle("light", lightMode);
        document.body.classList.toggle("light", lightMode);
        controls.querySelector(`input[name="theme"][value="${lightMode ? "Light" : "Dark"}"]`).checked = true;
        updateThemeButtons();
        renderClocks(scheme, showTime, blur);
        nextBtn.focus();
      }
    });
  });

  controls.querySelectorAll('input[name="scheme"]').forEach((input) => {
    input.addEventListener("change", () => {
      scheme = input.value;
      updateSchemeButtons();
      renderClocks(scheme, showTime, blur);
    });
  });

  controls.querySelector('input[name="time"]').addEventListener("change", (e) => {
    showTime = e.target.checked;
    renderClocks(scheme, showTime, blur);
  });

  controls.querySelectorAll('input[name="theme"]').forEach((input) => {
    input.addEventListener("change", () => {
      lightMode = input.value === "Light";
      document.documentElement.classList.toggle("light", lightMode);
      document.body.classList.toggle("light", lightMode);
      updateThemeButtons();
      renderClocks(scheme, showTime, blur);
    });
  });

  updateThemeButtons();
  updateSchemeButtons();
  renderClocks(scheme, showTime, blur);
}

buildControls();

// Auto-refresh at midnight
(function () {
  let lastDate = new Date().getDate();

  function checkMidnight() {
    const currentDate = new Date().getDate();
    if (currentDate !== lastDate) {
      window.location.reload();
    }
    requestAnimationFrame(checkMidnight);
  }

  requestAnimationFrame(checkMidnight);
})();
