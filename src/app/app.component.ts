import { Component, HostBinding, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent implements OnInit {
  @HostBinding('class') componentCssClass;

  constructor(
    public overlayContainer : OverlayContainer
  ) {

  }

  ngOnInit() {

  }
}
