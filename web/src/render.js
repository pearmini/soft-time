import * as cm from "charmingjs";
import * as d3 from "d3";

function isDarkTheme(background) {
  const lowerColor = background.toLowerCase().trim();
  return lowerColor === "black" || lowerColor === "#000" || lowerColor === "#000000";
}

function createCircles({r, count, seed}) {
  const random = d3.randomUniform.source(d3.randomLcg(seed * 1000))();
  const randomUniform = (min, max) => random() * (max - min) + min;
  const circles = [];
  let d = 0;
  for (let i = 0; i < count; i++) {
    circles.push({d, r});
    d = randomUniform(0.1, 0.2) * r;
    const maxR = r - d;
    r = randomUniform(0.8, 0.9) * maxR;
  }
  return circles;
}

export function render({
  size = 400,
  seed = 100,
  colors = [],
  blur = 2,
  background = "white",
  timezone = "UTC",
  timezoneName = "UTC",
  showTime = true,
  scheme = "Gradient",
} = {}) {
  const ctx = cm.context2d({width: size, height: size});
  const canvas = ctx.canvas;

  // Determine text colors based on background
  const isDark = isDarkTheme(background);
  const textColor = isDark ? "#fff" : "#333";
  const secondaryTextColor = isDark ? "#ccc" : "#666";
  const strokeColor = isDark ? "#fff" : "#000";

  // Create container div
  const container = document.createElement("div");
  container.style.display = "inline-block";
  container.style.textAlign = "center";
  container.style.margin = "10px";

  // Create timezone name element
  const timezoneNameEl = document.createElement("div");
  timezoneNameEl.style.fontWeight = "bold";
  timezoneNameEl.style.fontSize = "12px";
  timezoneNameEl.style.color = textColor;
  timezoneNameEl.style.marginTop = "4px";
  timezoneNameEl.style.fontFamily = "monospace";
  timezoneNameEl.textContent = timezoneName;
  timezoneNameEl.style.display = showTime ? "block" : "none";

  // Create time element
  const timeEl = document.createElement("div");
  timeEl.style.fontFamily = "monospace";
  timeEl.style.fontSize = "10px";
  timeEl.style.color = secondaryTextColor;
  timeEl.style.marginTop = "2px";
  timeEl.style.display = showTime ? "block" : "none";

  container.appendChild(canvas);
  container.appendChild(timezoneNameEl);
  container.appendChild(timeEl);

  const r1 = (size / 2) * 0.8;
  const circles = createCircles({r: r1, count: 5, seed});
  const startAngle = -Math.PI / 2;

  function getTimeInTimezone(timezone) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hours = parseInt(parts.find((p) => p.type === "hour").value);
    const minutes = parseInt(parts.find((p) => p.type === "minute").value);
    const seconds = parseInt(parts.find((p) => p.type === "second").value);
    // Milliseconds are universal, not timezone-dependent
    const milliseconds = now.getMilliseconds();

    return {hours, minutes, seconds, milliseconds};
  }

  function update() {
    const timeData = getTimeInTimezone(timezone);
    const milliseconds = timeData.milliseconds;
    const seconds = timeData.seconds;
    const minutes = timeData.minutes;
    const hours = timeData.hours % 12;
    const millisecondsAngle = (milliseconds / 1000) * 2 * Math.PI;
    const secondsAngle = ((seconds * 1000 + milliseconds) / 60000) * 2 * Math.PI;
    const minutesAngle = (minutes / 60) * 2 * Math.PI;
    const hoursAngle = (hours / 12) * 2 * Math.PI;
    const angles = [0, hoursAngle, minutesAngle, secondsAngle, millisecondsAngle];

    // Clear canvas
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);

    // Update time display visibility
    timezoneNameEl.style.display = showTime ? "block" : "none";
    timeEl.style.display = showTime ? "block" : "none";

    // Draw circles based on scheme
    let cx = size / 2;
    let cy = size / 2;

    const pos = circles.map((circle, i) => {
      const angle = angles[i];
      cx += circle.d * Math.cos(startAngle + angle);
      cy += circle.d * Math.sin(startAngle + angle);
      return {cx, cy};
    });

    if (scheme === "None") {
      // Draw strokes with color based on background
      ctx.filter = "none";
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        const {cx, cy} = pos[i];
        ctx.beginPath();
        ctx.arc(cx, cy, circle.r, 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else if (scheme === "Solid") {
      // Solid colors without blur and gradient
      ctx.filter = "none";
      for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        const color = colors[i];
        const {cx, cy} = pos[i];
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(cx, cy, circle.r, 0, 2 * Math.PI);
        ctx.fill();
      }
    } else {
      // Gradient (default) - with blur and gradient
      ctx.filter = `blur(${blur}px)`;
      let prevColor = background;
      for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        const color = colors[i];
        const {cx, cy} = pos[i];
        const {cx: nextCx, cy: nextCy} = pos[i + 1] ? pos[i + 1] : {cx, cy};
        const nextR = circles[i + 1] ? circles[i + 1].r : 0;

        const gradient = ctx.createRadialGradient(nextCx, nextCy, nextR, cx, cy, circle.r);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, prevColor);
        prevColor = color;

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(cx, cy, circle.r, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.filter = "none";
    }

    // Update HTML time display
    if (showTime) {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      timeEl.textContent = timeString;
    }
  }

  const interval = d3.interval(update);
  update(); // Initial render

  const node = container;

  node.cleanup = () => {
    interval.stop();
  };

  return node;
}
