import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import {
  Aniversariante,
  AtualizarOficial,
  CargoOficial,
  MESES,
  Oficial,
  OficialDetalhe,
  FiltrosOficiais,
  ResumoOficiais
} from '../../models/oficial.model';
import { OficialService } from '../../services/oficial.service';
import { type UnidadeOficialAcessivel } from '../../services/oficial.service';
import { ToastService } from '../../services/toast.service';
import { mensagemDeErro } from '../../services/usuario.service';
import { CadastroUnidadeService, PaisOpcao, UfOpcao, MunicipioOpcao, SubdivisaoLocalOpcao, CodigoPostalOpcao } from '../../services/cadastro-unidade.service';
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
  tiposUnidades: Array<{codigo: string; nome: string}> = [];
  unidadesDisponiveis: UnidadeOficialAcessivel[] = [];
  tipoUnidadeSelecionado = '';
  unidadeIdSelecionada = '';
  carregandoUnidades = false;

  get unidadesFiltradasPorTipo(): UnidadeOficialAcessivel[] {
    return this.unidadesDisponiveis.filter(u => !this.tipoUnidadeSelecionado || u.tipo === this.tipoUnidadeSelecionado);
  }

  aoTrocarTipoUnidade(): void {
    this.unidadeIdSelecionada = '';
    this.cdr.detectChanges();
  }

  carregarUnidadesParaFiltro(): void {
    this.carregandoUnidades = true;
    this.oficialService.unidadesAcessiveis()
      .pipe(finalize(() => { this.carregandoUnidades = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (unidades) => {
          this.unidadesDisponiveis = [...unidades].sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR'));
          // Catálogo completo vem de legio.tipo_unidade; as unidades são escopadas.
          this.cdr.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(mensagemDeErro(error, 'Não foi possível consultar as unidades autorizadas.'));
        }
      });
  }

  private filtrosUnidades(): { unidadeId?: string; tipoUnidade?: string } {
    return {
      unidadeId: this.unidadeIdSelecionada || undefined,
      tipoUnidade: this.tipoUnidadeSelecionado || undefined
    };
  }

  podeEditarOficial(oficial: Oficial): boolean {
    return this.unidadesDisponiveis.some(u => u.id === oficial.unidadeId && u.podeEditar);
  }


  carregarTiposUnidades(): void {
    this.oficialService.tiposUnidades().subscribe({
      next: tipos => { this.tiposUnidades = tipos; this.cdr.detectChanges(); },
      error: (error: HttpErrorResponse) => {
        this.toastService.erro(mensagemDeErro(error, 'Falha ao consultar os tipos de unidade.'));
      }
    });
  }

  oficialEditando: OficialDetalhe | null = null;
  oficialExcluindo: OficialDetalhe | null = null;
  excluindo = false;
  paisesEdicao: PaisOpcao[] = [];
  ufsEdicao: UfOpcao[] = [];
  municipiosEdicao: MunicipioOpcao[] = [];
  subdivisoesEdicao: SubdivisaoLocalOpcao[] = [];
  paisIdEdicao = '';
  ufIdEdicao = '';
  buscandoCepEdicao = false;

  get diretorEspiritualEdicao(): boolean {
    const cargo = this.cargos.find(c => c.codigo === this.formularioEdicao?.cargo);
    return !!cargo && (/DIRETOR[_\s-]*ESPIRITUAL/i.test(cargo.codigo) || /DIRETOR\s+ESPIRITUAL/i.test(cargo.nome));
  }

  trocarPaisEdicao(): void {
    this.ufIdEdicao = '';
    if (this.formularioEdicao) { this.formularioEdicao.municipioId = null; this.formularioEdicao.subdivisaoLocalId = null; }
    this.ufsEdicao = []; this.municipiosEdicao = []; this.subdivisoesEdicao = [];
    if (this.paisIdEdicao) this.cadastro.listarUfs(this.paisIdEdicao).subscribe({
      next: itens => { this.ufsEdicao = itens; this.cdr.detectChanges(); },
      error: () => this.toastService.erro('Não foi possível consultar as divisões administrativas.')
    });
  }
  trocarUfEdicao(): void {
    if (this.formularioEdicao) { this.formularioEdicao.municipioId = null; this.formularioEdicao.subdivisaoLocalId = null; }
    this.municipiosEdicao = []; this.subdivisoesEdicao = [];
    if (this.ufIdEdicao) this.cadastro.listarMunicipios(this.ufIdEdicao).subscribe({
      next: itens => { this.municipiosEdicao = itens; this.cdr.detectChanges(); },
      error: () => this.toastService.erro('Não foi possível consultar os municípios.')
    });
  }
  trocarMunicipioEdicao(): void {
    if (!this.formularioEdicao) return;
    this.formularioEdicao.subdivisaoLocalId = null;
    this.subdivisoesEdicao = [];
    if (this.formularioEdicao.municipioId) this.cadastro.listarSubdivisoesLocais(this.formularioEdicao.municipioId).subscribe({
      next: itens => { this.subdivisoesEdicao = itens; this.cdr.detectChanges(); },
      error: () => this.toastService.erro('Não foi possível consultar as subdivisões.')
    });
  }
  consultarCepEdicao(): void {
    const dados = this.formularioEdicao;
    if (!dados || !this.paisIdEdicao || !dados.cep) return;
    this.buscandoCepEdicao = true;
    this.cadastro.buscarCodigosPostais(this.paisIdEdicao, dados.cep).pipe(
      finalize(() => { this.buscandoCepEdicao = false; this.cdr.detectChanges(); })
    ).subscribe({ next: resposta => {
      const item: CodigoPostalOpcao | undefined = resposta.resultados[0];
      if (!item) { this.toastService.erro('CEP não encontrado. Preencha manualmente.'); return; }
      dados.logradouro = item.logradouro || dados.logradouro;
      dados.bairro = item.bairro || dados.bairro;
      dados.localidade = item.localidade || dados.localidade;
      if (item.ufId) {
        this.ufIdEdicao = item.ufId;
        this.cadastro.listarUfs(this.paisIdEdicao).subscribe(v => { this.ufsEdicao = v; this.cdr.detectChanges(); });
        this.cadastro.listarMunicipios(item.ufId).subscribe(v => { this.municipiosEdicao = v; this.cdr.detectChanges(); });
      }
      dados.municipioId = item.municipioId || null;
      dados.subdivisaoLocalId = item.subdivisaoLocalId || null;
      if (item.municipioId) this.cadastro.listarSubdivisoesLocais(item.municipioId).subscribe(v => {this.subdivisoesEdicao = v; this.cdr.detectChanges();});
      this.cdr.detectChanges();
    }, error: () => this.toastService.erro('Falha na consulta do CEP.') });
  }

  private carregarCatalogosEndereco(dados: OficialDetalhe): void {
    this.paisIdEdicao = dados.paisId || '';
    this.ufIdEdicao = dados.ufId || '';
    this.cadastro.listarPaises().subscribe({
      next: paises => {
        this.paisesEdicao = paises;
        if (!this.paisIdEdicao) this.paisIdEdicao = paises.find(p => p.sigla === 'BR')?.id || '';
        if (this.paisIdEdicao) this.cadastro.listarUfs(this.paisIdEdicao).subscribe({
          next: ufs => { this.ufsEdicao = ufs; this.cdr.detectChanges(); }
        });
        if (this.ufIdEdicao) this.cadastro.listarMunicipios(this.ufIdEdicao).subscribe({
          next: municipios => { this.municipiosEdicao = municipios; this.cdr.detectChanges(); }
        });
        if (dados.municipioId) this.cadastro.listarSubdivisoesLocais(dados.municipioId).subscribe({
          next: subdivisoes => { this.subdivisoesEdicao = subdivisoes; this.cdr.detectChanges(); }
        });
        this.cdr.detectChanges();
      }, error: () => this.toastService.erro('Não foi possível carregar os países.')
    });
  }

  formularioEdicao: AtualizarOficial | null = null;
  carregandoEdicao = false;
  salvandoEdicao = false;

  get unidadesEditaveis(): UnidadeOficialAcessivel[] {
    return this.unidadesDisponiveis.filter(u => u.podeEditar);
  }

  fecharEdicao(): void {
    if (this.salvandoEdicao) return;
    this.oficialEditando = null;
    this.formularioEdicao = null;
  }

  salvarEdicao(): void {
    if (!this.oficialEditando || !this.formularioEdicao || this.salvandoEdicao) return;
    const dados = this.formularioEdicao;
    if (!dados.nome.trim() || !dados.unidadeId || !dados.cargo || !dados.dataInicio) {
      this.toastService.erro('Preencha nome, unidade, cargo e data de início.');
      return;
    }
    this.salvandoEdicao = true;
    this.oficialService.atualizar(this.oficialEditando.id, dados).pipe(
      finalize(() => { this.salvandoEdicao = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: () => {
        this.toastService.sucesso('Dados do oficial atualizados com sucesso.');
        this.oficialEditando = null;
        this.formularioEdicao = null;
        this.carregar();
        this.carregarResumo();
        this.carregarAniversariantes();
      },
      error: (error: HttpErrorResponse) => {
        this.toastService.erro(mensagemDeErro(error, 'Não foi possível atualizar o oficial.'));
      }
    });
  }

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
    { label: 'Conselhos-Praesidia', routerLink: '/afiliacao', icone: 'bi-diagram-3' },
    { label: 'Oficiais', routerLink: '/oficiais', icone: 'bi-people' }
  ];
  
  /** Chips de vari\u00E1veis exibidos abaixo do campo de texto. */
  readonly variaveisTemplate = [
    '{nome}',
    '{cargo}',
    '{unidade}',
    '{idade}',
    '{ano}'
  ];

  constructor(
    private oficialService: OficialService,
    private cadastro: CadastroUnidadeService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarUnidadesParaFiltro();
    this.carregarTiposUnidades();
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
      .listar({ ...this.filtros, ...this.filtrosUnidades() })
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
      .resumo(undefined, this.filtrosUnidades())
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
    this.carregarResumo();
    if (this.aba === 'calendario') this.carregarAniversariantes();
  }

  limparFiltros(): void {
    this.tipoUnidadeSelecionado = '';
    this.unidadeIdSelecionada = '';
    this.filtros = {
      busca: '',
      cargo: '',
      somenteVigentes: false
    };

    this.carregar();
    this.carregarResumo();
    if (this.aba === 'calendario') this.carregarAniversariantes();
  }

  carregarAniversariantes(): void {
    this.carregandoAniversariantes = true;

    this.oficialService
      .aniversariantes(this.mesSelecionado, undefined, this.filtrosUnidades())
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

  /** Explica por que o envio esta bloqueado. */
  motivoBloqueio(pessoa: Aniversariante): string {
    if (this.ehAniversarioHoje(pessoa)) {
      return '';
    }

    const hoje = new Date();

    const atual =
      hoje.getFullYear() * 10000 +
      (hoje.getMonth() + 1) * 100 +
      hoje.getDate();

    const alvo =
      hoje.getFullYear() * 10000 +
      pessoa.mes * 100 +
      pessoa.dia;

    return alvo > atual
      ? 'Anivers\u00E1rio ainda n\u00E3o chegou'
      : 'A data j\u00E1 passou';
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

  // ==================================================
  // ACOES DA LINHA (aba Oficiais)
  // ==================================================

  /**
   * Abre o WhatsApp com uma mensagem simples de contato.
   *
   * Diferente do envio de parabens (que usa o template
   * editavel), aqui a mensagem e direta, sem variaveis.
   */
  abrirWhatsappOficial(oficial: Oficial): void {
    const telefone = this.normalizarTelefone(
      oficial.celular || oficial.telefone
    );

    if (!telefone) {
      this.toastService.erro(
        'Este oficial n\u00E3o possui celular ou telefone cadastrado.'
      );
      return;
    }

    const nome = oficial.nomePreferido || oficial.nome;

    const mensagem =
      `Ol\u00E1, ${nome}! Falamos do Sys Legio Mariae.`;

    const url =
      `https://wa.me/${telefone}` +
      `?text=${encodeURIComponent(mensagem)}`;

    window.open(url, '_blank', 'noopener');
  }

  editarOficial(oficial: Oficial): void {
    if (!this.podeEditarOficial(oficial)) return;
    this.carregandoEdicao = true;
    this.oficialService.obter(oficial.id).pipe(
      finalize(() => { this.carregandoEdicao = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: dados => {
        if (!dados.podeEditar) {
          this.toastService.erro('Sem permissão para editar este oficial.');
          return;
        }
        this.oficialEditando = dados;
        this.formularioEdicao = {
          nome: dados.nome,
          nomePreferido: dados.nomePreferido,
          email: dados.email,
          celular: dados.celular,
          telefone: dados.telefone,
          dataNascimento: dados.dataNascimento,
          dtOrdenacaoPresbiteral: dados.dtOrdenacaoPresbiteral,
          municipioId: dados.municipioId,
          subdivisaoLocalId: dados.subdivisaoLocalId,
          cep: dados.cep, localidade: dados.localidade, logradouro: dados.logradouro,
          numeroLogradouro: dados.numeroLogradouro, complemento: dados.complemento, bairro: dados.bairro,
          unidadeId: dados.unidadeId,
          cargo: dados.cargo,
          numeroMandato: dados.numeroMandato,
          dataInicio: dados.dataInicio,
          dataFim: dados.dataFim
        };
        this.carregarCatalogosEndereco(dados);
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => this.toastService.erro(
        mensagemDeErro(error, 'Não foi possível obter os dados do oficial.')
      )
    });
  }

  excluirOficial(oficial: Oficial): void {
    if (!this.podeEditarOficial(oficial)) return;
    this.oficialService.obter(oficial.id).subscribe({
      next: dados => {
        if (!dados.podeEditar) { this.toastService.erro('Sem autorização para excluir.'); return; }
        this.oficialExcluindo = dados;
        this.cdr.detectChanges();
      }, error: erro => this.toastService.erro(mensagemDeErro(erro, 'Não foi possível consultar o oficial.'))
    });
  }
  confirmarExclusao(): void {
    const oficial = this.oficialExcluindo;
    if (!oficial || this.excluindo) return;
    this.excluindo = true;
    this.oficialService.encerrar(oficial.id).pipe(finalize(() => {
      this.excluindo = false; this.cdr.detectChanges();
    })).subscribe({
      next: () => {
        this.oficialExcluindo = null;
        this.toastService.sucesso('Mandato encerrado. Dados pessoais e membro preservados.');
        this.carregar(); this.carregarResumo(); this.carregarAniversariantes();
      }, error: erro => this.toastService.erro(mensagemDeErro(erro, 'Não foi possível encerrar o mandato.'))
    });
  }

  trocarMes(valor: number): void {
    this.mesSelecionado = valor;
    this.carregarAniversariantes();
    this.carregarResumo();
  }
}