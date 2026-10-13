import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { VERSION } from '../../../environments/version';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatToolbar, RouterLink]
})
export class FooterComponent implements OnInit {
  currentYear : number;
  buildHash: string;

  constructor() {

   }

  ngOnInit() {
    this.currentYear = new Date().getFullYear();
    this.buildHash = VERSION.hash;
  }

}
