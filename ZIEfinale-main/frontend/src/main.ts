import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { AuthInterceptor } from './app/services/auth.interceptor';
import { MockBackendInterceptor } from './app/services/mock-backend.interceptor';
import 'hammerjs'; // Enable gesture support for Material components

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    importProvidersFrom(HttpClientModule, BrowserAnimationsModule),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: MockBackendInterceptor, multi: true },
  ],
}).catch((err) => console.error(err));
