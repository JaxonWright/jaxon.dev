import { signal } from '@angular/core';
import { prefersReducedMotion } from './motion';

const SHADES = ['░', '▒', '▓'];

/**
 * CP437 logo animation: a ~1s decode where each filled cell cycles through ░▒▓ before
 * settling on its final █▀▄ glyph, then an idle diagonal ▓▒ shimmer sweep every 6-8s.
 * Only glyphs change (spaces stay spaces), so there is no layout shift. Static under
 * prefers-reduced-motion; paused while the tab is hidden.
 */
export class LogoAnimator {
  readonly text: ReturnType<typeof signal<string>>;
  private readonly rows: string[];
  private readonly settle: number[][];
  private raf = 0;
  private timer: any;
  private start = 0;
  private mode: 'decode' | 'sweep' | 'idle' = 'idle';
  private readonly width: number;
  private readonly onVis = () => this.visibility();

  constructor(private readonly final: string) {
    this.text = signal(final);
    this.rows = final.split('\n');
    this.width = Math.max(...this.rows.map(r => r.length));
    // Settle time per cell: left-to-right bias plus jitter, 0..900ms.
    this.settle = this.rows.map(r => [...r].map((_, x) => 250 * (x / this.width) + Math.random() * 650));
  }

  begin(): void {
    if (prefersReducedMotion()) return;
    document.addEventListener('visibilitychange', this.onVis);
    this.run('decode');
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.timer);
    document.removeEventListener('visibilitychange', this.onVis);
  }

  private visibility(): void {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
      clearTimeout(this.timer);
      this.mode = 'idle';
      this.text.set(this.final);
    } else {
      this.scheduleSweep();
    }
  }

  private run(mode: 'decode' | 'sweep'): void {
    this.mode = mode;
    this.start = performance.now();
    cancelAnimationFrame(this.raf);
    const frame = (now: number) => {
      const t = now - this.start;
      const done = mode === 'decode' ? this.decodeFrame(t) : this.sweepFrame(t);
      if (done) {
        this.text.set(this.final);
        this.mode = 'idle';
        this.scheduleSweep();
      } else {
        this.raf = requestAnimationFrame(frame);
      }
    };
    this.raf = requestAnimationFrame(frame);
  }

  private scheduleSweep(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { if (!document.hidden) this.run('sweep'); }, 6000 + Math.random() * 2000);
  }

  private lastTick = -1;

  /** Returns true when finished. */
  private decodeFrame(t: number): boolean {
    const tick = Math.floor(t / 45); // re-roll shades ~22fps for a chunky terminal feel
    if (tick === this.lastTick) return false;
    this.lastTick = tick;
    let pending = false;
    const out = this.rows.map((r, y) => [...r].map((ch, x) => {
      if (ch === ' ') return ch;
      if (t >= this.settle[y][x]) return ch;
      pending = true;
      return SHADES[(Math.random() * 3) | 0];
    }).join(''));
    this.text.set(out.join('\n'));
    return !pending;
  }

  /** Diagonal band sweeping left to right over ~700ms. */
  private sweepFrame(t: number): boolean {
    const dur = 700;
    const h = this.rows.length;
    const span = this.width + h + 6;
    const pos = (t / dur) * span - 3;
    if (pos > span) return true;
    const out = this.rows.map((r, y) => [...r].map((ch, x) => {
      if (ch === ' ') return ch;
      const d = Math.abs(x + (h - y) - pos);
      return d < 1 ? '▓' : d < 2.5 ? '▒' : ch;
    }).join(''));
    this.text.set(out.join('\n'));
    return false;
  }
}
