import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { AtualizarOficial } from '../models/oficial.model';

export interface UnidadeOficialAcessivel { id: string; nome: string; tipo: string; tipoNome: string; podeEditar: boolean; }
import {
  Aniversariante,
  CargoOficial,
  FiltrosOficiais,
  Oficial,
  ResumoOficiais
} from '../models/oficial.model';

@Injectable({
  providedIn: 'root'
})
export class OficialService {

  constructor(private http: HttpClient) {}

  listar(
    filtros: FiltrosOficiais = {}
  ): Observable<Oficial[]> {
    let params = new HttpParams();

    if (filtros.busca?.trim()) {
      params = params.set('busca', filtros.busca.trim());
    }

    if (filtros.tipoUnidade) {
      params = params.set('tipoUnidade', filtros.tipoUnidade);
    }

    if (filtros.unidadeId) {
      params = params.set('unidadeId', filtros.unidadeId);
    }

    if (filtros.cargo) {
      params = params.set('cargo', filtros.cargo);
    }

    if (filtros.somenteVigentes) {
      params = params.set('vigentes', 'true');
    }

    return this.http.get<Oficial[]>(
      `${environment.apiUrl}/oficiais`,
      { params, withCredentials: true }
    );
  }

  /**
   * Sem `mes`, devolve os aniversariantes dos próximos `dias`.
   * Com `mes` (1-12), devolve todos do mês.
   */
  aniversariantes(
    mes?: number | null,
    dias?: number,
    filtros: Pick<FiltrosOficiais, 'unidadeId' | 'tipoUnidade'> = {}
  ): Observable<Aniversariante[]> {
    let params = new HttpParams();

    if (mes) {
      params = params.set('mes', String(mes));
    } else if (dias) {
      params = params.set('dias', String(dias));
    }

    if (filtros.unidadeId) params = params.set('unidadeId', filtros.unidadeId);
    if (filtros.tipoUnidade) params = params.set('tipoUnidade', filtros.tipoUnidade);

    return this.http.get<Aniversariante[]>(
      `${environment.apiUrl}/oficiais/aniversariantes`,
      { params, withCredentials: true }
    );
  }

  resumo(mes?: number, filtros: Pick<FiltrosOficiais, 'unidadeId' | 'tipoUnidade'> = {}): Observable<ResumoOficiais> {
    let params = new HttpParams();

    if (mes) {
      params = params.set('mes', String(mes));
    }

    if (filtros.unidadeId) params = params.set('unidadeId', filtros.unidadeId);
    if (filtros.tipoUnidade) params = params.set('tipoUnidade', filtros.tipoUnidade);

    return this.http.get<ResumoOficiais>(
      `${environment.apiUrl}/oficiais/resumo`,
      { params, withCredentials: true }
    );
  }

  unidadesAcessiveis(): Observable<UnidadeOficialAcessivel[]> {
    return this.http.get<UnidadeOficialAcessivel[]>(
      `${environment.apiUrl}/oficiais/unidades-acessiveis`,
      { withCredentials: true }
    );
  }

  tiposUnidades(): Observable<Array<{ codigo: string; nome: string }>> {
    return this.http.get<Array<{ codigo: string; nome: string }>>(
      `${environment.apiUrl}/oficiais/tipos-unidades`, { withCredentials: true }
    );
  }

  obter(vinculoId: string): Observable<Oficial & { podeEditar: boolean }> {
    return this.http.get<Oficial & { podeEditar: boolean }>(
      `${environment.apiUrl}/oficiais/${encodeURIComponent(vinculoId)}`,
      { withCredentials: true }
    );
  }

  atualizar(vinculoId: string, dados: AtualizarOficial): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/oficiais/${encodeURIComponent(vinculoId)}`,
      dados, { withCredentials: true }
    );
  }

  cargos(): Observable<CargoOficial[]> {
    return this.http.get<CargoOficial[]>(
      `${environment.apiUrl}/oficiais/cargos`,
      { withCredentials: true }
    );
  }

  /**
   * Encerra o mandato de um oficial.
   *
   * O id e o do vinculo em membro_cargo_unidade, nao o do membro.
   * A exclusao e logica: o vinculo vira inativo no back.
   */
  encerrar(vinculoId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/oficiais/${vinculoId}`,
      { withCredentials: true }
    );
  }
}