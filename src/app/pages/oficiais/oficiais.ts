import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  Aniversariante,
  CargoOficial,
  MESES,
  Oficial,
  FiltrosOficiais,
  ResumoOficiais
} from '../../models/oficial.model';
import { OficialService } from '../../services/oficial.service';
import { ToastService } from '../../services/toast.service';
import { mensagemDeErro } from '../../services/usuario.service';
import { RouterLink } from '@angular/router';
import { Breadcrumb, ItemBreadcrumb } from '../../components/breadcrumb/breadcrumb';

type Aba = 'oficiais' | 'calendario';

@Component({
  selector: 'app-oficiais',
  imports: [FormsModule, RouterLink, Breadcrumb],
  templateUrl: './oficiais.html',
  styleUrl: './oficiais.scss'
})
export class Oficiais implements OnInit {

  aba: Aba = 'oficiais';

  readonly meses = MESES;

  oficiais: Oficial[] = [];
  cargos: CargoOficial[] = [];

  resumo: ResumoOficiais = {
    total: 0,
    totalCargos: 0,
    porCargo: [],
    aniversariantesMes: 0
  };

  filtros: FiltrosOficiais = {
    busca: '',
    cargo: '',
    somenteVigentes: false
  };

  carregando = false;

  // ---- Calend\u00E1rio ----
  aniversariantes: Aniversariante[] = [];
  carregandoAniversariantes = false;
  mesSelecionado = new Date().getMonth() + 1;

  // ---- WhatsApp ----
  /**
   * Template padrao da mensagem de parabens.
   *
   * Todo caractere nao-ASCII (acentos e emoji) usa escape Unicode.
   * Motivo: se o arquivo for salvo em Latin-1/Windows-1252 por algum
   * editor, os bytes viram invalidos e o WhatsApp exibe o caractere de substituicao. Com
   * escape, o arquivo e 100% ASCII e nada pode corromper.
   *
   * Variaveis: {nome} {cargo} {unidade} {idade} {ano}
   */
  readonly templatePadrao =
    'Feliz anivers\u00E1rio, {nome}! \u{1F389}\n\n' +
    'Em nome de toda a fam\u00EDlia legion\u00E1ria do(a) {unidade}, ' +
    'desejamos a voc\u00EA um dia aben\u00E7oado e um novo ano ' +
    'de gra\u00E7as.\n\n' +
    'Que Nossa Senhora o(a) acompanhe sempre.\n\n' +
    'Com carinho,\nLegi\u00E3o de Maria - SysLegioMariae';


  templateMensagem = this.templatePadrao;

  /** Se falso, mostra a pre-visualizacao; se true, o campo de texto. */
  editandoTemplate = false;

  itens: ItemBreadcrumb[] = [
    { label: 'Início', routerLink: '/home', icone: 'bi-house' },
    { label: 'Oficiais', routerLink: '/oficiais', icone: 'bi-people' }
  ];

  constructor(
    private oficialService: OficialService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarCargos();
    this.carregar();
    this.carregarResumo();
  }

  get nomeMesSelecionado(): string {
    return this.meses[this.mesSelecionado - 1] ?? '';
  }

  /**
   * Cat\u00E1logo de cargos de oficial \u2014 alimenta o filtro e os chips
   * de resumo. Buscado uma \u00FAnica vez.
   */
  carregarCargos(): void {
    this.oficialService
      .cargos()
      .subscribe({
        next: (cargos) => {
          this.cargos = cargos;
        },
        error: () => {
          // Sem os cargos o filtro fica vazio, mas a lista carrega.
          this.cargos = [];
        }
      });
  }

  carregar(): void {
    this.carregando = true;

    this.oficialService
      .listar(this.filtros)
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (oficiais) => {
          this.oficiais = oficiais;
        },
        error: (error: HttpErrorResponse) => {
          this.oficiais = [];

          this.toastService.erro(
            mensagemDeErro(
              error,
              'N\u00E3o foi poss\u00EDvel carregar os oficiais.'
            )
          );
        }
      });
  }

  private carregarResumo(): void {
    this.oficialService
      .resumo()
      .subscribe({
        next: (resumo) => {
          this.resumo = resumo;
          this.cdr.detectChanges();
        },
        error: () => {
          // O resumo é acessório: se falhar, a lista continua.
        }
      });
  }

  /** Total de meses em anos e meses, para exibir na coluna. */
  tempoMandato(oficial: Oficial): string {
    const meses = oficial.mesesMandato ?? 0;

    if (meses <= 0) {
      return 'Rec\u00E9m-empossado';
    }

    const anos = Math.floor(meses / 12);
    const resto = meses % 12;

    if (anos === 0) {
      return `${resto} ${resto === 1 ? 'm\u00EAs' : 'meses'}`;
    }

    if (resto === 0) {
      return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
    }

    return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${resto} ${
      resto === 1 ? 'm\u00EAs' : 'meses'
    }`;
  }

  aniversario(oficial: Oficial): string {
    if (!oficial.diaAniversario || !oficial.mesAniversario) {
      return '-';
    }

    const dia = String(oficial.diaAniversario).padStart(2, '0');
    const mes = String(oficial.mesAniversario).padStart(2, '0');

    return `${dia}/${mes}`;
  }

  trocarAba(aba: Aba): void {
    this.aba = aba;

    if (aba === 'calendario' && this.aniversariantes.length === 0) {
      this.carregarAniversariantes();
    }
  }

  filtrar(): void {
    this.carregar();
  }

  limparFiltros(): void {
    this.filtros = {
      busca: '',
      cargo: '',
      somenteVigentes: false
    };

    this.carregar();
  }

  carregarAniversariantes(): void {
    this.carregandoAniversariantes = true;

    this.oficialService
      .aniversariantes(this.mesSelecionado)
      .pipe(
        finalize(() => {
          this.carregandoAniversariantes = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (aniversariantes) => {
          this.aniversariantes = aniversariantes;
        },
        error: (error: HttpErrorResponse) => {
          this.aniversariantes = [];

          this.toastService.erro(
            mensagemDeErro(
              error,
              'N\u00E3o foi poss\u00EDvel carregar os aniversariantes.'
            )
          );
        }
      });
  }

  /** Agrupa os aniversariantes por dia do m\u00EAs. */
  get aniversariantesPorDia(): Array<{
    dia: number;
    pessoas: Aniversariante[];
  }> {

    const mapa = new Map<number, Aniversariante[]>();

    for (const pessoa of this.aniversariantes) {
      const lista = mapa.get(pessoa.dia) ?? [];
      lista.push(pessoa);
      mapa.set(pessoa.dia, lista);
    }

    return Array.from(mapa.entries())
      .map(([dia, pessoas]) => ({ dia, pessoas }))
      .sort((a, b) => a.dia - b.dia);
  }

  /** Busca se tem aniversariante hoje */
  get aniversarianteDeHoje(): Aniversariante | null {
    return (
      this.aniversariantes.find(pessoa =>
        this.ehAniversarioHoje(pessoa)
      ) ?? null
    );
  }

  get diasComAniversario(): Set<number> {
    return new Set(
      this.aniversariantes.map((pessoa) => pessoa.dia)
    );
  }

  /** Grade do m\u00EAs: 6 semanas por 7 dias, com null nas c\u00E9lulas vazias. */
  get gradeDoMes(): Array<Array<number | null>> {

    const ano = new Date().getFullYear();

    const primeiroDia = new Date(ano, this.mesSelecionado - 1, 1);
    const diasNoMes = new Date(
      ano,
      this.mesSelecionado,
      0
    ).getDate();

    const inicioSemana = primeiroDia.getDay();

    const celulas: Array<number | null> = [];

    for (let i = 0; i < inicioSemana; i++) {
      celulas.push(null);
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
      celulas.push(dia);
    }

    while (celulas.length % 7 !== 0) {
      celulas.push(null);
    }

    const semanas: Array<Array<number | null>> = [];

    for (let i = 0; i < celulas.length; i += 7) {
      semanas.push(celulas.slice(i, i + 7));
    }

    return semanas;
  }

  ehHoje(dia: number): boolean {
    const hoje = new Date();

    return (
      hoje.getDate() === dia &&
      hoje.getMonth() + 1 === this.mesSelecionado
    );
  }

  // ==================================================
  // WHATSAPP
  // ==================================================

  /**
   * Somente d\u00EDgitos, com DDI 55 quando o n\u00FAmero parece
   * brasileiro sem c\u00F3digo de pa\u00EDs.
   */
  private normalizarTelefone(bruto: string | null): string {
    const digitos = String(bruto ?? '').replace(/\D/g, '');

    if (!digitos) {
      return '';
    }

    if (digitos.length <= 11) {
      return `55${digitos}`;
    }

    return digitos;
  }

  /**
   * O aniversario e hoje?
   *
   * Compara dia e mes do aniversario com a data atual. O envio de
   * parabens fica liberado apenas no proprio dia. Antes disso a
   * mensagem seria adiantada, e depois seria atrasada.
   */
  ehAniversarioHoje(pessoa: Aniversariante): boolean {
    const hoje = new Date();

    return (
      pessoa.dia === hoje.getDate() &&
      pessoa.mes === hoje.getMonth() + 1
    );
  }

  /** Troca as vari\u00E1veis do template pelos dados do oficial. */
  montarMensagem(pessoa: Aniversariante | null): string {
    if (!pessoa) {
      return this.templateMensagem;
    }

    return this.templateMensagem
      .replace(/{nome}/g, pessoa.nomePreferido || pessoa.nome)
      .replace(/{nomeCompleto}/g, pessoa.nome)
      .replace(/{cargo}/g, pessoa.cargoNome)
      .replace(/{unidade}/g, pessoa.unidadeNome)
      .replace(/{idade}/g, String(pessoa.idadeCompleta))
      .replace(/{ano}/g, String(new Date().getFullYear()));
  }

  /** Pr\u00E9via da mensagem j\u00E1 com os dados substitu\u00EDdos. */
  previaMensagem(pessoa: Aniversariante | null): string {
    return this.montarMensagem(pessoa);
  }

  /**
   * Abre o WhatsApp (web ou app) com a mensagem pronta.
   *
   * Usa a URL universal `wa.me`, que encaminha para o WhatsApp Web
   * no desktop e para o aplicativo no celular.
   */
  abrirWhatsapp(pessoa: Aniversariante): void {
    const telefone = this.normalizarTelefone(
      pessoa.celular || pessoa.telefone
    );

    const mensagem = this.montarMensagem(pessoa);

    if (!telefone) {
      this.toastService.erro(
        'Esta pessoa n\u00E3o possui celular cadastrado.'
      );
      return;
    }

    const url =
      `https://wa.me/${telefone}` +
      `?text=${encodeURIComponent(mensagem)}`;

    window.open(url, '_blank', 'noopener');
  }

  editarTemplate(): void {
    this.editandoTemplate = true;
  }

  /**
   * Fecha a edicao voltando para a pre-visualizacao.
   *
   * Se o campo ficou vazio, restaura o padrao: uma mensagem em
   * branco nao serve para nada e e facil acontecer sem perceber.
   */
  salvarTemplate(): void {
    if (!this.templateMensagem.trim()) {
      this.templateMensagem = this.templatePadrao;
    }

    this.editandoTemplate = false;
  }

  restaurarTemplate(): void {
    this.templateMensagem = this.templatePadrao;
  }

  /** Insere uma vari\u00E1vel na posi\u00E7\u00E3o atual do cursor. */
  inserirVariavel(variavel: string): void {
    this.templateMensagem = `${this.templateMensagem} ${variavel}`;
  }

  trocarMes(valor: number): void {
    this.mesSelecionado = valor;
    this.carregarAniversariantes();
    this.carregarResumo();
  }
}