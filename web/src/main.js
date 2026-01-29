import * as d3 from "d3";
import { render } from "./render.js";

const size = 300;
const count = 5;
const values = (count, start = 0, end = 1) =>
  d3.range(count).map((i) => start + ((end - start) * i) / (count - 1));
const reverse = (fn) => (t) => fn(1 - t);

let lightMode = window.location.pathname === "/light";
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

function renderClocks(scheme, showTime) {
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
    });
    container.appendChild(node);
    clockNodes.push(node);
  });
}

function buildControls() {
  const app = document.getElementById("app");
  document.documentElement.classList.toggle("light", isLight());
  document.body.classList.toggle("light", isLight());

  const controls = document.createElement("div");
  controls.className = "controls";

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
      <label><input type="checkbox" name="time" checked /> Show time</label>
    </fieldset>
  `;

  const clocks = document.createElement("div");
  clocks.className = "clocks";

  app.appendChild(clocks);
  app.appendChild(controls);

  let scheme = "Gradient";
  let showTime = true;

  controls.querySelectorAll('input[name="scheme"]').forEach((input) => {
    input.addEventListener("change", () => {
      scheme = input.value;
      renderClocks(scheme, showTime);
    });
  });

  controls.querySelector('input[name="time"]').addEventListener("change", (e) => {
    showTime = e.target.checked;
    renderClocks(scheme, showTime);
  });

  controls.querySelectorAll('input[name="theme"]').forEach((input) => {
    input.addEventListener("change", () => {
      lightMode = input.value === "Light";
      document.documentElement.classList.toggle("light", lightMode);
      document.body.classList.toggle("light", lightMode);
      renderClocks(scheme, showTime);
    });
  });

  renderClocks(scheme, showTime);
}

buildControls();
