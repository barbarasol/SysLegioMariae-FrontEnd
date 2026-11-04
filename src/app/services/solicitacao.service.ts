import { catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import type { UnidadeDetalhe, UnidadeEstrutura, IgrejaOpcao } from './cadastro-unidade.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ResumoStatus,
  SolicitacaoUnidade,
  SolicitacaoDetalhe
} from '../models/solicitacao.model';

@Injectable({
  providedIn: 'root'
})
export class SolicitacaoService {

  constructor(private http: HttpClient) {}

  /** SYSLEGIOMARIAE_V313: solicitações formais + cadastros anteriores, sem alterar o banco. */
  listar(status?: string | null, tipo?: string | null): Observable<SolicitacaoUnidade[]> {
    return forkJoin({
      oficiais: this.http.get<SolicitacaoUnidade[]>(
        `${environment.apiUrl}/solicitacoes-unidades`, { withCredentials: true }
      ),
      estrutura: this.http.get<UnidadeEstrutura[]>(
        `${environment.apiUrl}/unidades/estrutura`, { withCredentials: true }
      )
    }).pipe(
      map(({ oficiais, estrutura }) => {
        const idsOficiais = new Set(oficiais.map(s => String(s.unidadeId)));
        const antigos: SolicitacaoUnidade[] = estrutura
          .filter(u => !idsOficiais.has(String(u.id)))
          .map(u => ({
            id: `UNIDADE:${u.id}`,
            unidadeId: String(u.id),
            unidadeNome: u.nome,
            unidadeTipo: u.tipo,
            unidadeCidade: u.cidade,
            unidadeEstado: u.estadoRegiao,
            unidadeSuperior: u.unidadeSuperiorNome,
            status: (u.statusAprovacao || 'SEM_STATUS') as SolicitacaoUnidade['status'],
            justificativa: null,
            solicitadoEm: '',
            analisadoEm: null,
            solicitanteNome: null,
            solicitanteEmail: null,
            cadastroAnterior: true
          }));
        const items = [...oficiais, ...antigos];
        const st = (status ?? '').trim().toUpperCase();
        const tp = (tipo ?? '').trim().toUpperCase();
        return items.filter(s =>
          (!st || st === 'TODOS' || s.status === st) &&
          (!tp || tp === 'TODOS' || s.unidadeTipo.toUpperCase() === tp)
        );
      })
    );
  }

  /** Consulta uma solicitação real, junto aos dados da unidade vinculada. */
  /** Em cadastros anteriores, consulta a unidade real (sem forjar solicitante e datas). */
  obterDetalhe(id: string): Observable<SolicitacaoDetalhe> {
    if (!id.startsWith('UNIDADE:')) {
      return this.http.get<SolicitacaoDetalhe>(
        `${environment.apiUrl}/solicitacoes-unidades/${encodeURIComponent(id)}`,
        { withCredentials: true }
      );
    }
    const unidadeId = id.slice('UNIDADE:'.length);
    if (!/^\d+$/.test(unidadeId)) {
      return throwError(() => new Error('Identificador de unidade inválido.'));
    }
    return forkJoin({
      dados: this.http.get<UnidadeDetalhe>(
        `${environment.apiUrl}/unidades/${encodeURIComponent(unidadeId)}`,
        { withCredentials: true }
      ),
      estrutura: this.http.get<UnidadeEstrutura[]>(
        `${environment.apiUrl}/unidades/estrutura`, { withCredentials: true }
      )
    }).pipe(
      switchMap(({ dados, estrutura }) => {
        const unidade = estrutura.find(u => String(u.id) === unidadeId);
        // Igreja cadastrada: consultar pelo município, não inventar informação.
        const igrejas$ = dados.municipioId
          ? this.http.get<IgrejaOpcao[]>(
              `${environment.apiUrl}/unidades/igrejas`,
              { params: new HttpParams().set('municipioId', String(dados.municipioId)), withCredentials: true }
            ).pipe(catchError(() => of([] as IgrejaOpcao[])))
          : of([] as IgrejaOpcao[]);
        return igrejas$.pipe(map((igrejas): SolicitacaoDetalhe => ({
          id,
          unidadeId,
          cadastroAnterior: true,
          status: (dados.statusAprovacao || 'SEM_STATUS') as SolicitacaoDetalhe['status'],
          statusUnidade: dados.statusAprovacao,
          unidadeNome: dados.nome,
          nomeReduzido: dados.nomeReduzido,
          unidadeTipo: dados.tipoCodigo,
          unidadeCidade: unidade?.cidade ?? null,
          unidadeEstado: unidade?.estadoRegiao ?? null,
          unidadeSuperior: unidade?.unidadeSuperiorNome ?? null,
          dataFundacao: dados.dataConstituicao,
          dataElevacao: (dados as UnidadeDetalhe & {dataElevacao?:string|null}).dataElevacao ?? null,
          codigoPostal: dados.codigoPostal,
          municipioNome: unidade?.cidade ?? null,
          ufNome: unidade?.estadoRegiao ?? null,
          paisNome: null,
          subdivisaoNome: null,
          igrejaNome: igrejas.find(i => String(i.id) === String(dados.igrejaId))?.nome ?? null,
          logradouro: null,
          numeroLogradouro: null,
          complemento: null,
          bairro: null,
          email: dados.email,
          celular: dados.celular,
          telefone: dados.telefone,
          site: dados.site,
          diaReuniaoNome: null,
          horarioInicio: dados.horarioInicioReuniao,
          horarioFim: dados.horarioFimReuniao,
          fusoHorario: dados.fusoHorario,
          solicitanteNome: null,
          solicitanteEmail: null,
          solicitadoEm: '',
          analisadoEm: null,
          analisadorNome: null,
          justificativa: null,
          resposta: null,
          anexos: []
        })));
      })
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
    if (id.startsWith('UNIDADE:')) {
      return throwError(() => new Error('Não existe solicitação formal para este cadastro anterior.'));
    }
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
    if (id.startsWith('UNIDADE:')) {
      return throwError(() => new Error('Não existe solicitação formal para este cadastro anterior.'));
    }
    return this.http.post<SolicitacaoUnidade>(
      `${environment.apiUrl}/solicitacoes-unidades/${id}/rejeitar`,
      { resposta: resposta ?? null },
      { withCredentials: true }
    );
  }
}
