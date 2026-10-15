import {
  Component, ChangeDetectionStrategy, ElementRef, HostListener, OnDestroy, OnInit,
  ViewChild, effect, signal, computed,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { VERSION } from '../environments/version';
import { TERMINAL_THEMES, TerminalService } from '@services/terminal.service';

const BOOT_KEY = 'jxn-terminal-booted';

export const ASCII_LOGO = [
  '0000000000  000      000  000      000',
  '     00000   000    000   0000     000',
  '      0000    000  000    00000    000',
  '      0000     000000     000 00   000',
  '      0000     000000     000  00  000',
  '000   0000    000  000    000   00 000',
  '000   0000   000    000   000    00000',
  ' 00000000   000      000  000     0000',
].join('\n');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('cmdInput') cmdInput?: ElementRef<HTMLInputElement>;
  @ViewChild('screen') screen?: ElementRef<HTMLElement>;

  readonly logo = ASCII_LOGO;
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
    return '[' + '#'.repeat(filled) + '.'.repeat(20 - filled) + ']';
  });

  private historyIndex = -1;
  private timers: any[] = [];
  private sub?: Subscription;

  constructor(public term: TerminalService, private router: Router, private host: ElementRef<HTMLElement>) {
    effect(() => {
      const t = this.term.theme();
      const s = document.documentElement.style;
      s.setProperty('--t-primary', t.primary);
      s.setProperty('--t-secondary', t.secondary);
      s.setProperty('--t-bg', t.background);
      s.setProperty('--t-text', t.text);
      s.setProperty('--t-accent', t.accent);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.background);
    });
    // Re-type the echoed command whenever it changes.
    effect(() => this.typeEcho(this.term.routeEcho()));
  }

  ngOnInit(): void {
    this.sub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      // Browser back/forward or direct links: derive the echo from the URL.
      const echo = this.term.echoForUrl(e.urlAfterRedirects);
      if (echo !== this.term.routeEcho()) this.term.routeEcho.set(echo);
      this.term.cleared.set(false);
      this.scrollSoon(true);
    });

    let skip = false;
    try { skip = sessionStorage.getItem(BOOT_KEY) === '1'; } catch { /* ignore */ }
    if (skip || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.finishBoot();
    } else {
      this.runBoot();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.timers.forEach(t => clearTimeout(t));
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
  }

  private typeTimer: any;
  private typeEcho(text: string): void {
    clearInterval(this.typeTimer);
    if (!text) { this.typed.set(''); return; }
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
        if (options.length === 1) this.input.set(options[0] + (options[0].startsWith('theme ') ? '' : ''));
        else this.term.entries.update(e => [...e, { command: this.input(), lines: [{ text: options.join('   '), kind: 'muted' }] }]);
      }
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      this.run('clear');
    } else if (event.key === 'c' && event.ctrlKey && !window.getSelection()?.toString()) {
      event.preventDefault();
      this.term.entries.update(e => [...e, { command: this.input() + '^C', lines: [] }]);
      this.input.set('');
    }
  }

  /** Any key while booting skips the boot; clicking the screen focuses the prompt. */
  @HostListener('document:keydown', ['$event'])
  onDocKey(event: KeyboardEvent): void {
    if (this.booting()) { this.finishBoot(); event.preventDefault(); return; }
    const target = event.target as HTMLElement;
    if (target?.tagName !== 'INPUT' && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.focusInput();
    }
  }

  onScreenClick(event: MouseEvent): void {
    if (this.booting()) { this.finishBoot(); return; }
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input')) return;
    if (window.getSelection()?.toString()) return;
    this.focusInput(true);
  }

  setHelp(text: string): void {
    this.term.helpText.set(text);
  }

  private focusInput(preventScroll = true): void {
    setTimeout(() => this.cmdInput?.nativeElement.focus({ preventScroll }), 0);
  }

  private scrollSoon(top: boolean): void {
    setTimeout(() => {
      const el = this.screen?.nativeElement;
      if (!el) return;
      if (top) el.scrollTo({ top: 0 });
      else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 30);
  }
}
