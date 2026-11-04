import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SolicitacaoDetalhe } from '../../../../models/solicitacao.model';
import { SolicitacaoService } from '../../../../services/solicitacao.service';
import { mensagemDeErro } from '../../../../services/usuario.service';

@Component({
  selector: 'app-visualizar-solicitacao',
  templateUrl: './visualizar-solicitacao.html',
  styleUrl: './visualizar-solicitacao.scss'
})
export class VisualizarSolicitacao implements OnInit {
  carregando = true;
  erro = '';
  solicitacao: SolicitacaoDetalhe | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private solicitacaoService: SolicitacaoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (!id || !/^(?:\d+|UNIDADE:\d+)$/.test(id)) {
      this.erro = 'Identificador da solicitação inválido.';
      this.carregando = false;
      return;
    }
    this.solicitacaoService.obterDetalhe(id)
      .pipe(finalize(() => {
        this.carregando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (dados) => { this.solicitacao = dados; },
        error: (err: HttpErrorResponse) => {
          this.erro = mensagemDeErro(err, 'Não foi possível carregar os dados da solicitação.');
        }
      });
  }

  dataBR(data: string | null | undefined): string {
    if (!data) return '-';
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    const instante = new Date(data);
    return Number.isNaN(instante.valueOf()) ? '-' : new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    }).format(instante);
  }

  get mostrarDataElevacao(): boolean {
    return !!this.solicitacao && ['COMITIUM', 'COMITIA', 'REGIA', 'SENATUS']
      .includes(this.solicitacao.unidadeTipo);
  }

  voltarParaSolicitacao(): void {
    this.router.navigate(['/solicitacoes-unidades']);
  }
}
