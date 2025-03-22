import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/root/app.config';
import { AppComponent } from './app/root/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
