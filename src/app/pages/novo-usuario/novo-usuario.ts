import {
  CommonModule
} from '@angular/common';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  finalize
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

type CampoOrdenacao =
  | 'nome'
  | 'cpf'
  | 'celular'
  | 'email';

type DirecaoOrdenacao =
  | 'asc'
  | 'desc';

export interface UsuarioLista {
  id: string;
  pessoaId?: string;
  nome: string;
  nomePreferido?: string | null;
  cpf: string | null;
  celular: string | null;
  email: string;
  status: string;
  perfisGlobais: string[];
}

interface UsuarioEdicao
  extends UsuarioLista {
  perfilCodigo: string;
}

interface PerfilAcessoGlobal {
  id: string;
  codigo: string;
}

interface RespostaUsuarios {
  usuarios:
    UsuarioLista[];
}

interface RespostaPerfis {
  perfis:
    PerfilAcessoGlobal[];
}

@Component({
  selector:
    'app-novo-usuario',

  standalone:
    true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl:
    './novo-usuario.html',

  styleUrl:
    './novo-usuario.scss'
})
export class NovoUsuario
implements OnInit {

  filtroNome = '';
  filtroCpf = '';
  filtroCelular = '';
  filtroEmail = '';

  usuarios:
    UsuarioLista[] = [];

  perfisDisponiveis:
    PerfilAcessoGlobal[] = [];

  carregando = false;
  carregandoPerfis = false;

  erro = '';

  campoOrdenacao:
    CampoOrdenacao =
      'nome';

  direcaoOrdenacao:
    DirecaoOrdenacao =
      'asc';

  usuarioEdicao:
    UsuarioEdicao | null =
      null;

  salvandoEdicao = false;
  erroEdicao = '';

  excluindoId:
    string | null =
      null;

  constructor(
    private http:
      HttpClient,

    private cdr:
      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarPerfisGlobais();
    this.filtrar();
  }

  carregarPerfisGlobais():
  void {

    this.carregandoPerfis =
      true;

    this.http
      .get<RespostaPerfis>(
        `${environment.apiUrl}/usuarios/perfis-globais`
      )
      .pipe(
        finalize(() => {
          this.carregandoPerfis =
            false;

          this.cdr
            .detectChanges();
        })
      )
      .subscribe({
        next: (
          resultado
        ) => {

          this.perfisDisponiveis =
            Array.isArray(
              resultado?.perfis
            )
              ? resultado.perfis
              : [];

          this.cdr
            .detectChanges();
        },

        error: (
          error
        ) => {

          console.error(
            'Erro ao carregar perfis globais:',
            error
          );

          this.perfisDisponiveis =
            [];

          this.cdr
            .detectChanges();
        }
      });
  }

  filtrar(): void {

    if (
      this.carregando
    ) {
      return;
    }

    let params =
      new HttpParams();

    const nome =
      this.filtroNome
        .trim();

    const cpf =
      this.filtroCpf
        .trim();

    const celular =
      this.filtroCelular
        .trim();

    const email =
      this.filtroEmail
        .trim();

    if (nome) {
      params =
        params.set(
          'nome',
          nome
        );
    }

    if (cpf) {
      params =
        params.set(
          'cpf',
          cpf
        );
    }

    if (celular) {
      params =
        params.set(
          'celular',
          celular
        );
    }

    if (email) {
      params =
        params.set(
          'email',
          email
        );
    }

    params =
      params
        .set(
          'ordenarPor',
          this.campoOrdenacao
        )
        .set(
          'direcao',
          this.direcaoOrdenacao
        );

    this.carregando =
      true;

    this.erro = '';

    this.http
      .get<RespostaUsuarios>(
        `${environment.apiUrl}/usuarios`,
        {
          params
        }
      )
      .pipe(
        finalize(() => {

          this.carregando =
            false;

          this.cdr
            .detectChanges();
        })
      )
      .subscribe({
        next: (
          resultado
        ) => {

          this.usuarios =
            Array.isArray(
              resultado?.usuarios
            )
              ? resultado.usuarios
              : [];

          this.cdr
            .detectChanges();
        },

        error: (
          error
        ) => {

          console.error(
            'Erro ao listar usuários:',
            error
          );

          this.usuarios = [];

          this.erro =
            error?.error?.message ??
            'Não foi possível carregar os usuários.';

          this.cdr
            .detectChanges();
        }
      });
  }

  perfilUsuario(
    usuario:
      UsuarioLista
  ): string {

    if (
      !usuario.perfisGlobais ||
      usuario.perfisGlobais.length === 0
    ) {
      return '-';
    }

    return usuario
      .perfisGlobais
      .join(', ');
  }

  limparFiltros(): void {

    this.filtroNome = '';
    this.filtroCpf = '';
    this.filtroCelular = '';
    this.filtroEmail = '';

    this.campoOrdenacao =
      'nome';

    this.direcaoOrdenacao =
      'asc';

    this.filtrar();
  }

  ordenar(
    campo:
      CampoOrdenacao
  ): void {

    if (
      this.carregando
    ) {
      return;
    }

    if (
      this.campoOrdenacao ===
      campo
    ) {

      this.direcaoOrdenacao =
        this.direcaoOrdenacao ===
          'asc'
          ? 'desc'
          : 'asc';

    } else {

      this.campoOrdenacao =
        campo;

      this.direcaoOrdenacao =
        'asc';
    }

    this.filtrar();
  }

  iconeOrdenacao(
    campo:
      CampoOrdenacao
  ): string {

    if (
      this.campoOrdenacao !==
      campo
    ) {
      return 'bi-arrow-down-up';
    }

    return (
      this.direcaoOrdenacao ===
      'asc'
        ? 'bi-sort-down'
        : 'bi-sort-up'
    );
  }

  novoUsuario():
  void {

    console.log(
      'Novo usuário'
    );
  }

  editarUsuario(
    usuario:
      UsuarioLista
  ): void {

    this.erroEdicao = '';

    const perfilAtual =
      usuario
        .perfisGlobais?.[0] ??
      '';

    this.usuarioEdicao = {
      ...usuario,

      nomePreferido:
        usuario.nomePreferido ??
        '',

      cpf:
        usuario.cpf ??
        '',

      celular:
        usuario.celular ??
        '',

      perfisGlobais:
        [
          ...(usuario
            .perfisGlobais ??
            [])
        ],

      perfilCodigo:
        perfilAtual
    };

    /*
     * Se a listagem de perfis ainda
     * não chegou, tenta novamente.
     */
    if (
      this.perfisDisponiveis
        .length === 0 &&
      !this.carregandoPerfis
    ) {
      this.carregarPerfisGlobais();
    }

    this.cdr
      .detectChanges();
  }

  cancelarEdicao():
  void {

    if (
      this.salvandoEdicao
    ) {
      return;
    }

    this.usuarioEdicao =
      null;

    this.erroEdicao =
      '';

    this.cdr
      .detectChanges();
  }

  salvarEdicao():
  void {

    if (
      !this.usuarioEdicao ||
      this.salvandoEdicao
    ) {
      return;
    }

    const nome =
      this.usuarioEdicao
        .nome
        .trim();

    const email =
      this.usuarioEdicao
        .email
        .trim();

    const perfilCodigo =
      this.usuarioEdicao
        .perfilCodigo
        .trim();

    if (!nome) {
      this.erroEdicao =
        'Informe o nome completo.';
      return;
    }

    if (!email) {
      this.erroEdicao =
        'Informe o e-mail.';
      return;
    }

    if (!perfilCodigo) {
      this.erroEdicao =
        'Selecione o perfil de acesso.';
      return;
    }

    this.salvandoEdicao =
      true;

    this.erroEdicao = '';

    this.http
      .put<{
        usuario:
          UsuarioLista;
      }>(
        `${environment.apiUrl}/usuarios/${this.usuarioEdicao.id}`,
        {
          nome,

          nomePreferido:
            this.usuarioEdicao
              .nomePreferido ??
            '',

          cpf:
            this.usuarioEdicao
              .cpf ??
            '',

          celular:
            this.usuarioEdicao
              .celular ??
            '',

          email,

          status:
            this.usuarioEdicao
              .status,

          perfilCodigo
        }
      )
      .pipe(
        finalize(() => {

          this.salvandoEdicao =
            false;

          this.cdr
            .detectChanges();
        })
      )
      .subscribe({
        next: () => {

          this.usuarioEdicao =
            null;

          this.filtrar();

          this.cdr
            .detectChanges();
        },

        error: (
          error
        ) => {

          console.error(
            'Erro ao editar usuário:',
            error
          );

          this.erroEdicao =
            error?.error?.message ??
            'Não foi possível atualizar o usuário.';

          this.cdr
            .detectChanges();
        }
      });
  }

  excluirUsuario(
    usuario:
      UsuarioLista
  ): void {

    if (
      this.excluindoId
    ) {
      return;
    }

    const confirmou =
      window.confirm(
        `Deseja realmente excluir o usuário "${usuario.nome}"?\n\n` +
        'A exclusão será lógica: o acesso será inativado e o histórico será preservado.'
      );

    if (!confirmou) {
      return;
    }

    this.excluindoId =
      usuario.id;

    this.erro = '';

    this.http
      .delete<{
        message:
          string;
      }>(
        `${environment.apiUrl}/usuarios/${usuario.id}`
      )
      .pipe(
        finalize(() => {

          this.excluindoId =
            null;

          this.cdr
            .detectChanges();
        })
      )
      .subscribe({
        next: () => {

          this.filtrar();

          this.cdr
            .detectChanges();
        },

        error: (
          error
        ) => {

          console.error(
            'Erro ao excluir usuário:',
            error
          );

          this.erro =
            error?.error?.message ??
            'Não foi possível excluir o usuário.';

          this.cdr
            .detectChanges();
        }
      });
  }
}
