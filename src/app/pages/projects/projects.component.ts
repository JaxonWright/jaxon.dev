import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NgTemplateOutlet } from '@angular/common';
import { PROJECT_LOGOS } from '@services/ascii-art';
declare var require: any;

export interface Link { title: string; link: string; }
export interface Project {
  title: string;
  logo: string;
  description: string;
  tags: string[];
  links: Link[];
  archived?: boolean;
  /** Repo is private: no public link. */
  note?: string;
}
export interface PullRequest { number: number; title: string; state: 'merged' | 'open' | 'closed'; url: string; date: string; }
export interface Contribution { repo: string; url: string; description: string; prs: PullRequest[]; }
export interface Cell { text: string; fg: string; bg: string; }

// Minor tone is the page background, so light details (the Volgistics V, testube's tt) read as cut-outs on every theme.
const TONES = ['', 'var(--t-primary)', 'var(--t-bg)'];

/** Logo for a contributed-to repo; anything unknown (a new repo picked up at build time) gets the GitHub mark. */
const CONTRIB_LOGOS: Record<string, string> = {
  'mattlewis92/angular-calendar': 'angular', 'Cordobo/angularx-qrcode': 'angular',
  'Dymstro/nova-chatmix-linux': 'steelseries', 'ypMrg/omarchy-bambu-companion': 'bambulab',
};
const contribLogo = (repo: string) => CONTRIB_LOGOS[repo] ?? (/omarchy/i.test(repo) ? 'omarchy' : /angular/i.test(repo) ? 'angular' : 'github');

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
  imports: [NgTemplateOutlet],
})
export class ProjectsComponent {
  /** Fetched at build time by scripts/fetch-contributions.mjs (committed snapshot as fallback). */
  readonly contributions: (Contribution & { logo: string; merged: number })[] =
    (require('../../services/contributions.json').repos as Contribution[]).map(r => ({
      ...r, logo: contribLogo(r.repo), merged: r.prs.filter(p => p.state === 'merged').length,
    }));
  readonly prCount = this.contributions.reduce((n, r) => n + r.prs.length, 0);

  private readonly cache = new Map<string, Cell[][]>();

  /** Two-tone ▀▄█ cells; a background colour is only needed where both halves are inked. */
  logo(key: string): Cell[][] {
    let rows = this.cache.get(key);
    if (!rows) {
      rows = (PROJECT_LOGOS[key] ?? PROJECT_LOGOS['github']).map(row => row.map(([t, b, n]) => {
        const ch = t && b ? (t === b ? '█' : '▀') : t ? '▀' : b ? '▄' : ' ';
        return { text: ch.repeat(n), fg: TONES[t || b], bg: t && b && t !== b ? TONES[b] : '' };
      }));
      this.cache.set(key, rows);
    }
    return rows;
  }

  readonly personal: Project[] = [
    {
      title: 'jaxon.dev', logo: 'jw',
      description: 'The website that you are currently on. This is my personal website.',
      tags: ['MIT', 'Angular', 'TypeScript', 'HTML', 'CSS'],
      links: [{ title: 'GitHub', link: 'https://github.com/JaxonWright/jaxon.dev' }],
    },
    {
      title: 'testube', logo: 'testube',
      description: `Used by more than 3,000 people every month, testube provides Tesla drivers with seamless access to a wide range of media services while their vehicle is parked. What sets it apart is its ability to activate Tesla's "Theater Mode," allowing any application or content to be displayed in full screen, enhancing the overall viewing experience.`,
      tags: ['GPL-3.0', 'Angular', 'TypeScript', 'HTML', 'CSS'],
      links: [{ title: 'Website', link: 'https://testube.app' }, { title: 'GitHub', link: 'https://github.com/arbitrari/testube' }],
    },
    {
      title: 'OmniGear', logo: 'omnigear',
      description: 'Omarchy plugin to manage and configure peripherals across brands and product types.',
      tags: ['GPL-3.0', 'Omarchy', 'Linux'],
      links: [{ title: 'GitHub', link: 'https://github.com/arbitrari/omarchy-omnigear' }],
    },
    {
      title: 'dotfiles', logo: 'omarchy',
      description: 'Dotfiles for my Omarchy configuration, managed using GNU Stow, plus scripts to install programs, packages and plugins.',
      tags: ['MIT', 'Omarchy', 'Lua', 'Shell'],
      links: [{ title: 'GitHub', link: 'https://github.com/JaxonWright/dotfiles' }],
    },
    {
      title: 'Omarchy Midnight', logo: 'omarchy',
      description: 'A theme for Omarchy that gives you the inky black that your OLED monitor craves. It is also the default theme of this site.',
      tags: ['Omarchy', 'Theme'],
      links: [{ title: 'GitHub', link: 'https://github.com/JaxonWright/omarchy-midnight-theme' }],
    },
    {
      title: 'Digalog', logo: 'wearos',
      description: 'A Wear OS watch face that combines digital and analog in one.',
      tags: ['GPL-3.0', 'Wear OS'],
      links: [], note: 'source not public yet',
    },
    {
      title: 'sentinel', logo: 'sentinel', archived: true,
      description: `A free, open-source Windows, macOS, and Linux application that allows you to efficiently view, manage, and export sentry and dashcam footage from your Tesla vehicle. It does require you to have access to the USB drive containing the footage, whether that be directly plugged into your computer or using a more complicated setup with a network share.`,
      tags: ['GPL-3.0', 'Windows', 'macOS', 'Linux', 'Angular', 'Tauri', 'TypeScript', 'Rust'],
      links: [{ title: 'GitHub', link: 'https://github.com/arbitrari/sentinel' }],
    },
    {
      title: 'Passageway', logo: 'passageway', archived: true,
      description: `Passageway is an attempt to provide a cost-effective, scalable, and automated method of aggregating foot traffic data within a facility. Such data aggregation offers meaningful statistics about the foot traffic of individuals within a defined space. With Passageway, users are able to see heat maps and view graphs that represent the foot traffic in a building, and analyze it on a website with various building floor-plans layered onto a Google Map. Users may also specify a certain time frame to see specific temporal data. All of the data is collected within the facilities through a system including CHIP computers connected to a pair of Infrared break beams. Ultimately, the data may be used to determine the frequency of activity for specific rooms, hallways, or entryways. Foot traffic data may be useful for understanding activity within a facility, seeing popularity of certain areas during specific times, or identifying times where room capacity is exceeded and thus presents a fire code violation. This was also published in the Consortium for Computing Sciences in Colleges academic journal.`,
      tags: ['Android', 'Firebase', 'Java', 'Python', 'Polymer'],
      links: [{ title: 'GitHub', link: 'https://github.com/passageway' }, { title: 'Publication', link: 'https://dl.acm.org/citation.cfm?id=3007244' }],
    },
    {
      title: 'CineR8', logo: 'ciner8', archived: true,
      description: `CineR8 (Pronounced Cine [like in Cinema]-Rate) is an easy-to-use and very cleanly designed movie rating web application. The design tries to follow Google's Material Design guidelines as best as possible, which makes it look as clean as it does. There are no advertisements or obnoxious elements that hamper the user experience for what should be a simple web application. The Web app is built using Ember.js, a very robust Javascript framework. All of the movie information is pulled from TheMovieDB via their API. Movie ratings from 3rd party services are pulled from the OMDb API. User authentication and ratings are stored using Google's Firebase real-time database. The only personal information stored is the user's email, of which is not visible to others and is not shared by CineR8 anywhere. I know that there are bigger and arguably better services that do the same thing as CineR8. My motivation behind creating this web application was mainly to learn Ember.js, but I also wanted something simpler than the well-known services. I think that I acheived both goals and look forward to what this project will become over time.`,
      tags: ['MIT', 'Ember', 'Firebase', 'HTML', 'Javascript', 'CSS'],
      links: [{ title: 'Website', link: 'https://ciner8.com' }, { title: 'GitHub', link: 'https://github.com/jaxonwright/ciner8' }],
    },
    {
      title: 'eli5', logo: 'reddit', archived: true,
      description: `This project was created for CIS 365 Artificial Intelligence at Grand Valley State University. The project scrapes posts on the /r/eli5 (Explain Like I'm Five) subreddit on Reddit. The goal is to take the user's query and determine the reading level of the highest-rated comments and presents it to the user, so that they can make informed decisions about threads based on how easy the explanations are to understand. It was made in Java and just uses a simple command-line interface.`,
      tags: ['Java'],
      links: [{ title: 'GitHub', link: 'https://github.com/JaxonWright/eli5' }],
    },
    {
      title: 'TallyUp', logo: 'tallyup', archived: true,
      description: `This project was created for CIS 357 Mobile Applications at Grand Valley State University. TallyUp is a simple tool to create polls to settle anything you can think of. One example would be a group of employees or friends deciding on where to eat for lunch. Somebody would create a room that expires after a set amount of time, and shares a code/link with the others. They all vote on locations to eat and maybe even get access to navigate to the winner on Google Maps. That is one example, but there are a multitude of other use-cases that may get special features.`,
      tags: ['Android', 'Java', 'Firebase'],
      links: [{ title: 'GitHub', link: 'https://github.com/dunrite/tallyup' }],
    },
    {
      title: 'Pixbar', logo: 'pixbar', archived: true,
      description: `Pixbar modifies your device's navigation bar to have solid buttons. This is meant to resemble a certain device that has an exclusive on these kinds of buttons. Currently, Pixbar is meant for phones with stock Lollipop and above. This works without any root permissions needed, as well! This application is only meant for 3-button navigation mode.`,
      tags: ['Android', 'Java'],
      links: [{ title: 'GitHub', link: 'https://github.com/dunrite/pixbar' }],
    },
    {
      title: 'Xpaper', logo: 'xpaper', archived: true,
      description: `Specifically designed for all Moto X models, Xpaper provides a collection of simple, abstract wallpapers that you can customize to perfectly match your device's configuration. Even if you do not have a Moto X, you are still welcome to play with the app to get some clean wallpapers for your non-moto.`,
      tags: ['Android', 'Java'],
      links: [{ title: 'GitHub', link: 'https://github.com/dunrite/xpaper' }],
    },
    {
      title: 'nowPaper', logo: 'nowpaper', archived: true,
      description: `This was my first Android app. A unique, colorful new wallpaper app that provides your phone's homescreen with just the right touch of personality and feel. Choose between various landmarks and locations set in the iconic art-style of Google Now. The artwork was all done by the talented Alex Pasquarella.`,
      tags: ['Android', 'Java'],
      links: [{ title: 'GitHub', link: 'https://github.com/dunrite/nowpaper' }],
    },
    {
      title: 'PrEx', logo: 'delphi', archived: true,
      description: 'A simple process explorer application that can browse, kill and run Windows Processes. Made to get used to the Delphi programming language.',
      tags: ['Windows', 'Delphi'],
      links: [{ title: 'GitHub', link: 'https://github.com/JaxonWright/PrEx-Delphi' }],
    },
    {
      title: 'The Best Calculator Ever', logo: 'delphi', archived: true,
      description: 'A simple calculator Windows application created in Delphi. Mainly just to get familiar with the language.',
      tags: ['Windows', 'Delphi'],
      links: [{ title: 'GitHub', link: 'https://github.com/JaxonWright/calculator-delphi' }],
    },
  ];

  readonly professional: Project[] = [
    {
      title: 'VicNet', logo: 'volgistics',
      description: 'The Volgistics volunteer portal, rebuilt in Angular, along with its native Android and iOS app.',
      tags: ['Volgistics', 'Angular', 'Android', 'iOS'], links: [],
    },
    {
      title: 'Volgistics Help System', logo: 'volgistics',
      description: 'The help system for Volgistics.',
      tags: ['Volgistics'], links: [],
    },
    {
      title: 'Custom Shape Tool', logo: 'configura',
      description: "A custom shape tool for CET Designer, Configura's space-planning software, built during my internships at Configura.",
      tags: ['Configura', 'CET Designer', 'CM'], links: [],
    },
  ];

  /** Wordmark logos (wider than the 24-col icons) stack above their text. */
  isWide(key: string): boolean {
    return this.logo(key).some(row => row.reduce((n, c) => n + c.text.length, 0) > 30);
  }

  readonly activeCount = this.personal.filter(p => !p.archived).length;

  constructor(private title: Title) {
    this.title.setTitle('Jaxon Wright - Projects');
  }
}
