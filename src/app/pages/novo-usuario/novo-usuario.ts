import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { mensagemDeErro, UsuarioService } from '../../services/usuario.service';
import { PerfilDisponivel } from '../../models/usuario.model';

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
  perfilCodigo = 'PLATFORM_ADMIN';
  senha = '';
  confirmarSenha = '';

  /**
   * Somente perfis de escopo GLOBAL. Os perfis de unidade
   * (ADMIN_UNIDADE, OPERADOR, MEMBRO...) precisam de unidade_id
   * e são concedidos via legio.usuario_unidade_perfil.
   */
  perfis: PerfilDisponivel[] = [
    {
      codigo: 'PLATFORM_OWNER',
      nome: 'Proprietário da plataforma',
      escopo: 'GLOBAL'
    },
    {
      codigo: 'PLATFORM_ADMIN',
      nome: 'Administrador da plataforma',
      escopo: 'GLOBAL'
    },
    {
      codigo: 'PLATFORM_FINANCEIRO',
      nome: 'Financeiro da plataforma',
      escopo: 'GLOBAL'
    },
    {
      codigo: 'PLATFORM_SUPORTE',
      nome: 'Suporte da plataforma',
      escopo: 'GLOBAL'
    }
  ];

  erro = '';
  sucesso = '';
  carregando = false;

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  get nomePerfilSelecionado(): string {
    return (
      this.perfis.find(
        (perfil) => perfil.codigo === this.perfilCodigo
      )?.nome ?? this.perfilCodigo
    );
  }

  get senhasDiferentes(): boolean {
    return (
      this.confirmarSenha.length > 0 &&
      this.senha !== this.confirmarSenha
    );
  }

  get etapaValida(): boolean {
    if (this.etapa === 1) {
      return (
        !!this.nome.trim() &&
        !!this.email.trim()
      );
    }

    if (this.etapa === 2) {
      return (
        !!this.perfilCodigo &&
        this.senha.length >= 6 &&
        !this.senhasDiferentes
      );
    }

    return true;
  }

  proximo(): void {
    if (this.etapa < 3 && this.etapaValida) {
      this.erro = '';
      this.etapa++;
    }
  }

  voltar(): void {
    if (this.etapa > 1) {
      this.erro = '';
      this.etapa--;
    }
  }

  criar(): void {
    if (this.carregando || !this.etapaValida) {
      return;
    }

    this.erro = '';
    this.sucesso = '';
    this.carregando = true;

    this.usuarioService
      .criar({
        nome: this.nome,
        nomePreferido: this.nomePreferido,
        email: this.email,
        cpf: this.cpf,
        celular: this.celular,
        senha: this.senha,
        perfilCodigo: this.perfilCodigo
      })
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (resultado) => {
          this.sucesso =
            `Usuário ${resultado.usuario.email} criado com sucesso ` +
            `(status ${resultado.usuario.status}).`;

          this.etapa = 1;
          this.limpar();
        },
        error: (error: HttpErrorResponse) => {
          this.erro = mensagemDeErro(
            error,
            'Não foi possível criar o usuário. Tente novamente.'
          );
        }
      });
  }

  private limpar(): void {
    this.nome = '';
    this.nomePreferido = '';
    this.cpf = '';
    this.celular = '';
    this.email = '';
    this.perfilCodigo = 'PLATFORM_ADMIN';
    this.senha = '';
    this.confirmarSenha = '';
  }
}


