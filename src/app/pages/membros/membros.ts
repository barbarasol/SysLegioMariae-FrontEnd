import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CatalogosMembro, MembroListado, ResumoMembros } from '../../models/membro.model';
import { mensagemDeErro } from '../../services/usuario.service';
import { MembroService, type MeuCadastroMembro, type AtualizarMeuCadastroInput, type MembroPendenteValidacao } from '../../services/membro.service';
import { ToastService } from '../../services/toast.service';

const ROTULO_STATUS: Record<string, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  FALECIDO: 'Falecido',
  PENDENTE_VINCULO: 'Aguardando validação pela unidade'
};

function catalogosVazios(): CatalogosMembro {
  return { categorias: [], cargos: [], unidades: [] };
}

@Component({
  imports: [FormsModule],
  selector: 'app-membros',
  styleUrl: './membros.scss',
  templateUrl: './membros.html'
})
export class Membros implements OnInit, OnDestroy {
  membros: MembroListado[] = [];

  resumo: ResumoMembros = {
    total: 0,
    ativos: 0,
    inativos: 0,
    falecidos: 0
  };

  catalogos: CatalogosMembro = catalogosVazios();

  filtros = {
    busca: '',
    status: '',
    unidadeId: '',
    categoriaCodigo: ''
  };

  carregando = true;
  acessoNegado = false;
  platformOwner = false;
  somenteMeuCadastro = false;
  meuCadastro: MeuCadastroMembro | null = null;
  edicaoPropria: AtualizarMeuCadastroInput | null = null;
  salvandoMeuCadastro = false;
  carregandoMeuCadastro = false;

  mostrandoPendentes = false;
  carregandoPendentes = false;
  pendentes: MembroPendenteValidacao[] = [];
  categoriasPendentesSelecionadas: Record<string, string> = {};
  validandoPendenteId: string | null = null;
  erroPendentes = '';

  private requisicaoMembros?: Subscription;
  private requisicaoResumo?: Subscription;
  private requisicaoCatalogos?: Subscription;
  private requisicaoMeuCadastro?: Subscription;
  private requisicaoPendentes?: Subscription;

  constructor(
    private membroService: MembroService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // A lista deve aparecer assim que seu endpoint responder.
    // Resumo e catálogos são independentes: não bloqueiam a tabela.
    this.carregarCatalogos();
  }

  ngOnDestroy(): void {
    this.requisicaoMembros?.unsubscribe();
    this.requisicaoResumo?.unsubscribe();
    this.requisicaoCatalogos?.unsubscribe();
    this.requisicaoMeuCadastro?.unsubscribe();
    this.requisicaoPendentes?.unsubscribe();
  }

  rotulo(status: string): string {
    return ROTULO_STATUS[status] ?? status;
  }

  /** As funções legionárias marcadas, para exibir na linha. */
  funcoes(membro: MembroListado): string[] {
    const lista: string[] = [];

    if (membro.pretoriano) { lista.push('Pretoriano'); }
    if (membro.adjutor) { lista.push('Adjutor'); }
    if (membro.mesc) { lista.push('MESC'); }
    if (membro.catequista) { lista.push('Catequista'); }
    if (membro.coroinha) { lista.push('Coroinha'); }

    return lista;
  }

  private processarErro(erro: HttpErrorResponse, mensagem: string): void {
    if (erro.status === 401 || erro.status === 403) {
      this.acessoNegado = true;
      this.membros = [];
      this.catalogos = catalogosVazios();
      this.platformOwner = false;
      this.somenteMeuCadastro = false;
      this.resumo = { total: 0, ativos: 0, inativos: 0, falecidos: 0 };
      this.carregando = false;
      this.cdr.detectChanges();
      return;
    }

    this.toastService.erro(mensagemDeErro(erro, mensagem));
    this.cdr.detectChanges();
  }

  /** Carrega os registros sem esperar o resumo e os catálogos. */
  carregar(): void {
    if (this.acessoNegado || this.somenteMeuCadastro) return;

    // Filtragem rápida: cancela a requisição anterior para não
    // sobrescrever resultados recentes com respostas antigas.
    this.requisicaoMembros?.unsubscribe();
    this.carregando = true;
    this.cdr.markForCheck();

    this.requisicaoMembros = this.membroService.listar({ ...this.filtros })
      .subscribe({
        next: (membros) => {
          if (!this.acessoNegado) this.membros = membros;
          this.carregando = false;
          this.cdr.detectChanges();
        },
        error: (erro: HttpErrorResponse) => {
          this.membros = [];
          this.carregando = false;
          this.processarErro(erro, 'Não foi possível carregar os membros.');
        }
      });
  }

  /** Contadores não devem atrasar a consulta da lista. */
  private carregarResumo(): void {
    this.requisicaoResumo = this.membroService.resumo().subscribe({
      next: (resumo) => {
        if (!this.acessoNegado) this.resumo = resumo;
        this.cdr.detectChanges();
      },
      error: (erro: HttpErrorResponse) => {
        this.processarErro(erro, 'Não foi possível carregar o resumo dos membros.');
      }
    });
  }

  /** Catálogos não devem atrasar a consulta da lista. */
  private carregarCatalogos(): void {
    this.requisicaoCatalogos = this.membroService.catalogos().subscribe({
      next: (catalogos) => {
        if (!this.acessoNegado) {
          this.catalogos = catalogos;
          const escopo = catalogos as CatalogosMembro & {
            platformOwner?: boolean;
            somenteMeuCadastro?: boolean;
          };
          this.platformOwner = escopo.platformOwner === true;
          this.somenteMeuCadastro = escopo.somenteMeuCadastro === true;
          if (this.somenteMeuCadastro) {
            this.carregando = false;
            this.carregarMeuCadastro();
          } else {
            this.carregar();
            this.carregarResumo();
            this.carregarPendentes();
          }

          // Um único Praesidium autorizado: seleção automática do filtro.
          // A consulta sem filtro já é restrita no backend, portanto não
          // é necessário buscá-la novamente ao preencher esse campo.
          if (!this.platformOwner && catalogos.unidades.length === 1) {
            this.filtros.unidadeId = catalogos.unidades[0].id;
          }
        }
        this.cdr.detectChanges();
      },
      error: (erro: HttpErrorResponse) => {
        this.processarErro(erro, 'Não foi possível carregar as unidades autorizadas.');
      }
    });
  }

  /** Catálogo real do banco; o responsável escolhe uma categoria Ativo/Auxiliar. */
  get categoriasValidacao(): CatalogosMembro['categorias'] {
    return this.catalogos.categorias.filter(categoria => {
      const descricao = `${categoria.codigo} ${categoria.nome}`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      return /(^|[^A-Z])(ATIV[OA]S?|AUXILIAR(?:ES)?)(?=[^A-Z]|$)/.test(descricao);
    });
  }

  alternarPendentes(): void {
    if (this.acessoNegado || this.somenteMeuCadastro) return;
    this.mostrandoPendentes = !this.mostrandoPendentes;
    if (this.mostrandoPendentes) this.carregarPendentes();
  }

  carregarPendentes(): void {
    if (this.acessoNegado || this.somenteMeuCadastro) return;
    this.requisicaoPendentes?.unsubscribe();
    this.carregandoPendentes = true;
    this.erroPendentes = '';
    this.requisicaoPendentes = this.membroService.listarPendentes().subscribe({
      next: pendentes => {
        this.pendentes = Array.isArray(pendentes) ? pendentes : [];
        this.carregandoPendentes = false;
        this.cdr.detectChanges();
      },
      error: (erro: HttpErrorResponse) => {
        this.carregandoPendentes = false;
        this.erroPendentes = mensagemDeErro(erro, 'Não foi possível consultar membros pendentes.');
        this.cdr.detectChanges();
      }
    });
  }

  validarPendente(pendente: MembroPendenteValidacao): void {
    if (this.validandoPendenteId || this.carregandoPendentes || this.somenteMeuCadastro) return;
    const categoriaCodigo = this.categoriasPendentesSelecionadas[pendente.usuarioId] ?? '';
    const categoria = this.categoriasValidacao.find(c => c.codigo === categoriaCodigo);
    if (!categoria) {
      this.erroPendentes = 'Selecione uma categoria Ativo ou Auxiliar para validar o membro.';
      return;
    }
    const confirmado = window.confirm(
      `Confirmar ${pendente.nome} como ${categoria.nome} no Praesidium ${pendente.unidadeNome}?`
    );
    if (!confirmado) return;
    this.erroPendentes = '';
    this.validandoPendenteId = pendente.usuarioId;
    this.membroService.validarPendente(pendente.usuarioId, categoriaCodigo).subscribe({
      next: () => {
        this.validandoPendenteId = null;
        delete this.categoriasPendentesSelecionadas[pendente.usuarioId];
        this.toastService.sucesso(`Vínculo de ${pendente.nome} validado com sucesso.`);
        this.carregarPendentes();
        this.carregar();
        this.carregarResumo();
        this.cdr.detectChanges();
      },
      error: (erro: HttpErrorResponse) => {
        this.validandoPendenteId = null;
        this.erroPendentes = mensagemDeErro(erro, 'Não foi possível validar o membro.');
        this.cdr.detectChanges();
      }
    });
  }

  filtrar(): void {
    if (!this.somenteMeuCadastro) this.carregar();
  }

  limparFiltros(): void {
    this.filtros = {
      busca: '',
      status: '',
      unidadeId: '',
      categoriaCodigo: ''
    };

    if (!this.platformOwner && this.catalogos.unidades.length === 1) {
      this.filtros.unidadeId = this.catalogos.unidades[0].id;
    }

    this.carregar();
  }

  novoMembro(): void {
    if (this.acessoNegado || this.somenteMeuCadastro || this.catalogos.unidades.length === 0) return;
    this.router.navigate(['cadastro-membro']);
  }


  /** O perfil MEMBRO consulta e altera somente o cadastro vinculado à sua própria pessoa. */
  carregarMeuCadastro(): void {
    this.requisicaoMeuCadastro?.unsubscribe();
    this.carregandoMeuCadastro = true;
    this.requisicaoMeuCadastro = this.membroService.meuCadastro().subscribe({
      next: (cadastro) => {
        this.meuCadastro = cadastro;
        this.edicaoPropria = this.paraEdicao(cadastro);
        this.carregandoMeuCadastro = false;
        this.cdr.detectChanges();
      },
      error: (erro: HttpErrorResponse) => {
        this.carregandoMeuCadastro = false;
        // Um usuário pode ter acesso MEMBRO ativo e ainda não ter cadastro na tabela membro.
        if (erro.status === 404) {
          this.meuCadastro = null;
          this.edicaoPropria = null;
          this.toastService.erro('Não foi possível localizar seu cadastro pessoal.');
          this.cdr.detectChanges();
          return;
        }
        this.processarErro(erro, 'Não foi possível consultar o seu cadastro.');
      }
    });
  }

  private paraEdicao(cadastro: MeuCadastroMembro): AtualizarMeuCadastroInput {
    return {
      nome: cadastro.nome,
      nomePreferido: cadastro.nomePreferido,
      rg: cadastro.rg,
      dataNascimento: cadastro.dataNascimento,
      email: cadastro.email,
      celular: cadastro.celular,
      telefone: cadastro.telefone,
      formacaoEscolar: cadastro.formacaoEscolar,
      aposentado: cadastro.aposentado
    };
  }

  salvarMeuCadastro(): void {
    const dados = this.edicaoPropria;
    if (!dados || this.salvandoMeuCadastro || !dados.nome.trim()) return;
    this.salvandoMeuCadastro = true;
    this.membroService.atualizarMeuCadastro({ ...dados }).subscribe({
      next: (atualizado) => {
        this.meuCadastro = atualizado;
        this.edicaoPropria = this.paraEdicao(atualizado);
        this.salvandoMeuCadastro = false;
        this.toastService.sucesso('Seus dados foram atualizados com sucesso.');
        this.cdr.detectChanges();
      },
      error: (erro: HttpErrorResponse) => {
        this.salvandoMeuCadastro = false;
        this.processarErro(erro, 'Não foi possível atualizar os seus dados.');
      }
    });
  }
}
