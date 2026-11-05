import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CatalogosOficial,
  CriarSolicitacaoOficial,
  FiltrosSolicitacaoOficial,
  MembroEncontrado,
  ResumoOficialPendente,
  SolicitacaoOficial
} from '../models/solicitacao-oficial.model';

@Injectable({
  providedIn: 'root'
})
export class SolicitacaoOficialService {

  constructor(private http: HttpClient) {}

  listar(
    filtros: FiltrosSolicitacaoOficial = {}
  ): Observable<SolicitacaoOficial[]> {
    let params = new HttpParams();

    if (filtros.status) {
      params = params.set('status', filtros.status);
    }

    if (filtros.unidadeId) {
      params = params.set('unidadeId', filtros.unidadeId);
    }

    if (filtros.busca?.trim()) {
      params = params.set('busca', filtros.busca.trim());
    }

    return this.http.get<SolicitacaoOficial[]>(
      `${environment.apiUrl}/solicitacoes-oficiais`,
      { params, withCredentials: true }
    );
  }

  resumo(): Observable<ResumoOficialPendente> {
    return this.http.get<ResumoOficialPendente>(
      `${environment.apiUrl}/solicitacoes-oficiais/resumo`,
      { withCredentials: true }
    );
  }

  catalogos(): Observable<CatalogosOficial> {
    return this.http.get<CatalogosOficial>(
      `${environment.apiUrl}/solicitacoes-oficiais/catalogos`,
      { withCredentials: true }
    );
  }

  /** Busca membros ja cadastrados para vincular como oficial. */
  buscarMembros(busca: string): Observable<MembroEncontrado[]> {
    const params = new HttpParams().set('busca', busca.trim());

    return this.http.get<MembroEncontrado[]>(
      `${environment.apiUrl}/solicitacoes-oficiais/membros`,
      { params, withCredentials: true }
    );
  }

  criar(
    dados: CriarSolicitacaoOficial
  ): Observable<SolicitacaoOficial> {
    return this.http.post<SolicitacaoOficial>(
      `${environment.apiUrl}/solicitacoes-oficiais`,
      dados,
      { withCredentials: true }
    );
  }

  aprovar(
    id: string,
    resposta?: string
  ): Observable<SolicitacaoOficial> {
    return this.http.post<SolicitacaoOficial>(
      `${environment.apiUrl}/solicitacoes-oficiais/${id}/aprovar`,
      { resposta: resposta ?? null },
      { withCredentials: true }
    );
  }

  rejeitar(
    id: string,
    resposta?: string
  ): Observable<SolicitacaoOficial> {
    return this.http.post<SolicitacaoOficial>(
      `${environment.apiUrl}/solicitacoes-oficiais/${id}/rejeitar`,
      { resposta: resposta ?? null },
      { withCredentials: true }
    );
  }
}