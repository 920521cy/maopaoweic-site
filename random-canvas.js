const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
let drawing = false;
let colorIndex = 0;
const colors = ["#ffdc3d", "#49c6ff", "#ff4f6d", "#98f06e", "#ffffff", "#ba7cff"];

function resize() {
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * scale);
  canvas.height = Math.floor(window.innerHeight * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = colors[colorIndex];
  ctx.lineWidth = 10;
}

function point(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function startStroke(event) {
  drawing = true;
  colorIndex = (colorIndex + 1) % colors.length;
  ctx.strokeStyle = colors[colorIndex];
  ctx.lineWidth = 7 + (colorIndex * 2);
  const p = point(event);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
}

function continueStroke(event) {
  if (!drawing) return;
  const p = point(event);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
}

function endStroke() {
  drawing = false;
}

function burst(event) {
  const p = point(event);
  colorIndex = (colorIndex + 1) % colors.length;
  ctx.strokeStyle = colors[colorIndex];
  ctx.lineWidth = 5 + (colorIndex * 2);
  for (let i = 0; i < 9; i += 1) {
    const angle = (Math.PI * 2 * i) / 9 + colorIndex * 0.4;
    const length = 24 + ((i + colorIndex) % 4) * 12;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(angle) * length, p.y + Math.sin(angle) * length);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(p.x, p.y, 8 + colorIndex, 0, Math.PI * 2);
  ctx.stroke();
}

function randomArtwork() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  for (let n = 0; n < 18; n += 1) {
    colorIndex = (colorIndex + 1) % colors.length;
    ctx.strokeStyle = colors[colorIndex];
    ctx.lineWidth = 5 + ((n + colorIndex) % 5) * 3;
    ctx.beginPath();
    const cx = width * (0.15 + ((n * 37) % 70) / 100);
    const cy = height * (0.18 + ((n * 29) % 68) / 100);
    ctx.moveTo(cx, cy);
    for (let i = 0; i < 28; i += 1) {
      const a = i * 0.7 + n * 0.43;
      const r = 18 + ((i * 11 + n * 7) % 75);
      ctx.lineTo(
        cx + Math.cos(a) * r + Math.sin(i + n) * 32,
        cy + Math.sin(a) * r * 0.75 + Math.cos(i * 0.8 + n) * 24
      );
    }
    ctx.stroke();
  }
}

resize();
window.addEventListener("resize", resize);
canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  startStroke(event);
});
canvas.addEventListener("pointermove", continueStroke);
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("mousedown", startStroke);
canvas.addEventListener("mousemove", continueStroke);
canvas.addEventListener("click", (event) => {
  burst(event);
  randomArtwork();
});
window.addEventListener("mouseup", endStroke);

window.setBrush = (color, width) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
};
window.randomArtwork = randomArtwork;
