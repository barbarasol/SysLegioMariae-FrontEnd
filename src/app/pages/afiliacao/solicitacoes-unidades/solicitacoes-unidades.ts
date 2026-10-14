import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { ResumoStatus, SolicitacaoStatus, SolicitacaoUnidade } from '../../../models/solicitacao.model';
import { SolicitacaoService } from '../../../services/solicitacao.service';
import { ToastService } from '../../../services/toast.service';
import { mensagemDeErro } from '../../../services/usuario.service';
import { DatePipe } from '@angular/common';


const ROTULO_STATUS: Record<SolicitacaoStatus, string> = {
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
  CANCELADA: 'Cancelada'
};

@Component({
  selector: 'app-solicitacoes-unidades',
  imports: [
    RouterLink,
    FormsModule,
    DatePipe
  ],
  templateUrl: './solicitacoes-unidades.html',
  styleUrl: './solicitacoes-unidades.scss'
})
export class SolicitacoesUnidades implements OnInit {

  solicitacoes: SolicitacaoUnidade[] = [];

  resumo: ResumoStatus = {
    pendentes: 0,
    aprovadas: 0,
    rejeitadas: 0
  };

  filtroStatus = '';
  filtroTipo = '';

  carregando = false;
  processandoId: string | null = null;

  constructor(
    private solicitacaoService: SolicitacaoService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarTudo();
  }

  rotulo(status: SolicitacaoStatus): string {
    return ROTULO_STATUS[status] ?? status;
  }

  carregarTudo(): void {
    this.carregando = true;

    forkJoin({
      solicitacoes: this.solicitacaoService.listar(
        this.filtroStatus || null,
        this.filtroTipo || null
      ),
      resumo: this.solicitacaoService
        .resumo()
        .pipe(
          catchError(() => of({
            pendentes: 0,
            aprovadas: 0,
            rejeitadas: 0
          }))
        )
    })
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ({ solicitacoes, resumo }) => {
          this.solicitacoes = solicitacoes;
          this.resumo = resumo;
        },
        error: (error: HttpErrorResponse) => {
          this.solicitacoes = [];

          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível carregar as solicitações.'
            )
          );
        }
      });
  }

  filtrar(): void {
    this.carregarTudo();
  }

  limparFiltros(): void {
    this.filtroStatus = '';
    this.filtroTipo = '';
    this.carregarTudo();
  }

  aprovar(solicitacao: SolicitacaoUnidade): void {
    if (this.processandoId) {
      return;
    }

    this.processandoId = solicitacao.id;

    this.solicitacaoService
      .aprovar(solicitacao.id)
      .pipe(
        finalize(() => {
          this.processandoId = null;
        })
      )
      .subscribe({
        next: (atualizada) => {
          this.toastService.sucesso(
            `Unidade "${atualizada.unidadeNome}" aprovada com sucesso.`
          );

          this.carregarTudo();
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível aprovar a solicitação.'
            )
          );
        }
      });
  }

  rejeitar(solicitacao: SolicitacaoUnidade): void {
    if (this.processandoId) {
      return;
    }

    this.processandoId = solicitacao.id;

    this.solicitacaoService
      .rejeitar(solicitacao.id)
      .pipe(
        finalize(() => {
          this.processandoId = null;
        })
      )
      .subscribe({
        next: (atualizada) => {
          this.toastService.info(
            `Unidade "${atualizada.unidadeNome}" rejeitada.`
          );

          this.carregarTudo();
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível rejeitar a solicitação.'
            )
          );
        }
      });
  }
}