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
};

const lightPalettes = {
  orrd: values(count, 0.3, 1).map(d3.interpolateOrRd),
  viridis: values(count).map(reverse(d3.interpolateViridis)),
  ylg: values(count, 0.3, 1).map(d3.interpolateYlGn),
  ylgnbu: values(count, 0.2, 1).map(d3.interpolateYlGnBu),
  pubugn: values(count, 0.3, 1).map(d3.interpolatePuBuGn),
  rdpu: values(count, 0.3, 1).map(d3.interpolateRdPu),
};

const timezones = [
  {tz: "UTC", name: "UTC"},
  {tz: "GMT", name: "GMT"},
  {tz: "America/New_York", name: "EST"},
  {tz: "America/Los_Angeles", name: "PST"},
  {tz: "Europe/Paris", name: "CET"},
  {tz: "Asia/Shanghai", name: "CST"},
];

const darkColors = ["ylorrd", "inferno", "viridis", "cubehelix", "pubugn", "rurd"];
const lightColors = ["orrd", "viridis", "ylg", "ylgnbu", "pubugn", "rdpu"];

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

  const moreBtn = document.createElement("button");
  moreBtn.className = "more-btn";
  moreBtn.type = "button";
  moreBtn.setAttribute("aria-label", "Open menu");
  moreBtn.innerHTML = `
    <svg class="more-btn__icon more-btn__icon--menu" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
    <svg class="more-btn__icon more-btn__icon--close" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;

  const fullscreenBtn = document.createElement("button");
  fullscreenBtn.className = "fullscreen-btn";
  fullscreenBtn.type = "button";
  fullscreenBtn.setAttribute("aria-label", "Enter fullscreen");
  fullscreenBtn.innerHTML = `
    <svg class="fullscreen-btn__icon fullscreen-btn__icon--enter" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="15 3 21 3 21 9"></polyline>
      <polyline points="9 21 3 21 3 15"></polyline>
      <line x1="21" y1="3" x2="14" y2="10"></line>
      <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>
    <svg class="fullscreen-btn__icon fullscreen-btn__icon--exit" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="4 14 10 14 10 20"></polyline>
      <polyline points="20 10 14 10 14 4"></polyline>
      <line x1="14" y1="10" x2="21" y2="3"></line>
      <line x1="3" y1="21" x2="10" y2="14"></line>
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
    <fieldset>
      <legend>Fill Type</legend>
      <label><input type="radio" name="scheme" value="Gradient" checked /> Gradient</label>
      <label><input type="radio" name="scheme" value="Solid" /> Solid</label>
      <label><input type="radio" name="scheme" value="None" /> None</label>
    </fieldset>
    <fieldset>
      <legend>Color Theme</legend>
      <label><input type="radio" name="theme" value="Dark" ${!isLight() ? "checked" : ""} /> Dark</label>
      <label><input type="radio" name="theme" value="Light" ${isLight() ? "checked" : ""} /> Light</label>
    </fieldset>
    <fieldset>
      <legend>Display Time</legend>
      <label><input type="checkbox" name="time" ${showTimeInitial ? "checked" : ""} ${
    ipadMode ? "disabled" : ""
  } /> Show time</label>
    </fieldset>
  `;

  sidebarInner.appendChild(sidebarTitle);
  sidebarInner.appendChild(controls);
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
  topBar.appendChild(fullscreenBtn);
  topBar.appendChild(moreBtn);
  if (ipadMode) moreBtn.classList.add("more-btn--hidden");

  app.appendChild(topBar);
  app.appendChild(clocksRow);

  const layout = document.createElement("div");
  layout.className = "layout";
  layout.appendChild(app);
  layout.appendChild(sidebar);
  document.body.appendChild(layout);

  moreBtn.addEventListener("click", () => {
    const open = sidebar.classList.toggle("sidebar--open");
    moreBtn.classList.toggle("more-btn--open", open);
    moreBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  function updateFullscreenButton() {
    const isFullscreen = !!document.fullscreenElement;
    fullscreenBtn.classList.toggle("fullscreen-btn--active", isFullscreen);
    fullscreenBtn.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
  }

  fullscreenBtn.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (_) {}
  });

  document.addEventListener("fullscreenchange", updateFullscreenButton);
  updateFullscreenButton();

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
