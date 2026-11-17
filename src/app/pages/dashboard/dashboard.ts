import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, ElementRef, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimeoutError, timeout } from 'rxjs';
import {
  Chart, CategoryScale, LinearScale, BarElement, ArcElement, LineElement,
  PointElement, LineController, BarController, DoughnutController, Tooltip, Legend
} from 'chart.js';
import { Breadcrumb, ItemBreadcrumb } from '../../components/breadcrumb/breadcrumb';

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement,
  PointElement, LineController, BarController, DoughnutController, Tooltip, Legend);

/** Os nomes das propriedades correspondem às colunas de unidade_numeros. */
export interface TotaisUnidadeNumeros {
  qtd_senatus: number;
  qtd_regiae: number;
  qtd_comitia: number;
  qtd_comitia_juv: number;
  qtd_curiae: number;
  qtd_curiae_juv: number;
  qtd_praesidia: number;
  qtd_praesidia_juv: number;
  qtd_velites: number;
  qtd_praticios: number;
  qtd_pretorianos: number;
  qtd_adjutores: number;
  qtd_ativos_com_promessa: number;
  qtd_ativos_sem_promessa: number;
  qtd_auxiliares_permanentes: number;
  qtd_auxiliares_provisorios: number;
  qtd_mescs: number;
  qtd_catequistas: number;
  qtd_coroinhas: number;
  qtd_praesidia_total: number;
}

export type CampoTotal = keyof TotaisUnidadeNumeros;
export interface EvolucaoMensal { mes: number; membros: number | null; }
export interface UnidadeAtualizacao {
  id: string | number;
  nome: string;
  tipo: string;
  ultima_atualizacao: string | null;
}
export interface ResumoDashboard {
  ano: number;
  ultima_atualizacao: string | null;
  totais: TotaisUnidadeNumeros;
  evolucao: EvolucaoMensal[];
  unidades: UnidadeAtualizacao[];
}

@Component({
  standalone: true,
  imports: [CommonModule, Breadcrumb],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private temporizadorGraficos: ReturnType<typeof setTimeout> | null = null;
  private readonly charts: Chart[] = [];

  @ViewChild('membrosChart') membrosCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('estruturaChart') estruturaCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('evolucaoChart') evolucaoCanvas?: ElementRef<HTMLCanvasElement>;

  readonly meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  readonly campos: { chave: CampoTotal; titulo: string; icone: string }[] = [
    { chave: 'qtd_senatus', titulo: 'Senatus', icone: 'bi-diagram-3' },
    { chave: 'qtd_regiae', titulo: 'Regiae', icone: 'bi-diagram-3' },
    { chave: 'qtd_comitia', titulo: 'Comitia', icone: 'bi-building' },
    { chave: 'qtd_comitia_juv', titulo: 'Comitia juvenis', icone: 'bi-building' },
    { chave: 'qtd_curiae', titulo: 'Curiae', icone: 'bi-building' },
    { chave: 'qtd_curiae_juv', titulo: 'Curiae juvenis', icone: 'bi-building' },
    { chave: 'qtd_praesidia', titulo: 'Praesidia', icone: 'bi-people' },
    { chave: 'qtd_praesidia_juv', titulo: 'Praesidia juvenis', icone: 'bi-people' },
    { chave: 'qtd_praesidia_total', titulo: 'Praesidia — total informado', icone: 'bi-people-fill' },
    { chave: 'qtd_ativos_com_promessa', titulo: 'Ativos com promessa', icone: 'bi-person-check' },
    { chave: 'qtd_ativos_sem_promessa', titulo: 'Ativos sem promessa', icone: 'bi-person' },
    { chave: 'qtd_auxiliares_permanentes', titulo: 'Auxiliares permanentes', icone: 'bi-heart' },
    { chave: 'qtd_auxiliares_provisorios', titulo: 'Auxiliares provisórios', icone: 'bi-heart' },
    { chave: 'qtd_velites', titulo: 'Velites', icone: 'bi-person-badge' },
    { chave: 'qtd_praticios', titulo: 'Praticios', icone: 'bi-person-badge' },
    { chave: 'qtd_pretorianos', titulo: 'Pretorianos', icone: 'bi-person-badge' },
    { chave: 'qtd_adjutores', titulo: 'Adjutores', icone: 'bi-person-badge' },
    { chave: 'qtd_mescs', titulo: 'MESCs', icone: 'bi-person-workspace' },
    { chave: 'qtd_catequistas', titulo: 'Catequistas', icone: 'bi-book' },
    { chave: 'qtd_coroinhas', titulo: 'Coroinhas', icone: 'bi-person' },
  ];

  itens: ItemBreadcrumb[] = [
    { label: 'Início', routerLink: '/home', icone: 'bi-house' },
    { label: 'Dashboard', routerLink: '/dashboard', icone: 'bi-grid-1x2' }
  ];

  resumo: ResumoDashboard | null = null;
  carregando = true;
  erro = '';
  avisoGraficos = '';

  get totalAtivos(): number {
    const t = this.resumo?.totais;
    return t ? t.qtd_ativos_com_promessa + t.qtd_ativos_sem_promessa : 0;
  }
  get totalAuxiliares(): number {
    const t = this.resumo?.totais;
    return t ? t.qtd_auxiliares_permanentes + t.qtd_auxiliares_provisorios : 0;
  }
  get totalMembros(): number { return this.totalAtivos + this.totalAuxiliares; }

  get totalPretorianos(): number { return this.resumo?.totais.qtd_pretorianos ?? 0; }
  get totalAdjutores(): number { return this.resumo?.totais.qtd_adjutores ?? 0; }
  get ativosSemPretorianos(): number { return Math.max(0, this.totalAtivos - this.totalPretorianos); }
  get auxiliaresSemAdjutores(): number { return Math.max(0, this.totalAuxiliares - this.totalAdjutores); }
  get percentualPretorianos(): number {
    return this.totalAtivos > 0 ? 100 * this.totalPretorianos / this.totalAtivos : 0;
  }
  get percentualAdjutores(): number {
    return this.totalAuxiliares > 0 ? 100 * this.totalAdjutores / this.totalAuxiliares : 0;
  }
  /** Percentual de cada fatia sobre o total exibido no doughnut. */
  percentualDoTotal(quantidade: number): number {
    return this.totalMembros > 0 ? 100 * quantidade / this.totalMembros : 0;
  }
  get mediaAtivosPorPraesidium(): number | null {
    const praesidia = this.resumo?.totais.qtd_praesidia_total ?? 0;
    return praesidia > 0 ? this.totalAtivos / praesidia : null;
  }
  get mediaAuxiliaresPorPraesidium(): number | null {
    const praesidia = this.resumo?.totais.qtd_praesidia_total ?? 0;
    return praesidia > 0 ? this.totalAuxiliares / praesidia : null;
  }


  readonly estruturaCategorias = [
    { titulo: 'Senatus', chave: 'qtd_senatus' as const },
    { titulo: 'Regiae', chave: 'qtd_regiae' as const },
    { titulo: 'Comitia (incl. juvenis)', chave: 'qtd_comitia' as const, juvenil: 'qtd_comitia_juv' as const },
    { titulo: 'Curiae (incl. juvenis)', chave: 'qtd_curiae' as const, juvenil: 'qtd_curiae_juv' as const },
    { titulo: 'Praesidia (total informado)', chave: 'qtd_praesidia_total' as const }
  ];

  get estruturaValores(): number[] {
    const totais = this.resumo?.totais;
    return this.estruturaCategorias.map(c => totais
      ? (totais[c.chave] ?? 0) + (c.juvenil ? (totais[c.juvenil] ?? 0) : 0)
      : 0);
  }

  get evolucaoAno(): EvolucaoMensal[] {
    const valores = new Map((this.resumo?.evolucao ?? []).map(item => [Number(item.mes), item.membros]));
    return this.meses.map((_, indice) => ({ mes: indice + 1, membros: valores.get(indice + 1) ?? null }));
  }

  ngOnInit(): void { this.atualizar(); }

  ngOnDestroy(): void {
    this.cancelarDesenho();
    this.destruirGraficos();
  }

  private cancelarDesenho(): void {
    if (this.temporizadorGraficos !== null) {
      clearTimeout(this.temporizadorGraficos);
      this.temporizadorGraficos = null;
    }
  }

  private agendarGraficos(): void {
    this.cancelarDesenho();
    // Aguarda o Angular inserir os canvas do bloco @if(resumo) e calcular o layout.
    this.temporizadorGraficos = setTimeout(() => {
      this.temporizadorGraficos = null;
      if (this.destroyRef.destroyed || !this.resumo || this.carregando) return;
      try {
        this.desenharGraficos();
      } catch (erro) {
        console.error('Falha ao desenhar os gráficos do dashboard:', erro);
        this.avisoGraficos = 'Os valores estão disponíveis abaixo, mas não foi possível desenhar todos os gráficos.';
        this.cdr.markForCheck();
      }
    }, 0);
  }

  atualizar(): void {
    this.carregando = true;
    this.erro = '';
    this.avisoGraficos = '';
    this.cancelarDesenho();
    this.cdr.markForCheck();
    // O backend consolida os quantitativos das unidades vinculadas ao Concilium.
    this.http.get<ResumoDashboard>(
      `${environment.apiUrl}/dashboard/concilium`,
      { withCredentials: true }
    )
      .pipe(timeout(15000), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resumo) => {
          this.destruirGraficos();
          if (!resumo || !resumo.totais || !Array.isArray(resumo.evolucao) || !Array.isArray(resumo.unidades)) {
            this.resumo = null;
            this.erro = 'A API retornou um formato inesperado para o dashboard.';
          } else {
            this.resumo = resumo;

          }
          this.carregando = false;
          this.cdr.detectChanges();
          if (this.resumo) this.agendarGraficos();
        },
        error: (erro: unknown) => {
          this.carregando = false;
          this.resumo = null;
          this.cancelarDesenho();
          this.destruirGraficos();
          if (erro instanceof TimeoutError) {
            this.erro = 'A consulta excedeu 15 segundos. Verifique a conexão com a API.';
          } else if (erro instanceof HttpErrorResponse) {
            const mensagem = erro.error && typeof erro.error === 'object' &&
              typeof erro.error.message === 'string' ? erro.error.message : '';
            this.erro = mensagem || `Não foi possível carregar o dashboard (HTTP ${erro.status || 'sem resposta'}).`;
          } else {
            this.erro = 'Não foi possível carregar o dashboard. Verifique o console do navegador.';
          }
          this.cdr.detectChanges();
        }
      });
  }

  private destruirGraficos(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts.length = 0;
  }

  private desenharGraficos(): void {
    if (!this.resumo) return;
    this.destruirGraficos();
    const novoGrafico = (nome: string, criar: () => Chart): void => {
      try {
        this.charts.push(criar());
      } catch (erro) {
        console.error(`Falha no gráfico ${nome}:`, erro);
        this.avisoGraficos = 'Alguns gráficos não puderam ser desenhados; os valores estão listados abaixo.';
        this.cdr.markForCheck();
      }
    };

    if (this.membrosCanvas) novoGrafico('Membros por categoria', () =>
      new Chart(this.membrosCanvas!.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Ativos (demais)', 'Pretorianos', 'Auxiliares (demais)', 'Adjutores'],
          datasets: [{
            data: [this.ativosSemPretorianos, this.totalPretorianos,
              this.auxiliaresSemAdjutores, this.totalAdjutores],
            backgroundColor: ['#14265c', '#5278cb', '#c9a227', '#e4bd57'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const quantidade = Number(context.parsed ?? 0);
                  const percentual = this.percentualDoTotal(quantidade);
                  const quantidadeFormatada = quantidade.toLocaleString('pt-BR', {
                    maximumFractionDigits: 0
                  });
                  const percentualFormatado = percentual.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  });
                  return `${context.label}: ${quantidadeFormatada} membros (${percentualFormatado}% do total)`;
                }
              }
            }
          }
        }
      })
    );

    if (this.estruturaCanvas) novoGrafico('Estrutura organizacional', () =>
      new Chart(this.estruturaCanvas!.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Senatus', 'Regiae', 'Comitia', 'Curiae', 'Praesidia'],
          datasets: [{
            label: 'Quantidade (incluindo juvenis)',
            data: this.estruturaValores,
            backgroundColor: '#14265c'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      })
    );

    // Um único mês com dados precisa aparecer como ponto, mesmo sem linha ligando meses.
    if (this.evolucaoCanvas) novoGrafico('Evolução de membros', () =>
      new Chart(this.evolucaoCanvas!.nativeElement, {
        type: 'line',
        data: {
          labels: this.meses,
          datasets: [{
            label: `Membros em ${this.resumo!.ano}`,
            data: this.evolucaoAno.map(item => item.membros),
            borderColor: '#14265c',
            backgroundColor: '#14265c',
            tension: 0.3,
            spanGaps: false,
            pointRadius: 7,
            pointHoverRadius: 9,
            pointBackgroundColor: '#c9a227'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      })
    );
  }
}
