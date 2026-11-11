import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CadastroUnidadeService, TipoUnidadeOpcao, UnidadeEstrutura
} from '../../services/cadastro-unidade.service';
import { UnidadeVisitasService } from '../../services/unidade-visitas.service';
import { FormVisita, RegistroVisita, visitaVazia } from '../../models/unidade-visitas.model';
import { Breadcrumb, ItemBreadcrumb } from '../../components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-unidade-visitas',
  imports: [FormsModule, Breadcrumb],
  templateUrl: './unidade-visitas.html',
  styleUrl: './unidade-visitas.scss'
})
export class UnidadeVisitas implements OnInit {
  readonly anos = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() + 2 - i);
  readonly meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  tipos: TipoUnidadeOpcao[] = [];
  unidades: UnidadeEstrutura[] = [];
  unidadesDoTipo: UnidadeEstrutura[] = [];
  tipoSelecionado = '';
  unidadeId = '';
  ano = new Date().getFullYear();
  mes = ''; // Sem filtro mensal por padrão: visitas são anuais.

  visitas: RegistroVisita[] = [];
  form: FormVisita = visitaVazia();
  editandoId: string | null = null;
  podeEditar = false;
  carregandoUnidades = true;
  carregando = false;
  salvando = false;
  erro = '';
  sucesso = '';

  itens: ItemBreadcrumb[] = [
    { label: 'Início', routerLink: '/home', icone: 'bi-house' },
    { label: 'Conselhos-Praesidia', routerLink: '/afiliacao', icone: 'bi-diagram-3' },
    { label: 'Visitas', routerLink: '/unidade-visitas', icone: 'bi-calendar-check'}
  ];

  constructor(
    private readonly cadastro: CadastroUnidadeService,
    private readonly service: UnidadeVisitasService,
    private readonly rota: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    forkJoin({ tipos: this.cadastro.listarTipos(), unidades: this.cadastro.listarEstrutura() }).subscribe({
      next: ({ tipos, unidades }) => {
        this.tipos = [...tipos].sort((a,b) => (a.ordemHierarquica ?? 999) - (b.ordemHierarquica ?? 999));
        this.unidades = [...unidades].sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'));
        const unidadeId = this.rota.snapshot.queryParamMap.get('unidadeId');
        const unidade = this.unidades.find(u => u.id === unidadeId);
        if (unidade) { this.tipoSelecionado = unidade.tipo; this.unidadeId = unidade.id; }
        this.atualizarUnidades();
        this.carregandoUnidades = false;
        if (this.unidadeId) this.carregar();
        this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => {
        this.erro = this.mensagem(e, 'Não foi possível carregar as unidades.');
        this.carregandoUnidades = false;
        this.cdr.detectChanges();
      }
    });
  }
  atualizarUnidades(): void {
    this.unidadesDoTipo = this.tipoSelecionado ? this.unidades.filter(u => u.tipo === this.tipoSelecionado) : [...this.unidades];
  }
  aoTrocarTipo(): void { this.unidadeId = ''; this.atualizarUnidades(); this.limpar(); }
  aoTrocarUnidade(): void { this.limpar(); if (this.unidadeId) this.carregar(); }
  aoTrocarPeriodo(): void { this.limpar(); if (this.unidadeId) this.carregar(); }
  private limpar(): void {
    this.visitas = [];
    this.podeEditar = false;
    this.editandoId = null;
    this.form = visitaVazia();
    this.erro = ''; this.sucesso = '';
  }
  carregar(): void {
    if (!this.unidadeId) return;
    const uid = this.unidadeId, ano = Number(this.ano), mes = this.mes;
    this.carregando = true; this.erro = '';
    this.service.listar(uid, ano, mes ? Number(mes) : null).subscribe({
      next: (r) => {
        if (uid !== this.unidadeId || ano !== Number(this.ano) || mes !== this.mes) return;
        this.visitas = r.visitas; this.podeEditar = r.permissoes.editar;
        this.carregando = false; this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => {
        if (uid !== this.unidadeId || ano !== Number(this.ano) || mes !== this.mes) return;
        this.erro = this.mensagem(e, 'Não foi possível consultar as visitas.');
        this.carregando = false; this.cdr.detectChanges();
      }
    });
  }
  novo(): void { this.editandoId = null; this.form = visitaVazia(); this.erro = ''; this.sucesso = ''; }
  editar(visita: RegistroVisita): void {
    if (!this.podeEditar) return;
    this.editandoId = visita.id;
    this.form = { data_visita: visita.data_visita.slice(0,10), visitantes: visita.visitantes, observacoes: visita.observacoes ?? '' };
    this.erro = ''; this.sucesso = '';
  }
  salvar(): void {
    if (!this.unidadeId || !this.podeEditar || this.salvando || this.carregando) return;
    const [ano, mes] = (this.form.data_visita ?? '').split('-').map(Number);
    if (ano !== Number(this.ano)) { this.erro = `A data precisa pertencer ao ano filtrado (${this.ano}).`; return; }
    if (this.mes && mes !== Number(this.mes)) { this.erro = 'A data deve estar no mês selecionado ou retire o filtro de mês.'; return; }
    if (!this.form.visitantes.trim() || this.form.visitantes.trim().length > 200) { this.erro = 'Informe os visitantes (até 200 caracteres).'; return; }
    this.salvando = true; this.erro = ''; this.sucesso = '';
    const id = this.editandoId;
    const requisicao = id ? this.service.atualizar(this.unidadeId, id, this.form)
      : this.service.criar(this.unidadeId, this.form);
    requisicao.subscribe({
      next: () => { this.salvando = false; this.sucesso = id ? 'Visita atualizada.' : 'Visita registrada.'; this.editandoId = null; this.form = visitaVazia(); this.carregar(); },
      error: (e: HttpErrorResponse) => { this.salvando = false; this.erro = this.mensagem(e, 'Erro ao salvar visita.'); this.cdr.detectChanges(); }
    });
  }
  excluir(visita: RegistroVisita): void {
    if (!this.podeEditar || this.salvando || !this.unidadeId) return;
    if (!window.confirm(`Excluir a visita de ${visita.data_visita.slice(0,10)}? Essa ação será registrada em auditoria.`)) return;
    this.salvando = true; this.erro = ''; this.sucesso = '';
    this.service.excluir(this.unidadeId, visita.id).subscribe({
      next: () => { this.salvando = false; this.novo(); this.sucesso = 'Visita excluída.'; this.carregar(); },
      error: (e: HttpErrorResponse) => { this.salvando = false; this.erro = this.mensagem(e, 'Erro ao excluir visita.'); this.cdr.detectChanges(); }
    });
  }
  private mensagem(e: HttpErrorResponse, fallback: string): string {
    return typeof e.error?.message === 'string' ? e.error.message : fallback;
  }
}
