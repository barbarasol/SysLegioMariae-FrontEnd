import {
  HttpClient,
  HttpErrorResponse,
  HttpParams
} from '@angular/common/http';

import {
  Injectable
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import {
  AcessoUnidade,
  AtualizarUsuarioRequest,
  CriarUsuarioRequest,
  PerfilDisponivel,
  SalvarAcessoUnidadeRequest,
  UnidadeDisponivel,
  UsuarioCriadoResponse,
  UsuarioLista
} from '../models/usuario.model';

import {
  environment
} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor(
    private http:
      HttpClient
  ) {}

  criar(
    payload:
      CriarUsuarioRequest
  ): Observable<UsuarioCriadoResponse> {

    return this.http
      .post<UsuarioCriadoResponse>(
        `${environment.apiUrl}/usuarios/cadastro`,
        {
          nome:
            payload.nome.trim(),

          email:
            payload.email
              .trim()
              .toLowerCase(),

          senha:
            payload.senha,

          nomePreferido:
            payload.nomePreferido
              ?.trim() || null,

          cpf:
            payload.cpf
              ?.trim() || null,

          celular:
            payload.celular
              ?.trim() || null
        },
        {
          withCredentials:
            true
        }
      );
  }

  listar(
    params:
      HttpParams
  ): Observable<{
    usuarios:
      UsuarioLista[];
  }> {

    return this.http
      .get<{
        usuarios:
          UsuarioLista[];
      }>(
        `${environment.apiUrl}/usuarios`,
        {
          params,
          withCredentials:
            true
        }
      );
  }

  listarPerfisGlobais():
  Observable<{
    perfis:
      PerfilDisponivel[];
  }> {

    return this.http
      .get<{
        perfis:
          PerfilDisponivel[];
      }>(
        `${environment.apiUrl}/usuarios/perfis-globais`,
        {
          withCredentials:
            true
        }
      );
  }

  listarPerfisUnidade():
  Observable<{
    perfis:
      PerfilDisponivel[];
  }> {

    return this.http
      .get<{
        perfis:
          PerfilDisponivel[];
      }>(
        `${environment.apiUrl}/usuarios/perfis-unidade`,
        {
          withCredentials:
            true
        }
      );
  }

  listarUnidadesDisponiveis():
  Observable<{
    unidades:
      UnidadeDisponivel[];
  }> {

    return this.http
      .get<{
        unidades:
          UnidadeDisponivel[];
      }>(
        `${environment.apiUrl}/usuarios/unidades-disponiveis`,
        {
          withCredentials:
            true
        }
      );
  }

  atualizar(
    usuarioId:
      string,
    payload:
      AtualizarUsuarioRequest
  ): Observable<{
    usuario:
      UsuarioLista;
  }> {

    return this.http
      .put<{
        usuario:
          UsuarioLista;
      }>(
        `${environment.apiUrl}/usuarios/${usuarioId}`,
        {
          ...payload,

          perfilCodigo:
            payload.perfilCodigo
              ?.trim() || null
        },
        {
          withCredentials:
            true
        }
      );
  }

  excluir(
    usuarioId:
      string
  ): Observable<{
    message:
      string;
  }> {

    return this.http
      .delete<{
        message:
          string;
      }>(
        `${environment.apiUrl}/usuarios/${usuarioId}`,
        {
          withCredentials:
            true
        }
      );
  }

  listarAcessosUnidade(
    usuarioId:
      string
  ): Observable<{
    acessos:
      AcessoUnidade[];
  }> {

    return this.http
      .get<{
        acessos:
          AcessoUnidade[];
      }>(
        `${environment.apiUrl}/usuarios/${usuarioId}/acessos-unidade`,
        {
          withCredentials:
            true
        }
      );
  }

  adicionarAcessoUnidade(
    usuarioId:
      string,
    payload:
      SalvarAcessoUnidadeRequest
  ): Observable<{
    acesso:
      AcessoUnidade;
  }> {

    return this.http
      .post<{
        acesso:
          AcessoUnidade;
      }>(
        `${environment.apiUrl}/usuarios/${usuarioId}/acessos-unidade`,
        payload,
        {
          withCredentials:
            true
        }
      );
  }

  alterarAcessoUnidade(
    usuarioId:
      string,
    unidadeIdAtual:
      string,
    perfilCodigoAtual:
      string,
    payload:
      SalvarAcessoUnidadeRequest
  ): Observable<{
    acesso:
      AcessoUnidade;
  }> {

    return this.http
      .put<{
        acesso:
          AcessoUnidade;
      }>(
        `${environment.apiUrl}/usuarios/${usuarioId}/acessos-unidade/${unidadeIdAtual}/${encodeURIComponent(perfilCodigoAtual)}`,
        payload,
        {
          withCredentials:
            true
        }
      );
  }

  removerAcessoUnidade(
    usuarioId:
      string,
    unidadeId:
      string,
    perfilCodigo:
      string
  ): Observable<{
    message:
      string;
  }> {

    return this.http
      .delete<{
        message:
          string;
      }>(
        `${environment.apiUrl}/usuarios/${usuarioId}/acessos-unidade/${unidadeId}/${encodeURIComponent(perfilCodigo)}`,
        {
          withCredentials:
            true
        }
      );
  }
}

export function mensagemDeErro(
  error:
    HttpErrorResponse,
  fallback:
    string
): string {

  return (
    error.error?.message ||
    fallback
  );
}
