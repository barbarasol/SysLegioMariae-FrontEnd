import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  UsuarioAtualService,
  UsuarioAutenticado
} from '../../services/usuario-atual.service';

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html'
})
export class Home implements OnInit {
  usuario: UsuarioAutenticado | null = null;
  nomeAbreviado = '';
  perfilGlobal = '';
  carregando = true;
  erro = '';

  constructor(
    private usuarioAtualService: UsuarioAtualService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarUsuarioAtual();
  }

  carregarUsuarioAtual(): void {
    this.carregando = true;
    this.erro = '';
    this.usuario = null;
    this.nomeAbreviado = '';
    this.perfilGlobal = '';

    this.usuarioAtualService.obter()
      .pipe(finalize(() => {
        this.carregando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (contexto) => {
          this.usuario = contexto;
          this.nomeAbreviado = this.usuarioAtualService.nomeAbreviado(contexto);
          this.perfilGlobal = this.usuarioAtualService.nomePerfisGlobais(contexto);
          this.cdr.detectChanges();
        },
        error: (erro) => {
          console.error('Falha ao consultar usuário autenticado:', erro);
          this.erro = 'Não foi possível carregar os dados do usuário autenticado.';
          this.cdr.detectChanges();
        }
      });
  }
}
