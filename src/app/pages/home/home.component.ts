import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NgTemplateOutlet } from '@angular/common';
import { DateTime } from 'luxon';
import { PHOTO_GRAY, PHOTO_GRAY_LEVELS, VOLGISTICS_COLOR, CONFIGURA_COLOR, GVSU_COLOR } from '@services/ascii-art';

type Run = [string | null, string | null, number];
export interface ArtRun { fg: string; bg: string; text: string; }
const toRuns = (rows: Run[][]): ArtRun[][] => rows.map(row => row.map(([fg, bg, n]) => ({
  fg: fg ?? 'transparent', bg: bg ?? 'transparent', text: (fg ? '▀' : bg ? '▄' : ' ').repeat(n),
})).map(r => r.fg === 'transparent' && r.bg !== 'transparent' ? { fg: r.bg, bg: 'transparent', text: r.text } : r));

@Component({
    selector: 'app-home',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [NgTemplateOutlet]
})
export class HomeComponent implements OnInit, AfterViewInit {
  yearsAtVolgistics : number;
  /** Grayscale ▀ half-block photo: each run has its own fg (top) and bg (bottom) gray. */
  readonly photoRows = PHOTO_GRAY.map(row => row.map(([fg, bg, n]) => ({
    fg: this.gray(fg), bg: this.gray(bg), text: '▀'.repeat(n),
  })));

  private gray(level: number): string {
    const v = Math.round(level / (PHOTO_GRAY_LEVELS - 1) * 255);
    return `rgb(${v},${v},${v})`;
  }
  readonly logos = { volgistics: toRuns(VOLGISTICS_COLOR), configura: toRuns(CONFIGURA_COLOR), gvsu: toRuns(GVSU_COLOR) };

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
