import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  CadastroUnidadeService,
  CodigoPostalOpcao,
  DiaReuniaoOpcao,
  FusoHorarioOpcao,
  IgrejaOpcao,
  MunicipioOpcao,
  PaisOpcao,
  SubdivisaoLocalOpcao,
  TipoUnidadeOpcao,
  UfOpcao,
  UnidadeResumoCadastro,
  UnidadeDetalhe
} from '../../../services/cadastro-unidade.service';
import { ToastService } from '../../../services/toast.service';
import { mensagemDeErro } from '../../../services/usuario.service';
import { Breadcrumb, ItemBreadcrumb } from '../../../components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-nova-unidade',
  imports: [FormsModule, Breadcrumb],
  templateUrl: './nova-unidade.html',
  styleUrl: './nova-unidade.scss'
})
export class NovaUnidade implements OnInit {
  etapa = 1;
  modo: 'novo' | 'editar' | 'excluir' = 'novo';
  subdivisaoLocalAlteradaPeloUsuario = false;
  unidadeId: string | null = null;
  // Status real retornado pelo backend ao editar/excluir uma unidade.
  statusAprovacao: string | null = null;
  carregandoUnidade = false;

  tipos: TipoUnidadeOpcao[] = [];
  diasReuniao: DiaReuniaoOpcao[] = [];
  fusosHorarios: FusoHorarioOpcao[] = [];
  paises: PaisOpcao[] = [];
  ufs: UfOpcao[] = [];
  municipios: MunicipioOpcao[] = [];
  subdivisoesLocais: SubdivisaoLocalOpcao[] = [];
  igrejas: IgrejaOpcao[] = [];
  codigoPostalResultados: CodigoPostalOpcao[] = [];

  private todasUnidades: UnidadeResumoCadastro[] = [];
  private fusoPesquisaTimer: ReturnType<typeof setTimeout> | null = null;
  private fusoPesquisaSeq = 0;
  private igrejasConsultaSeq = 0;

  solicitacao = this.novaSolicitacao();
  novaParoquia = this.novaParoquiaVazia();
  exibirEdicaoParoquia = false;
  salvandoEdicaoParoquia = false;
  pesquisandoCepEdicao = false;
  mensagemCepEdicao = '';
  resultadosCepEdicao: CodigoPostalOpcao[] = [];
  private cepEdicaoSeq = 0;
  igrejaEditandoId: string | null = null;
  igrejaEdicao = {
    nome: '', padre: '', codigoPostal: '', subdivisaoLocalId: '',
    logradouro: '', numeroLogradouro: '', complemento: '', bairro: '',
    celular: '', telefone: '', telefone2: '', email: '', site: ''
  };

  filtroMunicipio = '';
  filtroSubdivisao = '';
  filtroIgreja = '';
  filtroDiaReuniao = '';
  filtroFusoHorario = '';

  carregando = false;
  carregandoTipos = false;
  carregandoDiasReuniao = false;
  carregandoFusosHorarios = false;
  carregandoPaises = false;
  carregandoUfs = false;
  carregandoMunicipios = false;
  carregandoSubdivisoes = false;
  carregandoIgrejas = false;
  carregandoUnidades = false;
  pesquisandoCodigoPostal = false;
  salvandoParoquia = false;
  salvandoUf = false;
  salvandoMunicipio = false;
  salvandoSubdivisao = false;

  codigoPostalEncontrado: CodigoPostalOpcao | null = null;
  codigoPostalNovo = false;
  mensagemCodigoPostal = '';
  pesquisandoCepSede = false;
  mensagemCepSede = '';
  resultadosCepSede: CodigoPostalOpcao[] = [];
  private cepSedeSeq = 0;
  private cepParoquiaSeq = 0;

  exibirCadastroParoquia = false;
  exibirNovaUf = false;
  exibirNovoMunicipio = false;
  exibirNovaSubdivisao = false;

  novaUf = {
    nome: '',
    sigla: '',
    codigoIso: ''
  };

  novoMunicipio = {
    nome: ''
  };

  novaSubdivisao = {
    nome: '',
    tipo: '',
    codigo: ''
  };

  erro = '';
  sucesso = '';

  itens: ItemBreadcrumb[] = [
    { label: 'Início', routerLink: '/home', icone: 'bi-house' },
    { label: 'Conselhos-Praesidia', routerLink: '/afiliacao', icone: 'bi-diagram-3' },
    { label: 'Nova Unidade', routerLink: '/nova-unidade', icone: 'bi-clipboard-plus'}
  ];

  constructor(
    private cadastroUnidadeService: CadastroUnidadeService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.unidadeId = this.route.snapshot.queryParamMap.get('id');
    const modoParam = this.route.snapshot.queryParamMap.get('modo');

    if (this.unidadeId && modoParam === 'excluir') {
      this.modo = 'excluir';
    } else if (this.unidadeId) {
      this.modo = 'editar';
    }

    this.carregarTipos();
    this.carregarDiasReuniao();
    this.carregarFusosHorarios();
    this.carregarPaises();
    this.carregarUnidades();

    if (this.unidadeId) {
      this.carregarUnidade(this.unidadeId);
    }
  }

  get tituloPagina(): string {
    if (this.modo === 'editar') return 'Editar Unidade';
    if (this.modo === 'excluir') return 'Excluir Unidade';
    return 'Nova Solicitação de Unidade';
  }

  get somenteLeitura(): boolean {
    return this.modo === 'excluir';
  }

  private novaSolicitacao() {
    return {
      tipo: '',
      nome: '',
      nomeReduzido: '',
      email: '',
      celular: '',
      telefone: '',
      site: '',
      paisId: '',
      codigoPostal: '',
      codigoPostalSelecaoId: '',
      ufId: '',
      municipioId: '',
      subdivisaoLocalId: '',
      igrejaId: '',
      sedeEnderecoProprio: false,
      copiarEnderecoParoquia: false,
      sedeSubdivisaoLocalId: '',
      sedeCodigoPostal: '',
      sedeLogradouro: '',
      sedeNumeroLogradouro: '',
      sedeComplemento: '',
      sedeBairro: '',
      tipoLogradouro: '',
      logradouro: '',
      bairro: '',
      localidade: '',
      dataFundacao: '',
      dataElevacao: '',
      diaReuniaoId: '',
      horarioInicioReuniao: '',
      horarioFimReuniao: '',
      fusoHorario: '',
      tipoSuperior: '',
      unidadeSuperiorId: '',
      justificativa: ''
    };
  }

  private novaParoquiaVazia() {
    return {
      nome: '',
      padre: '',
      numeroLogradouro: '',
      complemento: '',
      celular: '',
      telefone: '',
      telefone2: '',
      email: '',
      site: ''
    };
  }

  get tipoSelecionado(): TipoUnidadeOpcao | undefined {
    return this.tipos.find(
      (tipo) => tipo.codigo === this.solicitacao.tipo
    );
  }

  get nomeTipoSelecionado(): string {
    return this.tipoSelecionado?.nome ?? '-';
  }

  get diasReuniaoFiltrados(): DiaReuniaoOpcao[] {
    const filtro = this.filtroDiaReuniao
      .trim()
      .toLocaleLowerCase();

    if (!filtro) {
      return this.diasReuniao;
    }

    return this.diasReuniao.filter((item) =>
      item.nome.toLocaleLowerCase().includes(filtro)
    );
  }

  get diaReuniaoSelecionado(): DiaReuniaoOpcao | undefined {
    return this.diasReuniao.find(
      (item) => item.id === this.solicitacao.diaReuniaoId
    );
  }

  get fusoHorarioSelecionado(): FusoHorarioOpcao | undefined {
    return this.fusosHorarios.find(
      (item) => item.nome === this.solicitacao.fusoHorario
    );
  }

  get tiposSuperiorPermitidos(): TipoUnidadeOpcao[] {
    const codigos = this.tipoSelecionado?.tiposSuperiorPermitidos ?? [];

    return this.tipos.filter(
      (tipo) => codigos.includes(tipo.codigo)
    );
  }

  get exigeSuperior(): boolean {
    return this.tiposSuperiorPermitidos.length > 0;
  }

  get nomeTipoSuperiorSelecionado(): string {
    return (
      this.tipos.find(
        (tipo) => tipo.codigo === this.solicitacao.tipoSuperior
      )?.nome ?? '-'
    );
  }

  get unidadesSuperiorDisponiveis(): UnidadeResumoCadastro[] {
    if (!this.solicitacao.tipoSuperior) {
      return [];
    }

    return this.todasUnidades.filter(
      (unidade) => unidade.tipo === this.solicitacao.tipoSuperior
    );
  }

  get nomeUnidadeSuperiorSelecionada(): string {
    const unidade = this.todasUnidades.find(
      (item) => item.id === this.solicitacao.unidadeSuperiorId
    );

    return unidade?.nome ?? '-';
  }

  get paisSelecionado(): PaisOpcao | undefined {
    return this.paises.find(
      (item) => item.id === this.solicitacao.paisId
    );
  }

  get ufSelecionada(): UfOpcao | undefined {
    return this.ufs.find(
      (item) => item.id === this.solicitacao.ufId
    );
  }

  get municipioSelecionado(): MunicipioOpcao | undefined {
    return this.municipios.find(
      (item) => item.id === this.solicitacao.municipioId
    );
  }

  get subdivisaoSelecionada(): SubdivisaoLocalOpcao | undefined {
    return this.subdivisoesLocais.find(
      (item) => item.id === this.solicitacao.subdivisaoLocalId
    );
  }

  get igrejaSelecionada(): IgrejaOpcao | undefined {
    return this.igrejas.find(
      (item) => item.id === this.solicitacao.igrejaId
    );
  }

  get igrejasFiltradas(): IgrejaOpcao[] {
    const filtro = this.filtroIgreja.trim().toLocaleLowerCase('pt-BR');
    if (!filtro) {
      return this.igrejas;
    }

    return this.igrejas.filter((igreja) =>
      igreja.nome.toLocaleLowerCase('pt-BR').includes(filtro) ||
      igreja.id.includes(filtro) ||
      // Não retirar do select a opção atualmente escolhida enquanto se pesquisa.
      igreja.id === this.solicitacao.igrejaId
    );
  }

  get enderecoIgrejaSelecionada(): string {
    const igreja = this.igrejaSelecionada;

    if (!igreja) {
      return '';
    }

    const endereco = [
      igreja.logradouro,
      igreja.numeroLogradouro,
      igreja.complemento,
      igreja.bairro
    ]
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .join(' — ');

    return endereco || 'Endereço não informado na Igreja/Paróquia/Sede.';
  }

  get ehBrasil(): boolean {
    return String(this.paisSelecionado?.sigla ?? '')
      .trim()
      .toUpperCase() === 'BR';
  }

  get permiteInclusaoGeografica(): boolean {
    return !!this.solicitacao.paisId && !this.ehBrasil;
  }

  get rotuloCodigoPostal(): string {
    return this.ehBrasil ? 'CEP' : 'Código Postal';
  }

  get rotuloDivisaoAdministrativa(): string {
    return this.ehBrasil
      ? 'UF / Divisão Administrativa'
      : 'Divisão Administrativa';
  }

  get placeholderCodigoPostal(): string {
    return this.ehBrasil ? '00000-000' : 'Informe o código postal';
  }

  get municipiosFiltrados(): MunicipioOpcao[] {
    const filtro = this.filtroMunicipio.trim().toLocaleLowerCase();

    if (!filtro) {
      return this.municipios;
    }

    return this.municipios.filter(
      (item) => item.nome.toLocaleLowerCase().includes(filtro)
    );
  }

  get subdivisoesFiltradas(): SubdivisaoLocalOpcao[] {
    const filtro = this.filtroSubdivisao.trim().toLocaleLowerCase();

    if (!filtro) {
      return this.subdivisoesLocais;
    }

    return this.subdivisoesLocais.filter((item) => {
      const texto = [
        item.nome,
        item.tipo ?? '',
        item.codigo ?? ''
      ].join(' ').toLocaleLowerCase();

      return texto.includes(filtro);
    });
  }

  get codigoPostalBrasilValido(): boolean {
    if (!this.ehBrasil) {
      return true;
    }

    if (!this.solicitacao.codigoPostal.trim()) {
      return true;
    }

    return !!this.solicitacao.codigoPostalSelecaoId;
  }

  get novaParoquiaValida(): boolean {
    return (
      !!this.solicitacao.municipioId &&
      !!this.novaParoquia.nome.trim() &&
      this.codigoPostalBrasilValido
    );
  }

  /** A elevação se aplica a Comitium (Comitia), Regia e Senatus. */
  get exigeDataElevacao(): boolean {
    return ['COMITIUM', 'COMITIA', 'REGIA', 'SENATUS'].includes(
      String(this.solicitacao.tipo ?? '').trim().toUpperCase()
    );
  }

  /** Datas são salvas em ISO (AAAA-MM-DD); só a apresentação é brasileira. */
  formatarDataBR(valor: string | null | undefined): string {
    if (!valor) return '-';
    const r = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
    return r ? `${r[3]}/${r[2]}/${r[1]}` : '-';
  }

  get etapaValida(): boolean {
    if (this.etapa === 1) {
      return (
        !!this.solicitacao.tipo &&
        !!this.solicitacao.nome.trim() &&
        !!this.solicitacao.paisId &&
        !!this.solicitacao.ufId &&
        !!this.solicitacao.municipioId &&
        !!this.solicitacao.igrejaId &&
        !!this.solicitacao.dataFundacao &&
        (!this.exigeDataElevacao || !!this.solicitacao.dataElevacao) &&
        (!this.solicitacao.sedeEnderecoProprio ||
          !!this.solicitacao.sedeLogradouro.trim()) &&
        this.codigoPostalBrasilValido
      );
    }

    if (this.etapa === 2) {
      return (
        !this.exigeSuperior ||
        (
          !!this.solicitacao.tipoSuperior &&
          !!this.solicitacao.unidadeSuperiorId
        )
      );
    }

    return true;
  }

  aoTrocarTipo(): void {
    if (!this.exigeDataElevacao) this.solicitacao.dataElevacao = '';
    this.solicitacao.tipoSuperior = '';
    this.solicitacao.unidadeSuperiorId = '';
  }

  aoTrocarTipoSuperior(): void {
    this.solicitacao.unidadeSuperiorId = '';
  }

  aoTrocarPais(): void {
    this.fecharEdicaoParoquia();
    this.solicitacao.codigoPostal = '';
    this.solicitacao.codigoPostalSelecaoId = '';
    this.solicitacao.ufId = '';
    this.solicitacao.municipioId = '';
    this.solicitacao.subdivisaoLocalId = '';
    this.solicitacao.sedeSubdivisaoLocalId = '';
    this.solicitacao.igrejaId = '';
    this.solicitacao.tipoLogradouro = '';
    this.solicitacao.logradouro = '';
    this.solicitacao.bairro = '';
    this.solicitacao.localidade = '';

    this.ufs = [];
    this.municipios = [];
    this.subdivisoesLocais = [];
    this.igrejas = [];
    this.igrejasConsultaSeq++;

    this.filtroMunicipio = '';
    this.filtroSubdivisao = '';
    this.filtroIgreja = '';
    this.filtroDiaReuniao = '';

    this.fecharCadastrosGeograficos();
    this.limparEstadoCodigoPostal();
    this.fecharCadastroParoquia();

    if (this.solicitacao.paisId) {
      this.carregarUfs();
    }
  }

  aoTrocarUf(): void {
    this.solicitacao.municipioId = '';
    this.solicitacao.subdivisaoLocalId = '';
    this.solicitacao.sedeSubdivisaoLocalId = '';
    this.solicitacao.igrejaId = '';

    this.municipios = [];
    this.subdivisoesLocais = [];
    this.igrejas = [];
    this.igrejasConsultaSeq++;

    this.filtroMunicipio = '';
    this.filtroSubdivisao = '';
    this.filtroIgreja = '';
    this.filtroDiaReuniao = '';

    this.invalidarCodigoPostalVinculado();
    this.fecharCadastroParoquia();
    this.exibirNovoMunicipio = false;
    this.exibirNovaSubdivisao = false;

    if (this.solicitacao.ufId) {
      this.carregarMunicipios();
    }
  }

  aoTrocarMunicipio(): void {
    this.fecharEdicaoParoquia();
    this.solicitacao.subdivisaoLocalId = '';
    this.solicitacao.sedeSubdivisaoLocalId = '';
    this.solicitacao.igrejaId = '';

    this.subdivisoesLocais = [];
    this.igrejas = [];
    this.igrejasConsultaSeq++;
    this.filtroSubdivisao = '';
    this.filtroIgreja = '';

    this.invalidarCodigoPostalVinculado();
    this.fecharCadastroParoquia();
    this.exibirNovaSubdivisao = false;

    if (this.solicitacao.municipioId) {
      this.carregarSubdivisoesLocais();
      this.carregarIgrejas();
    }
  }

  aoTrocarSubdivisao(): void {
    this.subdivisaoLocalAlteradaPeloUsuario = true;
    // A seleção geral identifica a RA da unidade. Caso a sede seja própria,
    // mantenha seu seletor sincronizado para não salvar o valor antigo.
    if (this.solicitacao.sedeEnderecoProprio) {
      this.solicitacao.sedeSubdivisaoLocalId =
        this.solicitacao.subdivisaoLocalId || '';
    }
    // A lista das Igrejas é municipal, não restrita à Região Administrativa.
    // Uma Igreja antiga pode ter subdivisao_local_id NULL.
    // A RA da sede pode ser diferente da RA da paróquia; manter igrejaId.
    this.fecharCadastroParoquia();

    if (this.solicitacao.municipioId) {
      this.carregarIgrejas();
    }
  }

  aoTrocarIgreja(): void {
    this.fecharEdicaoParoquia();
    const igreja = this.igrejaSelecionada;

    if (!igreja) {
      return;
    }

    // A troca da paróquia durante uma edição não deve restaurar a RA
    // da paróquia por cima da RA já registrada na unidade.
    if (igreja.subdivisaoLocalId &&
        this.modo === 'novo' &&
        !this.subdivisaoLocalAlteradaPeloUsuario &&
        !this.solicitacao.sedeEnderecoProprio) {
      this.solicitacao.subdivisaoLocalId = igreja.subdivisaoLocalId;
    }

    if (igreja.codigoPostal) {
      // Chave apenas de estado do frontend. O CEP não possui mais ID em
      // legio.codigo_postal, pois essa tabela deixou de ser utilizada.
      this.solicitacao.codigoPostalSelecaoId = `IGREJA:${igreja.id}`;
      this.solicitacao.codigoPostal = igreja.codigoPostal;
      this.solicitacao.logradouro = igreja.logradouro ?? '';
      this.solicitacao.bairro = igreja.bairro ?? '';

      this.codigoPostalNovo = false;
      this.codigoPostalResultados = [];
      this.mensagemCodigoPostal =
        `${this.rotuloCodigoPostal} carregado a partir da Igreja/Paróquia/Sede selecionada.`;
    }
  }

  aoAlterarCodigoPostal(valor: string): void {
    const texto = String(valor ?? '');

    if (this.ehBrasil) {
      const numeros = texto.replace(/\D/g, '').slice(0, 8);

      this.solicitacao.codigoPostal = numeros.length > 5
        ? `${numeros.slice(0, 5)}-${numeros.slice(5)}`
        : numeros;
    } else {
      this.solicitacao.codigoPostal = texto
        .toUpperCase()
        .slice(0, 20);
    }

    this.limparEstadoCodigoPostal();
    this.cepParoquiaSeq++;
    if (this.ehBrasil && this.solicitacao.codigoPostal.replace(/\D/g, '').length === 8) {
      this.pesquisarCodigoPostal();
    }
  }

  pesquisarCodigoPostal(): void {
    if (!this.solicitacao.paisId) {
      this.toastService.erro('Selecione primeiro o País.');
      return;
    }

    const codigo = this.solicitacao.codigoPostal.trim();

    if (!codigo) {
      this.toastService.erro(`Informe o ${this.rotuloCodigoPostal}.`);
      return;
    }

    if (this.ehBrasil) {
      const somenteNumeros = codigo.replace(/\D/g, '');

      if (somenteNumeros.length !== 8) {
        this.toastService.erro('Informe um CEP com 8 dígitos.');
        return;
      }
    } else {
      // Não mantemos catálogo de códigos postais estrangeiros. O valor é
      // armazenado diretamente no endereço da Igreja/Paróquia/Sede.
      this.codigoPostalEncontrado = null;
      this.codigoPostalResultados = [];
      this.codigoPostalNovo = true;
      this.mensagemCodigoPostal =
        'Para países estrangeiros, o Código Postal é informado manualmente e será armazenado diretamente na Igreja/Paróquia/Sede.';
      return;
    }

    const seq = ++this.cepParoquiaSeq;
    this.pesquisandoCodigoPostal = true;
    this.mensagemCodigoPostal = '';
    this.codigoPostalResultados = [];

    this.cadastroUnidadeService
      .buscarCodigosPostais(
        this.solicitacao.paisId,
        codigo
      )
      .pipe(
        finalize(() => {
          if (seq === this.cepParoquiaSeq) {
            this.pesquisandoCodigoPostal = false;
            this.cdr.detectChanges();
          }
        })
      )
      .subscribe({
        next: (resultado) => {
          if (seq !== this.cepParoquiaSeq) return;
          const encontrados = Array.isArray(resultado?.resultados)
            ? resultado.resultados
            : [];

          this.codigoPostalResultados = encontrados;

          if (!resultado.encontrado || encontrados.length === 0) {
            this.codigoPostalEncontrado = null;
            this.solicitacao.codigoPostalSelecaoId = '';
            this.codigoPostalNovo = false;
            this.mensagemCodigoPostal =
              'CEP não encontrado nos serviços públicos consultados. No Brasil não é permitido cadastrar CEP manualmente neste fluxo.';
            return;
          }

          this.codigoPostalNovo = false;

          if (encontrados.length === 1) {
            this.aplicarCodigoPostal(encontrados[0]);
            return;
          }

          this.codigoPostalEncontrado = null;
          this.solicitacao.codigoPostalSelecaoId = '';
          this.mensagemCodigoPostal =
            `${encontrados.length} ocorrências encontradas. Selecione abaixo o endereço correspondente.`;
        },
        error: (error: HttpErrorResponse) => {
          if (seq !== this.cepParoquiaSeq) return;
          this.toastService.erro(
            mensagemDeErro(
              error,
              `Não foi possível pesquisar o ${this.rotuloCodigoPostal}.`
            )
          );
        }
      });
  }

  selecionarCodigoPostalResultado(codigoPostalSelecaoId: string): void {
    const item = this.codigoPostalResultados.find(
      (codigo) => codigo.id === codigoPostalSelecaoId
    );

    if (item) {
      this.aplicarCodigoPostal(item);
    }
  }

  abrirNovaUf(): void {
    if (!this.permiteInclusaoGeografica) {
      this.toastService.erro(
        'No Brasil, UFs devem ser selecionadas exclusivamente da base já importada.'
      );
      return;
    }

    this.novaUf = {
      nome: '',
      sigla: '',
      codigoIso: ''
    };
    this.exibirNovaUf = true;
  }

  salvarNovaUf(): void {
    if (
      this.salvandoUf ||
      !this.permiteInclusaoGeografica ||
      !this.novaUf.nome.trim()
    ) {
      return;
    }

    this.salvandoUf = true;

    this.cadastroUnidadeService
      .criarUf({
        paisId: this.solicitacao.paisId,
        nome: this.novaUf.nome.trim().toUpperCase(),
        sigla: this.novaUf.sigla.trim().toUpperCase() || null,
        codigoIso: this.novaUf.codigoIso.trim().toUpperCase() || null
      })
      .pipe(
        finalize(() => {
          this.salvandoUf = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (uf) => {
          this.ufs = [
            ...this.ufs.filter((item) => item.id !== uf.id),
            uf
          ].sort((a, b) => a.nome.localeCompare(b.nome));

          this.solicitacao.ufId = uf.id;
          this.exibirNovaUf = false;
          this.carregarMunicipios();

          this.toastService.sucesso(
            `Divisão Administrativa "${uf.nome}" incluída.`
          );
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível incluir a Divisão Administrativa.'
            )
          );
        }
      });
  }

  abrirNovoMunicipio(): void {
    if (!this.permiteInclusaoGeografica) {
      this.toastService.erro(
        'No Brasil, Municípios devem ser selecionados exclusivamente da base já importada.'
      );
      return;
    }

    if (!this.solicitacao.ufId) {
      this.toastService.erro(
        'Selecione primeiro a Divisão Administrativa.'
      );
      return;
    }

    this.novoMunicipio = { nome: '' };
    this.exibirNovoMunicipio = true;
  }

  salvarNovoMunicipio(): void {
    if (
      this.salvandoMunicipio ||
      !this.permiteInclusaoGeografica ||
      !this.solicitacao.ufId ||
      !this.novoMunicipio.nome.trim()
    ) {
      return;
    }

    this.salvandoMunicipio = true;

    this.cadastroUnidadeService
      .criarMunicipio({
        ufId: this.solicitacao.ufId,
        nome: this.novoMunicipio.nome.trim().toUpperCase()
      })
      .pipe(
        finalize(() => {
          this.salvandoMunicipio = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (municipio) => {
          this.municipios = [
            ...this.municipios.filter((item) => item.id !== municipio.id),
            municipio
          ].sort((a, b) => a.nome.localeCompare(b.nome));

          this.solicitacao.municipioId = municipio.id;
          this.exibirNovoMunicipio = false;
          this.carregarSubdivisoesLocais();
          this.carregarIgrejas();

          this.toastService.sucesso(
            `Município/Localidade "${municipio.nome}" incluído.`
          );
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível incluir o Município/Localidade.'
            )
          );
        }
      });
  }

  abrirNovaSubdivisao(): void {
    if (!this.permiteInclusaoGeografica) {
      this.toastService.erro(
        'No Brasil, Subdivisões Locais devem ser selecionadas exclusivamente da base já cadastrada.'
      );
      return;
    }

    if (!this.solicitacao.municipioId) {
      this.toastService.erro(
        'Selecione primeiro o Município/Localidade.'
      );
      return;
    }

    this.novaSubdivisao = {
      nome: '',
      tipo: '',
      codigo: ''
    };
    this.exibirNovaSubdivisao = true;
  }

  salvarNovaSubdivisao(): void {
    if (
      this.salvandoSubdivisao ||
      !this.permiteInclusaoGeografica ||
      !this.solicitacao.municipioId ||
      !this.novaSubdivisao.nome.trim()
    ) {
      return;
    }

    this.salvandoSubdivisao = true;

    this.cadastroUnidadeService
      .criarSubdivisaoLocal({
        municipioId: this.solicitacao.municipioId,
        nome: this.novaSubdivisao.nome.trim().toUpperCase(),
        tipo: this.novaSubdivisao.tipo.trim() || null,
        codigo: this.novaSubdivisao.codigo.trim() || null
      })
      .pipe(
        finalize(() => {
          this.salvandoSubdivisao = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (subdivisao) => {
          this.subdivisoesLocais = [
            ...this.subdivisoesLocais.filter(
              (item) => item.id !== subdivisao.id
            ),
            subdivisao
          ].sort((a, b) => a.nome.localeCompare(b.nome));

          this.solicitacao.subdivisaoLocalId = subdivisao.id;
          this.subdivisaoLocalAlteradaPeloUsuario = true;
          if (this.solicitacao.sedeEnderecoProprio) {
            this.solicitacao.sedeSubdivisaoLocalId = subdivisao.id;
          }
          this.exibirNovaSubdivisao = false;
          this.carregarIgrejas();

          this.toastService.sucesso(
            `Subdivisão Local "${subdivisao.nome}" incluída.`
          );
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível incluir a Subdivisão Local.'
            )
          );
        }
      });
  }

  /** A alteração só substitui o endereço da unidade por ordem explícita. */
  aoAlterarSedePropria(marcado: boolean): void {
    this.solicitacao.sedeEnderecoProprio = !!marcado;
    this.solicitacao.copiarEnderecoParoquia = false;
    if (marcado && !this.solicitacao.sedeSubdivisaoLocalId) {
      this.solicitacao.sedeSubdivisaoLocalId =
        this.solicitacao.subdivisaoLocalId || '';
    }
  }

  /** Quando o usuário escolher a RA da sede, ela também é a RA da unidade. */
  aoTrocarSubdivisaoSede(): void {
    this.solicitacao.subdivisaoLocalId =
      this.solicitacao.sedeSubdivisaoLocalId || '';
    this.subdivisaoLocalAlteradaPeloUsuario = true;
  }

  copiarEnderecoDaParoquia(): void {
    const igreja = this.igrejaSelecionada;
    if (!igreja) {
      this.toastService.erro('Selecione primeiro a Igreja/Paróquia/Sede.');
      return;
    }
    this.solicitacao.sedeEnderecoProprio = false;
    this.solicitacao.copiarEnderecoParoquia = true;
    this.toastService.sucesso('A cópia do endereço será efetivada ao salvar a unidade.');
  }

  aoAlterarCepSede(valor: string): void {
    const bruto = String(valor ?? '');
    if (this.ehBrasil) {
      const numeros = bruto.replace(/\D/g, '').slice(0, 8);
      this.solicitacao.sedeCodigoPostal = numeros.length > 5
        ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : numeros;
    } else {
      this.solicitacao.sedeCodigoPostal = bruto.toUpperCase().slice(0, 20);
    }
    this.cepSedeSeq++;
    this.resultadosCepSede = [];
    this.mensagemCepSede = '';
    if (this.ehBrasil && this.solicitacao.sedeCodigoPostal.replace(/\D/g, '').length === 8) {
      this.pesquisarCepSede();
    }
  }

  pesquisarCepSede(): void {
    if (!this.ehBrasil) {
      this.mensagemCepSede = 'Para outros países, informe o código postal e endereço manualmente.';
      return;
    }
    const cep = this.solicitacao.sedeCodigoPostal.replace(/\D/g, '');
    if (cep.length !== 8 || !this.solicitacao.paisId) {
      this.toastService.erro('Informe um CEP brasileiro de 8 dígitos.');
      return;
    }
    const seq = ++this.cepSedeSeq;
    this.pesquisandoCepSede = true;
    this.mensagemCepSede = '';
    this.cadastroUnidadeService.buscarCodigosPostais(this.solicitacao.paisId, cep)
      .pipe(finalize(() => {
        if (seq === this.cepSedeSeq) {
          this.pesquisandoCepSede = false;
          this.cdr.detectChanges();
        }
      })).subscribe({
        next: (resposta) => {
          if (seq !== this.cepSedeSeq) return;
          const encontrados = resposta.resultados || [];
          if (!encontrados.length) {
            this.mensagemCepSede = 'CEP não encontrado. Confira os dígitos.';
            return;
          }
          const validos = encontrados.filter(item =>
            item.municipioId === this.solicitacao.municipioId &&
            item.ufId === this.solicitacao.ufId
          );
          if (!validos.length) {
            this.mensagemCepSede = 'O CEP informado pertence a outro município/UF. Confira a localização da sede.';
            return;
          }
          this.resultadosCepSede = validos;
          if (validos.length === 1) this.aplicarCepSede(validos[0]);
          else this.mensagemCepSede = 'Há mais de uma RA correspondente. Selecione o endereço correto.';
        },
        error: (erro: HttpErrorResponse) => {
          if (seq === this.cepSedeSeq) this.mensagemCepSede = mensagemDeErro(erro, 'Erro ao consultar CEP da sede.');
        }
      });
  }

  selecionarCepSede(id: string): void {
    const item = this.resultadosCepSede.find(x => x.id === id);
    if (item) this.aplicarCepSede(item);
  }

  private aplicarCepSede(item: CodigoPostalOpcao): void {
    this.solicitacao.sedeCodigoPostal = item.codigoPostal;
    this.solicitacao.sedeLogradouro = (item.logradouro ?? '').toLocaleUpperCase('pt-BR');
    this.solicitacao.sedeBairro = (item.bairro ?? '').toLocaleUpperCase('pt-BR');
    // CEP sem mapeamento de RA não apaga uma RA escolhida manualmente.
    if (item.subdivisaoLocalId) {
      this.solicitacao.sedeSubdivisaoLocalId = item.subdivisaoLocalId;
      this.solicitacao.subdivisaoLocalId = item.subdivisaoLocalId;
      this.subdivisaoLocalAlteradaPeloUsuario = true;
    }
    this.resultadosCepSede = [];
    this.mensagemCepSede = item.ufSigla?.toUpperCase() === 'DF' && !item.subdivisaoLocalId
      ? 'CEP localizado, mas sem RA identificada. Escolha a subdivisão da sede manualmente.'
      : 'Endereço da sede localizado. Confira número, complemento e subdivisão.';
  }

  abrirEdicaoParoquia(): void {
    const atual = this.igrejaSelecionada;
    if (!atual || !this.solicitacao.municipioId) return;
    this.fecharCadastroParoquia();
    this.igrejaEditandoId = atual.id;
    this.igrejaEdicao = {
      nome: atual.nome ?? '', padre: atual.padre ?? '',
      codigoPostal: atual.codigoPostal ?? '', subdivisaoLocalId: atual.subdivisaoLocalId ?? '',
      logradouro: atual.logradouro ?? '', numeroLogradouro: atual.numeroLogradouro ?? '',
      complemento: atual.complemento ?? '', bairro: atual.bairro ?? '',
      celular: atual.celular ?? '', telefone: atual.telefone ?? '',
      telefone2: atual.telefone2 ?? '', email: atual.email ?? '', site: atual.site ?? ''
    };
    this.cepEdicaoSeq++;
    this.resultadosCepEdicao = [];
    this.mensagemCepEdicao = '';
    this.exibirEdicaoParoquia = true;
  }

  fecharEdicaoParoquia(): void {
    this.cepEdicaoSeq++;
    this.exibirEdicaoParoquia = false;
    this.igrejaEditandoId = null;
    this.resultadosCepEdicao = [];
    this.mensagemCepEdicao = '';
  }

  aoAlterarCepEdicao(valor: string): void {
    const texto = String(valor ?? '');
    if (this.ehBrasil) {
      const digitos = texto.replace(/\D/g, '').slice(0, 8);
      this.igrejaEdicao.codigoPostal = digitos.length > 5
        ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
    } else this.igrejaEdicao.codigoPostal = texto.toUpperCase().slice(0, 20);
    this.cepEdicaoSeq++;
    this.resultadosCepEdicao = [];
    this.mensagemCepEdicao = '';
    if (this.ehBrasil && this.igrejaEdicao.codigoPostal.replace(/\D/g, '').length === 8) {
      this.pesquisarCepEdicao();
    }
  }

  pesquisarCepEdicao(): void {
    if (!this.ehBrasil) {
      this.mensagemCepEdicao = 'Para outros países, preencha o código postal manualmente.';
      return;
    }
    const cep = this.igrejaEdicao.codigoPostal.replace(/\D/g, '');
    if (cep.length !== 8 || !this.solicitacao.paisId) {
      this.toastService.erro('Informe um CEP de 8 dígitos.');
      return;
    }
    const seq = ++this.cepEdicaoSeq;
    this.pesquisandoCepEdicao = true;
    this.cadastroUnidadeService.buscarCodigosPostais(this.solicitacao.paisId, cep)
      .pipe(finalize(() => {
        if (seq === this.cepEdicaoSeq) {
          this.pesquisandoCepEdicao = false;
          this.cdr.detectChanges();
        }
      })).subscribe({
        next: resposta => {
          if (seq !== this.cepEdicaoSeq || !this.exibirEdicaoParoquia) return;
          const encontrados = (resposta.resultados ?? []).filter(item =>
            item.ufId === this.solicitacao.ufId &&
            item.municipioId === this.solicitacao.municipioId
          );
          this.resultadosCepEdicao = encontrados;
          if (!encontrados.length) {
            this.mensagemCepEdicao = 'CEP não encontrado neste município. Confira os dados da paróquia.';
          } else if (encontrados.length === 1) {
            this.aplicarCepEdicao(encontrados[0]);
          } else {
            this.mensagemCepEdicao = 'Selecione a ocorrência / Região Administrativa correspondente.';
          }
        },
        error: (erro: HttpErrorResponse) => {
          if (seq === this.cepEdicaoSeq) this.mensagemCepEdicao = mensagemDeErro(erro, 'Erro ao pesquisar CEP.');
        }
      });
  }

  selecionarCepEdicao(id: string): void {
    const item = this.resultadosCepEdicao.find(x => x.id === id);
    if (item) this.aplicarCepEdicao(item);
  }

  private aplicarCepEdicao(item: CodigoPostalOpcao): void {
    this.igrejaEdicao.codigoPostal = item.codigoPostal;
    this.igrejaEdicao.logradouro = (item.logradouro ?? '').toLocaleUpperCase('pt-BR');
    this.igrejaEdicao.bairro = (item.bairro ?? '').toLocaleUpperCase('pt-BR');
    this.igrejaEdicao.subdivisaoLocalId = item.subdivisaoLocalId ?? '';
    this.resultadosCepEdicao = [];
    this.mensagemCepEdicao = item.ufSigla?.toUpperCase() === 'DF' && !item.subdivisaoLocalId
      ? 'CEP localizado, mas sem RA identificada. Selecione a RA manualmente.'
      : 'CEP localizado. Confira número, complemento e Região Administrativa.';
  }

  salvarEdicaoParoquia(): void {
    if (!this.igrejaEditandoId || this.salvandoEdicaoParoquia || !this.igrejaEdicao.nome.trim()) return;
    const id = this.igrejaEditandoId;
    this.salvandoEdicaoParoquia = true;
    this.cadastroUnidadeService.atualizarIgreja(id, {
      nome: this.igrejaEdicao.nome.trim().toLocaleUpperCase('pt-BR'),
      padre: this.igrejaEdicao.padre.trim().toLocaleUpperCase('pt-BR') || null,
      municipioId: this.solicitacao.municipioId,
      subdivisaoLocalId: this.igrejaEdicao.subdivisaoLocalId || null,
      codigoPostal: this.igrejaEdicao.codigoPostal.trim() || null,
      logradouro: this.igrejaEdicao.logradouro.trim().toLocaleUpperCase('pt-BR') || null,
      bairro: this.igrejaEdicao.bairro.trim().toLocaleUpperCase('pt-BR') || null,
      numeroLogradouro: this.igrejaEdicao.numeroLogradouro.trim().toLocaleUpperCase('pt-BR') || null,
      complemento: this.igrejaEdicao.complemento.trim().toLocaleUpperCase('pt-BR') || null,
      celular: this.igrejaEdicao.celular.trim() || null,
      telefone: this.igrejaEdicao.telefone.trim() || null,
      telefone2: this.igrejaEdicao.telefone2.trim() || null,
      email: this.igrejaEdicao.email.trim() || null,
      site: this.igrejaEdicao.site.trim() || null
    }).pipe(finalize(() => {
      this.salvandoEdicaoParoquia = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: igreja => {
        this.igrejas = this.igrejas.map(item => item.id === id ? igreja : item)
          .sort((a, b) => a.nome.localeCompare(b.nome));
        this.fecharEdicaoParoquia();
        this.toastService.sucesso('Igreja/Paróquia/Sede atualizada. Endereço da unidade preservado.');
      },
      error: (erro: HttpErrorResponse) => this.toastService.erro(
        mensagemDeErro(erro, 'Não foi possível atualizar a Igreja/Paróquia/Sede.')
      )
    });
  }

  abrirCadastroParoquia(): void {
    this.fecharEdicaoParoquia();
    if (!this.solicitacao.municipioId) {
      this.toastService.erro(
        'Selecione primeiro o Município/Localidade.'
      );
      return;
    }

    if (
      this.ehBrasil &&
      this.solicitacao.codigoPostal.trim() &&
      !this.solicitacao.codigoPostalSelecaoId
    ) {
      this.toastService.erro(
        'Pesquise e valide o CEP pela API antes de cadastrar a Igreja/Paróquia/Sede, ou limpe o campo CEP.'
      );
      return;
    }

    // O endereço pode vir da BrasilAPI/ViaCEP em caixa mista.
    // Ao abrir o cadastro da Igreja, mostrar os campos em MAIÚSCULAS.
    this.solicitacao.logradouro =
      this.solicitacao.logradouro.toLocaleUpperCase('pt-BR');
    this.solicitacao.bairro =
      this.solicitacao.bairro.toLocaleUpperCase('pt-BR');

    this.novaParoquia = this.novaParoquiaVazia();
    this.exibirCadastroParoquia = true;
  }

  fecharCadastroParoquia(): void {
    this.exibirCadastroParoquia = false;
    this.novaParoquia = this.novaParoquiaVazia();
  }

  salvarNovaParoquia(): void {
    if (this.salvandoParoquia || !this.novaParoquiaValida) {
      return;
    }

    if (
      this.ehBrasil &&
      this.solicitacao.codigoPostal.trim() &&
      !this.solicitacao.codigoPostalSelecaoId
    ) {
      this.toastService.erro(
        'No Brasil, o CEP deve ser localizado e validado pela API antes de salvar a Igreja/Paróquia/Sede.'
      );
      return;
    }

    this.salvandoParoquia = true;

    this.cadastroUnidadeService
      .criarIgreja({
        nome: this.novaParoquia.nome.trim().toLocaleUpperCase('pt-BR'),
        padre: this.novaParoquia.padre.trim().toLocaleUpperCase('pt-BR') || null,
        municipioId: this.solicitacao.municipioId,
        subdivisaoLocalId:
          this.solicitacao.subdivisaoLocalId || null,
        codigoPostal:
          this.solicitacao.codigoPostal.trim() || null,
        tipoLogradouro:
          this.solicitacao.tipoLogradouro.trim() || null,
        logradouro:
          this.solicitacao.logradouro.trim().toLocaleUpperCase('pt-BR') || null,
        bairro:
          this.solicitacao.bairro.trim().toLocaleUpperCase('pt-BR') || null,
        localidade:
          this.solicitacao.localidade.trim() || null,
        numeroLogradouro:
          this.novaParoquia.numeroLogradouro.trim().toLocaleUpperCase('pt-BR') || null,
        complemento:
          this.novaParoquia.complemento.trim().toLocaleUpperCase('pt-BR') || null,
        celular:
          this.novaParoquia.celular.trim() || null,
        telefone:
          this.novaParoquia.telefone.trim() || null,
        telefone2:
          this.novaParoquia.telefone2.trim() || null,
        email:
          this.novaParoquia.email.trim() || null,
        site:
          this.novaParoquia.site.trim() || null
      })
      .pipe(
        finalize(() => {
          this.salvandoParoquia = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (igreja) => {
          this.igrejas = [
            ...this.igrejas.filter((item) => item.id !== igreja.id),
            igreja
          ].sort((a, b) => a.nome.localeCompare(b.nome));

          this.solicitacao.igrejaId = igreja.id;
          this.filtroIgreja = '';

          if (igreja.codigoPostal) {
            this.solicitacao.codigoPostalSelecaoId = `IGREJA:${igreja.id}`;
            this.solicitacao.codigoPostal = igreja.codigoPostal;
            this.solicitacao.logradouro = igreja.logradouro ?? '';
            this.solicitacao.bairro = igreja.bairro ?? '';
          }

          if (igreja.subdivisaoLocalId &&
              !this.subdivisaoLocalAlteradaPeloUsuario &&
              !this.solicitacao.sedeEnderecoProprio) {
            this.solicitacao.subdivisaoLocalId = igreja.subdivisaoLocalId;
          }

          this.codigoPostalNovo = false;
          this.fecharCadastroParoquia();

          this.toastService.sucesso(
            `Igreja/Paróquia/Sede "${igreja.nome}" cadastrada como ATIVA e disponível para uso.`
          );
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível cadastrar a Igreja/Paróquia/Sede.'
            )
          );
        }
      });
  }

  proximaEtapa(): void {
    if (this.etapa < 4 && this.etapaValida) {
      this.erro = '';
      this.etapa++;
    }
  }

  voltar(): void {
    if (this.etapa > 1) {
      this.erro = '';
      this.etapa--;
    }
  }

  carregarTipos(): void {
    this.carregandoTipos = true;

    this.cadastroUnidadeService
      .listarTipos()
      .pipe(
        finalize(() => {
          this.carregandoTipos = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (tipos) => {
          this.tipos = tipos;
        },
        error: (error: HttpErrorResponse) => {
          this.tipos = [];
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível carregar os tipos de unidade.'
            )
          );
        }
      });
  }

  carregarPaises(): void {
    this.carregandoPaises = true;

    this.cadastroUnidadeService
      .listarPaises()
      .pipe(
        finalize(() => {
          this.carregandoPaises = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (paises) => {
          this.paises = paises;

          const brasil = paises.find(
            (pais) => String(pais.sigla ?? '').toUpperCase() === 'BR'
          );

          if (brasil && !this.solicitacao.paisId) {
            this.solicitacao.paisId = brasil.id;
            this.carregarUfs();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.paises = [];
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível carregar os países.'
            )
          );
        }
      });
  }

  carregarUfs(ufSelecionar?: string): void {
    if (!this.solicitacao.paisId) {
      return;
    }

    this.carregandoUfs = true;

    this.cadastroUnidadeService
      .listarUfs(this.solicitacao.paisId)
      .pipe(
        finalize(() => {
          this.carregandoUfs = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (ufs) => {
          this.ufs = ufs;

          if (ufSelecionar) {
            const existe = ufs.some(
              (item) => item.id === ufSelecionar
            );

            if (existe) {
              this.solicitacao.ufId = ufSelecionar;
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          this.ufs = [];
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível carregar as UFs/Divisões Administrativas.'
            )
          );
        }
      });
  }

  carregarMunicipios(
    municipioSelecionar?: string,
    subdivisaoSelecionar?: string
  ): void {
    if (!this.solicitacao.ufId) {
      return;
    }

    this.carregandoMunicipios = true;

    this.cadastroUnidadeService
      .listarMunicipios(this.solicitacao.ufId)
      .pipe(
        finalize(() => {
          this.carregandoMunicipios = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (municipios) => {
          this.municipios = municipios;

          if (municipioSelecionar) {
            const existe = municipios.some(
              (item) => item.id === municipioSelecionar
            );

            if (existe) {
              this.solicitacao.municipioId = municipioSelecionar;

              this.carregarSubdivisoesLocais(
                subdivisaoSelecionar
              );
              this.carregarIgrejas();
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          this.municipios = [];
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível carregar os Municípios/Localidades.'
            )
          );
        }
      });
  }

  carregarSubdivisoesLocais(
    subdivisaoSelecionar?: string
  ): void {
    if (!this.solicitacao.municipioId) {
      this.subdivisoesLocais = [];
      return;
    }

    this.carregandoSubdivisoes = true;

    this.cadastroUnidadeService
      .listarSubdivisoesLocais(
        this.solicitacao.municipioId
      )
      .pipe(
        finalize(() => {
          this.carregandoSubdivisoes = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (subdivisoes) => {
          this.subdivisoesLocais = subdivisoes;

          if (subdivisaoSelecionar) {
            const existe = subdivisoes.some(
              (item) => item.id === subdivisaoSelecionar
            );

            if (existe) {
              if (!this.solicitacao.sedeEnderecoProprio) {
                this.solicitacao.subdivisaoLocalId = subdivisaoSelecionar;
                // Uma nova pesquisa de CEP feita durante a edição pode atualizar a RA.
                this.subdivisaoLocalAlteradaPeloUsuario = true;
              }
              // A lista de Igrejas já é carregada pelo município.
              // Não repetir uma requisição filtrada pela subdivisão.
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          this.subdivisoesLocais = [];
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível carregar as Subdivisões Locais.'
            )
          );
        }
      });
  }

  carregarIgrejas(): void {
    const municipioId = this.solicitacao.municipioId;
    const sequencia = ++this.igrejasConsultaSeq;

    if (!municipioId) {
      this.igrejas = [];
      this.carregandoIgrejas = false;
      return;
    }

    this.carregandoIgrejas = true;

    // Buscar TODAS as Igrejas ativas do município, inclusive as que
    // ainda não têm subdivisão local (RA) informada. O filtro por RA
    // poderia ocultar uma Igreja já cadastrada ao pesquisar o CEP.
    this.cadastroUnidadeService
      .listarIgrejas(municipioId)
      .pipe(
        finalize(() => {
          if (sequencia === this.igrejasConsultaSeq) {
            this.carregandoIgrejas = false;
            this.cdr.detectChanges();
          }
        })
      )
      .subscribe({
        next: (igrejas) => {
          if (
            sequencia !== this.igrejasConsultaSeq ||
            municipioId !== this.solicitacao.municipioId
          ) {
            return;
          }

          this.igrejas = igrejas ?? [];

          // Na edição, preservar a Igreja já vinculada à unidade.
          // Se o vínculo não existir mais na lista ativa, não mantê-lo
          // silenciosamente como opção inválida.
          if (
            this.solicitacao.igrejaId &&
            !this.igrejas.some((item) => item.id === this.solicitacao.igrejaId)
          ) {
            this.solicitacao.igrejaId = '';
          }
        },
        error: (error: HttpErrorResponse) => {
          if (sequencia !== this.igrejasConsultaSeq) {
            return;
          }
          this.igrejas = [];
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível carregar as Igrejas/Paróquias/Sedes.'
            )
          );
        }
      });
  }

  carregarDiasReuniao(): void {
    this.carregandoDiasReuniao = true;

    this.cadastroUnidadeService
      .listarDiasReuniao()
      .pipe(
        finalize(() => {
          this.carregandoDiasReuniao = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (dias) => {
          this.diasReuniao = dias;
        },
        error: (error: HttpErrorResponse) => {
          this.diasReuniao = [];
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível carregar os dias de reunião.'
            )
          );
        }
      });
  }

  aoAlterarFiltroFusoHorario(valor: string): void {
    this.filtroFusoHorario = valor;

    if (this.fusoPesquisaTimer) {
      clearTimeout(this.fusoPesquisaTimer);
    }

    this.fusoPesquisaTimer = setTimeout(() => {
      this.carregarFusosHorarios(valor);
    }, 350);
  }

  carregarFusosHorarios(filtro?: string): void {
    const pesquisa = String(
      filtro ?? this.filtroFusoHorario ?? ''
    ).trim();

    const sequencia = ++this.fusoPesquisaSeq;
    this.carregandoFusosHorarios = true;

    this.cadastroUnidadeService
      .listarFusosHorarios(pesquisa)
      .pipe(
        finalize(() => {
          if (sequencia === this.fusoPesquisaSeq) {
            this.carregandoFusosHorarios = false;
            this.cdr.detectChanges();
          }
        })
      )
      .subscribe({
        next: (fusos) => {
          if (sequencia !== this.fusoPesquisaSeq) {
            return;
          }

          this.fusosHorarios = fusos ?? [];

          const pesquisaNormalizada = pesquisa.toLocaleLowerCase('pt-BR');
          const resultadoExato = this.fusosHorarios.find(
            (fuso) =>
              fuso.nome.toLocaleLowerCase('pt-BR') ===
              pesquisaNormalizada
          );

          if (resultadoExato) {
            this.solicitacao.fusoHorario = resultadoExato.nome;
          } else if (
            pesquisa !== '' &&
            this.fusosHorarios.length === 1
          ) {
            this.solicitacao.fusoHorario =
              this.fusosHorarios[0].nome;
          }
        },
        error: (error: HttpErrorResponse) => {
          if (sequencia !== this.fusoPesquisaSeq) {
            return;
          }

          this.fusosHorarios = [];
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível carregar os fusos horários.'
            )
          );
        }
      });
  }

  limparPesquisaFusoHorario(): void {
    if (this.fusoPesquisaTimer) {
      clearTimeout(this.fusoPesquisaTimer);
      this.fusoPesquisaTimer = null;
    }

    this.filtroFusoHorario = '';
    this.solicitacao.fusoHorario = '';
    this.carregarFusosHorarios('');
  }

  carregarUnidades(): void {
    this.carregandoUnidades = true;

    this.cadastroUnidadeService
      .listarUnidades()
      .pipe(
        finalize(() => {
          this.carregandoUnidades = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (unidades) => {
          this.todasUnidades = unidades;
        },
        error: () => {
          this.todasUnidades = [];
        }
      });
  }

  enviarSolicitacao(): void {
    if (this.carregando || !this.etapaValida) {
      return;
    }

    this.carregando = true;

    const payload = {
        tipoCodigo: this.solicitacao.tipo,
        nome: this.solicitacao.nome.trim().toUpperCase(),
        nomeReduzido:
          this.solicitacao.nomeReduzido.trim().toUpperCase() || null,
        email:
          this.solicitacao.email.trim() || null,
        celular:
          this.solicitacao.celular.trim() || null,
        telefone:
          this.solicitacao.telefone.trim() || null,
        site:
          this.solicitacao.site.trim() || null,
        municipioId: this.solicitacao.municipioId,
        igrejaId: this.solicitacao.igrejaId,
        // Envia sempre a RA selecionada, inclusive na edição.
        // Se o seletor for limpo explicitamente, envia null.
        subdivisaoLocalId: this.solicitacao.subdivisaoLocalId || null,
        sedeEnderecoProprio: this.solicitacao.sedeEnderecoProprio,
        copiarEnderecoParoquia: this.modo === 'editar' && this.solicitacao.copiarEnderecoParoquia,
        // Na sede própria, prioriza o seletor da sede; usa o seletor geral
        // como reserva para impedir que uma seleção válida seja descartada.
        sedeSubdivisaoLocalId: this.solicitacao.sedeEnderecoProprio
          ? (
              this.solicitacao.sedeSubdivisaoLocalId ||
              this.solicitacao.subdivisaoLocalId ||
              null
            )
          : null,
        sedeCodigoPostal: this.solicitacao.sedeEnderecoProprio
          ? (this.solicitacao.sedeCodigoPostal.trim() || null) : null,
        sedeLogradouro: this.solicitacao.sedeEnderecoProprio
          ? (this.solicitacao.sedeLogradouro.trim() || null) : null,
        sedeNumeroLogradouro: this.solicitacao.sedeEnderecoProprio
          ? (this.solicitacao.sedeNumeroLogradouro.trim() || null) : null,
        sedeComplemento: this.solicitacao.sedeEnderecoProprio
          ? (this.solicitacao.sedeComplemento.trim() || null) : null,
        sedeBairro: this.solicitacao.sedeEnderecoProprio
          ? (this.solicitacao.sedeBairro.trim() || null) : null,
        dataConstituicao: this.solicitacao.dataFundacao,
        dataElevacao: this.exigeDataElevacao ? this.solicitacao.dataElevacao : null,
        diaReuniaoId:
          this.solicitacao.diaReuniaoId || null,
        horarioInicioReuniao:
          this.solicitacao.horarioInicioReuniao || null,
        horarioFimReuniao:
          this.solicitacao.horarioFimReuniao || null,
        fusoHorario:
          this.solicitacao.fusoHorario.trim() || null,
        unidadeSuperiorId: this.exigeSuperior
          ? this.solicitacao.unidadeSuperiorId
          : null,
        observacao:
          this.solicitacao.justificativa.trim() || null
      };

    const requisicao = this.modo === 'editar' && this.unidadeId
      ? this.cadastroUnidadeService.atualizarUnidade(this.unidadeId, payload)
      : this.cadastroUnidadeService.criarUnidade(payload);

    requisicao
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (unidade) => {
          this.toastService.sucesso(
            this.modo === 'editar'
              ? `Unidade "${unidade.nome}" atualizada com sucesso.`
              : `Unidade "${unidade.nome}" cadastrada com status PENDENTE e enviada para liberação do administrador.`
          );

          this.sucesso = this.modo === 'editar'
            ? 'Unidade atualizada com sucesso.'
            : 'Solicitação enviada para aprovação.';

          if (this.modo === 'editar') {
            this.router.navigate(['/afiliacao']);
          } else {
            this.etapa = 1;
            this.limpar();
            this.carregarUnidades();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível registrar a unidade. Tente novamente.'
            )
          );
        }
      });
  }

  confirmarExclusao(): void {
    if (!this.unidadeId || this.carregando) {
      return;
    }

    this.carregando = true;
    this.cadastroUnidadeService
      .excluirUnidade(this.unidadeId)
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.toastService.sucesso('Unidade excluída com sucesso.');
          this.router.navigate(['/afiliacao']);
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(error, 'Não foi possível excluir a unidade.')
          );
        }
      });
  }

  cancelarEdicao(): void {
    this.router.navigate(['/afiliacao']);
  }

  private carregarUnidade(id: string): void {
    this.carregandoUnidade = true;

    this.cadastroUnidadeService
      .obterUnidade(id)
      .pipe(
        finalize(() => {
          this.carregandoUnidade = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (unidade: UnidadeDetalhe) => {
          this.statusAprovacao = unidade.statusAprovacao;
          this.solicitacao.tipo = unidade.tipoCodigo;
          this.solicitacao.nome = unidade.nome;
          this.solicitacao.nomeReduzido = unidade.nomeReduzido ?? '';
          this.solicitacao.email = unidade.email ?? '';
          this.solicitacao.celular = unidade.celular ?? '';
          this.solicitacao.telefone = unidade.telefone ?? '';
          this.solicitacao.site = unidade.site ?? '';
          this.solicitacao.paisId = unidade.paisId;
          this.solicitacao.ufId = unidade.ufId;
          this.solicitacao.municipioId = unidade.municipioId;
          // Priorizar a RA efetivamente gravada em unidade_legionaria.
          // subdivisaoLocalId do detalhe é a RA da paróquia.
          this.solicitacao.subdivisaoLocalId =
            unidade.sedeSubdivisaoLocalId ?? unidade.subdivisaoLocalId ?? '';
          this.subdivisaoLocalAlteradaPeloUsuario = false;
          this.solicitacao.igrejaId = unidade.igrejaId;
          this.solicitacao.sedeEnderecoProprio = unidade.sedeEnderecoProprio;
          this.solicitacao.copiarEnderecoParoquia = false;
          this.solicitacao.sedeSubdivisaoLocalId = unidade.sedeSubdivisaoLocalId ?? '';
          this.solicitacao.sedeCodigoPostal = unidade.sedeCodigoPostal ?? '';
          this.solicitacao.sedeLogradouro = unidade.sedeLogradouro ?? '';
          this.solicitacao.sedeNumeroLogradouro = unidade.sedeNumeroLogradouro ?? '';
          this.solicitacao.sedeComplemento = unidade.sedeComplemento ?? '';
          this.solicitacao.sedeBairro = unidade.sedeBairro ?? '';
          this.solicitacao.codigoPostal = unidade.codigoPostal ?? '';
          this.solicitacao.codigoPostalSelecaoId = unidade.codigoPostal
            ? `UNIDADE:${unidade.id}`
            : '';
          this.solicitacao.dataFundacao = unidade.dataConstituicao ?? '';
          this.solicitacao.dataElevacao = unidade.dataElevacao?.slice(0, 10) ?? '';
          this.solicitacao.diaReuniaoId = unidade.diaReuniaoId ?? '';
          this.solicitacao.horarioInicioReuniao = unidade.horarioInicioReuniao ?? '';
          this.solicitacao.horarioFimReuniao = unidade.horarioFimReuniao ?? '';
          this.solicitacao.fusoHorario = unidade.fusoHorario ?? '';
          this.filtroFusoHorario = unidade.fusoHorario ?? '';
          if (unidade.fusoHorario) {
            this.carregarFusosHorarios(unidade.fusoHorario);
          }
          this.solicitacao.unidadeSuperiorId = unidade.unidadeSuperiorId ?? '';
          this.solicitacao.justificativa = unidade.observacao ?? '';

          this.carregarLocalizacaoEdicao(unidade);
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(error, 'Não foi possível carregar a unidade.')
          );
          this.router.navigate(['/afiliacao']);
        }
      });
  }

  private carregarLocalizacaoEdicao(unidade: UnidadeDetalhe): void {
    this.cadastroUnidadeService.listarUfs(unidade.paisId).subscribe({
      next: (ufs) => {
        this.ufs = ufs;
        this.cadastroUnidadeService.listarMunicipios(unidade.ufId).subscribe({
          next: (municipios) => {
            this.municipios = municipios;

            this.cadastroUnidadeService
              .listarSubdivisoesLocais(unidade.municipioId)
              .subscribe({
                next: (subdivisoes) => {
                  this.subdivisoesLocais = subdivisoes;
                },
                error: () => (this.subdivisoesLocais = [])
              });

            this.cadastroUnidadeService
              .listarIgrejas(unidade.municipioId)
              .subscribe({
                next: (igrejas) => {
                  this.igrejas = igrejas;
                  const igreja = igrejas.find((item) => item.id === unidade.igrejaId);
                  if (igreja) {
                    this.solicitacao.igrejaId = igreja.id;
                    // Dados da unidade já foram carregados: não reaplicar endereço da igreja.
                  }
                },
                error: () => (this.igrejas = [])
              });
          },
          error: () => (this.municipios = [])
        });
      },
      error: () => (this.ufs = [])
    });

    // Descobre o tipo da unidade superior para manter o select coerente.
    if (unidade.unidadeSuperiorId) {
      const superior = this.todasUnidades.find(
        (item) => item.id === unidade.unidadeSuperiorId
      );
      if (superior) {
        this.solicitacao.tipoSuperior = superior.tipo;
      } else {
        this.cadastroUnidadeService.listarUnidades().subscribe({
          next: (unidades) => {
            this.todasUnidades = unidades;
            this.solicitacao.tipoSuperior = unidades.find(
              (item) => item.id === unidade.unidadeSuperiorId
            )?.tipo ?? '';
          }
        });
      }
    }
  }

  private aplicarCodigoPostal(
    codigoPostal: CodigoPostalOpcao
  ): void {
    this.codigoPostalEncontrado = codigoPostal;
    this.codigoPostalNovo = false;
    this.mensagemCodigoPostal = '';
    this.codigoPostalResultados = [];

    this.solicitacao.codigoPostalSelecaoId = codigoPostal.id;
    this.solicitacao.codigoPostal =
      codigoPostal.codigoPostal;
    this.solicitacao.tipoLogradouro =
      codigoPostal.tipoLogradouro ?? '';
    this.solicitacao.logradouro =
      codigoPostal.logradouro ?? '';
    this.solicitacao.bairro =
      codigoPostal.bairro ?? '';
    this.solicitacao.localidade =
      codigoPostal.localidade ?? '';

    if (codigoPostal.ufId) {
      const mesmoMunicipio =
        codigoPostal.ufId === this.solicitacao.ufId &&
        !!codigoPostal.municipioId &&
        codigoPostal.municipioId === this.solicitacao.municipioId;
      const igrejaAnterior = mesmoMunicipio
        ? this.solicitacao.igrejaId
        : '';
      const preservarRaSedePropria =
        mesmoMunicipio && this.solicitacao.sedeEnderecoProprio;

      this.solicitacao.ufId = codigoPostal.ufId;
      this.solicitacao.municipioId = '';
      if (!preservarRaSedePropria) {
        this.solicitacao.subdivisaoLocalId = '';
      }
      this.solicitacao.igrejaId = igrejaAnterior;
      this.filtroIgreja = '';

      this.municipios = [];
      this.subdivisoesLocais = [];
      this.igrejas = [];
      this.igrejasConsultaSeq++;

      // Após identificar o município, carregar as Igrejas já existentes
      // independentemente da RA sugerida pelo CEP.
      this.carregarMunicipios(
        codigoPostal.municipioId ?? undefined,
        preservarRaSedePropria
          ? undefined
          : (codigoPostal.subdivisaoLocalId ?? undefined)
      );
    }

    if (codigoPostal.ufSigla?.toUpperCase() === 'DF' && !codigoPostal.subdivisaoLocalId) {
      this.toastService.erro('CEP localizado, mas sem RA mapeada. Selecione a Região Administrativa manualmente.');
    } else {
      this.toastService.sucesso(`${this.rotuloCodigoPostal} localizado com sucesso.`);
    }
  }

  private invalidarCodigoPostalVinculado(): void {
    if (!this.solicitacao.codigoPostal.trim()) {
      return;
    }

    this.solicitacao.codigoPostalSelecaoId = '';
    this.codigoPostalEncontrado = null;
    this.codigoPostalResultados = [];

    if (this.ehBrasil) {
      this.codigoPostalNovo = false;
      this.mensagemCodigoPostal =
        'A localização foi alterada. No Brasil, pesquise novamente o CEP na API.';
    } else {
      this.codigoPostalNovo = true;
      this.mensagemCodigoPostal =
        'A localização foi alterada. Para país estrangeiro, informe novamente o Código Postal manualmente.';
    }
  }

  private limparEstadoCodigoPostal(): void {
    this.solicitacao.codigoPostalSelecaoId = '';
    this.codigoPostalEncontrado = null;
    this.codigoPostalResultados = [];
    this.codigoPostalNovo = false;
    this.mensagemCodigoPostal = '';
  }

  private fecharCadastrosGeograficos(): void {
    this.exibirNovaUf = false;
    this.exibirNovoMunicipio = false;
    this.exibirNovaSubdivisao = false;

    this.novaUf = {
      nome: '',
      sigla: '',
      codigoIso: ''
    };
    this.novoMunicipio = { nome: '' };
    this.novaSubdivisao = {
      nome: '',
      tipo: '',
      codigo: ''
    };
  }

  private limpar(): void {
    this.subdivisaoLocalAlteradaPeloUsuario = false;
    this.erro = '';
    this.sucesso = '';
    this.solicitacao = this.novaSolicitacao();

    this.ufs = [];
    this.municipios = [];
    this.subdivisoesLocais = [];
    this.igrejas = [];

    this.filtroMunicipio = '';
    this.filtroSubdivisao = '';
    this.filtroIgreja = '';
    this.filtroDiaReuniao = '';
    this.filtroFusoHorario = '';

    this.limparEstadoCodigoPostal();
    this.fecharCadastrosGeograficos();
    this.fecharCadastroParoquia();

    const brasil = this.paises.find(
      (pais) => String(pais.sigla ?? '').toUpperCase() === 'BR'
    );

    if (brasil) {
      this.solicitacao.paisId = brasil.id;
      this.carregarUfs();
    }
  }
}
