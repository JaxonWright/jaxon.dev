import { LogoAnimator } from './logo-animator';

const LOGO = '█▀ ▄█\n ███ \n▀▀ ▀▀';
const spaces = (s: string) => [...s].map(c => c === ' ' || c === '\n');

describe('LogoAnimator', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('stays static under prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
    const anim = new LogoAnimator(LOGO);
    anim.begin();
    expect(anim.text()).toBe(LOGO);
    anim.destroy();
  });

  it('decodes into the final logo without moving any cell', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout'] });
    const anim = new LogoAnimator(LOGO);
    anim.begin();
    vi.advanceTimersByTime(50);
    const frame = anim.text();
    expect(frame).not.toBe(LOGO);
    expect(spaces(frame)).toEqual(spaces(LOGO));
    vi.advanceTimersByTime(1500);
    expect(anim.text()).toBe(LOGO);
    anim.destroy();
  });

  it('sweeps a shimmer across the logo every few seconds, then settles', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout'] });
    const anim = new LogoAnimator(LOGO);
    anim.begin();
    vi.advanceTimersByTime(1500);
    const seen = new Set<string>();
    for (let t = 0; t < 9000; t += 16) {
      vi.advanceTimersByTime(16);
      seen.add(anim.text());
    }
    expect([...seen].some(f => f !== LOGO && /[▓▒]/.test(f))).toBe(true);
    expect(anim.text()).toBe(LOGO);
    anim.destroy();
  });
});
