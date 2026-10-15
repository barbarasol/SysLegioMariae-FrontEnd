import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CatalogosMembro, MembroStatus } from '../../../models/membro.model';
import { ToastService } from '../../../services/toast.service';
import { MembroService } from '../../../services/membro.service';
import { mensagemDeErro } from '../../../services/usuario.service';

@Component({
  imports: [
    FormsModule
  ],
  selector: 'app-novo-membro',
  styleUrl: './novo-membro.scss',
  templateUrl: './novo-membro.html',
})
export class NovoMembro implements OnInit {

  etapa = 1;

  membro = {
    // Dados pessoais
    nome: '',
    nomePreferido: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    email: '',
    celular: '',
    telefone: '',

    // Dados legionários
    dtRecrutamento: '',
    dtIngresso: '',
    dtCompromisso: '',
    formacaoEscolar: '',
    aposentado: false,
    pretoriano: false,
    adjutor: false,
    mesc: false,
    catequista: false,
    coroinha: false,
    status: 'ATIVO' as MembroStatus,
    observacao: '',

    // Estrutura
    unidadeId: '',
    categoriaCodigo: '',
    cargoCodigo: '',
    numeroMandato: null as number | null
  };

  catalogos: CatalogosMembro = {
    categorias: [],
    cargos: [],
    unidades: []
  };

  carregando = false;
  carregandoCatalogos = false;

  constructor(
    private membroService: MembroService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarCatalogos();
  }

  get etapaValida(): boolean {
    if (this.etapa === 1) {
      return !!this.membro.nome.trim();
    }

    if (this.etapa === 2) {
      return !!this.membro.categoriaCodigo;
    }

    if (this.etapa === 3) {
      return !!this.membro.unidadeId;
    }

    return true;
  }

  get nomeCategoriaSelecionada(): string {
    return (
      this.catalogos.categorias.find(
        (item) => item.codigo === this.membro.categoriaCodigo
      )?.nome ?? '-'
    );
  }

  get nomeUnidadeSelecionada(): string {
    const unidade = this.catalogos.unidades.find(
      (item) => item.id === this.membro.unidadeId
    );

    return unidade
      ? `${unidade.tipo} — ${unidade.nome}`
      : '-';
  }

  get nomeCargoSelecionado(): string {
    if (!this.membro.cargoCodigo) {
      return 'Nenhum';
    }

    return (
      this.catalogos.cargos.find(
        (item) => item.codigo === this.membro.cargoCodigo
      )?.nome ?? this.membro.cargoCodigo
    );
  }

  /** Exibe a data da promessa apenas quando há promessa. */
  get temPromessa(): boolean {
    return !!this.membro.dtCompromisso;
  }

  proximo(): void {
    if (this.etapa < 3 && this.etapaValida) {
      this.etapa++;
    }
  }

  voltar(): void {
    if (this.etapa > 1) {
      this.etapa--;
    }
  }

  carregarCatalogos(): void {
    this.carregandoCatalogos = true;

    this.membroService
      .catalogos()
      .pipe(
        finalize(() => {
          this.carregandoCatalogos = false;
        })
      )
      .subscribe({
        next: (dados) => {
          this.catalogos = dados;
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível carregar categorias, cargos e unidades.'
            )
          );
        }
      });
  }

  salvar(): void {
    if (this.carregando || !this.etapaValida) {
      return;
    }

    this.carregando = true;

    this.membroService
      .criar({
        nome: this.membro.nome,
        nomePreferido: this.membro.nomePreferido,
        cpf: this.membro.cpf,
        rg: this.membro.rg,
        dataNascimento: this.membro.dataNascimento,
        email: this.membro.email,
        celular: this.membro.celular,
        telefone: this.membro.telefone,

        dtRecrutamento: this.membro.dtRecrutamento,
        dtIngresso: this.membro.dtIngresso,
        dtCompromisso: this.membro.dtCompromisso,
        formacaoEscolar: this.membro.formacaoEscolar,
        aposentado: this.membro.aposentado,
        pretoriano: this.membro.pretoriano,
        adjutor: this.membro.adjutor,
        mesc: this.membro.mesc,
        catequista: this.membro.catequista,
        coroinha: this.membro.coroinha,
        status: this.membro.status,
        observacao: this.membro.observacao,

        unidadeId: this.membro.unidadeId,
        categoriaCodigo: this.membro.categoriaCodigo,
        principal: true,

        cargoCodigo: this.membro.cargoCodigo || null,
        numeroMandato: this.membro.numeroMandato
      })
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (resultado) => {
          this.toastService.sucesso(
            `Membro "${resultado.pessoa.nome}" cadastrado com sucesso.`
          );

          this.etapa = 1;
          this.limpar();
          this.cdr.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível cadastrar o membro. Tente novamente.'
            )
          );
        }
      });
  }

  private limpar(): void {
    this.etapa = 1;
    this.membro = {
      nome: '',
      nomePreferido: '',
      cpf: '',
      rg: '',
      dataNascimento: '',
      email: '',
      celular: '',
      telefone: '',
      dtRecrutamento: '',
      dtIngresso: '',
      dtCompromisso: '',
      formacaoEscolar: '',
      aposentado: false,
      pretoriano: false,
      adjutor: false,
      mesc: false,
      catequista: false,
      coroinha: false,
      status: 'ATIVO',
      observacao: '',
      unidadeId: '',
      categoriaCodigo: '',
      cargoCodigo: '',
      numeroMandato: null
    };
  }
}