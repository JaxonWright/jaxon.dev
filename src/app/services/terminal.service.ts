import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TERMINAL_THEMES, DEFAULT_THEME, TerminalTheme } from './omarchy-themes';

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

export { TERMINAL_THEMES, DEFAULT_THEME } from './omarchy-themes';
export type { TerminalTheme } from './omarchy-themes';

const THEME_KEY = 'jxn-terminal-theme';

@Injectable({ providedIn: 'root' })
export class TerminalService {
  readonly entries = signal<TerminalEntry[]>([]);
  readonly history = signal<string[]>([]);
  /** Command echoed above the currently routed page. */
  readonly routeEcho = signal<string>('');
  readonly theme = signal<TerminalTheme>(TERMINAL_THEMES.find(t => t.name === DEFAULT_THEME)!);
  readonly helpText = signal<string>('');

  readonly commands: TerminalCommand[] = [
    { name: 'help', aliases: ['?', 'man'], description: 'List available commands', run: () => this.helpLines() },
    { name: 'about', aliases: ['whoami', 'home', 'cd ~'], description: 'Who is Jaxon?', route: '/', echo: 'cat about.txt' },
    { name: 'projects', aliases: ['ls', 'ls projects', 'cd projects'], description: 'Things I have built', route: '/projects', echo: 'ls -l ./projects' },
    { name: 'playlists', aliases: ['music', 'spotify', 'cd playlists', 'cd music'], description: 'My Spotify playlists', route: '/playlists', echo: 'spotify --list' },
    { name: 'contact', aliases: ['socials', 'email'], description: 'Ways to reach me', route: '/contact', echo: 'cat contact.txt' },
    { name: 'pay', aliases: ['venmo', 'tip'], description: 'Send me money', route: '/contact', echo: 'cat contact.txt --pay' },
    { name: 'version', aliases: ['build-info', 'build', 'fastfetch', 'neofetch', 'uname -a'], description: 'Build + dependency info', route: '/build-info', echo: 'fastfetch' },
    { name: 'theme', description: 'List themes or switch: theme <name>', run: (a) => this.themeCommand(a) },
    { name: 'history', description: 'Show command history', run: () => this.history().map((h, i) => ({ text: `${String(i + 1).padStart(4)}  ${h}` })) },
    { name: 'clear', aliases: ['cls'], description: 'Clear the screen', run: () => { this.entries.set([]); this.routeEcho.set(''); this.cleared.set(true); return; } },
    { name: 'date', description: 'Print the date', hidden: true, run: () => [{ text: new Date().toString() }] },
    { name: 'echo', description: 'Print text', hidden: true, run: (a) => [{ text: a.join(' ') }] },
    { name: 'rm -rf /', aliases: ['rm -rf /*', 'rm -rf --no-preserve-root /', 'sudo rm -rf /', 'sudo rm -rf /*', 'sudo rm -rf --no-preserve-root /'],
      description: '', hidden: true, run: () => undefined },
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
      // ?theme=<name> previews a theme without saving it.
      const q = new URLSearchParams(location.search).get('theme');
      const qt = TERMINAL_THEMES.find(x => x.name === q);
      if (qt) this.theme.set(qt);
    } catch { /* storage unavailable */ }
  }

  /** Commands shown as clickable shortcuts. */
  readonly quickCommands = ['about', 'projects', 'playlists', 'contact', 'pay', 'version', 'help'];

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
    this.cancelRmrf();
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
    if (cmd.name === 'rm -rf /') this.startRmrf(input);
  }

  private helpLines(): TerminalLine[] {
    const visible = this.commands.filter(c => !c.hidden);
    return [
      { text: 'AVAILABLE COMMANDS — click one or type it', kind: 'accent' },
      ...visible.map(c => ({ text: `${c.name.padEnd(11)}${c.description}`, command: c.name })),
      { text: '' },
      { text: 'KEYS: ↑/↓ history · TAB complete · CTRL+L clear', kind: 'muted' },
    ];
  }

  private themeCommand(args: string[]): TerminalLine[] {
    const name = (args[0] ?? '').toLowerCase();
    const t = TERMINAL_THEMES.find(x => x.name === name);
    if (!t) {
      return [
        { text: 'USAGE: theme <name>  (Omarchy themes + midnight)', kind: 'muted' },
        ...TERMINAL_THEMES.map(x => ({ text: `${x.name === this.theme().name ? '>' : ' '} ${x.name}`, command: `theme ${x.name}` })),
      ];
    }
    this.setTheme(t);
    return [{ text: `THEME SET TO ${t.name.toUpperCase()}` }];
  }

  // ---- Easter egg: `rm -rf /`. Purely cosmetic: prints fake lines, no storage or navigation. ----
  /** CP437 noise shown over the screen during the fake wipe; null when not glitching. */
  readonly glitch = signal<string | null>(null);
  private rmrfTimers: ReturnType<typeof setTimeout>[] = [];

  /** True while the fake wipe is streaming (the shell auto-scrolls to follow it). */
  readonly rmrfActive = signal(false);

  private static readonly RMRF_PATHS = [
    '/bin/bash', '/bin/ls', '/bin/cat', '/bin/sh', '/usr/bin/node', '/usr/bin/ng', '/usr/lib/angular/core',
    '/etc/omarchy/themes/midnight', '/etc/omarchy/hyprland.conf', '/etc/hosts', '/etc/passwd', '/boot/vmlinuz',
    '/home/jaxon/skittles/wild-berry', '/home/jaxon/skittles/tropical', '/home/jaxon/skittles/sour',
    '/home/jaxon/playlists/spotify-wrapped-2026', '/home/jaxon/resume/volgistics', '/home/jaxon/resume/gvsu',
    '/home/jaxon/.ssh/definitely_not_my_keys', '/home/jaxon/projects/jaxon.dev', '/home/jaxon/.config/nvim',
    '/var/packers/hope', '/var/packers/super-bowl-2011', '/var/lions/patience', '/var/log/regrets.log',
    '/opt/vicnet/volunteers', '/opt/victouch/time-clock', '/srv/www/jaxon.dev/index.html', '/tmp/.cursor-blink',
    '/dev/coffee', '/proc/self/sanity', '/lib/libjoy.so.1', '/sbin/init',
  ];

  private startRmrf(command: string): void {
    const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.rmrfActive.set(true);
    let entry: TerminalEntry = { command, lines: [] };
    this.entries.update(e => [...e, entry]);
    const add = (line: TerminalLine): boolean => {
      let found = false;
      this.entries.update(es => es.map(e => {
        if (e !== entry) return e;
        found = true;
        entry = { ...e, lines: [...e.lines, line] };
        return entry;
      }));
      if (!found) this.cancelRmrf(); // screen was cleared mid-animation
      return found;
    };
    const later = (ms: number, fn: () => void) => this.rmrfTimers.push(setTimeout(fn, ms));
    const paths = TerminalService.RMRF_PATHS;
    const count = reduced ? 8 : 60, step = reduced ? 90 : 42;
    for (let i = 0; i < count; i++) {
      later(i * step, () => add({ text: `removed '${paths[(i * 7) % paths.length]}'`, kind: i % 9 === 8 ? 'error' : undefined }));
    }
    const end = count * step;
    if (!reduced) {
      const noise = '░▒▓█▀▄▌▐■□▪▫◘○◙♦♣♠•▬↨↑↓→←∟↔▲▼#%&@$';
      const frame = () => {
        let out = '';
        for (let r = 0; r < 40; r++) {
          for (let c = 0; c < 140; c++) out += Math.random() < 0.55 ? ' ' : noise[Math.floor(Math.random() * noise.length)];
          out += '\n';
        }
        return out;
      };
      for (let f = 0; f < 12; f++) later(end + f * 60, () => this.glitch.set(frame()));
      later(end + 12 * 60, () => this.glitch.set(null));
    }
    const done = end + (reduced ? 200 : 12 * 60 + 250);
    later(done, () => add({ text: 'rm: it is dangerous to operate recursively on \'/\'', kind: 'muted' }));
    later(done + 350, () => add({ text: 'just kidding. nothing was harmed. type `help` for real commands.', kind: 'accent', command: 'help' }));
    later(done + 700, () => this.cancelRmrf());
  }

  cancelRmrf(): void {
    this.rmrfActive.set(false);
    this.rmrfTimers.forEach(t => clearTimeout(t));
    this.rmrfTimers = [];
    this.glitch.set(null);
  }

  setTheme(t: TerminalTheme): void {
    this.theme.set(t);
    try { localStorage.setItem(THEME_KEY, t.name); } catch { /* ignore */ }
  }

}
