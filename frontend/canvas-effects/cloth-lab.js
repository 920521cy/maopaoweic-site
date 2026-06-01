(function () {
  "use strict";

  /**
   * Lightweight Canvas 2D cloth field.
   * It avoids heavy dependencies and keeps all runtime state inside the class.
   */
  class ClothLabEffect {
    constructor(root, options = {}) {
      this.root = root;
      this.canvas = root?.querySelector("[data-cloth-canvas]");
      this.ctx = this.canvas?.getContext("2d", { alpha: true });
      this.options = options;
      this.controls = {};
      this.values = {
        wind: 0.55,
        turbulence: 0.42,
        stiffness: 0.62,
        speed: 0.58
      };
      this.points = [];
      this.noise = [];
      this.pointer = { x: 0, y: 0, active: false, strength: 0 };
      this.frame = 0;
      this.time = 0;
      this.flowOffset = 0;
      this.lastTime = 0;
      this.pixelRatio = 1;
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.isMobile = window.matchMedia("(max-width: 720px)").matches;

      if (!this.root || !this.canvas || !this.ctx) {
        return;
      }

      this.bindControls();
      this.bindPointer();
      this.resize();
      this.animate = this.animate.bind(this);
      this.onResize = this.onResize.bind(this);
      window.addEventListener("resize", this.onResize, { passive: true });
      this.frame = window.requestAnimationFrame(this.animate);
    }

    /**
     * Connect sliders to live simulation values and visible output numbers.
     */
    bindControls() {
      this.root.querySelectorAll("[data-cloth-control]").forEach((input) => {
        const key = input.dataset.clothControl;
        const output = this.root.querySelector(`[data-cloth-value="${key}"]`);

        this.controls[key] = { input, output };
        this.values[key] = Number(input.value) / 100;

        input.addEventListener("input", () => {
          const value = Number(input.value);
          this.values[key] = value / 100;

          if (output) {
            output.textContent = String(value);
          }
        });
      });
    }

    /**
     * Pointer movement creates a local ripple, but degrades safely on touch.
     */
    bindPointer() {
      const updatePointer = (event) => {
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.x = (event.clientX - rect.left) * this.pixelRatio;
        this.pointer.y = (event.clientY - rect.top) * this.pixelRatio;
        this.pointer.active = true;
        this.pointer.strength = 1;
      };

      this.canvas.addEventListener("pointermove", updatePointer, { passive: true });
      this.canvas.addEventListener("pointerenter", updatePointer, { passive: true });
      this.canvas.addEventListener("pointerleave", () => {
        this.pointer.active = false;
      });
    }

    /**
     * Rebuild the cloth grid when the canvas size or viewport class changes.
     */
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width || this.canvas.width));
      const height = Math.max(260, Math.floor(rect.height || this.canvas.height));

      this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.25 : 1.6);
      this.canvas.width = Math.floor(width * this.pixelRatio);
      this.canvas.height = Math.floor(height * this.pixelRatio);
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.isMobile = window.matchMedia("(max-width: 720px)").matches;

      const columns = this.reducedMotion ? 20 : this.isMobile ? 24 : 38;
      const rows = this.reducedMotion ? 13 : this.isMobile ? 16 : 24;
      const padX = this.width * 0.09;
      const padY = this.height * 0.13;
      const usableW = this.width - padX * 2;
      const usableH = this.height - padY * 2;

      this.points = [];

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < columns; col += 1) {
          const u = col / (columns - 1);
          const v = row / (rows - 1);
          const baseX = padX + usableW * u;
          const baseY = padY + usableH * v;

          this.points.push({
            row,
            col,
            u,
            v,
            baseX,
            baseY,
            x: baseX,
            y: baseY,
            vx: 0,
            vy: 0
          });
        }
      }

      this.columns = columns;
      this.rows = rows;
      this.noise = Array.from({ length: this.isMobile ? 28 : 54 }, () => ({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: Math.random() * 1.6 + 0.4,
        a: Math.random() * 0.22 + 0.05
      }));
    }

    onResize() {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.resize(), 120);
    }

    /**
     * Apply spring motion toward a moving wind target.
     */
    simulate(delta) {
      const speed = this.reducedMotion ? 0.28 : this.values.speed;
      const wind = this.values.wind * (this.isMobile ? 0.64 : 1);
      const turbulence = this.values.turbulence * (this.isMobile ? 0.58 : 1);
      const stiffness = 0.035 + this.values.stiffness * 0.115;
      const damping = this.reducedMotion ? 0.86 : 0.9;

      this.time += delta * (0.00038 + speed * 0.00115);
      this.flowOffset += delta * (0.00008 + speed * 0.00018);
      this.pointer.strength *= 0.92;

      this.points.forEach((point) => {
        const phase = this.time * 4.2 + point.u * 5.8 + point.v * 3.6;
        const crossPhase = this.time * 2.7 + point.v * 7.2;
        const edgeFalloff = Math.sin(point.u * Math.PI);
        const targetX = point.baseX + Math.sin(crossPhase) * wind * 30 * edgeFalloff;
        const targetY = point.baseY
          + Math.sin(phase) * turbulence * 24
          + Math.cos(this.time * 3.4 + point.u * 8) * wind * 8;

        let forceX = (targetX - point.x) * stiffness;
        let forceY = (targetY - point.y) * stiffness;

        if (this.pointer.strength > 0.02) {
          const dx = point.x - this.pointer.x;
          const dy = point.y - this.pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = this.width * (this.isMobile ? 0.18 : 0.14);

          if (dist < radius && dist > 0.001) {
            const push = (1 - dist / radius) * this.pointer.strength * 8;
            forceX += (dx / dist) * push;
            forceY += (dy / dist) * push;
          }
        }

        point.vx = (point.vx + forceX) * damping;
        point.vy = (point.vy + forceY) * damping;
        point.x += point.vx;
        point.y += point.vy;
      });
    }

    /**
     * Draw a restrained luminous mesh with subtle noise and edge glow.
     */
    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      const bg = ctx.createLinearGradient(0, 0, this.width, this.height);
      bg.addColorStop(0, "rgba(5, 10, 20, 0.98)");
      bg.addColorStop(0.52, "rgba(7, 18, 34, 0.94)");
      bg.addColorStop(1, "rgba(3, 6, 12, 0.98)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, this.width, this.height);

      this.drawAmbientGlow();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      this.drawRows("rgba(54, 226, 255, 0.32)", 1.1);
      this.drawColumns("rgba(183, 156, 255, 0.2)", 0.9);
      this.drawEdges();
      ctx.restore();

      this.drawNoise();
    }

    /**
     * Very light breathing glow under the mesh; one gradient, low cost.
     */
    drawAmbientGlow() {
      const ctx = this.ctx;
      const pulse = 0.52 + Math.sin(this.time * 1.8) * 0.12;
      const glow = ctx.createRadialGradient(
        this.width * 0.52,
        this.height * 0.48,
        0,
        this.width * 0.52,
        this.height * 0.48,
        this.width * 0.56
      );

      glow.addColorStop(0, `rgba(54, 226, 255, ${0.1 * pulse})`);
      glow.addColorStop(0.46, `rgba(183, 156, 255, ${0.06 * pulse})`);
      glow.addColorStop(1, "rgba(3, 6, 12, 0)");

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    drawRows(color, width) {
      const ctx = this.ctx;
      ctx.strokeStyle = color;
      ctx.lineWidth = width * this.pixelRatio;

      for (let row = 0; row < this.rows; row += 1) {
        ctx.beginPath();

        for (let col = 0; col < this.columns; col += 1) {
          const point = this.points[row * this.columns + col];

          if (col === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }

        ctx.stroke();
      }
    }

    drawColumns(color, width) {
      const ctx = this.ctx;
      ctx.strokeStyle = color;
      ctx.lineWidth = width * this.pixelRatio;

      for (let col = 0; col < this.columns; col += 1) {
        ctx.beginPath();

        for (let row = 0; row < this.rows; row += 1) {
          const point = this.points[row * this.columns + col];

          if (row === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }

        ctx.stroke();
      }
    }

    drawEdges() {
      const ctx = this.ctx;
      const gradient = ctx.createLinearGradient(0, 0, this.width, 0);
      gradient.addColorStop(0, "rgba(54, 226, 255, 0.05)");
      gradient.addColorStop(0.5, "rgba(141, 255, 176, 0.55)");
      gradient.addColorStop(1, "rgba(183, 156, 255, 0.12)");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.2 * this.pixelRatio;
      ctx.shadowColor = "rgba(54, 226, 255, 0.55)";
      ctx.shadowBlur = 18 * this.pixelRatio;
      this.drawRows(gradient, 1.6);
      this.drawFlowLine();
      ctx.shadowBlur = 0;
    }

    /**
     * A single moving edge highlight gives the cloth a controlled optical flow.
     */
    drawFlowLine() {
      const ctx = this.ctx;
      const row = Math.max(1, Math.min(this.rows - 2, Math.floor(this.rows * (0.36 + Math.sin(this.flowOffset * 3) * 0.12))));
      const highlight = ctx.createLinearGradient(0, 0, this.width, 0);
      highlight.addColorStop(0, "rgba(54, 226, 255, 0)");
      highlight.addColorStop(0.48, "rgba(141, 255, 176, 0.46)");
      highlight.addColorStop(1, "rgba(183, 156, 255, 0)");

      ctx.strokeStyle = highlight;
      ctx.lineWidth = 1.8 * this.pixelRatio;
      ctx.beginPath();

      for (let col = 0; col < this.columns; col += 1) {
        const point = this.points[row * this.columns + col];
        const y = point.y + Math.sin(this.flowOffset * 12 + point.u * 8) * this.pixelRatio * 2;

        if (col === 0) {
          ctx.moveTo(point.x, y);
        } else {
          ctx.lineTo(point.x, y);
        }
      }

      ctx.stroke();
    }

    drawNoise() {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      this.noise.forEach((dot, index) => {
        const drift = Math.sin(this.time * 2 + index) * 3.5 * this.pixelRatio;
        ctx.fillStyle = `rgba(185, 246, 255, ${dot.a})`;
        ctx.beginPath();
        ctx.arc(dot.x + drift, dot.y, dot.r * this.pixelRatio, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    animate(now) {
      const delta = Math.min(48, now - (this.lastTime || now));
      this.lastTime = now;

      this.simulate(delta);
      this.render();
      this.frame = window.requestAnimationFrame(this.animate);
    }

    destroy() {
      window.cancelAnimationFrame(this.frame);
      window.removeEventListener("resize", this.onResize);
      window.clearTimeout(this.resizeTimer);
    }
  }

  window.ClothLabEffect = ClothLabEffect;
})();
