import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TerminalService, TERMINAL_THEMES, DEFAULT_THEME } from './terminal.service';
import { RMRF_LINES } from './rmrf-paths';

@Component({ template: '' })
class Blank {}

function setup(search = ''): { term: TerminalService; router: Router } {
  window.history.replaceState(null, '', '/' + search);
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', component: Blank }])] });
  return { term: TestBed.inject(TerminalService), router: TestBed.inject(Router) };
}

const texts = (term: TerminalService) => term.entries().at(-1)!.lines.map(l => l.text);

describe('TerminalService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.useRealTimers());

  it('lists visible commands in help and hides the easter eggs', () => {
    const { term } = setup();
    term.execute('help');
    const out = texts(term).join('\n');
    for (const name of ['about', 'projects', 'playlists', 'contact', 'version', 'theme', 'history', 'clear']) {
      expect(out).toContain(name);
    }
    for (const hidden of ['sudo', 'rm -rf', 'pay', 'exit']) expect(out).not.toContain(hidden);
    expect(term.entries()[0].lines.find(l => l.text.startsWith('projects'))?.command).toBe('projects');
  });

  it('reports unknown commands with a clickable hint', () => {
    const { term } = setup();
    term.execute('frobnicate --hard');
    const [error, hint] = term.entries()[0].lines;
    expect(error).toEqual({ text: 'frobnicate: command not found', kind: 'error' });
    expect(hint.command).toBe('help');
  });

  it('matches commands case-insensitively and ignores a leading ./', () => {
    const { term } = setup();
    expect(term.find('./LS')?.cmd.name).toBe('projects');
    expect(term.find('  Cd   Music ')?.cmd.name).toBe('playlists');
    expect(term.find('lsblk')).toBeNull();
  });

  it('keeps the case of arguments', () => {
    const { term } = setup();
    term.execute('echo Hello   World');
    expect(texts(term)).toEqual(['Hello World']);
  });

  it('records history, numbers it, and skips blank input', () => {
    const { term } = setup();
    term.execute('date');
    term.execute('   ');
    term.execute('history');
    expect(term.history()).toEqual(['date', 'history']);
    expect(texts(term)).toEqual(['   1  date', '   2  history']);
  });

  it('navigates for route commands and echoes the fake shell command', async () => {
    const { term, router } = setup();
    term.execute('help');
    term.execute('ls projects');
    await vi.waitFor(() => expect(router.url).toBe('/projects'));
    expect(term.entries()).toEqual([]);
    expect(term.routeEcho()).toBe('ls -l ./projects');
  });

  it('clears the screen', () => {
    const { term } = setup();
    term.execute('date');
    term.execute('clear');
    expect(term.entries()).toEqual([]);
    expect(term.cleared()).toBe(true);
  });

  describe('themes', () => {
    const named = (name: string) => TERMINAL_THEMES.find(t => t.name === name)!;

    it('starts on the default theme', () => {
      expect(setup().term.theme().name).toBe(DEFAULT_THEME);
    });

    it('lists themes with the current one marked', () => {
      const { term } = setup();
      term.execute('theme');
      const lines = term.entries()[0].lines;
      expect(lines).toContainEqual({ text: `> ${DEFAULT_THEME}`, command: `theme ${DEFAULT_THEME}` });
      expect(lines).toContainEqual({ text: '  nord', command: 'theme nord' });
    });

    it('switches and remembers the theme', () => {
      const { term } = setup();
      term.execute('theme Nord');
      expect(term.theme()).toBe(named('nord'));
      expect(texts(term)).toEqual(['THEME SET TO NORD']);
      expect(localStorage.getItem('jxn-terminal-theme')).toBe('nord');
    });

    it('restores a saved theme', () => {
      localStorage.setItem('jxn-terminal-theme', 'gruvbox');
      expect(setup().term.theme()).toBe(named('gruvbox'));
    });

    it('previews ?theme= without saving it', () => {
      localStorage.setItem('jxn-terminal-theme', 'gruvbox');
      const { term } = setup('?theme=rose-pine');
      expect(term.theme()).toBe(named('rose-pine'));
      expect(localStorage.getItem('jxn-terminal-theme')).toBe('gruvbox');
    });
  });

  it('completes visible commands and theme names', () => {
    const { term } = setup();
    expect(term.completions('pr')).toEqual(['projects']);
    expect(term.completions('h')).toEqual(['help', 'history']);
    expect(term.completions('su')).toEqual([]);
    expect(term.completions('')).toEqual([]);
    expect(term.completions('theme no')).toEqual(['theme nord']);
  });

  it('derives the echo for a URL loaded directly', () => {
    const { term } = setup();
    expect(term.echoForUrl('/')).toBe('cat about.txt');
    expect(term.echoForUrl('/about?x=1')).toBe('cat about.txt');
    expect(term.echoForUrl('/playlists#top')).toBe('spotify --list');
    expect(term.echoForUrl('/build-info')).toBe('fastfetch');
    expect(term.echoForUrl('/nowhere')).toBe('cd /nowhere');
  });

  describe('rm -rf /', () => {
    it('streams the fake wipe, glitches, then reassures', () => {
      vi.useFakeTimers();
      const { term } = setup();
      term.execute('sudo rm -rf /');
      expect(term.rmrfActive()).toBe(true);
      vi.advanceTimersByTime(1000);
      const partial = texts(term).length;
      expect(partial).toBeGreaterThan(0);
      expect(partial).toBeLessThan(RMRF_LINES.length);
      vi.advanceTimersByTime(2000);
      expect(term.glitch()).not.toBeNull();
      vi.advanceTimersByTime(5000);
      expect(term.glitch()).toBeNull();
      expect(term.rmrfActive()).toBe(false);
      const out = texts(term);
      expect(out.slice(0, RMRF_LINES.length)).toEqual(RMRF_LINES);
      expect(out.at(-1)).toContain('just kidding');
    });

    it('stops when cancelled', () => {
      vi.useFakeTimers();
      const { term } = setup();
      term.execute('rm -rf /');
      vi.advanceTimersByTime(500);
      term.cancelRmrf();
      const lines = texts(term).length;
      vi.advanceTimersByTime(10000);
      expect(texts(term).length).toBe(lines);
      expect(term.rmrfActive()).toBe(false);
    });
  });
});
