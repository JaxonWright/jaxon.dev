import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { VERSION } from '../../../environments/version';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem, MatListItemAvatar, MatListItemTitle, MatListItemLine } from '@angular/material/list';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
declare var require: any;

export interface Dependency {
  name : string,
  link : string,
  version : string,
  icon : IconProp
}

@Component({
    selector: 'app-build-info',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './build-info.component.html',
    styleUrls: ['./build-info.component.css'],
    imports: [
      MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatList,
      MatListItem, FaIconComponent, MatListItemAvatar, MatListItemTitle, 
      MatListItemLine
    ]
})
export class BuildInfoComponent implements OnInit {
  dependencies : Dependency[];
  buildInfo : Dependency[];

  buildDate : string;

  constructor(private title : Title) { 
    this.title.setTitle('Jaxon Wright - Build Info');

    this.buildDate = new Date(VERSION.date).toLocaleString('en-US',{ year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' });
  }

  ngOnInit() {
    this.dependencies = [
                         {name: 'Angular', version: require('@angular/core/package.json').version, link: 'https://www.npmjs.com/package/@angular/core', icon: ['fab',  'angular']},
                         {name: 'Angular Material', version: require('@angular/material/package.json').version, link: 'https://www.npmjs.com/package/@angular/material', icon: ['fab', 'angular']},
                         {name: 'RxJS', version: require('rxjs/package.json').version, link: 'https://www.npmjs.com/package/rxjs', icon: ['fab',  'js']},
                         {name: 'TypeScript', version: require('typescript/package.json').version, link: 'https://www.npmjs.com/package/typescript', icon: ['fas', 'code']},
                         {name: 'Angular FontAwesome', version: require('@fortawesome/angular-fontawesome/package.json').version, link: 'https://www.fontawesome.com', icon: ['fab',  'font-awesome']},
                        ];
    
    this.buildInfo = [
                      {name: 'Hash', version: VERSION.hash, link: `https://github.com/JaxonWright/jaxonwright.com/commit/${VERSION.hash}`, icon: ['fas', 'hashtag']},
                      {name: 'Date', version: this.buildDate, link: '', icon: ['fas', 'calendar']}
                     ]

  }

}
