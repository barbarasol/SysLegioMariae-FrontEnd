import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';


@Component({
  imports: [],
  selector: 'app-toast-container',
  styleUrl: './toast-container.scss',
  templateUrl: './toast-container.html',
})
export class ToastContainer {

  protected readonly toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts;

  fechar(id: number): void {
    this.toastService.fechar(id);
  }

  /**
   * O clique no corpo do toast também fecha, para não obrigar
   * o usuário a acertar o X.
   */
  fecharAoClicar(id: number): void {
    this.toastService.fechar(id);
  }
}
