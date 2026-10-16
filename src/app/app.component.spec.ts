import { TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { TerminalService } from '@services/terminal.service';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    sessionStorage.setItem('jxn-terminal-booted', '1');
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the terminal banner and prompt', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.ascii-logo')).toBeTruthy();
    expect(el.textContent).not.toContain('JXN_TERMINAL');
    expect(el.querySelector('input#cmd')).toBeTruthy();
  });

  it('should print help and unknown-command output', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const term = TestBed.inject(TerminalService);
    term.execute('help');
    term.execute('nope');
    const entries = term.entries();
    expect(entries.length).toBe(2);
    expect(entries[0].lines.some(l => l.text.startsWith('playlists'))).toBeTrue();
    expect(entries[1].lines[0].text).toContain('command not found');
  });
});
