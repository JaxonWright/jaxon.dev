import { TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  it('links every contact and payment method, mail in place and the rest in a new tab', async () => {
    const fixture = TestBed.createComponent(ContactComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const page = fixture.componentInstance;
    for (const l of [...page.contact, ...page.pay]) {
      const a = el.querySelector<HTMLAnchorElement>(`a[href="${l.href}"]`)!;
      expect(a.textContent).toBe(l.label);
      expect(a.getAttribute('target')).toBe(l.href.startsWith('mailto:') ? null : '_blank');
    }
    expect(el.querySelector('#pay')).not.toBeNull();
  });
});
