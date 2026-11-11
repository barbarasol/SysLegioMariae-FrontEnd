import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import {
  CadastroUnidadeService,
  TipoUnidadeOpcao,
  UnidadeEstrutura
} from '../../services/cadastro-unidade.service';
import { UnidadeNumerosService } from '../../services/unidade-numeros.service';
import {
  criarValoresVazios, extrairValores, GRUPOS_NUMEROS,
  PermissoesNumerosUnidade,
  RegistroNumerosUnidade, ValoresNumerosUnidade
} from '../../models/unidade-numeros.model';
import { Breadcrumb, ItemBreadcrumb } from '../../components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-numeros-unidades',
  imports: [FormsModule, RouterLink, Breadcrumb],
  templateUrl: './numeros-unidades.html',
  styleUrl: './numeros-unidades.scss'
})
export class NumerosUnidades implements OnInit {
  readonly grupos = GRUPOS_NUMEROS;
  readonly meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  readonly anos = Array.from({ length: 7 }, (_, indice) => new Date().getFullYear() + 2 - indice);
  tipos: TipoUnidadeOpcao[] = [];
  unidades: UnidadeEstrutura[] = [];
  unidadesDoTipo: UnidadeEstrutura[] = [];
  tipoSelecionado = '';
  unidadeId = '';
  ano = new Date().getFullYear();
  mes = new Date().getMonth() + 1;

  valores: ValoresNumerosUnidade = criarValoresVazios();
  registro: RegistroNumerosUnidade | null = null;
  historico: RegistroNumerosUnidade[] = [];
  permissoes: PermissoesNumerosUnidade = { editar: false };
  sugestaoCopia: RegistroNumerosUnidade | null = null;
  copiaPendente = false;
  copiadoDeId: string | null = null;
  carregandoUnidades = false;
  carregando = false;
  consultaPermitida = false;
  salvando = false;
  alterado = false;
  erro = '';
  sucesso = '';

  itens: ItemBreadcrumb[] = [
    { label: 'Início', routerLink: '/home', icone: 'bi-house' },
    { label: 'Conselhos-Praesidia', routerLink: '/afiliacao', icone: 'bi-diagram-3' },
    { label: 'Números Unidade', routerLink: '/numeros-unidade', icone: 'bi-bar-chart-line'}
  ];

  constructor(
    private cadastroUnidade: CadastroUnidadeService,
    private numerosService: UnidadeNumerosService,
    private rota: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  get unidadeSelecionada(): UnidadeEstrutura | null {
    return this.unidades.find(u => u.id === this.unidadeId) ?? null;
  }

  get podeEditar(): boolean {
    return !!this.unidadeId && this.permissoes.editar && !this.salvando && !this.carregando && !this.copiaPendente;
  }

  get totalAtivos(): number | null {
    const a = this.valores.qtd_ativos_com_promessa;
    const b = this.valores.qtd_ativos_sem_promessa;
    return a == null && b == null ? null : (a ?? 0) + (b ?? 0);
  }

  get totalAuxiliares(): number | null {
    const a = this.valores.qtd_auxiliares_permanentes;
    const b = this.valores.qtd_auxiliares_provisorios;
    return a == null && b == null ? null : (a ?? 0) + (b ?? 0);
  }

  ngOnInit(): void {
    this.carregandoUnidades = true;
    forkJoin({
      tipos: this.cadastroUnidade.listarTipos(),
      unidades: this.cadastroUnidade.listarEstrutura()
    }).subscribe({
      next: ({ tipos, unidades }) => {
        this.tipos = [...tipos].sort((a, b) =>
          (a.ordemHierarquica ?? 999) - (b.ordemHierarquica ?? 999)
        );
        this.unidades = [...unidades].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        const destino = this.rota.snapshot.queryParamMap.get('unidadeId');
        const unidade = this.unidades.find(u => u.id === destino);
        if (unidade) {
          this.tipoSelecionado = unidade.tipo;
          this.atualizarListaUnidades();
          this.unidadeId = unidade.id;
          this.carregarCompetencia();
        } else {
          this.atualizarListaUnidades();
        }
        this.carregandoUnidades = false;
        this.cdr.detectChanges();
      },
      error: (erro: HttpErrorResponse) => {
        this.erro = this.mensagemErro(erro, 'Não foi possível carregar a estrutura das unidades.');
        this.carregandoUnidades = false;
        this.cdr.detectChanges();
      }
    });
  }

  atualizarListaUnidades(): void {
    this.unidadesDoTipo = this.tipoSelecionado
      ? this.unidades.filter(u => u.tipo === this.tipoSelecionado)
      : [...this.unidades];
  }

  aoTrocarTipo(): void {
    this.unidadeId = '';
    this.atualizarListaUnidades();
    this.limparDados();
  }

  aoTrocarUnidade(): void {
    this.limparDados();
    if (this.unidadeId) this.carregarCompetencia();
  }

  aoTrocarCompetencia(): void {
    this.limparDados();
    if (this.unidadeId) this.carregarCompetencia();
  }

  marcarAlterado(): void {
    this.alterado = true;
    this.sucesso = '';
  }

  private limparDados(): void {
    this.valores = criarValoresVazios();
    this.registro = null;
    this.consultaPermitida = false;
    this.historico = [];
    this.permissoes = { editar: false };
    this.sugestaoCopia = null;
    this.copiaPendente = false;
    this.copiadoDeId = null;
    this.alterado = false;
    this.erro = '';
    this.sucesso = '';
  }

  carregarCompetencia(): void {
    if (!this.unidadeId) return;
    const unidadeId = this.unidadeId;
    const ano = Number(this.ano);
    const mes = Number(this.mes);
    this.carregando = true;
    this.erro = '';
    forkJoin({
      atual: this.numerosService.obter(unidadeId, ano, mes),
      historico: this.numerosService.listarHistorico(unidadeId, ano),
      ultimo: this.numerosService.listarHistorico(unidadeId)
    }).subscribe({
      next: ({ atual, historico, ultimo }) => {
        // Evita sobrescrever o formulário quando usuário troca filtro rapidamente.
        if (this.unidadeId !== unidadeId || Number(this.ano) !== ano || Number(this.mes) !== mes) return;
        this.registro = atual.registro;
        this.consultaPermitida = true;
        this.permissoes = atual.permissoes;
        this.valores = atual.registro ? extrairValores(atual.registro) : criarValoresVazios();
        this.historico = historico.registros;
        // Só propõe copiar quando a competência selecionada ainda não existe.
        // A última competência é específica da unidade e pode ser de outro ano.
        this.sugestaoCopia = !atual.registro && atual.permissoes.editar
          ? (ultimo.registros[0] ?? null) : null;
        this.copiaPendente = this.sugestaoCopia !== null;
        this.copiadoDeId = null;
        this.alterado = false;
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (erro: HttpErrorResponse) => {
        if (this.unidadeId !== unidadeId || Number(this.ano) !== ano || Number(this.mes) !== mes) return;
        this.erro = this.mensagemErro(erro, 'Não foi possível consultar os números desta unidade.');
        this.consultaPermitida = false;
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  salvar(): void {
    if (!this.podeEditar || this.carregando || !this.unidadeId) return;
    this.salvando = true;
    this.erro = '';
    this.sucesso = '';
    this.numerosService.salvar(this.unidadeId, Number(this.ano), Number(this.mes), this.valores, this.copiadoDeId).subscribe({
      next: ({ registro }) => {
        this.registro = registro;
        this.valores = extrairValores(registro);
        this.alterado = false;
        this.salvando = false;
        this.copiadoDeId = null;
        this.sugestaoCopia = null;
        this.copiaPendente = false;
        this.sucesso = 'Indicadores salvos com sucesso. Você pode editá-los novamente quando precisar.';
        this.carregarHistorico();
        this.cdr.detectChanges();
      },
      error: (erro: HttpErrorResponse) => {
        this.erro = this.mensagemErro(erro, 'Não foi possível salvar os indicadores.');
        this.salvando = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Preenche localmente a nova competência, sem salvar nem criar linha no banco. */
  usarUltimaCompetencia(): void {
    if (!this.sugestaoCopia || !this.copiaPendente) return;
    this.valores = extrairValores(this.sugestaoCopia);
    this.copiadoDeId = this.sugestaoCopia.id;
    this.copiaPendente = false;
    this.alterado = true;
    this.sucesso = 'Números copiados para o formulário. Confira e clique em Salvar para registrar.';
    this.cdr.detectChanges();
  }

  iniciarEmBranco(): void {
    if (!this.copiaPendente) return;
    this.valores = criarValoresVazios();
    this.copiadoDeId = null;
    this.copiaPendente = false;
    this.alterado = false;
    this.sucesso = '';
    this.cdr.detectChanges();
  }

  get ativosOrigem(): number | null {
    if (!this.sugestaoCopia) return null;
    const r = this.sugestaoCopia;
    return r.qtd_ativos_com_promessa == null && r.qtd_ativos_sem_promessa == null
      ? null : (r.qtd_ativos_com_promessa ?? 0) + (r.qtd_ativos_sem_promessa ?? 0);
  }

  get auxiliaresOrigem(): number | null {
    if (!this.sugestaoCopia) return null;
    const r = this.sugestaoCopia;
    return r.qtd_auxiliares_permanentes == null && r.qtd_auxiliares_provisorios == null
      ? null : (r.qtd_auxiliares_permanentes ?? 0) + (r.qtd_auxiliares_provisorios ?? 0);
  }

  private carregarHistorico(): void {
    if (!this.unidadeId) return;
    this.numerosService.listarHistorico(this.unidadeId, Number(this.ano)).subscribe({
      next: ({ registros }) => {
        this.historico = registros;
        this.cdr.detectChanges();
      }
    });
  }

  selecionarHistorico(registro: RegistroNumerosUnidade): void {
    this.ano = registro.ano;
    this.mes = registro.mes;
    this.aoTrocarCompetencia();
  }

  labelMes(mes: number): string {
    return this.meses[mes - 1] ?? String(mes);
  }

  totalHistorico(registro: RegistroNumerosUnidade): number | null {
    const a = registro.qtd_ativos_com_promessa;
    const b = registro.qtd_ativos_sem_promessa;
    return a == null && b == null ? null : (a ?? 0) + (b ?? 0);
  }

  private mensagemErro(erro: HttpErrorResponse, fallback: string): string {
    return typeof erro.error?.message === 'string' ? erro.error.message : fallback;
  }
}
