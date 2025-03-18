import { Component, HostBinding, OnInit } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ThemeService } from './services/theme/theme.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements OnInit {
  title = 'app';
  @HostBinding('class') componentCssClass;

  constructor(public overlayContainer : OverlayContainer, public theme : ThemeService){}

  ngOnInit() {
    this.setTheme(this.theme.getSaved());
  }

  setTheme(theme) {
    this.overlayContainer.getContainerElement().classList.forEach((v,k,p)=> {
      if (v.endsWith('theme')) {
        p.replace(v,theme);
        return;
      }
    })
    document.documentElement.classList.remove(this.theme.themeType())
    document.documentElement.classList.add(theme);
    this.componentCssClass = theme;
    this.theme.set(theme);
  }

}
