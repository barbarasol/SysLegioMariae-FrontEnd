import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  HIERARQUIA_UNIDADE,
  TIPOS_UNIDADE,
  nomeTipoUnidade,
  tiposSuperiorPermitidos
} from '../../../core/hierarquia/unidade-hierarquia';
import { TipoUnidadeCodigo, UnidadeResumo } from '../../../models/unidade.model';
import { UnidadeService } from '../../../services/unidade.service';
import { ToastService } from '../../../services/toast.service';
import { mensagemDeErro } from '../../../services/usuario.service';

interface OpcaoTipo {
  codigo: TipoUnidadeCodigo;
  nome: string;
}

const TODOS_OS_TIPOS: OpcaoTipo[] = TIPOS_UNIDADE.map(
  (codigo) => ({
    codigo,
    nome: nomeTipoUnidade(codigo)
  })
);

@Component({
  selector: 'app-nova-unidade',
  imports: [FormsModule],
  templateUrl: './nova-unidade.html',
  styleUrl: './nova-unidade.scss'
})
export class NovaUnidade implements OnInit {

  etapa = 1;

  readonly tipos: OpcaoTipo[] = TODOS_OS_TIPOS;

  solicitacao = {
    tipo: '' as TipoUnidadeCodigo | '',
    nome: '',
    nomeReduzido: '',
    cidade: '',
    uf: '',
    paroquia: '',
    dataFundacao: '',
    tipoSuperior: '' as TipoUnidadeCodigo | '',
    unidadeSuperiorId: '',
    justificativa: ''
  };

  /** Todas as unidades carregadas do back. */
  private todasUnidades: UnidadeResumo[] = [];

  carregando = false;
  erro = '';
  sucesso = '';
  carregandoUnidades = false;

  constructor(
    private unidadeService: UnidadeService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.carregarUnidades();
  }

  get tipoSelecionado(): OpcaoTipo | undefined {
    return this.tipos.find(
      (tipo) => tipo.codigo === this.solicitacao.tipo
    );
  }

  get nomeTipoSelecionado(): string {
    return nomeTipoUnidade(this.solicitacao.tipo);
  }

  /**
   * Tipos que podem ser pai do tipo escolhido. Vazio quando o tipo
   * é o topo da estrutura (CONCILIUM) ou não pode ter filho.
   */
  get tiposSuperiorPermitidos(): OpcaoTipo[] {
    const permitidos = tiposSuperiorPermitidos(
      this.solicitacao.tipo
    );

    return TODOS_OS_TIPOS.filter(
      (tipo) => permitidos.includes(tipo.codigo)
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

  /**
   * Unidades concretas do tipo de pai escolhido — só existe
   * depois que o usuário seleciona o tipo superior.
   */
  get unidadesSuperiorDisponiveis(): UnidadeResumo[] {
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

    return unidade ? unidade.nome : '-';
  }

  get etapaValida(): boolean {
    if (this.etapa === 1) {
      return (
        !!this.solicitacao.tipo &&
        !!this.solicitacao.nome.trim()
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

  /** Trocar o tipo da unidade invalida o pai já escolhido. */
  aoTrocarTipo(): void {
    this.solicitacao.tipoSuperior = '';
    this.solicitacao.unidadeSuperiorId = '';
  }

  aoTrocarTipoSuperior(): void {
    this.solicitacao.unidadeSuperiorId = '';
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

  carregarUnidades(): void {
    this.carregandoUnidades = true;

    this.unidadeService
      .listar()
      .pipe(
        finalize(() => {
          this.carregandoUnidades = false;
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

    if (!this.solicitacao.tipo) {
      this.toastService.erro('Selecione o tipo da unidade.');
      return;
    }

    this.carregando = true;

    this.unidadeService
      .criar({
        tipoCodigo: this.solicitacao.tipo,
        nome: this.solicitacao.nome,
        nomeReduzido: null,
        cidade: this.solicitacao.cidade,
        estadoRegiao: this.solicitacao.uf,
        paisCodigo: 'BR',
        dataConstituicao: this.solicitacao.dataFundacao || null,
        unidadeSuperiorId: this.exigeSuperior
          ? this.solicitacao.unidadeSuperiorId
          : null,
        observacao: this.montarObservacao()
      })
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (unidade) => {
          this.toastService.sucesso(
            `Unidade "${unidade.nome}" registrada com sucesso.`
          );

          this.etapa = 1;
          this.limpar();
          this.carregarUnidades();
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

  /**
   * O schema não possui coluna de paróquia, então ela é gravada
   * junto da justificativa no campo observacao.
   */
  private montarObservacao(): string {
    const partes: string[] = [];

    if (this.solicitacao.paroquia.trim()) {
      partes.push(`Paróquia ${this.solicitacao.paroquia.trim()}.`);
    }

    if (this.solicitacao.justificativa.trim()) {
      partes.push(this.solicitacao.justificativa.trim());
    }

    return partes.join(' ');
  }

  private limpar(): void {
    this.solicitacao = {
      tipo: '',
      nome: '',
      nomeReduzido: '',
      cidade: '',
      uf: '',
      paroquia: '',
      dataFundacao: '',
      tipoSuperior: '',
      unidadeSuperiorId: '',
      justificativa: ''
    };
  }
}