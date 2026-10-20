import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';

async function renderOn(date: Date): Promise<string> {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(date);
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'projects', children: [] }])] });
  const fixture = TestBed.createComponent(HomeComponent);
  await fixture.whenStable();
  return (fixture.nativeElement as HTMLElement).textContent!;
}

describe('HomeComponent', () => {
  afterEach(() => vi.useRealTimers());

  it('counts age and tenure in whole years, turning over on the day', async () => {
    const before = await renderOn(new Date(2026, 1, 24, 23, 59));
    expect(before).toContain('I am a 30-year-old');
    expect(before).toContain('(8 years)');
    TestBed.resetTestingModule();
    const after = await renderOn(new Date(2026, 6, 13, 0, 1));
    expect(after).toContain('I am a 31-year-old');
    expect(after).toContain('(9 years)');
    TestBed.resetTestingModule();
    expect(await renderOn(new Date(2026, 6, 12, 23, 59))).toContain('(8 years)');
  });

  it('greets by time of day', async () => {
    expect(await renderOn(new Date(2026, 0, 1, 9))).toContain('Good Morning');
    TestBed.resetTestingModule();
    expect(await renderOn(new Date(2026, 0, 1, 14))).toContain('Good Afternoon');
    TestBed.resetTestingModule();
    expect(await renderOn(new Date(2026, 0, 1, 20))).toContain('Good Evening');
  });

  it('labels the block-art photo and logos for screen readers', async () => {
    await renderOn(new Date(2026, 0, 1));
    const labels = [...document.querySelectorAll('[role=img]')].map(e => e.getAttribute('aria-label'));
    expect(labels).toEqual(expect.arrayContaining(['Photo of Jaxon Wright', 'Volgistics logo', 'Configura logo']));
  });

  it('opens projects through the router, keeping the session alive', async () => {
    await renderOn(new Date(2026, 0, 1));
    const link = document.querySelector<HTMLAnchorElement>('a[href="/projects"]')!;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(click);
    await new Promise(r => setTimeout(r));
    expect(click.defaultPrevented).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/projects');
  });
});
