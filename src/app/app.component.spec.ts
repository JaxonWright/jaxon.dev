import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { TerminalService, TERMINAL_THEMES, DEFAULT_THEME } from '@services/terminal.service';

@Component({ template: '<p class="routed">routed page</p>' })
class Page {}

async function render(booted = true): Promise<ComponentFixture<AppComponent>> {
  sessionStorage.clear();
  if (booted) sessionStorage.setItem('jxn-terminal-booted', '1');
  window.history.replaceState(null, '', '/');
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: '**', component: Page }])],
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

  it('focuses the prompt when a printable key is pressed elsewhere', async () => {
    const f = await render();
    input(f).blur();
    await key(f, document.body, { key: 'a' });
    await vi.waitFor(() => expect(document.activeElement).toBe(input(f)));
  });

  describe('theme picker', () => {
    const css = (name: string) => document.documentElement.style.getPropertyValue(name);
    const button = (f: ComponentFixture<AppComponent>) => el(f).querySelector<HTMLButtonElement>('.theme-btn')!;

    it('applies the current theme to the page', async () => {
      await render();
      const midnight = TERMINAL_THEMES.find(t => t.name === DEFAULT_THEME)!;
      expect(css('--t-bg')).toBe(midnight.background);
      TestBed.inject(TerminalService).execute('theme flexoki-light');
      await vi.waitFor(() => expect(css('--t-bg')).toBe('#FFFCF0'));
      expect(document.documentElement.classList.contains('t-light')).toBe(true);
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
