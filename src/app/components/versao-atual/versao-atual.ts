import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ControleVersaoService } from '../../services/controle-versao.service';

@Component({
  selector: 'app-versao-atual', standalone: true,
  template: `@if (versao) {
    <div class="versao-syslegio" style="font-size: 11px; opacity: .9; text-align: center; margin-top: 3px;">
      Versão {{ versao }}
    </div>
  }`
})
export class VersaoAtual implements OnInit, OnDestroy {
  versao: string | null = null;
  private readonly destruir$ = new Subject<void>();
  constructor(private readonly versoes: ControleVersaoService, private readonly cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.recarregar();
    this.versoes.alteracoes$.pipe(takeUntil(this.destruir$))
      .subscribe(() => this.recarregar());
  }
  private recarregar(): void {
    this.versoes.atual().pipe(takeUntil(this.destruir$))
      .subscribe({ next: r => { this.versao = r.ultima_versao; this.cdr.detectChanges(); },
        error: () => { this.versao = null; this.cdr.detectChanges(); } });
  }
  ngOnDestroy(): void { this.destruir$.next(); this.destruir$.complete(); }
}
