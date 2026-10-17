import { Routes } from '@angular/router';
import { HomeComponent } from '@pages/home/home.component';
import { ProjectsComponent } from '@pages/projects/projects.component';
import { BuildInfoComponent } from '@pages/build-info/build-info.component';
import { ContactComponent } from '@pages/contact/contact.component';
import { PageNotFoundComponent } from '@pages/page-not-found/page-not-found.component';
import { MusicComponent } from '@pages/music/music.component';

export const appRoutes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: HomeComponent },
  { path: 'projects', component: ProjectsComponent },
  { path: 'playlists', component: MusicComponent },
  { path: 'music', redirectTo: 'playlists' },
  { path: 'build-info', component: BuildInfoComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'pay', component: ContactComponent, data: { anchor: 'pay' } },
  { path: '**', component: PageNotFoundComponent }
];
