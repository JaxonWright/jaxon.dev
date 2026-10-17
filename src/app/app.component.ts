import {
  Component, ChangeDetectionStrategy, ElementRef, HostListener, OnDestroy, OnInit,
  ViewChild, effect, signal, computed,
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { VERSION } from '../environments/version';
import { TERMINAL_THEMES, TerminalService } from '@services/terminal.service';
import { JW_LOGO } from '@services/ascii-art';
import { LogoAnimator } from '@services/logo-animator';
import { prefersReducedMotion } from '@services/motion';

const BOOT_KEY = 'jxn-terminal-booted';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('cmdInput') cmdInput?: ElementRef<HTMLInputElement>;
  @ViewChild('screen') screen?: ElementRef<HTMLElement>;

  readonly logoAnim = new LogoAnimator(JW_LOGO);
  readonly themes = TERMINAL_THEMES;
  readonly version = VERSION;
  readonly year = new Date().getFullYear();
  readonly bootSteps = ['INITIALIZING SYSTEM', 'LOADING ASSETS', 'CHECKING HARDWARE', 'ESTABLISHING CONNECTION', 'READY'];

  readonly booting = signal(true);
  readonly bootIndex = signal(0);
  readonly progress = signal(0);
  /** Characters of the route echo typed so far. */
  readonly typed = signal('');
  readonly input = signal('');
  readonly helpOpen = signal(false);
  readonly progressBar = computed(() => {
    const filled = Math.round(this.progress() / 5);
    return '▐' + '█'.repeat(filled) + '░'.repeat(20 - filled) + '▌';
  });

  private historyIndex = -1;
  /** Element id the current route opens at (route data `anchor`); empty for the top of the page. */
  private anchor = '';
  private timers: ReturnType<typeof setTimeout>[] = [];
  private sub?: Subscription;

  constructor(public term: TerminalService, private router: Router, private host: ElementRef<HTMLElement>) {
    effect(() => {
      const t = this.term.theme();
      const s = document.documentElement.style;
      const dark = t.mode === 'dark';
      s.setProperty('--t-bg', t.background);
      s.setProperty('--t-text', t.foreground);
      s.setProperty('--t-primary', t.bright);       // headings, logos, highlights
      s.setProperty('--t-secondary', t.accent);     // prompt
      s.setProperty('--t-accent', `color-mix(in srgb, ${t.foreground} 55%, ${t.background})`); // dim text
      s.setProperty('--t-error', t.red);
      // Photo ramp: shadow -> accent -> highlight (inverted ends on light themes so the face isn't a negative).
      s.setProperty('--t-photo-lo', dark ? t.background : t.foreground);
      s.setProperty('--t-photo', t.name === 'midnight' ? '#3EB489' : t.accent);
      s.setProperty('--t-photo-hi', t.name === 'midnight' ? '#98FFC8' : (dark ? t.bright : t.background));
      document.documentElement.classList.toggle('t-light', !dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.background);
      document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', t.mode);
    });
    // Re-type the echoed command whenever it changes.
    effect(() => this.typeEcho(this.term.routeEcho()));
    // Follow the `rm -rf /` easter egg output as it streams.
    effect(() => { this.term.entries(); if (this.term.rmrfActive()) setTimeout(() => { const el = this.screen?.nativeElement; if (el) el.scrollTop = el.scrollHeight; }); });
  }

  ngOnInit(): void {
    this.logoAnim.begin();
    this.sub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      // Browser back/forward or direct links: derive the echo from the URL.
      const echo = this.term.echoForUrl(e.urlAfterRedirects);
      if (echo !== this.term.routeEcho()) this.term.routeEcho.set(echo);
      let route = this.router.routerState.snapshot.root;
      while (route.firstChild) route = route.firstChild;
      this.anchor = route.data['anchor'] ?? '';
      this.term.cleared.set(false);
      this.scrollSoon(true);
    });

    let skip = false;
    try { skip = sessionStorage.getItem(BOOT_KEY) === '1'; } catch { /* ignore */ }
    if (skip || prefersReducedMotion()) {
      this.finishBoot();
    } else {
      this.runBoot();
    }
  }

  ngOnDestroy(): void {
    this.logoAnim.destroy();
    this.sub?.unsubscribe();
    this.timers.forEach(t => clearTimeout(t));
    clearInterval(this.typeTimer);
  }

  private runBoot(): void {
    const tick = (p: number) => {
      this.progress.set(p);
      this.bootIndex.set(Math.min(this.bootSteps.length - 1, Math.floor(p / 25)));
      if (p >= 100) {
        this.timers.push(setTimeout(() => this.finishBoot(), 250));
      } else {
        this.timers.push(setTimeout(() => tick(Math.min(100, p + 4 + Math.floor(Math.random() * 7))), 35));
      }
    };
    tick(0);
  }

  finishBoot(): void {
    if (!this.booting()) return;
    this.timers.forEach(t => clearTimeout(t));
    this.progress.set(100);
    this.bootIndex.set(this.bootSteps.length - 1);
    this.booting.set(false);
    try { sessionStorage.setItem(BOOT_KEY, '1'); } catch { /* ignore */ }
    this.focusInput();
    this.scrollSoon(true);
  }

  private typeTimer?: ReturnType<typeof setInterval>;
  private typeEcho(text: string): void {
    clearInterval(this.typeTimer);
    if (!text || prefersReducedMotion()) { this.typed.set(text); return; }
    let i = 0;
    this.typed.set('');
    this.typeTimer = setInterval(() => {
      i++;
      this.typed.set(text.slice(0, i));
      if (i >= text.length) clearInterval(this.typeTimer);
    }, 22);
  }

  run(command: string): void {
    if (this.booting()) this.finishBoot();
    this.term.execute(command);
    this.input.set('');
    this.historyIndex = -1;
    this.scrollSoon(false);
    this.focusInput();
  }

  submit(): void {
    this.run(this.input());
  }

  onKeydown(event: KeyboardEvent): void {
    const hist = this.term.history();
    if (event.key === 'ArrowUp') {
      if (!hist.length) return;
      event.preventDefault();
      this.historyIndex = this.historyIndex < 0 ? hist.length - 1 : Math.max(0, this.historyIndex - 1);
      this.input.set(hist[this.historyIndex]);
    } else if (event.key === 'ArrowDown') {
      if (this.historyIndex < 0) return;
      event.preventDefault();
      this.historyIndex++;
      if (this.historyIndex >= hist.length) { this.historyIndex = -1; this.input.set(''); }
      else this.input.set(hist[this.historyIndex]);
    } else if (event.key === 'Tab') {
      const options = this.term.completions(this.input());
      if (options.length) {
        event.preventDefault();
        if (options.length === 1) this.input.set(options[0]);
        else this.term.entries.update(e => [...e, { command: this.input(), lines: [{ text: options.join('   '), kind: 'muted' }] }]);
      }
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      this.run('clear');
    } else if (event.key === 'c' && event.ctrlKey && !window.getSelection()?.toString()) {
      event.preventDefault();
      this.term.cancelRmrf();
      this.term.entries.update(e => [...e, { command: this.input() + '^C', lines: [] }]);
      this.input.set('');
    }
  }

  /** Any key while booting skips the boot; clicking the screen focuses the prompt. */
  @HostListener('document:keydown', ['$event'])
  onDocKey(event: KeyboardEvent): void {
    if (this.booting()) {
      this.finishBoot();
      // Leave browser shortcuts (Ctrl+R, F5, Alt+Left...) working.
      if (!event.ctrlKey && !event.metaKey && !event.altKey && !/^F\d+$/.test(event.key)) event.preventDefault();
      return;
    }
    const target = event.target as HTMLElement;
    if (this.themeOpen() || target?.closest?.('.statusbar')) return;
    if (target?.tagName !== 'INPUT' && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.focusInput();
    }
  }

  onScreenClick(event: MouseEvent): void {
    if (this.booting()) { this.finishBoot(); return; }
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input, select, .statusbar')) return;
    if (window.getSelection()?.toString()) return;
    this.focusInput(true);
  }

  // ---- Theme popover (custom listbox; a native <select> lost focus to the prompt) ----
  @ViewChild('themeList') themeList?: ElementRef<HTMLElement>;
  @ViewChild('themeBtn') themeBtn?: ElementRef<HTMLButtonElement>;
  readonly themeOpen = signal(false);
  readonly themeIndex = signal(0);

  toggleThemes(): void {
    if (this.themeOpen()) { this.closeThemes(true); return; }
    this.themeIndex.set(Math.max(0, this.themes.findIndex(t => t.name === this.term.theme().name)));
    this.themeOpen.set(true);
    setTimeout(() => {
      const list = this.themeList?.nativeElement;
      list?.focus({ preventScroll: true });
      list?.querySelector('.current')?.scrollIntoView({ block: 'nearest' });
    });
  }

  closeThemes(refocusButton = false): void {
    this.themeOpen.set(false);
    if (refocusButton) setTimeout(() => this.themeBtn?.nativeElement.focus({ preventScroll: true }));
  }

  chooseTheme(i: number): void {
    const t = this.themes[i];
    if (t) this.term.setTheme(t);
    this.closeThemes(true);
  }

  onThemeBtnKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); if (!this.themeOpen()) this.toggleThemes(); }
    e.stopPropagation();
  }

  onThemeListKey(e: KeyboardEvent): void {
    e.stopPropagation();
    const n = this.themes.length;
    const move = (i: number) => {
      this.themeIndex.set((i + n) % n);
      setTimeout(() => this.themeList?.nativeElement.querySelector('.active')?.scrollIntoView({ block: 'nearest' }));
    };
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); move(this.themeIndex() + 1); break;
      case 'ArrowUp': e.preventDefault(); move(this.themeIndex() - 1); break;
      case 'Home': e.preventDefault(); move(0); break;
      case 'End': e.preventDefault(); move(n - 1); break;
      case 'Enter': case ' ': e.preventDefault(); this.chooseTheme(this.themeIndex()); break;
      case 'Escape': case 'Tab': e.preventDefault(); this.closeThemes(true); break;
    }
  }

  /** Outside click closes the popover. */
  @HostListener('document:pointerdown', ['$event'])
  onDocPointer(e: PointerEvent): void {
    if (this.themeOpen() && !(e.target as HTMLElement).closest?.('.theme-pick')) this.closeThemes();
  }

  private focusInput(preventScroll = true): void {
    setTimeout(() => this.cmdInput?.nativeElement.focus({ preventScroll }), 0);
  }

  private scrollSoon(top: boolean): void {
    setTimeout(() => {
      const el = this.screen?.nativeElement;
      if (!el) return;
      const target = top && this.anchor ? document.getElementById(this.anchor) : null;
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      else if (top) el.scrollTo({ top: 0 });
      else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 30);
  }
}
