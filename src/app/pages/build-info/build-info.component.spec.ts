import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BuildInfoComponent, detectOs } from './build-info.component';
import { TerminalService } from '@services/terminal.service';
import { VERSION } from '../../../environments/version';

const UA = {
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0 Safari/537.36',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0 Mobile Safari/537.36',
  linux: 'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0',
  cros: 'Mozilla/5.0 (X11; CrOS x86_64 16000.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0 Safari/537.36',
};

function asBrowser(userAgent: string, extra: object = {}) {
  vi.stubGlobal('navigator', { userAgent, language: 'en-US', maxTouchPoints: 0, ...extra });
}

describe('detectOs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  it('reads the user agent', () => {
    const cases: [string, string | null, string][] = [
      [UA.windows, 'windows', 'Windows'], [UA.mac, 'macos', 'macOS'], [UA.iphone, 'ios', 'iOS'],
      [UA.android, 'android', 'Android'], [UA.linux, 'linux', 'Linux'], [UA.cros, 'chromeos', 'ChromeOS'],
    ];
    for (const [ua, id, name] of cases) {
      asBrowser(ua);
      expect(detectOs()).toEqual({ id, name });
    }
  });

  it('treats a touch Mac as iPadOS', () => {
    asBrowser(UA.mac, { maxTouchPoints: 5 });
    expect(detectOs()).toEqual({ id: 'ios', name: 'iPadOS' });
  });

  it('prefers userAgentData when present', () => {
    asBrowser(UA.linux, { userAgentData: { platform: 'Windows' } });
    expect(detectOs().id).toBe('windows');
  });

  it('lets ?os= preview another logo', () => {
    asBrowser(UA.linux);
    window.history.replaceState(null, '', '/build-info?os=android');
    expect(detectOs()).toEqual({ id: 'android', name: 'Android' });
  });
});

describe('BuildInfoComponent', () => {
  afterEach(() => vi.unstubAllGlobals());

  async function render(userAgent: string) {
    asBrowser(userAgent);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BuildInfoComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('prints fastfetch-style fields for the visitor', async () => {
    const fixture = await render(UA.linux);
    const text = (fixture.nativeElement as HTMLElement).textContent!;
    expect(text).toContain('OS: Linux');
    expect(text).toContain('Terminal: Firefox 150');
    expect(text).toContain(`Build: ${VERSION.hash}`);
    expect(text).toContain('Theme: midnight');
    expect((fixture.nativeElement as HTMLElement).querySelector('.ff-logo')!.getAttribute('aria-label')).toBe('Linux logo');
  });

  it('follows theme changes live', async () => {
    const fixture = await render(UA.windows);
    TestBed.inject(TerminalService).execute('theme nord');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Theme: nord');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.ff-colors span').length).toBe(16);
  });
});
