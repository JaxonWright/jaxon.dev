import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AppComponent } from '@app/app.component';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatAnchor } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { LogoComponent } from "../logo/logo.component";

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    imports: [
      MatToolbar, MatToolbarRow, MatAnchor, RouterLink,
      MatTooltip, RouterLinkActive, LogoComponent,
    ]
})
export class NavbarComponent {
  constructor(
    public router: Router,
    public app: AppComponent,
  ) { }

}
