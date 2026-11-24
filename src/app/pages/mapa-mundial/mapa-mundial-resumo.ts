import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { timeout } from 'rxjs';
import { MapaMundialService, PaisMapa } from '../../services/mapa-mundial.service';

@Component({
  standalone: true,
  selector: 'app-mapa-mundial-resumo',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="resumo-mundo" aria-label="Resumo da presença mundial da Legião de Maria">
      <div class="texto">
        <div class="titulo"><i class="bi bi-globe-americas"></i> Presença mundial</div>
        @if (carregando) { <p>Carregando dados do mapa...</p> }
        @else if (erro) { <p>{{ erro }}</p> }
        @else {
          <div class="numeros">
            <span><strong>{{ paises.length }}</strong> países</span>
            <span><strong>{{ totalUnidades }}</strong> unidades</span>
          </div>
          <p>Unidades ativas e aprovadas visíveis ao seu perfil.</p>
        }
      </div>
      <a routerLink="/mapa-mundial">Explorar mapa mundial <i class="bi bi-arrow-right"></i></a>
    </section>
  `,
  styles: [`
    .resumo-mundo{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px;
      padding:22px;margin:18px 0;border:1px solid #dbe8f0;border-radius:14px;background:#f6fbff}
    .titulo{font-size:17px;font-weight:700;color:#225879}.titulo i{margin-right:8px}
    .numeros{display:flex;gap:28px;margin:12px 0}.numeros span{color:#46606e}
    .numeros strong{font-size:24px;color:#173f5a}.texto p{margin:5px 0;color:#64748b;font-size:13px}
    a{border-radius:8px;background:#2563eb;color:white;padding:10px 16px;text-decoration:none;font-weight:600}
  `]
})
export class MapaMundialResumo implements OnInit {
  private readonly api = inject(MapaMundialService);
  paises: PaisMapa[] = [];
  carregando = true;
  erro = '';
  get totalUnidades(): number { return this.paises.reduce((s, p) => s + p.total, 0); }
  ngOnInit(): void {
    this.api.paises().pipe(timeout(12000)).subscribe({
      next: paises => { this.paises = paises; this.carregando = false; },
      error: erro => { console.error('Resumo do mapa: falha na API de países', erro); this.carregando = false; this.erro = 'Dados indisponíveis no momento. Abra o mapa para visualizar os contornos.'; }
    });
  }
}
