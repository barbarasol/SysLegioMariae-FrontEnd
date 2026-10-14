import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ResumoStatus,
  SolicitacaoUnidade
} from '../models/solicitacao.model';

@Injectable({
  providedIn: 'root'
})
export class SolicitacaoService {

  constructor(private http: HttpClient) {}

  listar(
    status?: string | null,
    tipo?: string | null
  ): Observable<SolicitacaoUnidade[]> {
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    if (tipo) {
      params = params.set('tipo', tipo);
    }

    return this.http.get<SolicitacaoUnidade[]>(
      `${environment.apiUrl}/solicitacoes-unidades`,
      {
        params,
        withCredentials: true
      }
    );
  }

  resumo(): Observable<ResumoStatus> {
    return this.http.get<ResumoStatus>(
      `${environment.apiUrl}/solicitacoes-unidades/resumo`,
      { withCredentials: true }
    );
  }

  aprovar(
    id: string,
    resposta?: string | null
  ): Observable<SolicitacaoUnidade> {
    return this.http.post<SolicitacaoUnidade>(
      `${environment.apiUrl}/solicitacoes-unidades/${id}/aprovar`,
      { resposta: resposta ?? null },
      { withCredentials: true }
    );
  }

  rejeitar(
    id: string,
    resposta?: string | null
  ): Observable<SolicitacaoUnidade> {
    return this.http.post<SolicitacaoUnidade>(
      `${environment.apiUrl}/solicitacoes-unidades/${id}/rejeitar`,
      { resposta: resposta ?? null },
      { withCredentials: true }
    );
  }
}