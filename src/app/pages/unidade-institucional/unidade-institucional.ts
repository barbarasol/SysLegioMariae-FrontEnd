import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CadastroUnidadeService, TipoUnidadeOpcao, UnidadeEstrutura } from '../../services/cadastro-unidade.service';
import { UnidadeInstitucionalService } from '../../services/unidade-institucional.service';
import { AtualizarDadosInstitucionais, dadosVazios } from '../../models/unidade-institucional.model';
import { Breadcrumb, ItemBreadcrumb } from '../../components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-unidade-institucional',
  imports: [FormsModule, RouterLink, Breadcrumb],
  templateUrl: './unidade-institucional.html',
  styleUrl: './unidade-institucional.scss'
})
export class UnidadeInstitucional implements OnInit {
  tipos: TipoUnidadeOpcao[] = [];
  unidades: UnidadeEstrutura[] = [];
  unidadesDoTipo: UnidadeEstrutura[] = [];
  tipoSelecionado = '';
  unidadeId = '';
  dados: AtualizarDadosInstitucionais = dadosVazios();
  carregandoUnidades = true;
  carregando = false;
  consultaPermitida = false;
  podeEditar = false;
  salvando = false;
  erro = '';
  sucesso = '';

  itens: ItemBreadcrumb[] = [
    { label: 'Início', routerLink: '/home', icone: 'bi-house' },
    { label: 'Conselhos-Praesidia', routerLink: '/afiliacao', icone: 'bi-diagram-3' },
    { label: 'Dados Institucional', routerLink: '/unidade-institucional', icone: 'bi-card-checklist'}
  ];

  constructor(
    private readonly cadastro: CadastroUnidadeService,
    private readonly service: UnidadeInstitucionalService,
    private readonly rota: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    forkJoin({tipos: this.cadastro.listarTipos(), unidades: this.cadastro.listarEstrutura()}).subscribe({
      next: ({tipos, unidades}) => {
        this.tipos = [...tipos].sort((a,b) => (a.ordemHierarquica ?? 999) - (b.ordemHierarquica ?? 999));
        this.unidades = [...unidades].sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'));
        const unidade = this.unidades.find(u => u.id === this.rota.snapshot.queryParamMap.get('unidadeId'));
        if (unidade) { this.tipoSelecionado = unidade.tipo; this.unidadeId = unidade.id; }
        this.atualizarUnidades(); this.carregandoUnidades = false;
        if (this.unidadeId) this.carregar();
        this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => { this.erro = this.mensagem(e, 'Falha ao consultar unidades.'); this.carregandoUnidades = false; this.cdr.detectChanges(); }
    });
  }
  atualizarUnidades(): void {
    this.unidadesDoTipo = this.tipoSelecionado ? this.unidades.filter(u => u.tipo === this.tipoSelecionado) : [...this.unidades];
  }
  aoTrocarTipo(): void { this.unidadeId = ''; this.atualizarUnidades(); this.limpar(); }
  aoTrocarUnidade(): void { this.limpar(); if (this.unidadeId) this.carregar(); }
  private limpar(): void { this.dados = dadosVazios(); this.podeEditar = false; this.consultaPermitida = false; this.erro = ''; this.sucesso = ''; }
  carregar(): void {
    if (!this.unidadeId) return;
    const uid = this.unidadeId;
    this.carregando = true; this.erro = '';
    this.service.obter(uid).subscribe({
      next: (r) => {
        if (this.unidadeId !== uid) return;
        this.dados = {
          num_ult_ata: r.dados.num_ult_ata,
          num_ult_relatorio: r.dados.num_ult_relatorio,
          dt_apresentacao_ult_relatorio: r.dados.dt_apresentacao_ult_relatorio,
          dt_ultimo_congresso: r.dados.dt_ultimo_congresso
        };
        this.podeEditar = r.permissoes.editar;
        this.consultaPermitida = true;
        this.carregando = false; this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => {
        if (this.unidadeId !== uid) return;
        this.erro = this.mensagem(e, 'Falha ao obter dados institucionais.');
        this.carregando = false; this.cdr.detectChanges();
      }
    });
  }
  salvar(): void {
    if (!this.unidadeId || !this.podeEditar || this.salvando || this.carregando) return;
    const a = this.dados.num_ult_ata;
    const r = this.dados.num_ult_relatorio;
    if ([a,r].some(v => v !== null && (!Number.isSafeInteger(Number(v)) || Number(v) < 0))) {
      this.erro = 'Informe números de ata e relatório inteiros e não negativos.'; return;
    }
    this.salvando = true; this.erro = ''; this.sucesso = '';
    const payload: AtualizarDadosInstitucionais = {
      num_ult_ata: a === null || a === undefined ? null : Number(a),
      num_ult_relatorio: r === null || r === undefined ? null : Number(r),
      dt_apresentacao_ult_relatorio: this.dados.dt_apresentacao_ult_relatorio || null,
      dt_ultimo_congresso: this.dados.dt_ultimo_congresso || null
    };
    this.service.salvar(this.unidadeId, payload).subscribe({
      next: () => { this.salvando = false; this.sucesso = 'Dados institucionais atualizados.'; this.carregar(); },
      error: (e: HttpErrorResponse) => { this.salvando = false; this.erro = this.mensagem(e, 'Não foi possível salvar.'); this.cdr.detectChanges(); }
    });
  }
  private mensagem(e: HttpErrorResponse, fallback: string): string {
    return typeof e.error?.message === 'string' ? e.error.message : fallback;
  }
}
