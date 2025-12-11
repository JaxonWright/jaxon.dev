import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from '@pages/home/home.component';
import { ProjectsComponent } from '@pages/projects/projects.component';
import { BuildInfoComponent } from '@pages/build-info/build-info.component';
import { ContactComponent } from '@pages/contact/contact.component';
import { PageNotFoundComponent } from '@pages/page-not-found/page-not-found.component';
import { MusicComponent } from '@pages/music/music.component';

const appRoutes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'about', component: HomeComponent },
    { path: 'projects', component: ProjectsComponent },
    { path: 'music', component: MusicComponent },
    { path: 'build-info', component: BuildInfoComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'pay', redirectTo: 'contact'},
    { path: '**', component: PageNotFoundComponent }
  ]

@NgModule({
    declarations: [],
    imports: [
      CommonModule,
      RouterModule.forRoot(appRoutes, { enableTracing: false }),
      CommonModule
    ],
    exports: [RouterModule]
  })
  export class RoutesModule { }