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

@Component({
  selector: 'app-numeros-unidades',
  imports: [FormsModule, RouterLink],
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
  permissoes: PermissoesNumerosUnidade = { editar: false, reabrir: false };
  carregandoUnidades = false;
  carregando = false;
  consultaPermitida = false;
  salvando = false;
  alterado = false;
  erro = '';
  sucesso = '';

  constructor(
    private cadastroUnidade: CadastroUnidadeService,
    private numerosService: UnidadeNumerosService,
    private rota: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  get unidadeSelecionada(): UnidadeEstrutura | null {
    return this.unidades.find(u => u.id === this.unidadeId) ?? null;
  }

  get confirmado(): boolean {
    return this.registro?.status === 'CONFIRMADO';
  }

  get podeEditar(): boolean {
    return !!this.unidadeId && this.permissoes.editar && !this.confirmado && !this.salvando;
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
    this.permissoes = { editar: false, reabrir: false };
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
      historico: this.numerosService.listarHistorico(unidadeId, ano)
    }).subscribe({
      next: ({ atual, historico }) => {
        // Evita sobrescrever o formulário quando usuário troca filtro rapidamente.
        if (this.unidadeId !== unidadeId || Number(this.ano) !== ano || Number(this.mes) !== mes) return;
        this.registro = atual.registro;
        this.consultaPermitida = true;
        this.permissoes = atual.permissoes;
        this.valores = atual.registro ? extrairValores(atual.registro) : criarValoresVazios();
        this.historico = historico.registros;
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
    this.numerosService.salvar(this.unidadeId, Number(this.ano), Number(this.mes), this.valores).subscribe({
      next: ({ registro }) => {
        this.registro = registro;
        this.valores = extrairValores(registro);
        this.alterado = false;
        this.salvando = false;
        this.sucesso = 'Indicadores salvos como rascunho. Clique em Confirmar para concluir a competência.';
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

  confirmar(): void {
    if (!this.registro || !this.podeEditar || this.carregando || !this.unidadeId) return;
    if (this.alterado) {
      this.erro = 'Salve as alterações antes de confirmar esta competência.';
      this.cdr.detectChanges();
      return;
    }
    if (!window.confirm('Confirma os números desta competência? Depois, a edição ficará bloqueada.')) return;
    this.executarAcao('confirmar');
  }

  reabrir(): void {
    if (!this.registro || !this.confirmado || !this.permissoes.reabrir || !this.unidadeId) return;
    if (!window.confirm('Reabrir esta competência confirmada para correção? A ação será auditada.')) return;
    this.executarAcao('reabrir');
  }

  copiarAnterior(): void {
    if (this.registro || !this.podeEditar || this.carregando || !this.unidadeId) return;
    if (!window.confirm('Copiar os números da última competência anterior para este mês como RASCUNHO?')) return;
    this.executarAcao('copiar');
  }

  private executarAcao(acao: 'confirmar' | 'reabrir' | 'copiar'): void {
    if (!this.unidadeId) return;
    this.salvando = true;
    this.erro = '';
    this.sucesso = '';
    const unidadeId = this.unidadeId;
    const ano = Number(this.ano);
    const mes = Number(this.mes);
    const pedido = acao === 'confirmar'
      ? this.numerosService.confirmar(unidadeId, ano, mes)
      : acao === 'reabrir'
        ? this.numerosService.reabrir(unidadeId, ano, mes)
        : this.numerosService.copiarAnterior(unidadeId, ano, mes);
    pedido.subscribe({
      next: ({ registro }) => {
        this.registro = registro;
        this.valores = extrairValores(registro);
        this.alterado = false;
        this.salvando = false;
        this.sucesso = acao === 'confirmar' ? 'Competência confirmada com sucesso.'
          : acao === 'reabrir' ? 'Competência reaberta como rascunho.'
            : 'Dados anteriores copiados como rascunho. Confira antes de confirmar.';
        this.carregarHistorico();
        this.cdr.detectChanges();
      },
      error: (erro: HttpErrorResponse) => {
        this.erro = this.mensagemErro(erro, 'Não foi possível realizar esta operação.');
        this.salvando = false;
        this.cdr.detectChanges();
      }
    });
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
