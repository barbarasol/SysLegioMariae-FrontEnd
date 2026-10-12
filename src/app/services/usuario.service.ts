import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CriarUsuarioRequest,
  UsuarioCriadoResponse
} from '../models/usuario.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor(private http: HttpClient) {}

  criar(
    payload: CriarUsuarioRequest
  ): Observable<UsuarioCriadoResponse> {
    return this.http.post<UsuarioCriadoResponse>(
      `${environment.apiUrl}/usuarios`,
      {
        nome: payload.nome.trim(),
        email: payload.email.trim().toLowerCase(),
        senha: payload.senha,
        nomePreferido: payload.nomePreferido?.trim() || null,
        cpf: payload.cpf?.trim() || null,
        celular: payload.celular?.trim() || null,
        perfilCodigo: payload.perfilCodigo
      },
      { withCredentials: true }
    );
  }
}

/**
 * Extrai a mensagem devolvida pelo backend (errorMiddleware
 * responde sempre no formato { message }), com um fallback.
 */
export function mensagemDeErro(
  error: HttpErrorResponse,
  fallback: string
): string {
  return error.error?.message || fallback;
}
