import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { VERSION } from '../../../environments/version';
import { JW_LOGO_SMALL, OS_LOGOS, TUX_CELLS } from '@services/ascii-art';
import { TerminalService } from '@services/terminal.service';
declare var require: any;

export interface Dependency { name: string; link: string; version: string; }
export interface Field { key: string; value: string; link?: string; }

export type OsId = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'chromeos';
const OS_NAMES: Record<OsId, string> = { windows: 'Windows', macos: 'macOS', linux: 'Linux', android: 'Android', ios: 'iOS', chromeos: 'ChromeOS' };
const OS_ART: Record<OsId, string> = { windows: OS_LOGOS['windows'], macos: OS_LOGOS['apple'], ios: OS_LOGOS['apple'], linux: OS_LOGOS['tux'], android: OS_LOGOS['android'], chromeos: OS_LOGOS['chrome'] };

/** Detect the visitor's OS (userAgentData first, userAgent fallback). `?os=<id>` previews one; display only. */
export function detectOs(): { id: OsId | null; name: string } {
  if (typeof navigator === 'undefined') return { id: null, name: 'unknown' };
  const n: any = navigator;
  const forced = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('os')?.toLowerCase() : null;
  if (forced && forced in OS_NAMES) return { id: forced as OsId, name: OS_NAMES[forced as OsId] };
  const plat: string = (n.userAgentData?.platform || '').toLowerCase();
  const ua: string = n.userAgent || '';
  let id: OsId | null = null;
  if (plat) {
    id = plat.includes('win') ? 'windows' : plat.includes('mac') ? 'macos' : plat.includes('android') ? 'android'
      : plat.includes('chrome') ? 'chromeos' : plat.includes('ios') ? 'ios' : plat.includes('linux') ? 'linux' : null;
  }
  if (!id) {
    id = /Windows/.test(ua) ? 'windows' : /Android/.test(ua) ? 'android' : /CrOS/.test(ua) ? 'chromeos'
      : /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && n.maxTouchPoints > 1) ? 'ios'
      : /Mac OS X|Macintosh/.test(ua) ? 'macos' : /Linux|X11/.test(ua) ? 'linux' : null;
  }
  const name = id === 'ios' && (/iPad/.test(ua) || (/Macintosh/.test(ua) && n.maxTouchPoints > 1)) ? 'iPadOS' : id ? OS_NAMES[id] : (n.platform || 'unknown');
  return { id, name };
}

const TONES = ['transparent', 'var(--t-secondary)', 'var(--ff-light, var(--t-text))'];

const PAGE_LOADED = performance.timeOrigin || Date.now();

@Component({
  selector: 'app-build-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './build-info.component.html',
  styleUrls: ['./build-info.component.css'],
  imports: [],
})
export class BuildInfoComponent implements OnInit, OnDestroy {
  readonly osInfo = detectOs();
  // Visitor's OS logo like fastfetch; unknown OS falls back to the static,
  // shaded (▓) JW variant so it differs from the animated banner logo.
  readonly logo = this.osInfo.id ? OS_ART[this.osInfo.id] : JW_LOGO_SMALL.replace(/█/g, '▓');
  /** Two-tone Tux cells (▀ with fg = top tone, bg = bottom tone); null for other logos. */
  readonly tuxRows = this.osInfo.id === 'linux'
    ? TUX_CELLS.map(row => row.map(([t, b, n]) => ({ ch: t === b ? (t ? '█' : ' ') : '▀', fg: TONES[t], bg: t === b ? '' : TONES[b], text: '' , n })).map(c => ({ ...c, text: (c.ch).repeat(c.n) })))
    : null;
  readonly logoLabel = this.osInfo.id ? `${this.osInfo.name} logo` : 'JW logo';
  readonly version = VERSION;
  readonly buildDate = new Date(VERSION.date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  readonly commitLink = `https://github.com/JaxonWright/jaxon.dev/commit/${VERSION.hash}`;

  readonly dependencies: Dependency[] = [
    { name: 'Angular', version: require('@angular/core/package.json').version, link: 'https://www.npmjs.com/package/@angular/core' },
    { name: 'RxJS', version: require('rxjs/package.json').version, link: 'https://www.npmjs.com/package/rxjs' },
    { name: 'TypeScript', version: require('typescript/package.json').version, link: 'https://www.npmjs.com/package/typescript' },
  ];
  private readonly pkg = require('../../../../package.json');
  readonly packageCount = Object.keys(this.pkg.dependencies ?? {}).length;
  readonly devPackageCount = Object.keys(this.pkg.devDependencies ?? {}).length;

  readonly now = signal(Date.now());
  readonly size = signal(this.windowSize());
  private timer: any;
  private readonly onResize = () => this.size.set(this.windowSize());

  readonly fields = computed<Field[]>(() => [
    { key: 'OS', value: this.os() },
    { key: 'Host', value: location.host || 'jaxon.dev' },
    { key: 'Kernel', value: `Angular ${this.dependencies[0].version}` },
    { key: 'Build', value: `${VERSION.hash} (${this.buildDate})`, link: this.commitLink },
    { key: 'Uptime', value: this.uptime(this.now() - PAGE_LOADED) },
    { key: 'Packages', value: `${this.packageCount} (npm), ${this.devPackageCount} (npm dev)` },
    { key: 'Shell', value: 'jxn-terminal' },
    { key: 'Resolution', value: this.size() },
    { key: 'Theme', value: this.term.theme().name },
    { key: 'Font', value: 'JetBrainsMono Nerd Font' },
    { key: 'Terminal', value: this.browser() },
    { key: 'Locale', value: navigator.language || 'unknown' },
    ...this.dependencies.slice(1).map(d => ({ key: d.name, value: d.version, link: d.link })),
  ]);

  readonly palette = computed(() => this.term.theme().palette);

  constructor(private title: Title, public term: TerminalService) {
    this.title.setTitle('Jaxon Wright - Build Info');
  }

  ngOnInit(): void {
    this.timer = setInterval(() => this.now.set(Date.now()), 1000);
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    window.removeEventListener('resize', this.onResize);
  }

  private windowSize(): string {
    const dpr = window.devicePixelRatio || 1;
    return `${window.innerWidth}x${window.innerHeight}${dpr !== 1 ? ` @${+dpr.toFixed(2)}x` : ''}`;
  }

  private uptime(ms: number): string {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h ? `${h} hour${h > 1 ? 's' : ''}` : '', m ? `${m} min${m > 1 ? 's' : ''}` : '', `${sec} sec${sec !== 1 ? 's' : ''}`].filter(Boolean).join(', ');
  }

  private os(): string {
    return this.osInfo.name;
  }

  private browser(): string {
    const ua = navigator.userAgent;
    const m = ua.match(/(Edg|OPR|Firefox|FxiOS|CriOS|Chrome|Version)\/([\d.]+)/);
    if (!m) return 'unknown';
    const names: Record<string, string> = { Edg: 'Edge', OPR: 'Opera', FxiOS: 'Firefox', CriOS: 'Chrome', Version: 'Safari' };
    if (/HeadlessChrome/.test(ua)) return `Headless Chrome ${m[2].split('.')[0]}`;
    return `${names[m[1]] ?? m[1]} ${m[2].split('.')[0]}`;
  }
}
