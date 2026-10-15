import {
  CommonModule
} from '@angular/common';

import {
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
  Router
} from '@angular/router';

import {
  finalize,
  forkJoin
} from 'rxjs';

import {
  AcessoUnidade,
  PerfilDisponivel,
  UnidadeDisponivel,
  UsuarioLista
} from '../../../models/usuario.model';

import {
  UsuarioService
} from '../../../services/usuario.service';

type CampoOrdenacao =
  | 'nome'
  | 'cpf'
  | 'celular'
  | 'email';

type DirecaoOrdenacao =
  | 'asc'
  | 'desc';

interface UsuarioEdicao
  extends UsuarioLista {
  perfilCodigo: string;
}

interface AcessoFormulario {
  unidadeId: string;
  perfilCodigo: string;
  observacao: string;
}

@Component({
  selector:
    'app-listagem-usuarios',

  standalone:
    true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl:
    './listagem-usuarios.html',

  styleUrl:
    './listagem-usuarios.scss'
})
export class ListagemUsuarios
implements OnInit {

  filtroNome = '';
  filtroCpf = '';
  filtroCelular = '';
  filtroEmail = '';

  usuarios:
    UsuarioLista[] = [];

  perfisGlobais:
    PerfilDisponivel[] = [];

  perfisUnidade:
    PerfilDisponivel[] = [];

  unidadesDisponiveis:
    UnidadeDisponivel[] = [];

  acessosUnidade:
    AcessoUnidade[] = [];

  usuarioEdicao:
    UsuarioEdicao | null =
      null;

  acessoFormulario:
    AcessoFormulario = {
      unidadeId: '',
      perfilCodigo: '',
      observacao: ''
    };

  acessoEditando:
    AcessoUnidade | null =
      null;

  carregando = false;
  carregandoCadastros = false;
  carregandoAcessos = false;
  salvandoEdicao = false;
  salvandoAcesso = false;

  excluindoId:
    string | null =
      null;

  removendoAcessoChave:
    string | null =
      null;

  erro = '';
  erroEdicao = '';
  erroAcesso = '';
  sucessoEdicao = '';
  sucessoAcesso = '';

  campoOrdenacao:
    CampoOrdenacao =
      'nome';

  direcaoOrdenacao:
    DirecaoOrdenacao =
      'asc';

  constructor(
    private usuarioService:
      UsuarioService,

    private router:
      Router,

    private cdr:
      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarCadastrosApoio();
    this.filtrar();
  }

  carregarCadastrosApoio():
  void {

    if (
      this.carregandoCadastros
    ) {
      return;
    }

    this.carregandoCadastros =
      true;

    forkJoin({
      globais:
        this.usuarioService
          .listarPerfisGlobais(),

      unidade:
        this.usuarioService
          .listarPerfisUnidade(),

      unidades:
        this.usuarioService
          .listarUnidadesDisponiveis()
    })
      .pipe(
        finalize(() => {
          this.carregandoCadastros =
            false;

          this.cdr
            .detectChanges();
        })
      )
      .subscribe({
        next: (
          resultado
        ) => {

          this.perfisGlobais =
            Array.isArray(
              resultado
                .globais
                ?.perfis
            )
              ? resultado
                  .globais
                  .perfis
              : [];

          this.perfisUnidade =
            Array.isArray(
              resultado
                .unidade
                ?.perfis
            )
              ? resultado
                  .unidade
                  .perfis
              : [];

          this.unidadesDisponiveis =
            Array.isArray(
              resultado
                .unidades
                ?.unidades
            )
              ? resultado
                  .unidades
                  .unidades
              : [];

          this.cdr
            .detectChanges();
        },

        error: (
          error
        ) => {

          console.error(
            'Erro ao carregar perfis/unidades:',
            error
          );

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

    this.usuarioService
      .listar(
        params
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
              resultado
                ?.usuarios
            )
              ? resultado
                  .usuarios
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

  perfilGlobalUsuario(
    usuario:
      UsuarioLista
  ): string {

    if (
      !usuario.perfisGlobais ||
      usuario
        .perfisGlobais
        .length === 0
    ) {
      return 'SEM PERFIL GLOBAL';
    }

    return usuario
      .perfisGlobais
      .join(', ');
  }

  statusUsuario(
    status:
      string
  ): string {

    if (
      status ===
      'PENDENTE_EMAIL'
    ) {
      return 'PENDENTE DE AUTORIZAÇÃO';
    }

    return status;
  }

  limparFiltros():
  void {

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

    this.router.navigate([
      '/novo-usuario'
    ]);
  }

  editarUsuario(
    usuario:
      UsuarioLista
  ): void {

    this.erroEdicao = '';
    this.erroAcesso = '';
    this.sucessoEdicao = '';
    this.sucessoAcesso = '';

    this.acessoEditando =
      null;

    this.limparFormularioAcesso();

    this.usuarioEdicao = {
      ...usuario,

      nomePreferido:
        usuario
          .nomePreferido ??
        '',

      cpf:
        usuario.cpf ??
        '',

      celular:
        usuario.celular ??
        '',

      perfisGlobais: [
        ...(
          usuario
            .perfisGlobais ??
          []
        )
      ],

      perfilCodigo:
        usuario
          .perfisGlobais
          ?.[0] ??
        ''
    };

    if (
      (
        this.perfisGlobais
          .length === 0 ||
        this.perfisUnidade
          .length === 0 ||
        this.unidadesDisponiveis
          .length === 0
      ) &&
      !this.carregandoCadastros
    ) {
      this.carregarCadastrosApoio();
    }

    this.carregarAcessosUnidade();

    this.cdr
      .detectChanges();
  }

  carregarAcessosUnidade():
  void {

    if (
      !this.usuarioEdicao
    ) {
      return;
    }

    this.carregandoAcessos =
      true;

    this.erroAcesso = '';

    this.usuarioService
      .listarAcessosUnidade(
        this.usuarioEdicao.id
      )
      .pipe(
        finalize(() => {

          this.carregandoAcessos =
            false;

          this.cdr
            .detectChanges();
        })
      )
      .subscribe({
        next: (
          resultado
        ) => {

          this.acessosUnidade =
            Array.isArray(
              resultado
                ?.acessos
            )
              ? resultado
                  .acessos
              : [];

          this.cdr
            .detectChanges();
        },

        error: (
          error
        ) => {

          console.error(
            'Erro ao carregar acessos por unidade:',
            error
          );

          this.acessosUnidade =
            [];

          this.erroAcesso =
            error?.error?.message ??
            'Não foi possível carregar os acessos por unidade.';

          this.cdr
            .detectChanges();
        }
      });
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

    this.salvandoEdicao =
      true;

    this.erroEdicao = '';
    this.sucessoEdicao = '';

    this.usuarioService
      .atualizar(
        this.usuarioEdicao.id,
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

          /*
           * Vazio = sem perfil global.
           */
          perfilCodigo:
            this.usuarioEdicao
              .perfilCodigo ||
            null
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
        next: (
          resultado
        ) => {

          this.usuarioEdicao = {
            ...this.usuarioEdicao!,
            ...resultado.usuario,
            perfilCodigo:
              resultado
                .usuario
                .perfisGlobais
                ?.[0] ??
              ''
          };

          this.sucessoEdicao =
            'Dados do usuário e perfil global atualizados com sucesso.';

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

  editarAcesso(
    acesso:
      AcessoUnidade
  ): void {

    this.erroAcesso = '';
    this.sucessoAcesso = '';

    this.acessoEditando = {
      ...acesso
    };

    this.acessoFormulario = {
      unidadeId:
        acesso.unidadeId,

      perfilCodigo:
        acesso.perfilCodigo,

      observacao:
        ''
    };

    this.cdr
      .detectChanges();
  }

  cancelarEdicaoAcesso():
  void {

    if (
      this.salvandoAcesso
    ) {
      return;
    }

    this.acessoEditando =
      null;

    this.limparFormularioAcesso();

    this.erroAcesso = '';
    this.sucessoAcesso = '';

    this.cdr
      .detectChanges();
  }

  salvarAcesso():
  void {

    if (
      !this.usuarioEdicao ||
      this.salvandoAcesso
    ) {
      return;
    }

    const unidadeId =
      this.acessoFormulario
        .unidadeId
        .trim();

    const perfilCodigo =
      this.acessoFormulario
        .perfilCodigo
        .trim();

    if (!unidadeId) {
      this.erroAcesso =
        'Selecione a unidade.';
      return;
    }

    if (!perfilCodigo) {
      this.erroAcesso =
        'Selecione o perfil da unidade.';
      return;
    }

    this.salvandoAcesso =
      true;

    this.erroAcesso = '';
    this.sucessoAcesso = '';

    const payload = {
      unidadeId,
      perfilCodigo,

      observacao:
        this.acessoFormulario
          .observacao
          .trim() ||
        null
    };

    const requisicao =
      this.acessoEditando
        ? this.usuarioService
            .alterarAcessoUnidade(
              this.usuarioEdicao.id,
              this.acessoEditando
                .unidadeId,
              this.acessoEditando
                .perfilCodigo,
              payload
            )
        : this.usuarioService
            .adicionarAcessoUnidade(
              this.usuarioEdicao.id,
              payload
            );

    requisicao
      .pipe(
        finalize(() => {

          this.salvandoAcesso =
            false;

          this.cdr
            .detectChanges();
        })
      )
      .subscribe({
        next: () => {

          this.sucessoAcesso =
            this.acessoEditando
              ? 'Acesso por unidade atualizado com sucesso.'
              : 'Acesso por unidade incluído com sucesso.';

          this.acessoEditando =
            null;

          this.limparFormularioAcesso();

          this.carregarAcessosUnidade();

          this.cdr
            .detectChanges();
        },

        error: (
          error
        ) => {

          console.error(
            'Erro ao salvar acesso por unidade:',
            error
          );

          this.erroAcesso =
            error?.error?.message ??
            'Não foi possível salvar o acesso por unidade.';

          this.cdr
            .detectChanges();
        }
      });
  }

  removerAcesso(
    acesso:
      AcessoUnidade
  ): void {

    if (
      !this.usuarioEdicao ||
      this.removendoAcessoChave
    ) {
      return;
    }

    const confirmou =
      window.confirm(
        `Remover o perfil ${acesso.perfilCodigo} da unidade "${acesso.unidadeNome}"?`
      );

    if (!confirmou) {
      return;
    }

    this.removendoAcessoChave =
      this.chaveAcesso(
        acesso
      );

    this.erroAcesso = '';
    this.sucessoAcesso = '';

    this.usuarioService
      .removerAcessoUnidade(
        this.usuarioEdicao.id,
        acesso.unidadeId,
        acesso.perfilCodigo
      )
      .pipe(
        finalize(() => {

          this.removendoAcessoChave =
            null;

          this.cdr
            .detectChanges();
        })
      )
      .subscribe({
        next: () => {

          if (
            this.acessoEditando &&
            this.chaveAcesso(
              this.acessoEditando
            ) ===
            this.chaveAcesso(
              acesso
            )
          ) {
            this.acessoEditando =
              null;

            this.limparFormularioAcesso();
          }

          this.sucessoAcesso =
            'Acesso removido com sucesso.';

          this.carregarAcessosUnidade();

          this.cdr
            .detectChanges();
        },

        error: (
          error
        ) => {

          console.error(
            'Erro ao remover acesso:',
            error
          );

          this.erroAcesso =
            error?.error?.message ??
            'Não foi possível remover o acesso.';

          this.cdr
            .detectChanges();
        }
      });
  }

  chaveAcesso(
    acesso:
      AcessoUnidade
  ): string {

    return (
      `${acesso.unidadeId}` +
      ':' +
      `${acesso.perfilCodigo}`
    );
  }

  unidadeAprovada(
    unidade:
      UnidadeDisponivel
  ): boolean {

    return (
      unidade
        .statusAprovacao ===
      'APROVADA'
    );
  }

  perfilMembroSelecionado():
  boolean {

    return (
      this.acessoFormulario
        .perfilCodigo ===
      'MEMBRO'
    );
  }

  cancelarEdicao():
  void {

    if (
      this.salvandoEdicao ||
      this.salvandoAcesso
    ) {
      return;
    }

    this.usuarioEdicao =
      null;

    this.acessosUnidade =
      [];

    this.acessoEditando =
      null;

    this.limparFormularioAcesso();

    this.erroEdicao = '';
    this.erroAcesso = '';
    this.sucessoEdicao = '';
    this.sucessoAcesso = '';

    this.cdr
      .detectChanges();
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

    this.usuarioService
      .excluir(
        usuario.id
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

  private limparFormularioAcesso():
  void {

    this.acessoFormulario = {
      unidadeId: '',
      perfilCodigo: '',
      observacao: ''
    };
  }
}
