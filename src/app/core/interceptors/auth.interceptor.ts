import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  Observable,
  shareReplay,
  switchMap,
  throwError
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenResponse } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

let refreshEmAndamento$: Observable<TokenResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const ehLogin = req.url.endsWith('/auth/login');
  const ehRefresh = req.url.endsWith('/auth/refresh');

  const token = authService.getAccessToken();

  let requisicao = req.clone({
    withCredentials: true
  });

  if (token && !ehLogin && !ehRefresh) {
    requisicao = requisicao.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(requisicao).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        ehLogin ||
        ehRefresh
      ) {
        return throwError(() => error);
      }

      if (!refreshEmAndamento$) {
        refreshEmAndamento$ = authService.refresh().pipe(
          shareReplay({
            bufferSize: 1,
            refCount: false
          }),
          finalize(() => {
            refreshEmAndamento$ = null;
          })
        );
      }

      return refreshEmAndamento$.pipe(
        switchMap((response) => {
          const novaRequisicao = req.clone({
            withCredentials: true,
            setHeaders: {
              Authorization: `Bearer ${response.accessToken}`
            }
          });

          return next(novaRequisicao);
        }),
        catchError((refreshError) => {
          authService.clearSession();
          router.navigate(['/login']);

          return throwError(() => refreshError);
        })
      );
    })
  );
};
