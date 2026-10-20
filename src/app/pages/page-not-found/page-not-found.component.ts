import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-page-not-found',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './page-not-found.component.html',
    styleUrls: ['./page-not-found.component.css'],
    imports: []
})
export class PageNotFoundComponent {
  readonly path = typeof location !== 'undefined' ? location.pathname : '';
}
