import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import {
  FiltrosSolicitacaoOficial,
  ResumoOficialPendente,
  SolicitacaoOficial,
  UnidadeOpcao
} from '../../../models/solicitacao-oficial.model';
import { SolicitacaoOficialService } from '../../../services/solicitacao-oficial.service';
import { ToastService } from '../../../services/toast.service';
import { mensagemDeErro } from '../../../services/usuario.service';
import { Breadcrumb, ItemBreadcrumb } from '../../../components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-solicitacoes-oficiais',
  imports: [FormsModule, Breadcrumb],
  templateUrl: './solicitacoes-oficiais.html',
  styleUrl: './solicitacoes-oficiais.scss'
})
export class SolicitacoesOficiais implements OnInit {

  solicitacoes: SolicitacaoOficial[] = [];
  unidades: UnidadeOpcao[] = [];

  resumo: ResumoOficialPendente = {
    pendentes: 0,
    aprovadas: 0,
    rejeitadas: 0,
    canceladas: 0
  };

  filtros: FiltrosSolicitacaoOficial = {
    status: 'PENDENTE',
    unidadeId: '',
    busca: ''
  };

  carregando = false;

  /** Id da solicitacao em analise no momento. */
  analisandoId: string | null = null;

  /** Modal de resposta (aprovar ou rejeitar). */
  modalAberto = false;
  tipoAnalise: 'APROVAR' | 'REJEITAR' = 'APROVAR';
  solicitacaoEmAnalise: SolicitacaoOficial | null = null;
  resposta = '';
  enviandoAnalise = false;

  itens: ItemBreadcrumb[] = [
    { label: 'Início', routerLink: '/home', icone: 'bi-house' },
    { label: 'Oficiais', routerLink: '/oficiais', icone: 'bi-people' },
    { label: 'Solicitações Oficiais', icone: 'bi-person-fill-exclamation' }
  ];

  constructor(
    private service: SolicitacaoOficialService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarTudo();
  }

  carregarTudo(): void {
    this.carregando = true;

    forkJoin({
      solicitacoes: this.service.listar(this.filtros),
      resumo: this.service.resumo().pipe(
        catchError(() => of({
          pendentes: 0,
          aprovadas: 0,
          rejeitadas: 0,
          canceladas: 0
        }))
      ),
      catalogos: this.service.catalogos().pipe(
        catchError(() => of({ unidades: [], cargos: [] }))
      )
    })
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ({ solicitacoes, resumo, catalogos }) => {
          this.solicitacoes = solicitacoes;
          this.resumo = resumo;
          this.unidades = catalogos.unidades;
        },
        error: (error: HttpErrorResponse) => {
          this.solicitacoes = [];

          this.toastService.erro(
            mensagemDeErro(
              error,
              'Nao foi possivel carregar as solicitacoes.'
            )
          );
        }
      });
  }

  filtrar(): void {
    this.carregarTudo();
  }

  limparFiltros(): void {
    this.filtros = {
      status: 'PENDENTE',
      unidadeId: '',
      busca: ''
    };

    this.carregarTudo();
  }

  // ==================================================
  // ANALISE
  // ==================================================

  abrirAnalise(
    solicitacao: SolicitacaoOficial,
    tipo: 'APROVAR' | 'REJEITAR'
  ): void {
    this.solicitacaoEmAnalise = solicitacao;
    this.tipoAnalise = tipo;
    this.resposta = '';
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.solicitacaoEmAnalise = null;
    this.resposta = '';
  }

  confirmarAnalise(): void {
    const solicitacao = this.solicitacaoEmAnalise;

    if (!solicitacao || this.enviandoAnalise) {
      return;
    }

    this.enviandoAnalise = true;
    this.analisandoId = solicitacao.id;

    const chamada = this.tipoAnalise === 'APROVAR'
      ? this.service.aprovar(solicitacao.id, this.resposta)
      : this.service.rejeitar(solicitacao.id, this.resposta);

    chamada
      .pipe(
        finalize(() => {
          this.enviandoAnalise = false;
          this.analisandoId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (atualizada) => {
          const verbo = this.tipoAnalise === 'APROVAR'
            ? 'aprovada'
            : 'rejeitada';

          this.toastService.sucesso(
            `Proposta de "${atualizada.nome}" ${verbo} com sucesso.`
          );

          this.fecharModal();
          this.carregarTudo();
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Nao foi possivel concluir a analise.'
            )
          );
        }
      });
  }

  // ==================================================
  // APRESENTACAO
  // ==================================================

  get rotuloStatus(): Record<string, string> {
    return {
      PENDENTE: 'Pendente',
      APROVADA: 'Aprovada',
      REJEITADA: 'Rejeitada',
      CANCELADA: 'Cancelada'
    };
  }

  classeStatus(status: string): string {
    return status.toLowerCase();
  }

  origemTexto(solicitacao: SolicitacaoOficial): string {
    return solicitacao.origem === 'MEMBRO_EXISTENTE'
      ? 'Membro cadastrado'
      : 'Pessoa nova';
  }

  dataCurta(valor: string | null): string {
    if (!valor) {
      return '-';
    }

    const partes = valor.slice(0, 10).split('-');

    if (partes.length !== 3) {
      return valor;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  contato(solicitacao: SolicitacaoOficial): string {
    return (
      solicitacao.celular ||
      solicitacao.telefone ||
      solicitacao.email ||
      'Sem contato'
    );
  }
}