import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { RoutesModule } from './routes.module';

@NgModule({
    declarations: [AppComponent],
    imports: [
        RoutesModule,
        BrowserModule,
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
