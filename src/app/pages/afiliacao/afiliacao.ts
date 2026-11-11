import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  catchError,
  finalize,
  forkJoin,
  of,
  timeout
} from 'rxjs';

import {
  CadastroUnidadeService,
  TipoUnidadeOpcao,
  UnidadeEstrutura
} from '../../services/cadastro-unidade.service';
import { ToastService } from '../../services/toast.service';
import { montarLinhasConsolidadas, type LinhaTabelaConsolidada, COLUNAS_ESTRUTURA } from '../../utils/consolidar-estrutura.util';
import { Breadcrumb, ItemBreadcrumb } from '../../components/breadcrumb/breadcrumb';

interface UnidadeLinha extends UnidadeEstrutura {
  nivel: number;
}

@Component({
  selector: 'app-afiliacao',
  imports: [FormsModule, RouterLink, Breadcrumb],
  templateUrl: './afiliacao.html',
  styleUrl: './afiliacao.scss'
})
export class Afiliacao implements OnInit {
  tipos: TipoUnidadeOpcao[] = [];
  tiposFiltro: TipoUnidadeOpcao[] = [];

  unidades: UnidadeEstrutura[] = [];
  unidadesDoTipo: UnidadeEstrutura[] = [];
  estruturaVisivel: UnidadeLinha[] = [];
  linhasTabela: LinhaTabelaConsolidada[] = [];
  readonly colunasNumeros = COLUNAS_ESTRUTURA;

  tipoSelecionado = '';
  unidadeFiltroId = '';
  unidadeSelecionada: UnidadeEstrutura | null = null;
  // Ordenação global por UF e nome é a visualização padrão.
  // O modo hierárquico preserva a sequência pai -> filhos.
  modoOrdenacao: 'estado' | 'hierarquia' = 'estado';

  carregando = false;
  erroCarregamento = '';

  private unidadePorId = new Map<string, UnidadeEstrutura>();
  private filhosPorPai = new Map<string, UnidadeEstrutura[]>();
  private unidadesPorTipo = new Map<string, UnidadeEstrutura[]>();

  readonly ordemTipos = [
    'CONCILIUM',
    'SENATUS',
    'REGIA',
    'COMITIUM',
    'CURIA',
    'PRAESIDIUM',
    'VELITE',
    'PATRICIOS'
  ];

  itens: ItemBreadcrumb[] = [
    { label: 'Início', routerLink: '/home', icone: 'bi-house' },
    { label: 'Conselhos-Praesidia', routerLink: '/afiliacao', icone: 'bi-diagram-3' }
  ];

  constructor(
    private cadastroUnidadeService: CadastroUnidadeService,
    private router: Router,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.erroCarregamento = '';

    forkJoin({
      tipos: this.cadastroUnidadeService
        .listarTipos()
        .pipe(
          timeout(15000),
          catchError(() => of([] as TipoUnidadeOpcao[]))
        ),

      unidades: this.cadastroUnidadeService
        .listarEstrutura()
        .pipe(
          timeout(15000),
          catchError((erro) => {
            console.error(
              'Erro ao carregar estrutura de unidades:',
              erro
            );

            this.erroCarregamento =
              'Não foi possível carregar a estrutura das unidades.';

            return of([] as UnidadeEstrutura[]);
          })
        )
    })
      .pipe(
        finalize(() => {
          this.carregando = false;

          // O projeto pode trabalhar sem Zone.js. Força a atualização
          // do template depois que as requisições HTTP terminarem.
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ({ tipos, unidades }) => {
          this.tipos = tipos;
          this.tiposFiltro = this.ordenarTipos(tipos);

          this.unidades = unidades;
          this.reconstruirIndices();
          this.recalcularFiltroEestrutura();

          if (this.erroCarregamento) {
            this.toastService.erro(this.erroCarregamento);
          }

          this.cdr.detectChanges();
        },
        error: (erro) => {
          // Como cada chamada já possui catchError, este bloco é apenas
          // uma última proteção contra erro inesperado do forkJoin.
          console.error('Erro inesperado ao carregar afiliação:', erro);

          this.unidades = [];
          this.tipos = [];
          this.tiposFiltro = [];
          this.unidadesDoTipo = [];
          this.estruturaVisivel = [];
          this.linhasTabela = [];
          this.erroCarregamento =
            'Não foi possível carregar a estrutura das unidades.';

          this.toastService.erro(this.erroCarregamento);
          this.cdr.detectChanges();
        }
      });
  }

  aoTrocarTipo(): void {
    this.unidadeFiltroId = '';
    this.unidadeSelecionada = null;
    this.recalcularFiltroEestrutura();
  }

  aoTrocarUnidade(): void {
    this.unidadeSelecionada = this.unidadeFiltroId
      ? this.unidadePorId.get(this.unidadeFiltroId) ?? null
      : null;

    this.recalcularEstrutura();
  }

  aoTrocarOrdenacao(): void {
    this.recalcularEstrutura();
  }

  selecionarUnidade(unidade: UnidadeEstrutura): void {
    this.unidadeSelecionada = unidade;
  }

  editar(unidade: UnidadeEstrutura, event?: Event): void {
    event?.stopPropagation();

    this.router.navigate(['/nova-unidade'], {
      queryParams: {
        id: unidade.id,
        modo: 'editar'
      }
    });
  }

  excluir(unidade: UnidadeEstrutura, event?: Event): void {
    event?.stopPropagation();

    this.router.navigate(['/nova-unidade'], {
      queryParams: {
        id: unidade.id,
        modo: 'excluir'
      }
    });
  }

  nomeTipo(codigo: string): string {
    return this.tipos.find(
      (tipo) => tipo.codigo === codigo
    )?.nome ?? codigo;
  }

  private ordenarTipos(
    tipos: TipoUnidadeOpcao[]
  ): TipoUnidadeOpcao[] {
    return [...tipos].sort((a, b) => {
      const ia = this.indiceTipo(a.codigo);
      const ib = this.indiceTipo(b.codigo);

      if (ia !== ib) {
        return ia - ib;
      }

      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }

  private reconstruirIndices(): void {
    this.unidadePorId.clear();
    this.filhosPorPai.clear();
    this.unidadesPorTipo.clear();

    for (const unidade of this.unidades) {
      this.unidadePorId.set(unidade.id, unidade);

      const tipo = unidade.tipo;
      const porTipo = this.unidadesPorTipo.get(tipo) ?? [];
      porTipo.push(unidade);
      this.unidadesPorTipo.set(tipo, porTipo);

      if (unidade.unidadeSuperiorId) {
        const filhos =
          this.filhosPorPai.get(unidade.unidadeSuperiorId) ?? [];

        filhos.push(unidade);
        this.filhosPorPai.set(
          unidade.unidadeSuperiorId,
          filhos
        );
      }
    }

    for (const lista of this.unidadesPorTipo.values()) {
      lista.sort((a, b) => this.compararPorEstado(a, b));
    }

    for (const lista of this.filhosPorPai.values()) {
      lista.sort((a, b) => this.compararEstrutura(a, b));
    }
  }

  private recalcularFiltroEestrutura(): void {
    this.unidadesDoTipo = this.tipoSelecionado
      ? [...(
          this.unidadesPorTipo.get(this.tipoSelecionado) ?? []
        )]
      : [];

    this.recalcularEstrutura();
  }

  private recalcularEstrutura(): void {
    if (this.unidadeFiltroId) {
      this.estruturaVisivel =
        this.achatarSubarvore(this.unidadeFiltroId);
      this.atualizarLinhasTabela();
      return;
    }

    if (this.modoOrdenacao === 'estado') {
      // Lista estritamente ordenada por UF -> nome; sem recuo hierárquico.
      const base = this.tipoSelecionado ? this.unidadesDoTipo : this.unidades;
      this.estruturaVisivel = [...base]
        .sort((a, b) => this.compararPorEstado(a, b))
        .map((item) => ({ ...item, nivel: 0 }));
      this.atualizarLinhasTabela();
      return;
    }

    if (this.tipoSelecionado) {
      const idsRaizes = new Set(
        this.unidadesDoTipo.map((item) => item.id)
      );

      const linhas: UnidadeLinha[] = [];
      const visitados = new Set<string>();

      for (const unidade of this.unidadesDoTipo) {
        if (visitados.has(unidade.id)) {
          continue;
        }

        visitados.add(unidade.id);
        linhas.push({ ...unidade, nivel: 0 });

        this.adicionarDescendentes(
          unidade.id,
          1,
          linhas,
          visitados,
          idsRaizes
        );
      }

      this.estruturaVisivel = linhas;
      this.atualizarLinhasTabela();
      return;
    }

    const raizes = this.unidades
      .filter(
        (item) =>
          !item.unidadeSuperiorId ||
          !this.unidadePorId.has(item.unidadeSuperiorId)
      )
      .sort((a, b) => this.compararEstrutura(a, b));

    const linhas: UnidadeLinha[] = [];
    const visitados = new Set<string>();

    for (const raiz of raizes) {
      if (visitados.has(raiz.id)) {
        continue;
      }

      visitados.add(raiz.id);
      linhas.push({ ...raiz, nivel: 0 });

      this.adicionarDescendentes(
        raiz.id,
        1,
        linhas,
        visitados
      );
    }

    // Segurança para qualquer unidade que tenha ficado fora da árvore.
    for (const item of this.unidades) {
      if (visitados.has(item.id)) {
        continue;
      }

      visitados.add(item.id);
      linhas.push({ ...item, nivel: 0 });

      this.adicionarDescendentes(
        item.id,
        1,
        linhas,
        visitados
      );
    }

    this.estruturaVisivel = linhas;
    this.atualizarLinhasTabela();
  }

  private achatarSubarvore(id: string): UnidadeLinha[] {
    const raiz = this.unidadePorId.get(id);

    if (!raiz) {
      return [];
    }

    const linhas: UnidadeLinha[] = [
      { ...raiz, nivel: 0 }
    ];

    const visitados = new Set<string>([raiz.id]);

    this.adicionarDescendentes(
      raiz.id,
      1,
      linhas,
      visitados
    );

    return linhas;
  }

  private adicionarDescendentes(
    paiId: string,
    nivel: number,
    destino: UnidadeLinha[],
    visitados: Set<string>,
    ignorarRaizes?: Set<string>
  ): void {
    const filhos = this.filhosPorPai.get(paiId) ?? [];

    for (const filho of filhos) {
      if (
        visitados.has(filho.id) ||
        ignorarRaizes?.has(filho.id)
      ) {
        continue;
      }

      visitados.add(filho.id);
      destino.push({ ...filho, nivel });

      this.adicionarDescendentes(
        filho.id,
        nivel + 1,
        destino,
        visitados,
        ignorarRaizes
      );
    }
  }

  private atualizarLinhasTabela(): void {
    this.linhasTabela = montarLinhasConsolidadas(
      this.estruturaVisivel,
      this.unidades,
      this.modoOrdenacao
    );
  }

  formatarQuantidade(numero: number | null): string {
    return numero == null ? '—' : numero.toLocaleString('pt-BR');
  }

  private compararPorEstado(a: UnidadeEstrutura, b: UnidadeEstrutura): number {
    const ufA = (a.ufSigla || a.estadoRegiao || '').trim();
    const ufB = (b.ufSigla || b.estadoRegiao || '').trim();
    const estado = ufA.localeCompare(ufB, 'pt-BR', { sensitivity: 'base' });
    if (estado !== 0) return estado;
    const nome = a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
    if (nome !== 0) return nome;
    return a.id.localeCompare(b.id);
  }

  private compararEstrutura(a: UnidadeEstrutura, b: UnidadeEstrutura): number {
    // A ordem pai-filhos sempre é preservada no modo hierarquia.
    // Entre irmãos, ordenar por UF e depois por nome da unidade.
    return this.compararPorEstado(a, b);
  }

  private indiceTipo(codigo: string): number {
    const indice = this.ordemTipos.indexOf(codigo);
    return indice < 0 ? 999 : indice;
  }
}
