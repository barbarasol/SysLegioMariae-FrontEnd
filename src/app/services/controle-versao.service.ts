import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ControleVersao, VersaoAtualResponse } from '../models/controle-versao.model';

@Injectable({ providedIn: 'root' })
export class ControleVersaoService {
  private readonly baseUrl = `${environment.apiUrl}/controle-versao`;
  private readonly alteracoesSubject = new Subject<void>();
  readonly alteracoes$ = this.alteracoesSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  atual(): Observable<VersaoAtualResponse> {
    return this.http.get<VersaoAtualResponse>(`${this.baseUrl}/atual`, { withCredentials: true });
  }
  listar(): Observable<ControleVersao[]> {
    return this.http.get<ControleVersao[]>(this.baseUrl, { withCredentials: true });
  }
  criar(ultima_versao: string, implementacao: string | null = null): Observable<ControleVersao> {
    return this.http.post<ControleVersao>(this.baseUrl, { ultima_versao, implementacao }, { withCredentials: true });
  }
  atualizar(id: string, ultima_versao: string, implementacao: string | null = null): Observable<ControleVersao> {
    return this.http.put<ControleVersao>(`${this.baseUrl}/${encodeURIComponent(id)}`, { ultima_versao, implementacao }, { withCredentials: true });
  }
  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(id)}`, { withCredentials: true });
  }
  notificarAlteracao(): void { this.alteracoesSubject.next(); }
}
