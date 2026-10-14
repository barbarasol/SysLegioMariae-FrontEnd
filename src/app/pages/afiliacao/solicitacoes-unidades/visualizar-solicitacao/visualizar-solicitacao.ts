import { Component } from '@angular/core';
import { ModalConfirmacao } from '../../../../components/modal-confirmacao/modal-confirmacao';
import { Router } from '@angular/router';

@Component({
  imports: [
    ModalConfirmacao
  ],
  selector: 'app-visualizar-solicitacao',
  styleUrl: './visualizar-solicitacao.scss',
  templateUrl: './visualizar-solicitacao.html',
})
export class VisualizarSolicitacao {
  modalAprovacao = false;

  constructor(
    private router: Router
  ) {}

  abrirModalAprovacao() {
    this.modalAprovacao = true;
  }

  cancelarModal() {
    this.modalAprovacao = false;
  }

  confirmarAprovacao() {
    this.modalAprovacao = false;
  }

  voltarParaSolicitacao(){
    this.router.navigate(['/solicitacoes-unidades'])
  }
}
