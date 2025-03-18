import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AppComponent } from '@app/app.component';
import { ThemeService, ThemeType } from '@services/theme/theme.service';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatAnchor, MatIconAnchor, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { LogoComponent } from "../logo/logo.component";

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    imports: [
      MatToolbar, MatToolbarRow, MatAnchor, RouterLink, MatIconAnchor,
      MatTooltip, FaIconComponent, MatIconButton, MatMenuTrigger,
      MatIcon, MatMenu, MatMenuItem, RouterLinkActive, LogoComponent,
    ]
})
export class NavbarComponent {
  ThemeType = ThemeType;
  
  constructor(
    public router: Router,
    public app: AppComponent,
    public theme: ThemeService
  ) { }

}
