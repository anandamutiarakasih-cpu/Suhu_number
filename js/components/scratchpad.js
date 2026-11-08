/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Digital Scratchpad Component (Kertas Cakar Digital)
 * Canvas whiteboard for solving calculation formulas on-screen
 */

export class Scratchpad {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.color = '#f59e0b';
    this.lineWidth = 3;
    this.history = [];
  }

  init(canvasElement) {
    if (!canvasElement) return;
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.resize();

    window.addEventListener('resize', () => this.resize());

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

    // Touch events for mobile/tablet screens
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    });
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    let imgData = null;
    if (this.canvas.width > 0 && this.canvas.height > 0) {
      try {
        imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      } catch (e) {}
    }

    this.canvas.width = rect.width;
    this.canvas.height = Math.max(rect.height, 260);

    if (imgData) {
      try {
        this.ctx.putImageData(imgData, 0, 0);
      } catch (e) {}
    }
  }

  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
    this.saveState();
  }

  draw(e) {
    if (!this.isDrawing) return;
    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(currentX, currentY);
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.lastX = currentX;
    this.lastY = currentY;
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  setColor(newColor) {
    this.color = newColor;
  }

  clear() {
    if (!this.ctx || !this.canvas) return;
    this.saveState();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  saveState() {
    if (!this.ctx || !this.canvas) return;
    if (this.history.length > 10) this.history.shift();
    this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
  }

  undo() {
    if (this.history.length > 0) {
      const prevState = this.history.pop();
      this.ctx.putImageData(prevState, 0, 0);
    }
  }
}

export const scratchpad = new Scratchpad();
