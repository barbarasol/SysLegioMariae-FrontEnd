import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { UsuarioAtualService } from '../services/usuario-atual.service';

/** Proteção do caminho Angular, além da autorização obrigatória da API. */
export const platformOwnerGuard: CanActivateFn = () => {
  const usuario = inject(UsuarioAtualService);
  const router = inject(Router);
  return usuario.obter().pipe(
    map(sessao => sessao.perfisGlobais?.includes('PLATFORM_OWNER')
      ? true : router.parseUrl('/home')),
    catchError(() => of(router.parseUrl('/home')))
  );
};
