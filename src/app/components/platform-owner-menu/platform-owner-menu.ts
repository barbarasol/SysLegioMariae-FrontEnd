import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsuarioAtualService } from '../../services/usuario-atual.service';

/** Menu administrativo: funções globais restritas a perfis globais ativos. */
@Component({
  selector: 'app-platform-owner-menu', standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (podeVisualizar) {
      <div class="platform-owner-menu" style="padding: 8px 10px;">
        <button type="button" (click)="aberto = !aberto"
          [attr.aria-expanded]="aberto"
          style="width:100%;text-align:left;background:transparent;border:0;color:inherit;cursor:pointer;padding:8px 0;">
          <i class="bi bi-shield-lock"></i> Gerenciamento Platform Owner
          <i class="bi" [class.bi-chevron-down]="!aberto" [class.bi-chevron-up]="aberto"></i>
        </button>
        @if (aberto) {
          <div class="platform-owner-submenu" style="padding-left:17px;display:grid;gap:8px;">
            <a routerLink="/listagem-usuarios"
              routerLinkActive="active" style="color:inherit;">
              <i class="bi bi-people-fill"></i> Gerenciamento Usuários Plataforma
            </a>
            @if (ehPlatformOwner) {
              <a routerLink="/gerenciamento-platform-owner/versoes"
                routerLinkActive="active" style="color:inherit;">
                <i class="bi bi-tags"></i> Versão
              </a>
              <span style="opacity:.65;" title="Em desenvolvimento"><i class="bi bi-globe"></i> Países (em breve)</span>
              <span style="opacity:.65;" title="Em desenvolvimento"><i class="bi bi-map"></i> Estados (em breve)</span>
              <span style="opacity:.65;" title="Em desenvolvimento"><i class="bi bi-geo-alt"></i> Municípios (em breve)</span>
            }
          </div>
        }
      </div>
    }
  `
})
export class PlatformOwnerMenu implements OnInit {
  podeVisualizar = false;
  ehPlatformOwner = false;
  aberto = false;
  constructor(private readonly usuarioAtual: UsuarioAtualService, private readonly cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.usuarioAtual.obter().subscribe({
      next: resposta => {
        const perfis = resposta.perfisGlobais ?? [];
        this.ehPlatformOwner = perfis.includes('PLATFORM_OWNER');
        this.podeVisualizar = this.ehPlatformOwner || perfis.includes('PLATFORM_ADMIN');
        this.cdr.detectChanges();
      },
      error: () => { this.podeVisualizar = false; this.ehPlatformOwner = false; this.cdr.detectChanges(); }
    });
  }
}
