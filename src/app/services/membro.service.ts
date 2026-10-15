import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CatalogosMembro,
  CriarMembroRequest,
  FiltrosMembros,
  MembroCriadoResponse,
  MembroListado,
  ResumoMembros
} from '../models/membro.model';

@Injectable({
  providedIn: 'root'
})
export class MembroService {

  constructor(private http: HttpClient) {}

  listar(
    filtros: FiltrosMembros = {}
  ): Observable<MembroListado[]> {
    let params = new HttpParams();

    if (filtros.busca?.trim()) {
      params = params.set('busca', filtros.busca.trim());
    }

    if (filtros.status) {
      params = params.set('status', filtros.status);
    }

    if (filtros.unidadeId) {
      params = params.set('unidadeId', filtros.unidadeId);
    }

    if (filtros.categoriaCodigo) {
      params = params.set('categoria', filtros.categoriaCodigo);
    }

    return this.http.get<MembroListado[]>(
      `${environment.apiUrl}/membros`,
      {
        params,
        withCredentials: true
      }
    );
  }

  resumo(): Observable<ResumoMembros> {
    return this.http.get<ResumoMembros>(
      `${environment.apiUrl}/membros/resumo`,
      { withCredentials: true }
    );
  }

  catalogos(): Observable<CatalogosMembro> {
    return this.http.get<CatalogosMembro>(
      `${environment.apiUrl}/membros/catalogos`,
      { withCredentials: true }
    );
  }

  criar(
    payload: CriarMembroRequest
  ): Observable<MembroCriadoResponse> {
    return this.http.post<MembroCriadoResponse>(
      `${environment.apiUrl}/membros`,
      {
        nome: payload.nome.trim(),
        nomePreferido: payload.nomePreferido?.trim() || null,
        cpf: payload.cpf?.trim() || null,
        rg: payload.rg?.trim() || null,
        dataNascimento: payload.dataNascimento || null,
        email: payload.email?.trim().toLowerCase() || null,
        celular: payload.celular?.trim() || null,
        telefone: payload.telefone?.trim() || null,

        dtRecrutamento: payload.dtRecrutamento || null,
        dtIngresso: payload.dtIngresso || null,
        dtCompromisso: payload.dtCompromisso || null,
        formacaoEscolar: payload.formacaoEscolar?.trim() || null,
        aposentado: payload.aposentado === true,
        pretoriano: payload.pretoriano === true,
        adjutor: payload.adjutor === true,
        mesc: payload.mesc === true,
        catequista: payload.catequista === true,
        coroinha: payload.coroinha === true,
        status: payload.status || 'ATIVO',
        observacao: payload.observacao?.trim() || null,

        unidadeId: payload.unidadeId,
        categoriaCodigo: payload.categoriaCodigo,
        principal: payload.principal !== false,
        dataInicio: payload.dataInicio || null,

        cargoCodigo: payload.cargoCodigo || null,
        numeroMandato: payload.numeroMandato ?? null
      },
      { withCredentials: true }
    );
  }
}