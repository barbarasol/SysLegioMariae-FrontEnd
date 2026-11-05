import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PerfilGlobalAutenticado {
  codigo: string;
  nome: string;
}

export interface UnidadeUsuarioAutenticado {
  id: string;
  nome: string;
  tipo: string;
  gestaoLiberada: boolean;
  perfis: string[];
}

export interface UsuarioAutenticado {
  usuario: {
    id: string;
    email: string;
    status: string;
  };
  pessoa: {
    id: string;
    nome: string;
    nomePreferido: string | null;
    cpf: string | null;
    celular: string | null;
  };
  membro: { id: string } | null;
  perfisGlobais: string[];
  perfisGlobaisDetalhes?: PerfilGlobalAutenticado[];
  unidades: UnidadeUsuarioAutenticado[];
}

export interface PreferenciasUsuario {
  notificacoesEmail: boolean;
  notificacoesSistema: boolean;
  modoEscuro: boolean;
}

export interface AtualizarPerfilPayload {
  nomePreferido: string | null;
  email: string;
  celular: string | null;
  senhaAtual: string | null;
}

export interface AtualizarPerfilResposta {
  usuario: UsuarioAutenticado['usuario'];
  pessoa: UsuarioAutenticado['pessoa'];
}

/** Informações fornecidas pela sessão autenticada; nunca pelo nome salvo no navegador. */
@Injectable({ providedIn: 'root' })
export class UsuarioAtualService {
  constructor(private http: HttpClient) {}

  obter(): Observable<UsuarioAutenticado> {
    return this.http.get<UsuarioAutenticado>(
      `${environment.apiUrl}/auth/me`,
      { withCredentials: true }
    );
  }

  atualizarPerfil(payload: AtualizarPerfilPayload): Observable<AtualizarPerfilResposta> {
    return this.http.put<AtualizarPerfilResposta>(
      `${environment.apiUrl}/auth/me`, payload, { withCredentials: true }
    );
  }

  alterarSenha(senhaAtual: string, novaSenha: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${environment.apiUrl}/auth/me/senha`,
      { senhaAtual, novaSenha },
      { withCredentials: true }
    );
  }

  obterPreferencias(): Observable<{ preferencias: PreferenciasUsuario }> {
    return this.http.get<{ preferencias: PreferenciasUsuario }>(
      `${environment.apiUrl}/auth/me/preferencias`, { withCredentials: true }
    );
  }

  salvarPreferencias(preferencias: PreferenciasUsuario): Observable<{ preferencias: PreferenciasUsuario }> {
    return this.http.put<{ preferencias: PreferenciasUsuario }>(
      `${environment.apiUrl}/auth/me/preferencias`, preferencias, { withCredentials: true }
    );
  }

  nomeAbreviado(contexto: UsuarioAutenticado): string {
    const nome = (
      contexto.pessoa.nomePreferido?.trim() ||
      contexto.pessoa.nome?.trim() ||
      ''
    ).replace(/\s+/g, ' ');

    if (!nome) return '';

    const partes = nome.split(' ');
    return partes.length > 1
      ? `${partes[0]} ${partes[partes.length - 1]}`
      : partes[0];
  }

  nomePerfisGlobais(contexto: UsuarioAutenticado): string {
    const nomes = (contexto.perfisGlobaisDetalhes ?? [])
      .map(perfil => perfil.nome?.trim() || perfil.codigo)
      .filter(Boolean);

    if (nomes.length > 0) return nomes.join(', ');

    const codigos = (contexto.perfisGlobais ?? []).filter(Boolean);
    return codigos.length > 0
      ? codigos.join(', ')
      : 'Sem perfil global';
  }
}
