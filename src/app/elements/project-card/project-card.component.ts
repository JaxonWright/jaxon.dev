import { Component, OnInit, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

/** Card shape from the pre-terminal projects page. */
export interface Project {
  logo: string; darkLogo?: string; title: string; description: string; logoOnly: boolean;
  categories: { icon: IconProp; title: string }[]; actions: { link: string; title: string }[];
}
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatChipListbox, MatChip } from '@angular/material/chips';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatAnchor } from '@angular/material/button';



@Component({
    selector: 'app-project-card',
    templateUrl: './project-card.component.html',
    styleUrls: ['./project-card.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
      MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatChipListbox,
      MatChip, FaIconComponent, MatCardContent, MatCardActions, MatAnchor
    ]
})
export class ProjectCardComponent implements OnInit {
  project = input<Project>();
  imageSource = computed(() => {
    if (this.project()?.darkLogo) {
      return this.project().darkLogo;
    } else {
      return this.project().logo ?? '';
    }
  });

  constructor(
    public router : Router,
  ) { 

  }

  ngOnInit() {
  }

}