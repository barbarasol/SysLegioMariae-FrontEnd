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
  MembroEdicao,
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

  obterParaEdicao(id: string, unidadeId?: string | null): Observable<MembroEdicao> {
    const params = unidadeId ? new HttpParams().set('unidadeId', unidadeId) : undefined;
    return this.http.get<MembroEdicao>(
      `${environment.apiUrl}/membros/${encodeURIComponent(id)}`, { params, withCredentials: true }
    );
  }

  atualizarMembro(id: string, dados: MembroEdicao): Observable<MembroEdicao> {
    return this.http.patch<MembroEdicao>(
      `${environment.apiUrl}/membros/${encodeURIComponent(id)}`,
      {
        vinculoId: dados.vinculoId, unidadeId: dados.unidadeId,
        nome: dados.nome, nomePreferido: dados.nomePreferido,
        cpf: dados.cpf, rg: dados.rg, dataNascimento: dados.dataNascimento,
        email: dados.email, celular: dados.celular, telefone: dados.telefone,
        dtRecrutamento: dados.dtRecrutamento, dtIngresso: dados.dtIngresso,
        dtCompromisso: dados.dtCompromisso, formacaoEscolar: dados.formacaoEscolar,
        aposentado: dados.aposentado, pretoriano: dados.pretoriano,
        adjutor: dados.adjutor, mesc: dados.mesc, catequista: dados.catequista,
        coroinha: dados.coroinha, status: dados.status, observacao: dados.observacao,
        categoriaCodigo: dados.categoriaCodigo, cargoCodigo: dados.cargoCodigo,
        numeroMandato: dados.numeroMandato, principal: dados.principal,
        dataInicio: dados.dataInicio
      }, { withCredentials: true }
    );
  }

  meuCadastro(): Observable<MeuCadastroMembro> {
    return this.http.get<MeuCadastroMembro>(
      `${environment.apiUrl}/membros/me`,
      { withCredentials: true }
    );
  }

  atualizarMeuCadastro(payload: AtualizarMeuCadastroInput): Observable<MeuCadastroMembro> {
    return this.http.patch<MeuCadastroMembro>(
      `${environment.apiUrl}/membros/me`,
      payload,
      { withCredentials: true }
    );
  }


  listarPendentes(unidadeId?: string): Observable<MembroPendenteValidacao[]> {
    const params = unidadeId ? new HttpParams().set('unidadeId', unidadeId) : undefined;
    return this.http.get<MembroPendenteValidacao[]>(
      `${environment.apiUrl}/membros/pendentes`, { params, withCredentials: true }
    );
  }

  validarPendente(usuarioId: string, categoriaCodigo: string): Observable<MembroValidadoResponse> {
    return this.http.post<MembroValidadoResponse>(
      `${environment.apiUrl}/membros/pendentes/${encodeURIComponent(usuarioId)}/validar`,
      { categoriaCodigo }, { withCredentials: true }
    );
  }
}

export interface MembroPendenteValidacao {
  usuarioId: string;
  pessoaId: string;
  membroId: string | null;
  nome: string;
  nomePreferido: string | null;
  cpf: string | null;
  email: string | null;
  celular: string | null;
  formacaoEscolar: string | null;
  aposentado: boolean;
  unidadeId: string;
  unidadeNome: string;
  autorizadoEm: string | null;
}

export interface MembroValidadoResponse {
  membroId: string;
  unidadeId: string;
  categoriaCodigo: string;
  status: 'ATIVO';
}

/** Dados que o usuário com perfil MEMBRO pode consultar do próprio cadastro. */
export interface MeuCadastroMembro {
  id: string;
  nome: string;
  nomePreferido: string | null;
  cpf: string | null;
  rg: string | null;
  dataNascimento: string | null;
  email: string | null;
  celular: string | null;
  telefone: string | null;
  formacaoEscolar: string | null;
  aposentado: boolean;
  status: string;
  categoria: string | null;
  unidadeNome: string | null;
  cargoNome: string | null;
  dtIngresso: string | null;
  dtCompromisso: string | null;
  pretoriano: boolean;
  adjutor: boolean;
  mesc: boolean;
  catequista: boolean;
  coroinha: boolean;
}

export type AtualizarMeuCadastroInput = Pick<
  MeuCadastroMembro,
  'nome' | 'nomePreferido' | 'rg' | 'dataNascimento' |
  'email' | 'celular' | 'telefone' | 'formacaoEscolar' | 'aposentado'
>;
