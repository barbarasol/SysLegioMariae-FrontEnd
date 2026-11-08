import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { FormVisita, RegistroVisita } from '../models/unidade-visitas.model';

@Injectable({ providedIn: 'root' })
export class UnidadeVisitasService {
  private readonly url = `${environment.apiUrl}/unidade-visitas`;
  private readonly options = { withCredentials: true };
  constructor(private readonly http: HttpClient) {}

  listar(unidadeId: string, ano: number, mes: number | null = null): Observable<{
    visitas: RegistroVisita[]; permissoes: { editar: boolean };
  }> {
    let params = new HttpParams().set('ano', String(ano));
    if (mes !== null) params = params.set('mes', String(mes));
    return this.http.get<{ visitas: RegistroVisita[]; permissoes: { editar: boolean } }>(
      `${this.url}/${encodeURIComponent(unidadeId)}`, { ...this.options, params }
    );
  }
  criar(unidadeId: string, dados: FormVisita): Observable<{ visita: RegistroVisita }> {
    return this.http.post<{ visita: RegistroVisita }>(
      `${this.url}/${encodeURIComponent(unidadeId)}`, dados, this.options
    );
  }
  atualizar(unidadeId: string, visitaId: string, dados: FormVisita): Observable<{ visita: RegistroVisita }> {
    return this.http.put<{ visita: RegistroVisita }>(
      `${this.url}/${encodeURIComponent(unidadeId)}/${encodeURIComponent(visitaId)}`, dados, this.options
    );
  }
  excluir(unidadeId: string, visitaId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.url}/${encodeURIComponent(unidadeId)}/${encodeURIComponent(visitaId)}`, this.options
    );
  }
}
