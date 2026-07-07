import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Get the token from localStorage
    const token = localStorage.getItem('token');

    // Clone the request and add the Authorization header if token exists
    if (token) {
      console.log(`📡 Auth Interceptor: Adding token to request for ${request.url}`);
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    } else {
      console.warn(`⚠️ Auth Interceptor: No token found in localStorage for ${request.url}`);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // If 401, redirect to login
        if (error.status === 401) {
          console.error(`❌ Auth Interceptor: 401 Unauthorized - clearing storage and redirecting to login`);
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          console.error(`❌ Auth Interceptor: 403 Forbidden (Invalid or expired token)`);
          console.error(`   Token present: ${!!token}`);
          if (error.error?.message) {
            console.error(`   Error: ${error.error.message}`);
          }
        }

        return throwError(() => error);
      })
    );
  }
}
