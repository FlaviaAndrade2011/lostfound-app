import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { appRouter } from './app/app-routing.module';

bootstrapApplication(AppComponent, {
    providers: [appRouter, importProvidersFrom(HttpClientModule)]
}).catch(err => console.error(err));
