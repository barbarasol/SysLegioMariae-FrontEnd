import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, catchError, finalize } from 'rxjs';
import { CatalogosMembro, MembroListado, ResumoMembros } from '../../models/membro.model';
import { mensagemDeErro } from '../../services/usuario.service';
import { MembroService } from '../../services/membro.service';
import { ToastService } from '../../services/toast.service';


const ROTULO_STATUS: Record<string, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  FALECIDO: 'Falecido'
};

@Component({
  imports: [
    FormsModule
  ],
  selector: 'app-membros',
  styleUrl: './membros.scss',
  templateUrl: './membros.html',
})
export class Membros implements OnInit {

  membros: MembroListado[] = [];

  resumo: ResumoMembros = {
    total: 0,
    ativos: 0,
    inativos: 0,
    falecidos: 0
  };

  catalogos: CatalogosMembro = {
    categorias: [],
    cargos: [],
    unidades: []
  };

  filtros = {
    busca: '',
    status: '',
    unidadeId: '',
    categoriaCodigo: ''
  };

  carregando = true;
  acessoNegado = false;

  constructor(
    private membroService: MembroService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  rotulo(status: string): string {
    return ROTULO_STATUS[status] ?? status;
  }

  /** As funções legionárias marcadas, para exibir na linha. */
  funcoes(membro: MembroListado): string[] {
    const lista: string[] = [];

    if (membro.pretoriano) { lista.push('Pretoriano'); }
    if (membro.adjutor) { lista.push('Adjutor'); }
    if (membro.mesc) { lista.push('MESC'); }
    if (membro.catequista) { lista.push('Catequista'); }
    if (membro.coroinha) { lista.push('Coroinha'); }

    return lista;
  }

  carregar(): void {
    if (this.acessoNegado) return;
    this.carregando = true;

    forkJoin({
      membros: this.membroService.listar(this.filtros),

      resumo: this.membroService
        .resumo()
        .pipe(
          catchError(() => of({
            total: 0,
            ativos: 0,
            inativos: 0,
            falecidos: 0
          }))
        ),

      catalogos: this.membroService
        .catalogos()
        .pipe(
          catchError(() => of({
            categorias: [],
            cargos: [],
            unidades: []
          }))
        )
    })
      .pipe(
        finalize(() => {
          this.carregando = false;
        })
      )
      .subscribe({
        next: ({ membros, resumo, catalogos }) => {
          this.membros = membros;
          this.resumo = resumo;
          this.catalogos = catalogos;
          this.acessoNegado = false;
          if (catalogos.unidades.length === 1) {
            this.filtros.unidadeId = catalogos.unidades[0].id;
          }
        },
        error: (error: HttpErrorResponse) => {
          this.membros = [];
          if (error.status === 401 || error.status === 403) {
            this.acessoNegado = true;
            return;
          }

          this.toastService.erro(
            mensagemDeErro(
              error,
              'Não foi possível carregar os membros.'
            )
          );
        }
      });
  }

  filtrar(): void {
    this.carregar();
  }

  limparFiltros(): void {
    this.filtros = {
      busca: '',
      status: '',
      unidadeId: '',
      categoriaCodigo: ''
    };

    if (this.catalogos.unidades.length === 1) {
      this.filtros.unidadeId = this.catalogos.unidades[0].id;
    }
    this.carregar();
  }

  novoMembro(): void {
    if (this.acessoNegado || this.catalogos.unidades.length === 0) return;
    this.router.navigate(['cadastro-membro']);
  }
}