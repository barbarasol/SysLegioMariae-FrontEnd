import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  mensagemDeErro,
  UsuarioService
} from '../../../services/usuario.service';

@Component({
  imports: [
    FormsModule
  ],
  selector: 'app-novo-usuario',
  styleUrl: './novo-usuario.scss',
  templateUrl: './novo-usuario.html',
})
export class NovoUsuario {

  etapa = 1;

  nome = '';
  nomePreferido = '';
  cpf = '';
  celular = '';
  email = '';
  senha = '';
  confirmarSenha = '';

  erro = '';
  sucesso = '';
  carregando = false;

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  get senhasDiferentes(): boolean {
    return (
      this.senha.length > 0 &&
      this.confirmarSenha.length > 0 &&
      this.senha !== this.confirmarSenha
    );
  }

  get etapaValida(): boolean {

    if (this.etapa === 1) {
      return (
        !!this.nome.trim() &&
        !!this.email.trim() &&
        this.emailValido(this.email)
      );
    }

    if (this.etapa === 2) {
      return (
        this.senha.length >= 6 &&
        this.confirmarSenha.length >= 6 &&
        this.senha === this.confirmarSenha
      );
    }

    return true;
  }

  proximo(): void {

    if (this.carregando) {
      return;
    }

    this.erro = '';

    if (this.etapa === 1) {

      if (!this.nome.trim()) {
        this.erro =
          'Informe o nome completo.';
        this.cdr.detectChanges();
        return;
      }

      if (!this.email.trim()) {
        this.erro =
          'Informe o e-mail.';
        this.cdr.detectChanges();
        return;
      }

      if (!this.emailValido(this.email)) {
        this.erro =
          'Informe um e-mail válido.';
        this.cdr.detectChanges();
        return;
      }
    }

    if (this.etapa === 2) {

      if (!this.senha) {
        this.erro =
          'Informe a senha.';
        this.cdr.detectChanges();
        return;
      }

      if (this.senha.length < 6) {
        this.erro =
          'A senha deve possuir pelo menos 6 caracteres.';
        this.cdr.detectChanges();
        return;
      }

      if (!this.confirmarSenha) {
        this.erro =
          'Confirme a senha.';
        this.cdr.detectChanges();
        return;
      }

      if (
        this.confirmarSenha.length < 6
      ) {
        this.erro =
          'A confirmação da senha deve possuir pelo menos 6 caracteres.';
        this.cdr.detectChanges();
        return;
      }

      if (
        this.senha !==
        this.confirmarSenha
      ) {
        this.erro =
          'As senhas informadas não são iguais.';
        this.cdr.detectChanges();
        return;
      }
    }

    if (this.etapa < 3) {
      this.etapa++;
      this.cdr.detectChanges();
    }
  }

  voltar(): void {

    if (
      this.carregando ||
      this.etapa <= 1
    ) {
      return;
    }

    this.erro = '';
    this.etapa--;

    this.cdr.detectChanges();
  }

  criar(): void {

    if (
      this.carregando ||
      this.etapa !== 3
    ) {
      return;
    }

    this.erro = '';
    this.sucesso = '';
    this.carregando = true;

    this.usuarioService
      .criar({
        nome:
          this.nome,

        nomePreferido:
          this.nomePreferido,

        email:
          this.email,

        cpf:
          this.cpf,

        celular:
          this.celular,

        senha:
          this.senha
      })
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (resultado) => {

          /*
           * Cadastro iniciado pela tela de Login:
           * volta ao Login exibindo a mensagem de pendência.
           */
          if (
            this.router.url
              .startsWith(
                '/cadastro'
              ) &&
            resultado.usuario.status ===
              'PENDENTE_EMAIL'
          ) {
            this.router.navigate(
              ['/login'],
              {
                queryParams: {
                  cadastro:
                    'pendente'
                },
                replaceUrl:
                  true
              }
            );

            return;
          }

          /*
           * Cadastro iniciado por administrador:
           * permanece na tela atual.
           */
          this.sucesso =
            `Usuário ${resultado.usuario.email} criado com sucesso. ` +
            'O cadastro ficará pendente até a definição das permissões.';

          this.etapa = 1;
          this.limpar();

          this.cdr.detectChanges();
        },

        error: (
          error:
            HttpErrorResponse
        ) => {

          this.erro =
            mensagemDeErro(
              error,
              'Não foi possível criar o usuário. Tente novamente.'
            );

          this.cdr.detectChanges();
        }
      });
  }

  private emailValido(
    email: string
  ): boolean {

    return (
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
          email.trim()
        )
    );
  }

  private limpar(): void {
    this.nome = '';
    this.nomePreferido = '';
    this.cpf = '';
    this.celular = '';
    this.email = '';
    this.senha = '';
    this.confirmarSenha = '';
  }
}
