import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import { finalize } from 'rxjs';

import {
  AuthService
} from '../../core/services/auth.service';

@Component({
  imports: [
    FormsModule
  ],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {

  email = '';
  senha = '';
  erro = '';
  aviso = '';
  carregando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {

    if (
      this.route.snapshot
        .queryParamMap
        .get('cadastro') === 'pendente'
    ) {
      this.aviso =
        'Usuário recém-criado, aguarde a autorização do administrador do sistema.';
    }
  }

  entrar(): void {

    if (
      this.carregando ||
      !this.email.trim() ||
      !this.senha
    ) {
      return;
    }

    this.erro = '';
    this.carregando = true;

    this.authService
      .login(
        this.email.trim(),
        this.senha
      )
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(
            ['/home']
          );
        },

        error: (
          error:
            HttpErrorResponse
        ) => {

          const mensagemBackend =
            String(
              error.error?.message ??
              ''
            );

          const mensagemNormalizada =
            mensagemBackend
              .trim()
              .toLocaleUpperCase('pt-BR')
              .normalize('NFD')
              .replace(
                /[\u0300-\u036f]/g,
                ''
              );

          /*
           * O backend atual responde algo como:
           *
           * "Não foi possível entrar, confirme seu email..."
           *
           * Esse retorno corresponde ao usuário
           * com status PENDENTE_EMAIL.
           */
          const usuarioPendente =
            mensagemNormalizada.includes(
              'PENDENTE'
            ) ||
            (
              mensagemNormalizada.includes(
                'CONFIRME'
              ) &&
              (
                mensagemNormalizada.includes(
                  'EMAIL'
                ) ||
                mensagemNormalizada.includes(
                  'E-MAIL'
                )
              )
            ) ||
            mensagemNormalizada.includes(
              'VERIFIQUE SEU EMAIL'
            ) ||
            mensagemNormalizada.includes(
              'VERIFIQUE SEU E-MAIL'
            );

          if (usuarioPendente) {

            this.erro =
              'Usuário recém-criado, aguarde a autorização do administrador do sistema.';

            this.cdr.detectChanges();
            return;
          }

          if (error.status === 401) {

            this.erro =
              'E-mail ou senha inválidos. Tente novamente.';

            this.cdr.detectChanges();
            return;
          }

          this.erro =
            mensagemBackend ||
            'Não foi possível entrar. Tente novamente.';

          this.cdr.detectChanges();
        }
      });
  }

  criarUsuario(): void {
    this.router.navigate([
      '/cadastro'
    ]);
  }
}
