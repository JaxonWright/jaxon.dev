import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { NgFor } from '@angular/common';
import { ProjectCardComponent } from '../../elements/project-card/project-card.component';

export interface Project {
  logo  : string,
  darkLogo? : string
  title : string,
  description : string,
  logoOnly : boolean,
  categories : Category[],
  actions : Action[],
}

export interface Category {
  icon : IconProp, //['fab','android']
  title : string
}

export interface Action {
  link : string;
  title : string;
}

@Component({
    selector: 'app-projects',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './projects.component.html',
    styleUrls: ['./projects.component.css'],
    imports: [NgFor, ProjectCardComponent]
})
export class ProjectsComponent implements OnInit {
  projects : Project[];

  constructor(
    private title : Title
  ) { 
    this.title.setTitle('Jaxon Wright - Projects');
  }

  ngOnInit() {
    this.setProjects();
  }

  setProjects() {
    this.projects = [
      {
        title : 'testube',
        logo : '../../assets/img/projects/testube.png',
        darkLogo : '../../assets/img/projects/testubeLight.png',
        logoOnly : true,
        description : `This is a web application that allows Tesla drivers to have easy access to a multitude of media services while their vehicle is in park. 
        What makes this special is that it triggers "Theater Mode", which will make the application and anything clicked within it be open on the entire screen.`,
        categories : [
          {
            icon : ['fas','file-contract'],
            title : 'GPL-3.0'
          },
          {
            icon : ['fab','angular'],
            title : 'Angular'
          },
          {
            icon : ['fas','code'],
            title : 'TypeScript'
          },
          {
            icon : ['fab','html5'],
            title : 'HTML'
          },
          {
            icon : ['fab','css3-alt'],
            title : 'CSS'
          },
        ],
        actions : [
          {
            link : 'https://testube.app',
            title : 'Website'
          },
          {
            link : 'https://github.com/arbitrari/testube',
            title : 'GitHub'
          }
        ]
      },
      {
        title : 'sentinel',
        logo : '../../assets/img/projects/sentinel.png',
        darkLogo : '../../assets/img/projects/sentinelLight.png',
        logoOnly : true,
        description : `A free, open-source Windows, macOS, and Linux application that allows you to efficiently view, manage, and export sentry and dashcam footage from your Tesla vehicle. It does require you to have access to the USB drive containing the footage, whether that be directly plugged into your computer or using a more complicated setup with a network share`,
        categories : [
          {
            icon : ['fas','file-contract'],
            title : 'GPL-3.0'
          },
          {
            icon : ['fab','windows'],
            title : 'Windows'
          },
          {
            icon : ['fab','apple'],
            title : 'macOS'
          },
          {
            icon : ['fab','linux'],
            title : 'Linux'
          },
          {
            icon : ['fab','angular'],
            title : 'Angular'
          },
          {
            icon : ['fas','code'],
            title : 'Tauri'
          },
          {
            icon : ['fas','code'],
            title : 'TypeScript'
          },
          {
            icon : ['fab','rust'],
            title : 'Rust'
          },
          {
            icon : ['fab','html5'],
            title : 'HTML'
          },
          {
            icon : ['fab','css3-alt'],
            title : 'CSS'
          },
        ],
        actions : [
          {
            link : 'https://github.com/arbitrari/sentinel',
            title : 'GitHub'
          }
        ]
      },
      {
        title : 'Passageway',
        logo : '../../assets/img/projects/passageway.png',
        logoOnly : true,
        description : `Passageway is an attempt to provide a cost-effective, scalable, and automated method of aggregating foot traffic data within
        a facility. Such data aggregation offers meaningful statistics about the foot traffic of individuals within a defined
        space. With Passageway, users are able to see heat maps and view graphs that represent the foot traffic in a building,
        and analyze it on a website with various building floor-plans layered onto a Google Map. Users may also specify a
        certain time frame to see specific temporal data. All of the data is collected within the facilities through a system
        including CHIP computers connected to a pair of Infrared break beams. Ultimately, the data may be used to determine
        the frequency of activity for specific rooms, hallways, or entryways. Foot traffic data may be useful for understanding
        activity within a facility, seeing popularity of certain areas during specific times, or identifying times where
        room capacity is exceeded and thus presents a fire code violation. This was also published in the Consortium for
        Computing Sciences in Colleges academic journal.`,
        categories : [
          {
            icon : ['fab','android'],
            title : 'Android'
          },
          {
            icon : ['fas','database'],
            title : 'Firebase'
          },
          {
            icon : ['fas','code'],
            title : 'Java'
          },
          {
            icon : ['fab','python'],
            title : 'Python'
          },
          {
            icon : ['fas','code'],
            title : 'Polymer'
          },
        ],
        actions : [
          {
            link : 'https://github.com/passageway',
            title : 'GitHub'
          },
          {
            link : 'https://dl.acm.org/citation.cfm?id=3007244',
            title : 'Publication'
          }
        ]
      },
      {
        title : 'CineR8',
        logo : '../../assets/img/projects/ciner8.png',
        darkLogo : '../../assets/img/projects/ciner8Light.png',
        logoOnly : true,
        description : `CineR8 (Pronounced Cine [like in Cinema]-Rate) is an easy-to-use and very cleanly designed movie rating web application.
        The design tries to follow Google's Material Design guidelines as best as possible, which makes it look as clean
        as it does. There are no advertisements or obnoxious elements that hamper the user experience for what should be
        a simple web application. The Web app is built using Ember.js, a very robust Javascript framework. All of the movie
        information is pulled from TheMovieDB via their API. Movie ratings from 3rd party services are pulled from the OMDb
        API. User authentication and ratings are stored using Google's Firebase real-time database. The only personal information
        stored is the user's email, of which is not visible to others and is not shared by CineR8 anywhere. I know that there
        are bigger and arguably better services that do the same thing as CineR8. My motivation behind creating this web
        application was mainly to learn Ember.js, but I also wanted something simpler than the well-known services. I think
        that I acheived both goals and look forward to what this project will become over time.`,
        categories : [
          {
            icon : ['fas','file-contract'],
            title : 'MIT'
          },
          {
            icon : ['fab','ember'],
            title : 'Ember'
          },
          {
            icon : ['fas','database'],
            title : 'Firebase'
          },
          {
            icon : ['fab','html5'],
            title : 'HTML'
          },
          {
            icon : ['fab','js'],
            title : 'Javascript'
          },
          {
            icon : ['fab','css3-alt'],
            title : 'CSS'
          },
        ],
        actions : [
          {
            link : 'https://ciner8.com',
            title : 'Website'
          },
          {
            link : 'https://github.com/jaxonwright/ciner8',
            title : 'GitHub'
          }
        ]
      },
      {
        title : 'jaxon.dev',
        logo : '../../assets/img/branding/favicon.svg',
        darkLogo : '../../assets/img/branding/favicon.svg',
        logoOnly : false,
        description : `The website that you are currently on. This is my personal website.`,
        categories : [
          {
            icon : ['fas','file-contract'],
            title : 'MIT'
          },
          {
            icon : ['fab','angular'],
            title : 'Angular'
          },
          {
            icon : ['fas','code'],
            title : 'TypeScript'
          },
          {
            icon : ['fab','html5'],
            title : 'HTML'
          },
          {
            icon : ['fab','css3-alt'],
            title : 'CSS'
          },
        ],
        actions : [
          {
            link : 'https://github.com/JaxonWright/jaxon.dev',
            title : 'GitHub'
          }
        ]
      },
      {
        title : 'PrEx',
        logo : '',
        logoOnly : false,
        description : `A simple process explorer application that can browse, kill and run Windows Processes. Made to get used to the Delphi programming
        language.`,
        categories : [
          {
            icon : ['fab','windows'],
            title : 'Windows'
          },
          {
            icon : ['fas','code'],
            title : 'Delphi'
          }
        ],
        actions : [
          {
            link : 'https://github.com/JaxonWright/PrEx-Delphi',
            title : 'GitHub'
          }
        ]
      },
      {
        title : 'The Best Calculator Ever',
        logo : '',
        logoOnly : false,
        description : `A simple calculator Windows application created in Delphi. Mainly just to get familiar with the language`,
        categories : [
          {
            icon : ['fab','windows'],
            title : 'Windows'
          },
          {
            icon : ['fas','code'],
            title : 'Delphi'
          }
        ],
        actions : [
          {
            link : 'https://github.com/JaxonWright/calculator-delphi',
            title : 'GitHub'
          }
        ]
      },
      {
        title : 'eli5',
        logo : '../../assets/img/projects/eli5.png',
        darkLogo : '../../assets/img/projects/eli5White.png',
        logoOnly : true,
        description : `This project was created for CIS 365 Artificial Intelligence at Grand Valley State University. The project scrapes posts
        on the /r/eli5 (Explain Like I'm Five) subreddit on Reddit. The goal is to take the user's query and determine the
        reading level of the highest-rated comments and presents it to the user, so that they can make informed decisions
        about threads based on how easy the explanations are to understand. It was made in Java and just uses a simple command-line
        interface.`,
        categories : [
          {
            icon : ['fas','code'],
            title : 'Java'
          }
        ],
        actions : [
          {
            link : 'https://github.com/JaxonWright/eli5',
            title : 'GitHub'
          }
        ]
      },
      {
        title : 'TallyUp',
        logo : '../../assets/img/apps/tallyup_green.png',
        logoOnly : false,
        description : `This project was created for CIS 357 Mobile Applications at Grand Valley State University. TallyUp is a simple tool to create polls to settle anything you can think of. One example would be a group of employees or
        friends deciding on where to eat for lunch. Somebody would create a room that expires after a set amount of time,
        and shares a code/link with the others. They all vote on locations to eat and maybe even get access to navigate to
        the winner on Google Maps. That is one example, but there are a multitude of other use-cases that may get special
        features.`,
        categories : [
          {
            icon : ['fab','android'],
            title : 'Android'
          },
          {
            icon : ['fas','code'],
            title : 'Java'
          },
          {
            icon : ['fas','database'],
            title : 'Firebase'
          }
        ],
        actions : [
          {
            link : 'https://github.com/dunrite/tallyup',
            title : 'GitHub'
          }
        ]
      },
      {
        title : 'Pixbar',
        logo : '../../assets/img/apps/pixbar.png',
        logoOnly : false,
        description : `Pixbar modifies your device's navigation bar to have solid buttons. This is meant to resemble a certain device that has an exclusive on these kinds of buttons. Currently, Pixbar is meant for phones with stock Lollipop and above. This works without any root permissions needed, as well!
        This application is only meant for 3-button navigation mode.`,
        categories : [
          {
            icon : ['fab','android'],
            title : 'Android'
          },
          {
            icon : ['fas','code'],
            title : 'Java'
          }
        ],
        actions : [
          {
            link : 'https://github.com/dunrite/pixbar',
            title : 'GitHub'
          }
        ]
      },
      {
        title : 'Xpaper',
        logo : '../../assets/img/apps/xpaper.png',
        logoOnly : false,
        description : `Specifically designed for all Moto X models, Xpaper provides a collection of simple, abstract wallpapers that you can customize to perfectly match your device's configuration. Even if you do not have a Moto X, you are still welcome to play with the app to get some clean wallpapers for your non-moto.`,
        categories : [
          {
            icon : ['fab','android'],
            title : 'Android'
          },
          {
            icon : ['fas','code'],
            title : 'Java'
          }
        ],
        actions : [
          {
            link : 'https://github.com/dunrite/xpaper',
            title : 'GitHub'
          }
        ]
      },
      {
        title : 'nowPaper',
        logo : '../../assets/img/apps/nowPaper.png',
        logoOnly : false,
        description : `This was my first Android app. A unique, colorful new wallpaper app that provides your phone's homescreen with just the right touch of personality and feel. Choose between various landmarks and locations set in the iconic art-style of Google Now. The artwork was all done by the talented Alex Pasquarella.`,
        categories : [
          {
            icon : ['fab','android'],
            title : 'Android'
          },
          {
            icon : ['fas','code'],
            title : 'Java'
          }
        ],
        actions : [
          {
            link : 'https://github.com/dunrite/nowpaper',
            title : 'GitHub'
          }
        ]
      },
    ]
  }

}
