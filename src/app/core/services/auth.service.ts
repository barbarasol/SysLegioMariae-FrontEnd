import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize, Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  TokenResponse,
  UsuarioContexto
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly ACCESS_TOKEN_KEY = 'legio-access-token';
  private readonly ACCESS_TOKEN_EXPIRES_KEY = 'legio-access-token-expires';
  private readonly CONTEXT_KEY = 'legio-user-context';

  constructor(private http: HttpClient) {}

  login(email: string, senha: string): Observable<UsuarioContexto> {
    const payload: LoginRequest = {
      email: email.trim().toLowerCase(),
      senha
    };

    return this.http.post<TokenResponse>(
      `${environment.apiUrl}/auth/login`,
      payload,
      { withCredentials: true }
    ).pipe(
      tap((response) => this.salvarToken(response)),
      switchMap(() => this.me()),
      tap((contexto) => this.salvarContexto(contexto))
    );
  }

  me(): Observable<UsuarioContexto> {
    return this.http.get<UsuarioContexto>(
      `${environment.apiUrl}/auth/me`,
      { withCredentials: true }
    );
  }

  refresh(): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(
      `${environment.apiUrl}/auth/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      tap((response) => this.salvarToken(response))
    );
  }

  logout(): void {
    this.http.post(
      `${environment.apiUrl}/auth/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      finalize(() => this.clearSession())
    ).subscribe({
      error: () => {
        // A sessão local é removida pelo finalize mesmo se o backend estiver indisponível.
      }
    });
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const expiraEm = Number(
      localStorage.getItem(this.ACCESS_TOKEN_EXPIRES_KEY) ?? 0
    );

    return !!token && expiraEm > Date.now() + 5000;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getContexto(): UsuarioContexto | null {
    const contexto = localStorage.getItem(this.CONTEXT_KEY);

    if (!contexto) {
      return null;
    }

    try {
      return JSON.parse(contexto) as UsuarioContexto;
    } catch {
      return null;
    }
  }

  /**
   * Mantém compatibilidade com componentes já existentes,
   * como a Home, que esperam usuario.nome e usuario.funcao.
   */
  getUser() {
    const contexto = this.getContexto();

    if (!contexto) {
      return null;
    }

    const perfilUnidade = contexto.unidades
      .flatMap((unidade) => unidade.perfis)
      .at(0);

    return {
      id: contexto.usuario.id,
      nome: contexto.pessoa.nomePreferido || contexto.pessoa.nome,
      email: contexto.usuario.email,
      funcao: contexto.perfisGlobais.at(0) || perfilUnidade || 'Usuário',
      contexto
    };
  }

  clearSession(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.ACCESS_TOKEN_EXPIRES_KEY);
    localStorage.removeItem(this.CONTEXT_KEY);
  }

  salvarContexto(contexto: UsuarioContexto): void {
    localStorage.setItem(
      this.CONTEXT_KEY,
      JSON.stringify(contexto)
    );
  }

  private salvarToken(response: TokenResponse): void {
    localStorage.setItem(
      this.ACCESS_TOKEN_KEY,
      response.accessToken
    );

    localStorage.setItem(
      this.ACCESS_TOKEN_EXPIRES_KEY,
      String(Date.now() + response.expiresIn * 1000)
    );
  }
}
