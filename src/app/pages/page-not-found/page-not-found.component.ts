import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-page-not-found',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './page-not-found.component.html',
    styleUrls: ['./page-not-found.component.css'],
    standalone: false
})
export class PageNotFoundComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
