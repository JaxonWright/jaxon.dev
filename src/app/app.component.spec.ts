import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Routes, provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { appRoutes } from './routes';
import { TerminalService, TERMINAL_THEMES, DEFAULT_THEME } from '@services/terminal.service';

@Component({ template: '<p class="routed">routed page</p>' })
class Page {}

async function render(booted = true, routes: Routes = [{ path: '**', component: Page }]): Promise<ComponentFixture<AppComponent>> {
  sessionStorage.clear();
  if (booted) sessionStorage.setItem('jxn-terminal-booted', '1');
  window.history.replaceState(null, '', '/');
  TestBed.configureTestingModule({
    providers: [provideRouter(routes)],
  });
  const fixture = TestBed.createComponent(AppComponent);
  await fixture.whenStable();
  return fixture;
}

const el = (f: ComponentFixture<AppComponent>) => f.nativeElement as HTMLElement;
const input = (f: ComponentFixture<AppComponent>) => el(f).querySelector<HTMLInputElement>('#cmd')!;
const text = (f: ComponentFixture<AppComponent>) => el(f).querySelector('.session')!.textContent!;

async function type(f: ComponentFixture<AppComponent>, value: string): Promise<void> {
  const i = input(f);
  i.value = value;
  i.dispatchEvent(new Event('input'));
  await f.whenStable();
}

async function enter(f: ComponentFixture<AppComponent>, value: string): Promise<void> {
  await type(f, value);
  input(f).form!.requestSubmit();
  await f.whenStable();
}

async function key(f: ComponentFixture<AppComponent>, target: Element, init: KeyboardEventInit): Promise<KeyboardEvent> {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  await f.whenStable();
  return event;
}

describe('AppComponent', () => {
  beforeEach(() => localStorage.clear());

  it('boots, and any key skips the boot sequence', async () => {
    const f = await render(false);
    expect(el(f).textContent).toContain('INITIALIZING SYSTEM');
    expect(input(f)).toBeNull();
    await key(f, document.body, { key: 'x' });
    expect(input(f)).not.toBeNull();
    expect(sessionStorage.getItem('jxn-terminal-booted')).toBe('1');
  });

  it('lets browser shortcuts through while skipping the boot sequence', async () => {
    for (const init of [{ key: 'r', ctrlKey: true }, { key: 'F5' }, { key: 'l', ctrlKey: true }, { key: 'r', metaKey: true }, { key: 'ArrowLeft', altKey: true }]) {
      TestBed.resetTestingModule();
      const f = await render(false);
      const event = await key(f, document.body, init);
      expect(event.defaultPrevented, JSON.stringify(init)).toBe(false);
      expect(input(f), JSON.stringify(init)).not.toBeNull();
    }
  });

  it('swallows plain keys that skip the boot sequence', async () => {
    const f = await render(false);
    const event = await key(f, document.body, { key: ' ' });
    expect(event.defaultPrevented).toBe(true);
    expect(input(f)).not.toBeNull();
  });

  it('skips the boot sequence later in the same session', async () => {
    const f = await render();
    expect(el(f).querySelector('.boot')).toBeNull();
    expect(input(f)).not.toBeNull();
  });

  it('runs a typed command and prints its output under the prompt', async () => {
    const f = await render();
    await enter(f, 'echo hi there');
    expect(text(f)).toContain('guest@jaxon.dev:~$ echo hi there');
    expect(text(f)).toContain('hi there');
    expect(input(f).value).toBe('');
  });

  it('draws the cursor and selection where the real input has them', async () => {
    const f = await render();
    const ghost = () => el(f).querySelector('.ghost')!;
    const moveTo = async (start: number, end = start) => {
      input(f).setSelectionRange(start, end);
      input(f).dispatchEvent(new KeyboardEvent('keyup'));
      await f.whenStable();
    };
    await type(f, 'hello');
    expect(ghost().querySelector('.cursor')!.textContent).toBe('█');
    await moveTo(2);
    expect(ghost().textContent).toBe('hello');
    expect(ghost().querySelector('.cursor')!.textContent).toBe('l');
    await moveTo(1, 4);
    expect(ghost().querySelector('.sel')!.textContent).toBe('ell');
    expect(ghost().querySelector('.cursor')).toBeNull();
    await enter(f, 'date');
    await key(f, input(f), { key: 'ArrowUp' });
    expect(ghost().textContent).toBe('date█');
  });

  it('keeps a whole emoji under the cursor', async () => {
    const f = await render();
    for (const emoji of ['🔥', '👨‍👩‍👧', '🇺🇸', 'é']) {
      const text = `echo ${emoji}!`;
      await type(f, text);
      input(f).setSelectionRange(5, 5);
      input(f).dispatchEvent(new KeyboardEvent('keyup'));
      await f.whenStable();
      const ghost = el(f).querySelector('.ghost')!;
      expect(ghost.querySelector('.cursor')!.textContent, emoji).toBe(emoji);
      expect(ghost.textContent, emoji).toBe(text);
    }
  });

  it('walks history with the arrow keys', async () => {
    const f = await render();
    await enter(f, 'date');
    await enter(f, 'echo two');
    await key(f, input(f), { key: 'ArrowUp' });
    expect(input(f).value).toBe('echo two');
    await key(f, input(f), { key: 'ArrowUp' });
    expect(input(f).value).toBe('date');
    await key(f, input(f), { key: 'ArrowDown' });
    expect(input(f).value).toBe('echo two');
    await key(f, input(f), { key: 'ArrowDown' });
    expect(input(f).value).toBe('');
  });

  it('completes a unique prefix with Tab and lists ambiguous ones', async () => {
    const f = await render();
    await type(f, 'pro');
    const tab = await key(f, input(f), { key: 'Tab' });
    expect(tab.defaultPrevented).toBe(true);
    expect(input(f).value).toBe('projects');
    await type(f, 'h');
    await key(f, input(f), { key: 'Tab' });
    expect(text(f)).toContain('help   history');
  });

  it('clears with Ctrl+L and interrupts with Ctrl+C', async () => {
    const f = await render();
    await enter(f, 'echo gone');
    await key(f, input(f), { key: 'l', ctrlKey: true });
    expect(text(f)).not.toContain('echo gone');
    await type(f, 'half typed');
    await key(f, input(f), { key: 'c', ctrlKey: true });
    expect(text(f)).toContain('half typed^C');
    expect(input(f).value).toBe('');
  });

  it('runs a command when its output line is clicked', async () => {
    const f = await render();
    await enter(f, 'nope');
    el(f).querySelector<HTMLButtonElement>('.output button.line')!.click();
    await f.whenStable();
    expect(text(f)).toContain('AVAILABLE COMMANDS');
  });

  it('navigates from the footer and shows the page below its echoed command', async () => {
    const f = await render();
    const button = [...el(f).querySelectorAll<HTMLButtonElement>('.quick button')].find(b => b.textContent!.includes('projects'))!;
    button.click();
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/projects'));
    await vi.waitFor(() => expect(f.componentInstance.typed()).toBe('ls -l ./projects'));
    await f.whenStable();
    expect(text(f)).toContain('ls -l ./projects');
    expect(el(f).querySelector('.page .routed')).not.toBeNull();
  });

  it('types the echoed command out, or shows it at once under reduced motion', async () => {
    const f = await render();
    const term = TestBed.inject(TerminalService);
    term.routeEcho.set('cat contact.txt');
    await f.whenStable();
    expect(f.componentInstance.typed()).not.toBe('cat contact.txt');
    await vi.waitFor(() => expect(f.componentInstance.typed()).toBe('cat contact.txt'));

    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
    try {
      term.routeEcho.set('ls -l ./projects');
      await f.whenStable();
      expect(f.componentInstance.typed()).toBe('ls -l ./projects');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('focuses the prompt when a printable key is pressed elsewhere', async () => {
    const f = await render();
    input(f).blur();
    await key(f, document.body, { key: 'a' });
    await vi.waitFor(() => expect(document.activeElement).toBe(input(f)));
  });

  describe('pay', () => {
    afterEach(() => vi.restoreAllMocks());

    async function scrolledTo(f: ComponentFixture<AppComponent>, scroll: ReturnType<typeof vi.spyOn>): Promise<void> {
      await vi.waitFor(() => expect(scroll.mock.contexts).toContain(el(f).querySelector('#pay')));
    }

    it('keeps its own echo and scrolls to the payment links', async () => {
      const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
      const f = await render(true, appRoutes);
      await enter(f, 'pay');
      await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/pay'));
      await vi.waitFor(() => expect(f.componentInstance.typed()).toBe('cat contact.txt --pay'));
      await f.whenStable();
      expect(text(f)).toContain('cat contact.txt --pay');
      await scrolledTo(f, scroll);
    });

    it('scrolls to the payment links when /pay is opened directly', async () => {
      const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
      const f = await render(true, appRoutes);
      await TestBed.inject(Router).navigateByUrl('/pay');
      await f.whenStable();
      await vi.waitFor(() => expect(f.componentInstance.typed()).toBe('cat contact.txt --pay'));
      await scrolledTo(f, scroll);
    });

    it('scrolls to the payment links once a first-visit boot finishes', async () => {
      const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
      const f = await render(false, appRoutes);
      await TestBed.inject(Router).navigateByUrl('/pay');
      await key(f, document.body, { key: 'x' });
      await scrolledTo(f, scroll);
    });

    it('scrolls back to the top for other pages', async () => {
      const f = await render(true, appRoutes);
      const screen = el(f).querySelector<HTMLElement>('.screen')!;
      const top = vi.spyOn(screen, 'scrollTo');
      await TestBed.inject(Router).navigateByUrl('/contact');
      await vi.waitFor(() => expect(top).toHaveBeenCalledWith({ top: 0 }));
    });
  });

  describe('theme picker', () => {
    const css = (name: string) => document.documentElement.style.getPropertyValue(name);
    const meta = (name: string) => document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');

    beforeAll(() => {
      for (const [name, content] of [['color-scheme', 'dark'], ['theme-color', '#000']]) {
        if (document.querySelector(`meta[name="${name}"]`)) continue;
        const m = document.createElement('meta');
        m.name = name;
        m.content = content;
        document.head.append(m);
      }
    });
    const button = (f: ComponentFixture<AppComponent>) => el(f).querySelector<HTMLButtonElement>('.theme-btn')!;

    it('applies the current theme to the page', async () => {
      await render();
      const midnight = TERMINAL_THEMES.find(t => t.name === DEFAULT_THEME)!;
      expect(css('--t-bg')).toBe(midnight.background);
      TestBed.inject(TerminalService).execute('theme flexoki-light');
      await vi.waitFor(() => expect(css('--t-bg')).toBe('#FFFCF0'));
      expect(document.documentElement.classList.contains('t-light')).toBe(true);
      expect(meta('color-scheme')).toBe('light');
      expect(meta('theme-color')).toBe('#FFFCF0');
      TestBed.inject(TerminalService).execute('theme nord');
      await vi.waitFor(() => expect(meta('color-scheme')).toBe('dark'));
    });

    it('picks a theme from the keyboard', async () => {
      const f = await render();
      button(f).click();
      await f.whenStable();
      const list = el(f).querySelector<HTMLElement>('[role=listbox]')!;
      expect(list).not.toBeNull();
      await key(f, list, { key: 'ArrowDown' });
      await key(f, list, { key: 'Enter' });
      expect(el(f).querySelector('[role=listbox]')).toBeNull();
      expect(button(f).textContent).toContain(TERMINAL_THEMES[1].name);
      expect(localStorage.getItem('jxn-terminal-theme')).toBe(TERMINAL_THEMES[1].name);
    });

    it('closes on Escape without changing the theme', async () => {
      const f = await render();
      button(f).click();
      await f.whenStable();
      const list = el(f).querySelector<HTMLElement>('[role=listbox]')!;
      await key(f, list, { key: 'ArrowDown' });
      await key(f, list, { key: 'Escape' });
      expect(el(f).querySelector('[role=listbox]')).toBeNull();
      expect(button(f).textContent).toContain(DEFAULT_THEME);
    });
  });
});
