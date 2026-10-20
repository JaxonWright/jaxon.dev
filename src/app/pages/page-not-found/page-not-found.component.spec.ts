import { TestBed } from '@angular/core/testing';
import { PageNotFoundComponent } from './page-not-found.component';

describe('PageNotFoundComponent', () => {
  it('names the missing path like a shell would', async () => {
    window.history.replaceState(null, '', '/secret/plans');
    const fixture = TestBed.createComponent(PageNotFoundComponent);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('bash: /secret/plans: No such file or directory');
  });
});
