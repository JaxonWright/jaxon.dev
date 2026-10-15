import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DateTime } from 'luxon';
import { PHOTO, VOLGISTICS_LOGO, CONFIGURA_LOGO, GVSU_LOGO } from '@services/ascii-art';

@Component({
    selector: 'app-home',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: []
})
export class HomeComponent implements OnInit, AfterViewInit {
  yearsAtVolgistics : number;
  readonly art = { photo: PHOTO, volgistics: VOLGISTICS_LOGO, configura: CONFIGURA_LOGO, gvsu: GVSU_LOGO };

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
