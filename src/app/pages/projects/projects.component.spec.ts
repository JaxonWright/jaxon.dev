import { TestBed } from '@angular/core/testing';
import { ProjectsComponent } from './projects.component';
import contributions from '../../services/contributions.json';

async function render() {
  const fixture = TestBed.createComponent(ProjectsComponent);
  await fixture.whenStable();
  return { page: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

describe('ProjectsComponent', () => {
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
    expect(el.querySelector('.tag-unreleased')?.closest('h3')?.textContent).toContain('Volgistics Admin');
  });

  it('opens every project link in a new tab', async () => {
    const { el } = await render();
    const links = [...el.querySelectorAll<HTMLAnchorElement>('a')];
    expect(links.length).toBeGreaterThan(10);
    for (const a of links) {
      expect(a.target).toBe('_blank');
      expect(a.rel).toContain('noopener');
    }
  });

  it('draws a logo for every project, falling back to the GitHub mark', async () => {
    const { page, el } = await render();
    expect(page.logo('not-a-logo')).toEqual(page.logo('github'));
    for (const art of el.querySelectorAll('.proj-logo')) expect(art.textContent!.trim()).not.toBe('');
  });
});
