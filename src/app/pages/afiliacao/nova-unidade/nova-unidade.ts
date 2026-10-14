import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { mensagemDeErro } from '../../../services/usuario.service';
import { TipoUnidadeCodigo, UnidadeResumo } from '../../../models/unidade.model';
import { UnidadeService } from '../../../services/unidade.service';
import { ToastService } from '../../../services/toast.service';


interface OpcaoTipo {
  codigo: TipoUnidadeCodigo;
  nome: string;
  exigeSuperior: boolean;
}

@Component({
  selector: 'app-nova-unidade',
  imports: [FormsModule],
  templateUrl: './nova-unidade.html',
  styleUrl: './nova-unidade.scss'
})
export class NovaUnidade implements OnInit {

  etapa = 1;

  /**
   * CONCILIUM é o único tipo que pode existir sem unidade superior —
   * a trigger fn_validar_hierarquia_unidade rejeita os demais sem pai.
   */
  readonly tipos: OpcaoTipo[] = [
    { codigo: 'CONCILIUM', nome: 'Concilium', exigeSuperior: false },
    { codigo: 'SENATUS', nome: 'Senatus', exigeSuperior: true },
    { codigo: 'REGIA', nome: 'Regia', exigeSuperior: true },
    { codigo: 'COMITIUM', nome: 'Comitium', exigeSuperior: true },
    { codigo: 'CURIA', nome: 'Cúria', exigeSuperior: true },
    { codigo: 'PRAESIDIUM', nome: 'Praesidium', exigeSuperior: true },
    { codigo: 'PATRICIOS', nome: 'Patrícios', exigeSuperior: true },
    { codigo: 'VELITE', nome: 'Velite', exigeSuperior: true }
  ];

  solicitacao = {
    tipo: '' as TipoUnidadeCodigo | '',
    nome: '',
    nomeReduzido: '',
    cidade: '',
    uf: '',
    paroquia: '',
    dataFundacao: '',
    unidadeSuperiorId: '',
    justificativa: ''
  };

  unidadesSuperiores: UnidadeResumo[] = [];

  erro = '';
  sucesso = '';
  carregando = false;
  carregandoSuperiores = false;

  constructor(
    private unidadeService: UnidadeService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.carregarSuperiores();
  }

  get tipoSelecionado(): OpcaoTipo | undefined {
    return this.tipos.find(
      (tipo) => tipo.codigo === this.solicitacao.tipo
    );
  }

  get exigeSuperior(): boolean {
    return this.tipoSelecionado?.exigeSuperior ?? false;
  }

  get nomeUnidadeSuperiorSelecionada(): string {
    const unidade = this.unidadesSuperiores.find(
      (item) => item.id === this.solicitacao.unidadeSuperiorId
    );

    return unidade
      ? `${unidade.tipo} — ${unidade.nome}`
      : '-';
  }

  get etapaValida(): boolean {
    if (this.etapa === 1) {
      return (
        !!this.solicitacao.tipo &&
        !!this.solicitacao.nome.trim()
      );
    }

    if (this.etapa === 2) {
      return !this.exigeSuperior ||
        !!this.solicitacao.unidadeSuperiorId;
    }

    return true;
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

  carregarSuperiores(): void {
    this.carregandoSuperiores = true;

    this.unidadeService
      .listar()
      .pipe(
        finalize(() => {
          this.carregandoSuperiores = false;
        })
      )
      .subscribe({
        next: (unidades: any) => {
          this.unidadesSuperiores = unidades;
        },
        error: () => {
          this.unidadesSuperiores = [];
        }
      });
  }

  enviarSolicitacao(): void {
    if (this.carregando || !this.etapaValida) {
      return;
    }

    if (!this.solicitacao.tipo) {
      this.erro = 'Selecione o tipo da unidade.';
      return;
    }

    this.erro = '';
    this.sucesso = '';
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
        next: (unidade: any) => {
          this.toastService.sucesso(
            `Unidade "${unidade.nome}" registrada com sucesso.`
          );

          this.limpar();
          this.carregarSuperiores();
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
    console.log('ta cheando aq')
    this.etapa = 1;
    this.solicitacao = {
      tipo: '',
      nome: '',
      nomeReduzido: '',
      cidade: '',
      uf: '',
      paroquia: '',
      dataFundacao: '',
      unidadeSuperiorId: '',
      justificativa: ''
    };
  }
}