import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'sucesso' | 'erro' | 'info';

export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensagem: string;
  duracaoMs: number;
}

const DURACAO_PADRAO_MS = 5000;

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private contador = 0;

  /**
   * Lista reativa dos toasts visíveis. O componente lê direto
   * este signal, sem subscribe manual.
   */
  private readonly toastsSignal = signal<Toast[]>([]);

  readonly toasts = this.toastsSignal.asReadonly();

  sucesso(
    mensagem: string,
    duracaoMs = DURACAO_PADRAO_MS
  ): number {
    return this.exibir('sucesso', mensagem, duracaoMs);
  }

  erro(
    mensagem: string,
    duracaoMs = DURACAO_PADRAO_MS
  ): number {
    return this.exibir('erro', mensagem, duracaoMs);
  }

  info(
    mensagem: string,
    duracaoMs = DURACAO_PADRAO_MS
  ): number {
    return this.exibir('info', mensagem, duracaoMs);
  }

  fechar(id: number): void {
    this.toastsSignal.update(
      (toasts) => toasts.filter((toast) => toast.id !== id)
    );
  }

  limpar(): void {
    this.toastsSignal.set([]);
  }

  private exibir(
    tipo: ToastTipo,
    mensagem: string,
    duracaoMs: number
  ): number {

    const texto = String(mensagem ?? '').trim();

    if (!texto) {
      return -1;
    }

    const id = ++this.contador;

    this.toastsSignal.update(
      (toasts) => [
        ...toasts,
        {
          id,
          tipo,
          mensagem: texto,
          duracaoMs
        }
      ]
    );

    if (duracaoMs > 0) {
      setTimeout(() => this.fechar(id), duracaoMs);
    }

    return id;
  }
}