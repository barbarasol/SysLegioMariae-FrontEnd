import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CatalogosMembro, MembroListado, ResumoMembros } from '../../models/membro.model';
import { mensagemDeErro } from '../../services/usuario.service';
import { MembroService, type MeuCadastroMembro, type AtualizarMeuCadastroInput } from '../../services/membro.service';
import { ToastService } from '../../services/toast.service';

const ROTULO_STATUS: Record<string, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  FALECIDO: 'Falecido'
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

  private requisicaoMembros?: Subscription;
  private requisicaoResumo?: Subscription;
  private requisicaoCatalogos?: Subscription;
  private requisicaoMeuCadastro?: Subscription;

  constructor(
    private membroService: MembroService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // A lista deve aparecer assim que seu endpoint responder.
    // Resumo e catálogos são independentes: não bloqueiam a tabela.
    this.carregar();
    this.carregarResumo();
    this.carregarCatalogos();
  }

  ngOnDestroy(): void {
    this.requisicaoMembros?.unsubscribe();
    this.requisicaoResumo?.unsubscribe();
    this.requisicaoCatalogos?.unsubscribe();
    this.requisicaoMeuCadastro?.unsubscribe();
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
          if (this.somenteMeuCadastro) this.carregarMeuCadastro();

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
          this.toastService.erro('Seu usuário não possui um registro de membro vinculado. Procure o responsável do Praesidium.');
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
