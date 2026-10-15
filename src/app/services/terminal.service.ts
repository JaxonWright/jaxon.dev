import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface TerminalLine {
  text: string;
  /** Optional command that runs when the line is clicked. */
  command?: string;
  /** Optional external link. */
  href?: string;
  kind?: 'muted' | 'error' | 'accent';
}

export interface TerminalEntry {
  command: string;
  lines: TerminalLine[];
}

export interface TerminalCommand {
  name: string;
  aliases?: string[];
  description: string;
  /** Route to navigate to (route commands render a page as their output). */
  route?: string;
  /** Command echoed above the routed page, e.g. `cat about.txt`. */
  echo?: string;
  hidden?: boolean;
  run?: (args: string[]) => TerminalLine[] | void;
}

export interface TerminalTheme {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

/** Palettes modeled after the WALLHACK terminal theme list. */
export const TERMINAL_THEMES: TerminalTheme[] = [
  { name: 'monochrome', primary: '#FFFFFF', secondary: '#CCCCCC', background: '#000000', text: '#FFFFFF', accent: '#999999' },
  { name: 'hacker_green', primary: '#00FF00', secondary: '#00AA00', background: '#001100', text: '#00FF00', accent: '#00CC00' },
  { name: 'retro_amber', primary: '#FFBF00', secondary: '#FF7F00', background: '#1A1408', text: '#FFD27A', accent: '#B38600' },
  { name: 'tron_blue', primary: '#00BFFF', secondary: '#0080B0', background: '#000000', text: '#00FFFF', accent: '#0090C0' },
  { name: 'code_red', primary: '#FF4C4C', secondary: '#CC0000', background: '#1A1A1A', text: '#F2F2F2', accent: '#A33' },
  { name: 'cyberpunk_neon', primary: '#FF0066', secondary: '#00FFFF', background: '#110022', text: '#FFFFFF', accent: '#B0489A' },
];

const THEME_KEY = 'jxn-terminal-theme';
const CRT_KEY = 'jxn-terminal-crt';

@Injectable({ providedIn: 'root' })
export class TerminalService {
  readonly entries = signal<TerminalEntry[]>([]);
  readonly history = signal<string[]>([]);
  /** Command echoed above the currently routed page. */
  readonly routeEcho = signal<string>('');
  readonly theme = signal<TerminalTheme>(TERMINAL_THEMES[0]);
  readonly crt = signal<boolean>(true);
  readonly helpText = signal<string>('');

  readonly commands: TerminalCommand[] = [
    { name: 'help', aliases: ['?', 'man'], description: 'List available commands', run: () => this.helpLines() },
    { name: 'about', aliases: ['whoami', 'home', 'cd ~'], description: 'Who is Jaxon?', route: '/', echo: 'cat about.txt' },
    { name: 'projects', aliases: ['ls', 'ls projects', 'cd projects'], description: 'Things I have built', route: '/projects', echo: 'ls -l ./projects' },
    { name: 'playlists', aliases: ['music', 'spotify', 'cd music'], description: 'My Spotify playlists', route: '/music', echo: 'spotify --list' },
    { name: 'contact', aliases: ['socials', 'email'], description: 'Ways to reach me', route: '/contact', echo: 'cat contact.txt' },
    { name: 'pay', aliases: ['venmo', 'tip'], description: 'Send me money', route: '/contact', echo: 'cat contact.txt --pay' },
    { name: 'version', aliases: ['build-info', 'build', 'uname -a', 'neofetch'], description: 'Build + dependency info', route: '/build-info', echo: 'uname -a' },
    { name: 'theme', description: 'Change colors: theme <name>', run: (a) => this.themeCommand(a) },
    { name: 'crt', description: 'Toggle CRT scanlines: crt on|off', run: (a) => this.crtCommand(a) },
    { name: 'history', description: 'Show command history', run: () => this.history().map((h, i) => ({ text: `${String(i + 1).padStart(4)}  ${h}` })) },
    { name: 'clear', aliases: ['cls'], description: 'Clear the screen', run: () => { this.entries.set([]); this.routeEcho.set(''); this.cleared.set(true); return; } },
    { name: 'date', description: 'Print the date', hidden: true, run: () => [{ text: new Date().toString() }] },
    { name: 'echo', description: 'Print text', hidden: true, run: (a) => [{ text: a.join(' ') }] },
    { name: 'sudo', description: '', hidden: true, run: () => [{ text: 'ACCESS DENIED. THIS INCIDENT WILL BE REPORTED.', kind: 'error' }] },
    { name: 'exit', description: '', hidden: true, run: () => [{ text: 'THERE IS NO ESCAPE. TRY `help`.', kind: 'muted' }] },
  ];

  /** Set when the user clears the screen so the routed page hides until the next route command. */
  readonly cleared = signal(false);

  constructor(private router: Router) {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      const t = TERMINAL_THEMES.find(x => x.name === saved);
      if (t) this.theme.set(t);
      const crt = localStorage.getItem(CRT_KEY);
      if (crt !== null) this.crt.set(crt === 'on');
    } catch { /* storage unavailable */ }
  }

  /** Commands shown as clickable shortcuts. */
  readonly quickCommands = ['about', 'projects', 'playlists', 'contact', 'version', 'help'];

  completions(prefix: string): string[] {
    const p = prefix.trim().toLowerCase();
    if (!p) return [];
    if (p.startsWith('theme ')) {
      const arg = p.slice(6);
      return TERMINAL_THEMES.map(t => `theme ${t.name}`).filter(c => c.startsWith(`theme ${arg}`));
    }
    return this.commands.filter(c => !c.hidden).map(c => c.name).filter(n => n.startsWith(p));
  }

  find(input: string): { cmd: TerminalCommand; args: string[] } | null {
    const normalized = input.trim().replace(/\s+/g, ' ').toLowerCase().replace(/^\.?\//, '');
    for (const cmd of this.commands) {
      for (const alias of [cmd.name, ...(cmd.aliases ?? [])]) {
        if (normalized === alias || normalized.startsWith(alias + ' ')) {
          const args = normalized === alias ? [] : input.trim().split(/\s+/).slice(alias.split(' ').length);
          return { cmd, args };
        }
      }
    }
    return null;
  }

  /** Echo used for a route that was loaded directly by URL. */
  echoForUrl(url: string): string {
    const path = url.split(/[?#]/)[0].replace(/^\//, '');
    const match = this.commands.find(c => c.route && c.route.replace(/^\//, '') === path);
    if (path === '' || path === 'home' || path === 'about') return 'cat about.txt';
    if (path === 'pay') return 'cat contact.txt --pay';
    return match?.echo ?? `cd /${path}`;
  }

  execute(raw: string): void {
    const input = raw.trim();
    if (!input) {
      this.entries.update(e => [...e, { command: '', lines: [] }]);
      return;
    }
    this.history.update(h => [...h, input]);
    const found = this.find(input);
    if (!found) {
      this.entries.update(e => [...e, {
        command: input,
        lines: [
          { text: `${input.split(' ')[0]}: command not found`, kind: 'error' },
          { text: 'Type `help` to see available commands.', kind: 'muted', command: 'help' },
        ],
      }]);
      return;
    }
    const { cmd, args } = found;
    if (cmd.route) {
      this.entries.set([]);
      this.cleared.set(false);
      this.routeEcho.set(cmd.echo ?? cmd.name);
      this.router.navigateByUrl(cmd.route).then(() => {
        if (cmd.name === 'pay') setTimeout(() => document.getElementById('pay')?.scrollIntoView({ behavior: 'smooth' }), 50);
      });
      return;
    }
    const lines = cmd.run?.(args);
    if (lines) { const out = lines; this.entries.update(e => [...e, { command: input, lines: out }]); }
  }

  private helpLines(): TerminalLine[] {
    const visible = this.commands.filter(c => !c.hidden);
    return [
      { text: 'AVAILABLE COMMANDS — click one or type it', kind: 'accent' },
      ...visible.map(c => ({ text: `${c.name.padEnd(11)}${c.description}`, command: c.name === 'theme' || c.name === 'crt' ? undefined : c.name })),
      { text: '' },
      { text: 'KEYS: ↑/↓ history · TAB complete · CTRL+L clear', kind: 'muted' },
    ];
  }

  private themeCommand(args: string[]): TerminalLine[] {
    const name = (args[0] ?? '').toLowerCase();
    const t = TERMINAL_THEMES.find(x => x.name === name);
    if (!t) {
      return [
        { text: 'USAGE: theme <name>', kind: 'muted' },
        ...TERMINAL_THEMES.map(x => ({ text: `${x.name === this.theme().name ? '>' : ' '} ${x.name}`, command: `theme ${x.name}` })),
      ];
    }
    this.setTheme(t);
    return [{ text: `THEME SET TO ${t.name.toUpperCase()}` }];
  }

  setTheme(t: TerminalTheme): void {
    this.theme.set(t);
    try { localStorage.setItem(THEME_KEY, t.name); } catch { /* ignore */ }
  }

  private crtCommand(args: string[]): TerminalLine[] {
    const arg = (args[0] ?? '').toLowerCase();
    const on = arg === 'on' ? true : arg === 'off' ? false : !this.crt();
    this.crt.set(on);
    try { localStorage.setItem(CRT_KEY, on ? 'on' : 'off'); } catch { /* ignore */ }
    return [{ text: `CRT EFFECT ${on ? 'ENABLED' : 'DISABLED'}` }];
  }
}
