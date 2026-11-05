import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  UsuarioAtualService,
  UsuarioAutenticado,
  PreferenciasUsuario
} from '../../services/usuario-atual.service';

@Component({
  imports: [FormsModule],
  selector: 'app-perfil',
  styleUrl: './perfil.scss',
  templateUrl: './perfil.html'
})
export class Perfil implements OnInit {
  abaSelecionada: 'perfil' | 'seguranca' | 'preferencias' = 'perfil';
  contexto: UsuarioAutenticado | null = null;
  nomeAbreviado = '';
  perfisGlobais = '';
  carregando = true;
  erro = '';

  // Aba Perfil
  nomePreferido = '';
  celular = '';
  email = '';
  senhaAtualEmail = '';
  salvandoPerfil = false;
  erroPerfil = '';
  sucessoPerfil = '';

  // Aba Segurança
  senhaAtual = '';
  novaSenha = '';
  confirmarNovaSenha = '';
  salvandoSenha = false;
  erroSenha = '';
  sucessoSenha = '';

  // Aba Preferências
  preferencias: PreferenciasUsuario = {
    notificacoesEmail: true,
    notificacoesSistema: true,
    modoEscuro: false
  };
  preferenciasCarregadas = false;
  carregandoPreferencias = false;
  salvandoPreferencias = false;
  erroPreferencias = '';
  sucessoPreferencias = '';

  constructor(
    private usuarioAtualService: UsuarioAtualService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarUsuarioAtual();
  }

  selecionarAba(aba: 'perfil' | 'seguranca' | 'preferencias'): void {
    this.abaSelecionada = aba;
    if (aba === 'preferencias' && !this.preferenciasCarregadas) {
      this.carregarPreferencias();
    }
  }

  carregarUsuarioAtual(): void {
    this.carregando = true;
    this.erro = '';
    this.usuarioAtualService.obter()
      .pipe(finalize(() => {
        this.carregando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: contexto => {
          this.contexto = contexto;
          this.atualizarExibicao(contexto);
          this.nomePreferido = contexto.pessoa.nomePreferido || '';
          this.celular = contexto.pessoa.celular || '';
          this.email = contexto.usuario.email || '';
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Falha ao consultar usuário autenticado:', err);
          this.erro = 'Não foi possível carregar seus dados. Confira sua sessão.';
          this.cdr.detectChanges();
        }
      });
  }

  private atualizarExibicao(contexto: UsuarioAutenticado): void {
    this.nomeAbreviado = this.usuarioAtualService.nomeAbreviado(contexto);
    this.perfisGlobais = this.usuarioAtualService.nomePerfisGlobais(contexto);
  }

  get emailFoiAlterado(): boolean {
    return !!this.contexto &&
      this.email.trim().toLowerCase() !== this.contexto.usuario.email.toLowerCase();
  }

  salvarPerfil(): void {
    if (!this.contexto || this.salvandoPerfil) return;
    this.erroPerfil = '';
    this.sucessoPerfil = '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.erroPerfil = 'Informe um e-mail válido.';
      return;
    }
    if (this.emailFoiAlterado && !this.senhaAtualEmail) {
      this.erroPerfil = 'Informe sua senha atual para alterar o e-mail de acesso.';
      return;
    }
    this.salvandoPerfil = true;
    this.usuarioAtualService.atualizarPerfil({
      nomePreferido: this.nomePreferido.trim() || null,
      celular: this.celular.trim() || null,
      email: this.email.trim(),
      senhaAtual: this.emailFoiAlterado ? this.senhaAtualEmail : null
    })
      .pipe(finalize(() => {
        this.salvandoPerfil = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: dados => {
          if (!this.contexto) return;
          this.contexto = {
            ...this.contexto,
            usuario: dados.usuario,
            pessoa: dados.pessoa
          };
          this.atualizarExibicao(this.contexto);
          this.nomePreferido = dados.pessoa.nomePreferido || '';
          this.celular = dados.pessoa.celular || '';
          this.email = dados.usuario.email;
          this.senhaAtualEmail = '';
          this.sucessoPerfil = 'Suas alterações foram salvas com sucesso.';
          this.cdr.detectChanges();
        },
        error: err => {
          this.erroPerfil = err.error?.message || 'Não foi possível salvar as alterações.';
          this.cdr.detectChanges();
        }
      });
  }

  salvarSenha(): void {
    if (this.salvandoSenha) return;
    this.erroSenha = '';
    this.sucessoSenha = '';
    if (!this.senhaAtual) {
      this.erroSenha = 'Informe sua senha atual.';
      return;
    }
    if (this.novaSenha.length < 8) {
      this.erroSenha = 'A nova senha precisa ter pelo menos 8 caracteres.';
      return;
    }
    if (this.novaSenha !== this.confirmarNovaSenha) {
      this.erroSenha = 'A confirmação da nova senha está diferente.';
      return;
    }
    this.salvandoSenha = true;
    this.usuarioAtualService.alterarSenha(this.senhaAtual, this.novaSenha)
      .pipe(finalize(() => {
        this.salvandoSenha = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: retorno => {
          this.senhaAtual = '';
          this.novaSenha = '';
          this.confirmarNovaSenha = '';
          this.sucessoSenha = retorno.message;
          this.cdr.detectChanges();
        },
        error: err => {
          this.erroSenha = err.error?.message || 'Não foi possível alterar a senha.';
          this.cdr.detectChanges();
        }
      });
  }

  carregarPreferencias(): void {
    this.carregandoPreferencias = true;
    this.erroPreferencias = '';
    this.usuarioAtualService.obterPreferencias()
      .pipe(finalize(() => {
        this.carregandoPreferencias = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: retorno => {
          this.preferencias = { ...retorno.preferencias };
          this.preferenciasCarregadas = true;
          this.cdr.detectChanges();
        },
        error: err => {
          this.erroPreferencias = err.error?.message ||
            'Não foi possível carregar suas preferências. Verifique a migration SQL.';
          this.cdr.detectChanges();
        }
      });
  }

  salvarPreferencias(): void {
    if (this.salvandoPreferencias || !this.preferenciasCarregadas) return;
    this.erroPreferencias = '';
    this.sucessoPreferencias = '';
    this.salvandoPreferencias = true;
    this.usuarioAtualService.salvarPreferencias({ ...this.preferencias })
      .pipe(finalize(() => {
        this.salvandoPreferencias = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: retorno => {
          this.preferencias = { ...retorno.preferencias };
          this.sucessoPreferencias = 'Preferências salvas com sucesso.';
          this.cdr.detectChanges();
        },
        error: err => {
          this.erroPreferencias = err.error?.message || 'Não foi possível salvar as preferências.';
          this.cdr.detectChanges();
        }
      });
  }

  statusUsuario(status: string): string {
    const nomes: Record<string, string> = {
      ATIVO: 'Ativo',
      PENDENTE_EMAIL: 'Pendente de confirmação',
      BLOQUEADO: 'Bloqueado',
      INATIVO: 'Inativo'
    };
    return nomes[status] ?? status;
  }
}
