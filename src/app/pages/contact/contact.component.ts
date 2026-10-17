import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';

export interface ContactLink { name: string; label: string; href: string; }

@Component({
    selector: 'app-contact',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './contact.component.html',
    imports: []
})
export class ContactComponent implements OnInit {
  readonly contact: ContactLink[] = [
    { name: 'X', label: '@jxn_w', href: 'https://x.com/jxn_w' },
    { name: 'EMAIL', label: 'j@jaxon.dev', href: 'mailto:j@jaxon.dev' },
    { name: 'GITHUB', label: 'github.com/jaxonwright', href: 'https://github.com/jaxonwright' },
    { name: 'STACK OVERFLOW', label: 'stackoverflow.com/users/3186832/jxn', href: 'https://stackoverflow.com/users/3186832/jxn' },
    { name: 'LINKEDIN', label: 'linkedin.com/in/jaxonwright', href: 'http://linkedin.com/in/jaxonwright' },
    { name: 'INSTAGRAM', label: '@jxn.w', href: 'https://instagram.com/jxn.w' },
  ];
  readonly pay: ContactLink[] = [
    { name: 'VENMO', label: '@jaxonwright', href: 'https://venmo.com/jaxonwright' },
    { name: 'CASH APP', label: '$jxnw', href: 'https://cash.me/$jxnw' },
    { name: 'PAYPAL', label: 'paypal.me/JaxonWright', href: 'https://paypal.me/JaxonWright' },
    { name: 'GOOGLE PAY', label: 'gpay.app.goo.gl/pay-I6sft0Ab64O', href: 'https://gpay.app.goo.gl/pay-I6sft0Ab64O' },
  ];

  constructor(private titleServ : Title) {
    this.titleServ.setTitle('Jaxon Wright - Contact');
  }

  ngOnInit() {
  }
}
