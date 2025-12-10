import * as cm from "charmingjs";
import * as d3 from "d3";

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

export function render({size = 400, seed = 100, colors = [], blur = 5} = {}) {
  const ctx = cm.context2d({width: size, height: size});
  const r1 = (size / 2) * 0.8;
  const circles = createCircles({r: r1, count: 5, seed});
  const startAngle = -Math.PI / 2;

  function update() {
    const date = new Date();
    const milliseconds = date.getMilliseconds();
    const seconds = date.getSeconds();
    const minutes = date.getMinutes();
    const hours = date.getHours() % 12;
    const millisecondsAngle = (milliseconds / 1000) * 2 * Math.PI;
    const secondsAngle = ((seconds * 1000 + milliseconds) / 60000) * 2 * Math.PI;
    const minutesAngle = (minutes / 60) * 2 * Math.PI;
    const hoursAngle = (hours / 12) * 2 * Math.PI;
    const angles = [0, hoursAngle, minutesAngle, secondsAngle, millisecondsAngle];

    let prevColor = "white";
    ctx.fillStyle = prevColor;
    ctx.fillRect(0, 0, size, size);
    ctx.filter = `blur(${blur}px)`;

    let cx = size / 2;
    let cy = size / 2;

    const pos = circles.map((circle, i) => {
      const angle = angles[i];
      cx += circle.d * Math.cos(startAngle + angle);
      cy += circle.d * Math.sin(startAngle + angle);
      return {cx, cy};
    });

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

  const interval = d3.interval(update);

  const node = ctx.canvas;

  node.cleanup = () => {
    interval.stop();
  };

  return node;
}
