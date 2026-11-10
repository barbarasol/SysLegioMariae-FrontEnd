import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ControleVersao } from '../../../models/controle-versao.model';
import { ControleVersaoService } from '../../../services/controle-versao.service';
import { formatarDataHoraLocal } from '../../../utils/data-hora.util';

@Component({
  selector: 'app-controle-versao', standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './controle-versao.html',
  styleUrl: './controle-versao.scss'
})
export class ControleVersaoPagina implements OnInit {
  readonly formatarDataHora = formatarDataHoraLocal;
  readonly fusoLocal = Intl.DateTimeFormat().resolvedOptions().timeZone || 'do dispositivo';
  registros: ControleVersao[] = [];
  versaoDigitada = '';
  implementacaoDigitada = '';
  idEdicao: string | null = null;
  carregando = false;
  salvando = false;
  excluindoId: string | null = null;
  erro = '';
  sucesso = '';
  constructor(private readonly service: ControleVersaoService, private readonly cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.listar(); }

  listar(): void {
    this.carregando = true;
    this.erro = '';
    this.service.listar().pipe(finalize(() => { this.carregando = false; this.cdr.detectChanges(); })).subscribe({
      next: dados => { this.registros = dados; this.cdr.detectChanges(); },
      error: e => { this.erro = this.mensagem(e, 'Não foi possível consultar as versões.'); this.cdr.detectChanges(); }
    });
  }
  editar(registro: ControleVersao): void {
    this.idEdicao = registro.id;
    this.versaoDigitada = registro.ultima_versao;
    this.implementacaoDigitada = registro.implementacao ?? '';
    this.erro = '';
    this.sucesso = '';
  }
  cancelar(): void { this.idEdicao = null; this.versaoDigitada = ''; this.implementacaoDigitada = ''; }
  salvar(): void {
    if (this.salvando) return;
    const versao = this.versaoDigitada.trim();
    if (!versao || versao.length > 50 || !/^[A-Za-z0-9][A-Za-z0-9._+\-]{0,49}$/.test(versao)) {
      this.erro = 'Informe uma versão válida, como 3.2.4.';
      return;
    }
    this.salvando = true; this.erro = ''; this.sucesso = '';
    const implementacao = this.implementacaoDigitada.trim() || null;
    const request = this.idEdicao
      ? this.service.atualizar(this.idEdicao, versao, implementacao)
      : this.service.criar(versao, implementacao);
    request.pipe(finalize(() => { this.salvando = false; this.cdr.detectChanges(); })).subscribe({
      next: () => { this.sucesso = 'Versão salva com sucesso.'; this.cancelar(); this.service.notificarAlteracao(); this.listar(); this.cdr.detectChanges(); },
      error: e => { this.erro = this.mensagem(e, 'Não foi possível salvar a versão.'); this.cdr.detectChanges(); }
    });
  }
  excluir(registro: ControleVersao): void {
    if (this.excluindoId || this.salvando) return;
    if (!confirm(`Excluir definitivamente a versão ${registro.ultima_versao}?`)) return;
    this.excluindoId = registro.id; this.erro = ''; this.sucesso = '';
    this.service.excluir(registro.id).pipe(finalize(() => { this.excluindoId = null; this.cdr.detectChanges(); })).subscribe({
      next: () => { this.sucesso = 'Versão excluída.'; this.service.notificarAlteracao(); this.listar(); this.cdr.detectChanges(); },
      error: e => { this.erro = this.mensagem(e, 'Não foi possível excluir a versão.'); this.cdr.detectChanges(); }
    });
  }
  private mensagem(e: HttpErrorResponse, padrao: string): string {
    if (e.status === 403) return 'Acesso exclusivo do perfil Platform Owner.';
    if (e.status === 409 || e.status === 23505) return 'Esta versão já está cadastrada.';
    return e.error?.message ?? e.error?.mensagem ?? padrao;
  }
}
