import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface ItemBreadcrumb {
  /** Texto exibido. */
  label: string;

  /** Rota de destino. Ausente = item atual (nao clicavel). */
  routerLink?: string | null;

  /** Icone do bootstrap-icons, opcional. */
  icone?: string;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss'
})
export class Breadcrumb {

  @Input({ required: true }) itens: ItemBreadcrumb[] = [];

  /** O ultimo item nunca e clicavel. */
  ehUltimo(indice: number): boolean {
    return indice === this.itens.length - 1;
  }

  /** Um item so vira link se nao for o ultimo e tiver destino. */
  temLink(indice: number, item: ItemBreadcrumb): boolean {
    return !this.ehUltimo(indice) && !!item.routerLink;
  }
}