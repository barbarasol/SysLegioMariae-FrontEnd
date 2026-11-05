import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, finalize, Subject, switchMap } from 'rxjs';
import {
  CargoOpcao,
  CriarSolicitacaoOficial,
  MembroEncontrado,
  OrigemOficial,
  UnidadeOpcao
} from '../../../models/solicitacao-oficial.model';
import { SolicitacaoOficialService } from '../../../services/solicitacao-oficial.service';
import { ToastService } from '../../../services/toast.service';
import { mensagemDeErro } from '../../../services/usuario.service';
import { Breadcrumb, ItemBreadcrumb } from '../../../components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-novo-oficial',
  imports: [FormsModule, Breadcrumb],
  templateUrl: './novo-oficial.html',
  styleUrl: './novo-oficial.scss'
})
export class NovoOficial implements OnInit {

  etapa = 1;

  origem: OrigemOficial = 'PESSOA_NOVA';

  unidades: UnidadeOpcao[] = [];
  cargos: CargoOpcao[] = [];

  // ---- Membro existente ----
  termoBusca = '';
  buscando = false;
  membros: MembroEncontrado[] = [];
  membroSelecionado: MembroEncontrado | null = null;

  private readonly busca$ = new Subject<string>();

  // ---- Formulario ----
  dados = {
    pessoaNome: '',
    pessoaNomePreferido: '',
    pessoaCpf: '',
    pessoaDataNascimento: '',
    pessoaEmail: '',
    pessoaCelular: '',
    pessoaTelefone: '',

    dtIngresso: '',
    dtCompromisso: '',
    pretoriano: false,
    adjutor: false,
    mesc: false,
    catequista: false,
    coroinha: false,

    unidadeId: '',
    cargoId: null as number | null,
    numeroMandato: null as number | null,
    dataInicio: '',
    dataFim: '',

    justificativa: ''
  };

  erro = '';
  carregando = false;

  itens: ItemBreadcrumb[] = [
    { label: 'Início', routerLink: '/home', icone: 'bi-house' },
    { label: 'Oficiais', routerLink: '/oficiais', icone: 'bi-people' },
    { label: 'Novo Oficial', icone: 'bi-person-add' }
  ];

  constructor(
    private service: SolicitacaoOficialService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarCatalogos();

    this.busca$
      .pipe(
        debounceTime(400),
        switchMap((termo) => {
          this.buscando = true;

          return this.service.buscarMembros(termo).pipe(
            finalize(() => {
              this.buscando = false;
              this.cdr.detectChanges();
            })
          );
        })
      )
      .subscribe({
        next: (membros) => {
          this.membros = membros;
        },
        error: () => {
          this.membros = [];
        }
      });
  }

  get nomeUnidadeSelecionada(): string {
    const unidade = this.unidades.find(
      (item) => item.id === this.dados.unidadeId
    );

    return unidade
      ? `${unidade.tipo} - ${unidade.nome}`
      : '-';
  }

  get nomeCargoSelecionado(): string {
    const cargo = this.cargos.find(
      (item) => item.id === Number(this.dados.cargoId)
    );

    return cargo ? cargo.nome : '-';
  }

  get etapaValida(): boolean {
    if (this.etapa === 1) {
      return this.origem === 'MEMBRO_EXISTENTE'
        ? !!this.membroSelecionado
        : !!this.dados.pessoaNome.trim();
    }

    if (this.etapa === 2) {
      return (
        !!this.dados.unidadeId &&
        !!this.dados.cargoId &&
        !!this.dados.dataInicio
      );
    }

    return true;
  }

  carregarCatalogos(): void {
    this.service.catalogos().subscribe({
      next: (catalogos) => {
        this.unidades = catalogos.unidades;
        this.cargos = catalogos.cargos;
      },
      error: (error: HttpErrorResponse) => {
        this.toastService.erro(
          mensagemDeErro(
            error,
            'Nao foi possivel carregar unidades e cargos.'
          )
        );
      }
    });
  }

  trocarOrigem(nova: OrigemOficial): void {
    this.origem = nova;
    this.erro = '';
    this.membroSelecionado = null;
    this.membros = [];
    this.termoBusca = '';
  }

  aoDigitarBusca(): void {
    const termo = this.termoBusca.trim();

    if (termo.length < 3) {
      this.membros = [];
      return;
    }

    this.busca$.next(termo);
  }

  selecionarMembro(membro: MembroEncontrado): void {
    this.membroSelecionado = membro;
    this.membros = [];
    this.termoBusca = membro.nome;
  }

  limparMembro(): void {
    this.membroSelecionado = null;
    this.termoBusca = '';
    this.membros = [];
  }

  proximaEtapa(): void {
    if (this.etapa < 3 && this.etapaValida) {
      this.erro = '';
      this.etapa++;
    }
  }

  enviar(): void {
    if (this.carregando || !this.etapaValida) {
      return;
    }

    this.erro = '';
    this.carregando = true;

    const payload: CriarSolicitacaoOficial = {
      origem: this.origem,

      membroId: this.origem === 'MEMBRO_EXISTENTE'
        ? this.membroSelecionado?.membroId ?? null
        : null,

      pessoaNome: this.dados.pessoaNome,
      pessoaNomePreferido: this.dados.pessoaNomePreferido,
      pessoaCpf: this.dados.pessoaCpf,
      pessoaDataNascimento: this.dados.pessoaDataNascimento || null,
      pessoaEmail: this.dados.pessoaEmail,
      pessoaCelular: this.dados.pessoaCelular,
      pessoaTelefone: this.dados.pessoaTelefone,

      dtIngresso: this.dados.dtIngresso || null,
      dtCompromisso: this.dados.dtCompromisso || null,
      pretoriano: this.dados.pretoriano,
      adjutor: this.dados.adjutor,
      mesc: this.dados.mesc,
      catequista: this.dados.catequista,
      coroinha: this.dados.coroinha,

      unidadeId: this.dados.unidadeId,
      cargoId: Number(this.dados.cargoId),
      numeroMandato: this.dados.numeroMandato,
      dataInicio: this.dados.dataInicio,
      dataFim: this.dados.dataFim || null,

      justificativa: this.dados.justificativa
    };

    this.service
      .criar(payload)
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (solicitacao) => {
          this.toastService.sucesso(
            `Proposta de oficial para "${solicitacao.nome}" enviada para analise.`
          );

          this.router.navigate(['/solicitacoes-oficiais']);
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Nao foi possivel enviar a proposta.'
            )
          );
        }
      });
  }
}