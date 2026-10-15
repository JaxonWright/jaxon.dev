import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NgTemplateOutlet } from '@angular/common';
import { DateTime } from 'luxon';
import { PHOTO_LEVELS, PHOTO_LEVEL_COUNT, VOLGISTICS_LOGO, CONFIGURA_LOGO, GVSU_LOGO } from '@services/ascii-art';

export interface ArtRun { fg: string; bg: string; text: string; }

@Component({
    selector: 'app-home',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [NgTemplateOutlet]
})
export class HomeComponent implements OnInit, AfterViewInit {
  yearsAtVolgistics : number;
  /** ▀ half-block photo: top/bottom luminance per cell, tinted from near-black to the theme color. */
  readonly art = { volgistics: VOLGISTICS_LOGO, configura: CONFIGURA_LOGO, gvsu: GVSU_LOGO };
  readonly photoRows: ArtRun[][] = PHOTO_LEVELS.map(row => row.map(([fg, bg, n]) => ({
    fg: this.tint(fg), bg: this.tint(bg), text: '▀'.repeat(n),
  })));

  private tint(level: number): string {
    const pct = Math.round(Math.pow(level / (PHOTO_LEVEL_COUNT - 1), 1.1) * 100);
    return `color-mix(in srgb, var(--t-photo) ${pct}%, #000)`;
  }

  constructor(private titleServ : Title) { 
    this.titleServ.setTitle('Jaxon Wright - About');
  }

  ngOnInit() {
    this.yearsAtVolgistics = this.getYearsAtVolgistics();
  }

  ngAfterViewInit() {
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

  getAge() : number {
    let birthday = DateTime.fromISO('1995-02-25');
    let now = DateTime.now();

	  return Math.floor(now.diff(birthday, 'years').years);
  }

  getYearsAtVolgistics() : number {
    let anniv = DateTime.fromISO('2017-07-13');
    let now = DateTime.now();

    return Math.floor(now.diff(anniv,'years').years);
  }


}
