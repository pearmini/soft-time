import * as d3 from "d3";
import { render } from "./render.js";

const size = 300;
const count = 5;
const values = (count, start = 0, end = 1) =>
  d3.range(count).map((i) => start + ((end - start) * i) / (count - 1));
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
  { tz: "UTC", name: "UTC" },
  { tz: "GMT", name: "GMT" },
  { tz: "America/New_York", name: "EST" },
  { tz: "America/Los_Angeles", name: "PST" },
  { tz: "Europe/Paris", name: "CET" },
  { tz: "Asia/Shanghai", name: "CST" },
];

const darkColors = ["ylorrd", "inferno", "viridis", "cubehelix", "pubugn", "rurd"];
const lightColors = ["orrd", "viridis", "ylg", "ylgnbu", "pubugn", "rdpu"];

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
  timezones.forEach(({ tz, name }, i) => {
    const colors = palettes[colorKeys[i]];
    const node = render({
      size,
      seed: Math.random() * 1000,
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
      <label><input type="checkbox" name="time" ${showTimeInitial ? "checked" : ""} ${ipadMode ? "disabled" : ""} /> Show time</label>
    </fieldset>
  `;

  sidebarInner.appendChild(sidebarTitle);
  sidebarInner.appendChild(controls);
  sidebar.appendChild(sidebarInner);

  const clocks = document.createElement("div");
  clocks.className = "clocks" + (ipadMode ? " clocks--ipad" : "");

  const schemeBtnGroup = document.createElement("div");
  schemeBtnGroup.className = "scheme-btn-group";
  const schemes = ["Gradient", "Solid", "None"];
  schemes.forEach((value) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "scheme-btn";
    btn.dataset.scheme = value;
    btn.textContent = value;
    schemeBtnGroup.appendChild(btn);
  });

  const themeBtn = document.createElement("button");
  themeBtn.className = "theme-btn";
  themeBtn.type = "button";
  themeBtn.setAttribute("aria-label", "Toggle dark/light mode");
  themeBtn.innerHTML = `
    <svg class="theme-btn__icon theme-btn__icon--sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
    <svg class="theme-btn__icon theme-btn__icon--moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  `;

  const controlsColumn = document.createElement("div");
  controlsColumn.className = "controls-column" + (ipadMode ? " controls-column--visible" : "");
  controlsColumn.appendChild(schemeBtnGroup);
  controlsColumn.appendChild(themeBtn);

  const clocksRow = document.createElement("div");
  clocksRow.className = "clocks-row";
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

  function updateThemeBtnIcon() {
    themeBtn.classList.toggle("theme-btn--light", lightMode);
    themeBtn.setAttribute("aria-label", lightMode ? "Switch to dark mode" : "Switch to light mode");
  }

  function updateSchemeButtons() {
    schemeBtnGroup.querySelectorAll(".scheme-btn").forEach((btn) => {
      btn.classList.toggle("scheme-btn--active", btn.dataset.scheme === scheme);
    });
  }

  schemeBtnGroup.querySelectorAll(".scheme-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      scheme = btn.dataset.scheme;
      controls.querySelector(`input[name="scheme"][value="${scheme}"]`).checked = true;
      updateSchemeButtons();
      renderClocks(scheme, showTime, blur);
    });
  });

  themeBtn.addEventListener("click", () => {
    lightMode = !lightMode;
    document.documentElement.classList.toggle("light", lightMode);
    document.body.classList.toggle("light", lightMode);
    controls.querySelector(`input[name="theme"][value="${lightMode ? "Light" : "Dark"}"]`).checked = true;
    updateThemeBtnIcon();
    renderClocks(scheme, showTime, blur);
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
      updateThemeBtnIcon();
      renderClocks(scheme, showTime, blur);
    });
  });

  updateThemeBtnIcon();
  updateSchemeButtons();
  renderClocks(scheme, showTime, blur);
}

buildControls();
