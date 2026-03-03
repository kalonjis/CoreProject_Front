import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/root/app.config';
import { AppComponent } from './app/root/app.component';
import {registerLocaleData} from '@angular/common';
import localeFr from '@angular/common/locales/fr';


registerLocaleData(localeFr);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
