import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import {
  CaminhoPais, MapaMundialService, PaisMapa, UnidadeMapa,
  TIPOS_MAPA, corTipo
} from '../../services/mapa-mundial.service';

@Component({
  selector: 'app-mapa-mundial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mapa-mundial.html',
  styleUrl: './mapa-mundial.scss'
})
export class MapaMundial implements OnInit {
  private readonly api = inject(MapaMundialService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly tipos = TIPOS_MAPA;
  readonly corTipo = corTipo;
  paises: PaisMapa[] = [];
  caminhos: CaminhoPais[] = [];
  paisId = '';
  tipo = '';
  /** Unidade escolhida entre as cadastradas no país e tipo. */
  unidadeId = '';
  opcoesUnidades: UnidadeMapa[] = [];
  busca = '';
  pagina = 1;
  porPagina = 100;
  totalUnidades = 0;
  unidades: UnidadeMapa[] = [];
  carregandoMapa = true;
  carregandoPaises = true;
  erroPaises = '';
  erroVetor = '';
  carregandoUnidades = false;
  erro = '';
  erroUnidades = '';
  zoom = 1;
  /** Evita exibir respostas de filtros ou países que não são mais os selecionados. */
  private consulta = 0;
  private readonly opcoesCache = new Map<string, UnidadeMapa[]>();

  /** O SVG e os dados do banco são independentes: a falha de um não bloqueia o outro. */
  ngOnInit(): void {
    this.carregandoMapa = true;
    this.carregandoPaises = true;
    this.api.vetor().pipe(
      timeout(12000),
      finalize(() => {
        this.carregandoMapa = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: vetor => {
        if (!vetor || !Array.isArray(vetor.countries) || !vetor.countries.length) {
          this.erroVetor = 'O arquivo vetorial retornou um formato inválido.';
          this.cdr.detectChanges();
          return;
        }
        this.caminhos = vetor.countries;
        this.erroVetor = '';
        this.cdr.detectChanges();
      },
      error: erro => {
        this.erroVetor = this.mensagemFalha(erro, 'arquivo vetorial do mapa');
        console.error('Mapa mundial: falha no arquivo vetorial', erro);
        this.cdr.detectChanges();
      }
    });
    this.api.paises().pipe(
      timeout(12000),
      finalize(() => {
        this.carregandoPaises = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: paises => {
        if (!Array.isArray(paises)) {
          this.erroPaises = 'A API de países retornou dados em formato inesperado.';
          this.cdr.detectChanges();
          return;
        }
        this.paises = paises;
        this.erroPaises = '';
        this.cdr.detectChanges();
      },
      error: erro => {
        this.erroPaises = this.mensagemFalha(erro, 'consulta de países');
        console.error('Mapa mundial: falha na consulta de países', erro);
        this.cdr.detectChanges();
      }
    });
  }
  private mensagemFalha(erro: unknown, recurso: string): string {
    if (erro instanceof HttpErrorResponse) {
      const detalhe = typeof erro.error?.message === 'string' ? `: ${erro.error.message}` : '';
      return `Falha na ${recurso} (HTTP ${erro.status || 'sem resposta'})${detalhe}.`;
    }
    return `A ${recurso} excedeu o tempo limite de 12 segundos ou falhou.`;
  }
  get totalPaises(): number { return this.paises.length; }
  get totalGeral(): number { return this.paises.reduce((s, p) => s + p.total, 0); }
  get paisSelecionado(): PaisMapa | undefined { return this.paises.find(p => p.paisId === this.paisId); }
  get totalPaginas(): number { return Math.max(1, Math.ceil(this.totalUnidades / this.porPagina)); }
  get viewBox(): string {
    const w = 900 / this.zoom;
    const h = 440.7063 / this.zoom;
    return `${(900 - w) / 2} ${(440.7063 - h) / 2} ${w} ${h}`;
  }
  get paisesOrdenados(): PaisMapa[] {
    return [...this.paises].sort((a, b) => b.total - a.total || a.paisNome.localeCompare(b.paisNome));
  }
  get totaisTipo(): { codigo: string; nome: string; cor: string; quantidade: number }[] {
    return this.tipos.map(t => ({ ...t, quantidade: this.paises.reduce((s, p) => s + (p.tipos[t.codigo] ?? 0), 0) }));
  }
  /** Países com maior total ficam mais intensos; marcadores seguem a cor do tipo. */
  corPais(sigla: string): string {
    const pais = this.paises.find(p => p.paisSigla?.toUpperCase() === sigla.toUpperCase());
    if (!pais) return '#e2e8f0';
    const max = Math.max(1, ...this.paises.map(p => p.total));
    const intensidade = Math.log1p(pais.total) / Math.log1p(max);
    return intensidade > .72 ? '#255e83' : intensidade > .44 ? '#3c87aa' : intensidade > .20 ? '#7bb1cb' : '#b3d4e4';
  }
  selecionarSigla(sigla: string): void {
    const pais = this.paises.find(p => p.paisSigla?.toUpperCase() === sigla.toUpperCase());
    if (pais) this.selecionarPais(pais.paisId);
  }
  selecionarPais(id: string): void {
    this.paisId = id;
    // Selecionar um país só o destaca; mantém todos os continentes visíveis.
    this.zoom = 1;
    this.tipo = '';
    this.unidadeId = '';
    this.carregarOpcoes();
  }
  selecionarTipo(): void {
    this.unidadeId = '';
    this.carregarOpcoes();
  }
  selecionarUnidade(id: string): void {
    this.unidadeId = id;
    const selecionada = this.opcoesUnidades.find(unidade => unidade.id === id);
    this.unidades = selecionada ? [selecionada] : [];
  }
  /** A consulta das opções substitui a paginação e a pesquisa de texto. */
  carregarOpcoes(): void {
    const seq = ++this.consulta;
    this.erroUnidades = '';
    this.unidadeId = '';
    this.opcoesUnidades = [];
    this.unidades = [];
    this.totalUnidades = 0;
    if (!this.paisId) {
      this.carregandoUnidades = false;
      this.cdr.detectChanges();
      return;
    }
    const chave = `${this.paisId}:${this.tipo}`;
    const emCache = this.opcoesCache.get(chave);
    if (emCache) {
      this.opcoesUnidades = emCache;
      this.totalUnidades = emCache.length;
      this.carregandoUnidades = false;
      this.cdr.detectChanges();
      return;
    }
    this.carregandoUnidades = true;
    this.api.opcoesUnidades(this.paisId, this.tipo)
      .pipe(timeout(12000), finalize(() => {
        if (seq === this.consulta) {
          this.carregandoUnidades = false;
          this.cdr.detectChanges();
        }
      }))
      .subscribe({
        next: opcoes => {
          if (seq !== this.consulta) return;
          if (!Array.isArray(opcoes)) {
            this.erroUnidades = 'A API retornou opções de unidades em formato inesperado.';
            this.cdr.detectChanges();
            return;
          }
          this.opcoesCache.set(chave, opcoes);
          this.opcoesUnidades = opcoes;
          this.totalUnidades = opcoes.length;
          this.cdr.detectChanges();
        },
        error: erro => {
          if (seq !== this.consulta) return;
          this.erroUnidades = this.mensagemFalha(erro, 'consulta das unidades disponíveis');
          this.cdr.detectChanges();
        }
      });
  }
  alterarZoom(delta: number): void {
    this.zoom = Math.max(1, Math.min(3, Math.round((this.zoom + delta) * 10) / 10));
  }
}
