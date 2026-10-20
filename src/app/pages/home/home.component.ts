import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PHOTO_LEVELS, PHOTO_LEVEL_COUNT, VOLGISTICS_LOGO, CONFIGURA_LOGO, GVSU_LOGO } from '@services/ascii-art';

export interface ArtRun { fg: string; bg: string; text: string; }

/** Whole years since a local calendar date (month is 1-based). */
const yearsSince = (year: number, month: number, day: number, now = new Date()): number =>
  now.getFullYear() - year - (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day) ? 1 : 0);

@Component({
    selector: 'app-home',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [NgTemplateOutlet, RouterLink]
})
export class HomeComponent {
  readonly age = yearsSince(1995, 2, 25);
  readonly yearsAtVolgistics = yearsSince(2017, 7, 13);
  /** ▀ half-block photo: top/bottom luminance per cell, tinted from near-black to the theme color. */
  readonly art = { volgistics: VOLGISTICS_LOGO, configura: CONFIGURA_LOGO, gvsu: GVSU_LOGO };
  readonly photoRows: ArtRun[][] = PHOTO_LEVELS.map(row => row.map(([fg, bg, n]) => ({
    fg: this.tint(fg), bg: this.tint(bg), text: '▀'.repeat(n),
  })));

  /** Ramp: near-black -> --t-photo (spearmint on the default theme) -> --t-photo-hi (pale mint highlights). */
  private tint(level: number): string {
    const t = level / (PHOTO_LEVEL_COUNT - 1);
    const knee = 0.7;
    if (t <= knee) {
      const pct = Math.round(Math.pow(t / knee, 1.1) * 100);
      return `color-mix(in srgb, var(--t-photo) ${pct}%, var(--t-photo-lo))`;
    }
    const pct = Math.round((t - knee) / (1 - knee) * 100);
    return `color-mix(in srgb, var(--t-photo-hi) ${pct}%, var(--t-photo))`;
  }

  constructor(private titleServ : Title) { 
    this.titleServ.setTitle('Jaxon Wright - About');
  }

  getTimeGreeting() : string {
    var myDate = new Date();
    var hrs = myDate.getHours();
    
    if (hrs < 12)
        return 'Good Morning';
    if (hrs >= 12 && hrs <= 17)
        return 'Good Afternoon';
    if (hrs >= 17 && hrs <= 24)
        return'Good Evening';
  }
}
