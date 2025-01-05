import { Component, OnInit, computed } from '@angular/core';
import { ThemeService, ThemeType } from '../../services/theme/theme.service';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css'],
    imports: [MatToolbar, RouterLink]
})
export class FooterComponent implements OnInit {
  currentYear : number;

  footerLogoPath = computed(()=> {
    if (this.theme.themeType() == ThemeType.Light) 
      return '../../assets/img/branding/jhwb.png'
    return '../../assets/img/branding/jhw.png' 
  })

  constructor(public theme : ThemeService) { }

  ngOnInit() {
    this.currentYear = new Date().getFullYear();
  }

}
