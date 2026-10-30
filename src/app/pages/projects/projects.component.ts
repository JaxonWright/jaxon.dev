import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NgTemplateOutlet } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { PROJECT_LOGOS, PROJECT_LOGO_FRAMES } from '@services/ascii-art';
import { prefersReducedMotion } from '@services/motion';
declare var require: any;

export interface Link { title: string; link: string; }
export interface Project {
  title: string;
  logo: string;
  description: string;
  tags: string[];
  links: Link[];
  archived?: boolean;
  /** Built but not yet shipped. */
  unreleased?: boolean;
  /** Repo is private: no public link. */
  note?: string;
}
export interface PullRequest { number: number; title: string; state: 'merged' | 'open' | 'closed'; url: string; date: string; }
export interface Contribution { repo: string; url: string; description: string; prs: PullRequest[]; languages?: string[]; tags?: string[]; }
export interface Cell { text: string; fg: string; bg: string; }

// Minor tone is the page background, so light details (the Volgistics V, testube's tt) read as cut-outs on every theme.
const TONES = ['', 'var(--t-primary)', 'var(--t-bg)', 'var(--t-text)', 'var(--t-secondary)'];

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
  imports: [NgTemplateOutlet, RouterLink],
})
export class ProjectsComponent {
  /** Fetched at build time by scripts/fetch-contributions.mjs (committed snapshot as fallback). */
  readonly contributions: (Contribution & { logo: string; merged: number })[] =
    (require('../../services/contributions.json').repos as Contribution[]).map(r => ({
      ...r, logo: contribLogo(r.repo), merged: r.prs.filter(p => p.state === 'merged').length,
    }));
  readonly prCount = this.contributions.reduce((n, r) => n + r.prs.length, 0);

  private readonly cache = new Map<string, Cell[][]>();

  /** Current eye frame per animated face ('' = eyes open); see animateFaces(). */
  private readonly faceFrame = signal<Record<string, string>>({});
  /** The hovered face looks down at the pointer, like the Grok Bot app; it wins over blinks and glances. */
  readonly lookingDown = signal<string | null>(null);

  /** Two-tone ▀▄█ cells; a background colour is only needed where both halves are inked. */
  logo(key: string): Cell[][] {
    const frame = !PROJECT_LOGO_FRAMES[key] ? '' : this.lookingDown() === key ? 'down' : this.faceFrame()[key] || '';
    const id = frame ? `${key}:${frame}` : key;
    let rows = this.cache.get(id);
    if (!rows) {
      rows = (frame ? PROJECT_LOGO_FRAMES[key][frame] : PROJECT_LOGOS[key] ?? PROJECT_LOGOS['github']).map(row => row.map(([t, b, n]) => {
        const ch = t && b ? (t === b ? '█' : '▀') : t ? '▀' : b ? '▄' : ' ';
        return { text: ch.repeat(n), fg: TONES[t || b], bg: t && b && t !== b ? TONES[b] : '' };
      }));
      this.cache.set(id, rows);
    }
    return rows;
  }

  readonly personal: Project[] = [
    {
      title: 'testube', logo: 'testube',
      description: `Used by more than 3,000 people every month, testube provides Tesla drivers with seamless access to a wide range of media services while their vehicle is parked. What sets it apart is its ability to activate Tesla's "Theater Mode," allowing any application or content to be displayed in full screen, enhancing the overall viewing experience.`,
      tags: ['GPL-3.0', 'Angular', 'TypeScript', 'HTML', 'CSS'],
      links: [{ title: 'Website', link: 'https://testube.app' }, { title: 'GitHub', link: 'https://github.com/arbitrari/testube' }],
    },
    {
      title: 'Bot Catalog for Grok Bot', logo: 'bot-catalog',
      description: 'A template for building your own shareable catalog of Grok Bots that keep themselves up to date. Every bot checks its catalog daily for a newer release of itself, shows you the changelog, and updates only if you say so. The Catalog Manager bot sets up your catalog and runs it for you.',
      tags: ['GPL-3.0', 'Grok Bot', 'GitHub Actions', 'Python'],
      links: [
        { title: 'Template', link: 'https://github.com/JaxonWright/bot-catalog-for-grok-bot-template' },
        { title: 'My Catalog', link: 'https://github.com/JaxonWright/bot-catalog-for-grok-bot' },
      ],
    },
    {
      title: 'OmniGear', logo: 'omnigear', unreleased: true,
      description: 'Omarchy plugin to manage and configure peripherals across brands and product types.',
      tags: ['GPL-3.0', 'Omarchy', 'Go', 'QML'],
      links: [{ title: 'GitHub', link: 'https://github.com/arbitrari/omarchy-omnigear' }],
    },
    {
      title: 'Omarchy Midnight', logo: 'midnight',
      description: 'A theme for Omarchy that gives you the inky black that your OLED monitor craves. It\'s also the default theme for this site.',
      tags: ['Omarchy', 'Theme'],
      links: [{ title: 'GitHub', link: 'https://github.com/JaxonWright/omarchy-midnight-theme' }],
    },
    {
      title: 'Digalog', logo: 'digalog',
      description: 'A Wear OS watch face that combines digital and analog in one.',
      tags: ['GPL-3.0', 'Wear OS'],
      links: [{ title: 'Google Play', link: 'https://play.google.com/store/apps/details?id=com.arbitrary.digalog' }, { title: 'GitHub', link: 'https://github.com/arbitrari/digalog' }],
    },
    {
      title: 'jaxon.dev', logo: 'jw',
      description: 'The website that you are currently on. This is my personal website.',
      tags: ['MIT', 'Angular', 'TypeScript', 'HTML', 'CSS'],
      links: [{ title: 'GitHub', link: 'https://github.com/JaxonWright/jaxon.dev' }],
    },
    {
      title: 'dotfiles', logo: 'omarchy',
      description: 'Dotfiles for my Omarchy configuration, managed using GNU Stow, plus scripts to install programs, packages and plugins.',
      tags: ['MIT', 'Omarchy', 'Lua', 'Shell'],
      links: [{ title: 'GitHub', link: 'https://github.com/JaxonWright/dotfiles' }],
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

  /** Grok Bots from my Bot Catalog, in catalog order: one entry per bot (logo key from gen-ascii-art.py, link to its x.ai page). */
  readonly grokBots: Project[] = [
    {
      title: 'Beet', logo: 'beet',
      description: 'Sends you a short news briefing every morning and afternoon, built around what you\'re into, as a clickable reader-style page. Pulls from X, RSS feeds, and the web, and stays quiet when nothing\'s new.',
      tags: ['Grok Bot'],
      links: [{ title: 'Try it', link: 'https://x.ai/bot/uAXoYTM5ZsMb59OwxqiT3' }],
    },
    {
      title: 'Clipper', logo: 'clipper',
      description: 'Clips digital coupons at your grocery stores for the things you buy most, and tells you when and how to spend your rewards points.',
      tags: ['Grok Bot'],
      links: [{ title: 'Try it', link: 'https://x.ai/bot/OmQl-O-9WfvmuAtgF1Olc' }],
    },
    {
      title: 'Larry', logo: 'larry',
      description: 'Sends you an original, never-aired Seinfeld episode, as if the show never ended. Every episode is period-accurate, from the \'90s to the near future, with neat caveats around the holidays. More nothing from the show about nothing.',
      tags: ['Grok Bot'],
      links: [{ title: 'Try it', link: 'https://x.ai/bot/-KMOoE7O15K9grZvG1cFF' }],
    },
    {
      title: 'Penny', logo: 'penny',
      description: 'Hunts down every subscription you\'re paying for. Reads your bank charges and receipt emails, sorts everything into "likely cancel / worth a look / keep," links each cancel page, and cancels the ones you pick.',
      tags: ['Grok Bot'],
      links: [{ title: 'Try it', link: 'https://x.ai/bot/xYeE15lS-qomwX0uWkqYJ' }],
    },
    {
      title: 'Spud', logo: 'spud',
      description: 'A potato with exactly two things to say. Every reply is either "I am a poteto" or "I want to be french fries," no matter how hard you try to get anything else out of it.',
      tags: ['Grok Bot'],
      links: [{ title: 'Try it', link: 'https://x.ai/bot/m_6wVETSdYfrJ8JWk501X' }],
    },
  ];

  readonly professional: Project[] = [
    {
      title: 'Volgistics Admin', logo: 'volgistics', unreleased: true,
      description: 'A completely rewritten, modern administrative experience for the Volgistics platform.',
      tags: ['Volgistics', 'Angular'], links: [],
    },
    {
      title: 'VicNet', logo: 'volgistics',
      description: 'The Volgistics volunteer portal, rebuilt in Angular, along with its native Android and iOS app.',
      tags: ['Volgistics', 'Angular', 'Android', 'iOS'],
      links: [{ title: 'Website', link: 'https://www.volgistics.com/vicnet/' }],
    },
    {
      title: 'Volgistics Help System', logo: 'volgistics',
      description: 'The help system for Volgistics.',
      tags: ['Volgistics', 'Python', 'MkDocs Material'],
      links: [{ title: 'Website', link: 'https://www.volgistics.com/help/' }],
    },
    {
      title: 'Custom Shape Tool', logo: 'configura',
      description: "A custom shape tool for CET Designer, Configura's space-planning software, built during my internships at Configura.",
      tags: ['Configura', 'CET Designer', 'CM'], links: [],
    },
  ];

  /** Animated faces get a fixed width in cells so swapping eye frames can't nudge the text beside them. */
  faceCols(key: string): number | null {
    return PROJECT_LOGO_FRAMES[key] ? Math.max(...PROJECT_LOGOS[key].map(r => r.reduce((n, [, , c]) => n + c, 0))) : null;
  }

  /** Wordmark logos (wider than the 24-col icons) stack above their text. */
  isWide(key: string): boolean {
    return this.logo(key).some(row => row.reduce((n, c) => n + c.text.length, 0) > 30);
  }

  readonly activePersonal = this.personal.filter(p => !p.archived);
  /** Archived personal projects sit collapsed behind the "► archived (n)" toggle. */
  readonly archivedPersonal = this.personal.filter(p => p.archived);
  readonly showArchived = signal(false);
  readonly activeCount = this.activePersonal.length;

  private readonly router = inject(Router);

  constructor(private title: Title) {
    this.title.setTitle('Jaxon Wright - Projects');
    this.animateFaces();
    // The routed URL is already committed when this component is created.
    this.revealArchived();
    const sub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) this.revealArchived();
    });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  /** /projects#archived opens the collapsed list on a fresh load and on later navigations. */
  private revealArchived(): void {
    if (this.router.parseUrl(this.router.url).fragment === 'archived') this.showArchived.set(true);
  }

  /**
   * RouterLink ignores a click whose fragment is already the URL, so no navigation
   * event fires and the shell never scrolls. Bring that heading back to the top anyway.
   */
  @HostListener('click', ['$event'])
  onSectionClick(event: MouseEvent): void {
    const link = (event.target as Element | null)?.closest?.('a.section-anchor');
    if (!link || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const id = (link as HTMLAnchorElement).hash.slice(1);
    if (!id) return;
    if (id === 'archived') this.showArchived.set(true);
    if (this.router.parseUrl(this.router.url).fragment !== id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  /**
   * Grok Bot faces blink at random 2.5-7s intervals (each bot on its own clock) and now
   * and then glance left or right. Frames are pre-generated and the same size as the
   * resting face, so only glyphs change. Static under prefers-reduced-motion.
   */
  private animateFaces(): void {
    if (typeof window === 'undefined' || prefersReducedMotion()) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (ms: number, fn: () => void) => {
      const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
      timers.add(t);
    };
    const set = (key: string, frame: string) => this.faceFrame.update(f => ({ ...f, [key]: frame }));
    const play = (key: string, steps: [string, number][], done: () => void) => {
      const [[frame, ms], ...rest] = steps;
      set(key, frame);
      later(ms, () => rest.length ? play(key, rest, done) : done());
    };
    const tick = (key: string) => later(2500 + Math.random() * 4500, () => {
      if (document.hidden) return tick(key);
      const blink: [string, number][] = [['half', 50], ['blink', 90], ['half', 50], ['', 0]];
      const glance: [string, number] = [Math.random() < 0.5 ? 'left' : 'right', 900 + Math.random() * 700];
      // ~1 in 4 turns is a glance, which ends with a blink as the eyes come back.
      play(key, Math.random() < 0.25 ? [glance, ...blink] : blink, () => tick(key));
    });
    Object.keys(PROJECT_LOGO_FRAMES).forEach(tick);
    inject(DestroyRef).onDestroy(() => timers.forEach(clearTimeout));
  }
}
