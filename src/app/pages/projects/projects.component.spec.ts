import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ProjectsComponent } from './projects.component';
import contributions from '../../services/contributions.json';

async function render() {
  const fixture = TestBed.createComponent(ProjectsComponent);
  await fixture.whenStable();
  return { page: fixture.componentInstance, el: fixture.nativeElement as HTMLElement, fixture };
}

describe('ProjectsComponent', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'projects', component: ProjectsComponent }])],
    });
  });

  it('lists every fetched contribution with its PRs', async () => {
    const { el } = await render();
    const prs = contributions.repos.reduce((n, r) => n + r.prs.length, 0);
    expect(el.textContent).toContain(`${contributions.repos.length} repos · ${prs} pull requests`);
    for (const repo of contributions.repos) {
      const link = el.querySelector<HTMLAnchorElement>(`a[href="${repo.url}"]`);
      expect(link?.textContent).toBe(repo.repo);
      for (const pr of repo.prs) expect(el.querySelector(`a[href="${pr.url}"]`)?.textContent).toBe(`#${pr.number}`);
    }
  });

  it('marks archived and unreleased projects and counts the active ones', async () => {
    const { page, el } = await render();
    const archived = page.personal.filter(p => p.archived).length;
    expect(el.textContent).toContain(`${page.personal.length - archived} active, ${archived} archived`);
    expect(el.querySelectorAll('.tag-archived').length).toBe(archived);
    const unreleased = [...page.personal, ...page.grokBots, ...page.professional].filter(p => p.unreleased).map(p => p.title);
    expect([...el.querySelectorAll('.tag-unreleased')].map(t => t.closest('h3')?.textContent?.replace('UNRELEASED', '').trim())).toEqual(unreleased);
  });

  it('keeps archived projects collapsed until the toggle is pressed', async () => {
    const fixture = TestBed.createComponent(ProjectsComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const archived = fixture.componentInstance.personal.filter(p => p.archived).length;
    const toggle = el.querySelector<HTMLButtonElement>('.archive-toggle')!;
    const panel = el.querySelector<HTMLElement>('#archived-projects')!;
    expect(toggle.getAttribute('aria-controls')).toBe('archived-projects');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.querySelector('.caret')?.textContent).toBe('►');
    expect(toggle.querySelector('.lbl')?.textContent).toBe(`archived (${archived})`);
    expect(panel.hidden).toBe(true);
    expect(panel.querySelectorAll('.tag-archived').length).toBe(archived);
    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.querySelector('.caret')?.textContent).toBe('▼');
    expect(panel.hidden).toBe(false);
  });

  it('opens every project link in a new tab', async () => {
    const { el } = await render();
    const links = [...el.querySelectorAll<HTMLAnchorElement>('a:not(.section-anchor)')];
    expect(links.length).toBeGreaterThan(10);
    for (const a of links) {
      expect(a.target).toBe('_blank');
      expect(a.rel).toContain('noopener');
    }
  });

  it('turns a Grok Bot face to look down while it is hovered', async () => {
    const fixture = TestBed.createComponent(ProjectsComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const face = el.querySelector<HTMLElement>('[aria-label="Penny logo"]')!;
    const other = el.querySelector<HTMLElement>('[aria-label="Larry logo"]')!;
    const [resting, otherResting] = [face.textContent, other.textContent];
    face.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    expect(face.textContent).not.toBe(resting);
    expect(face.textContent!.length).toBe(resting!.length);
    expect(other.textContent).toBe(otherResting);
    face.dispatchEvent(new MouseEvent('mouseleave'));
    await fixture.whenStable();
    expect(face.textContent).toBe(resting);
  });

  it('gives every section a stable fragment id and heading link', async () => {
    const { el } = await render();
    const sections: [string, RegExp][] = [
      ['open-source', /Notable open source contributions/],
      ['personal-projects', /Personal projects/],
      ['archived', /archived \(\d+\)/],
      ['grok-bots', /Grok Bots/],
      ['professional-work', /Professional work/],
    ];
    for (const [id, heading] of sections) {
      const section = el.querySelector<HTMLElement>(`#${id}`);
      expect(section, id).not.toBeNull();
      expect(section!.textContent).toMatch(heading);
      const link = section!.querySelector<HTMLAnchorElement>('a.section-anchor');
      expect(link?.getAttribute('href'), id).toBe(`/projects#${id}`);
      expect(link?.textContent).toBe('#');
      expect(link?.target).toBe('');
    }
  });

  it('expands archived projects when opened at #archived', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/projects#archived');
    const fixture = TestBed.createComponent(ProjectsComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.showArchived()).toBe(true);
    expect(el.querySelector<HTMLElement>('#archived-projects')!.hidden).toBe(false);
    expect(el.querySelector('.archive-toggle')!.getAttribute('aria-expanded')).toBe('true');
  });

  it('reopens archived projects when their heading link is clicked again', async () => {
    const { el, fixture } = await render();
    await TestBed.inject(Router).navigateByUrl('/projects#archived');
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('.archive-toggle')!.click();
    await fixture.whenStable();
    expect(el.querySelector<HTMLElement>('#archived-projects')!.hidden).toBe(true);
    el.querySelector<HTMLAnchorElement>('#archived .section-anchor')!.click();
    await fixture.whenStable();
    expect(el.querySelector<HTMLElement>('#archived-projects')!.hidden).toBe(false);
  });

  it('expands archived projects when navigated to #archived', async () => {
    const { el, fixture } = await render();
    expect(el.querySelector<HTMLElement>('#archived-projects')!.hidden).toBe(true);
    await TestBed.inject(Router).navigateByUrl('/projects#archived');
    await fixture.whenStable();
    expect(fixture.componentInstance.showArchived()).toBe(true);
    expect(el.querySelector<HTMLElement>('#archived-projects')!.hidden).toBe(false);
  });

  it('draws a logo for every project, falling back to the GitHub mark', async () => {
    const { page, el } = await render();
    expect(page.logo('not-a-logo')).toEqual(page.logo('github'));
    for (const art of el.querySelectorAll('.proj-logo')) expect(art.textContent!.trim()).not.toBe('');
  });
});
