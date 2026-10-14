import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CriarUnidadeRequest,
  UnidadeCriadaResponse,
  UnidadeResumo
} from '../models/unidade.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UnidadeService {

  constructor(private http: HttpClient) {}

  criar(
    payload: CriarUnidadeRequest
  ): Observable<UnidadeCriadaResponse> {
    return this.http.post<UnidadeCriadaResponse>(
      `${environment.apiUrl}/unidades`,
      {
        tipoCodigo: payload.tipoCodigo,
        nome: payload.nome.trim(),
        nomeReduzido: payload.nomeReduzido?.trim() || null,
        cidade: payload.cidade?.trim() || null,
        estadoRegiao: payload.estadoRegiao?.trim() || null,
        paisCodigo: payload.paisCodigo || 'BR',
        dataConstituicao: payload.dataConstituicao || null,
        unidadeSuperiorId: payload.unidadeSuperiorId || null,
        observacao: payload.observacao?.trim() || null
      },
      { withCredentials: true }
    );
  }

  listar(
    tipo?: string | null
  ): Observable<UnidadeResumo[]> {
    let params = new HttpParams();

    if (tipo) {
      params = params.set('tipo', tipo);
    }

    return this.http.get<UnidadeResumo[]>(
      `${environment.apiUrl}/unidades`,
      {
        params,
        withCredentials: true
      }
    );
  }
}