import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { VERSION } from '../../../environments/version';
import { JW_LOGO_SMALL } from '@services/ascii-art';
import { LogoAnimator } from '@services/logo-animator';
import { TerminalService } from '@services/terminal.service';
declare var require: any;

export interface Dependency { name: string; link: string; version: string; }
export interface Field { key: string; value: string; link?: string; }

const PAGE_LOADED = performance.timeOrigin || Date.now();

@Component({
  selector: 'app-build-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './build-info.component.html',
  styleUrls: ['./build-info.component.css'],
  imports: [],
})
export class BuildInfoComponent implements OnInit, OnDestroy {
  readonly logo = new LogoAnimator(JW_LOGO_SMALL);
  readonly version = VERSION;
  readonly buildDate = new Date(VERSION.date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  readonly commitLink = `https://github.com/JaxonWright/jaxon.dev/commit/${VERSION.hash}`;

  readonly dependencies: Dependency[] = [
    { name: 'Angular', version: require('@angular/core/package.json').version, link: 'https://www.npmjs.com/package/@angular/core' },
    { name: 'Angular Material', version: require('@angular/material/package.json').version, link: 'https://www.npmjs.com/package/@angular/material' },
    { name: 'RxJS', version: require('rxjs/package.json').version, link: 'https://www.npmjs.com/package/rxjs' },
    { name: 'TypeScript', version: require('typescript/package.json').version, link: 'https://www.npmjs.com/package/typescript' },
    { name: 'Angular FontAwesome', version: require('@fortawesome/angular-fontawesome/package.json').version, link: 'https://www.npmjs.com/package/@fortawesome/angular-fontawesome' },
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
    this.title.setTitle('Jaxon Wright - fastfetch');
  }

  ngOnInit(): void {
    this.logo.begin();
    this.timer = setInterval(() => this.now.set(Date.now()), 1000);
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    this.logo.destroy();
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
    const n: any = navigator;
    return n.userAgentData?.platform || n.platform || 'unknown';
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
