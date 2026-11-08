import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PermissoesNumerosUnidade, RegistroNumerosUnidade,
  ValoresNumerosUnidade
} from '../models/unidade-numeros.model';

@Injectable({ providedIn: 'root' })
export class UnidadeNumerosService {
  private readonly url = `${environment.apiUrl}/unidade-numeros`;
  private readonly options = { withCredentials: true };

  constructor(private http: HttpClient) {}

  private urlCompetencia(unidadeId: string, ano: number, mes: number): string {
    return `${this.url}/${encodeURIComponent(unidadeId)}/${ano}/${mes}`;
  }

  obter(unidadeId: string, ano: number, mes: number): Observable<{
    registro: RegistroNumerosUnidade | null;
    permissoes: PermissoesNumerosUnidade;
  }> {
    return this.http.get<{
      registro: RegistroNumerosUnidade | null;
      permissoes: PermissoesNumerosUnidade;
    }>(this.urlCompetencia(unidadeId, ano, mes), this.options);
  }

  listarHistorico(unidadeId: string, ano?: number): Observable<{
    registros: RegistroNumerosUnidade[];
  }> {
    const params = ano ? new HttpParams().set('ano', String(ano)) : undefined;
    return this.http.get<{ registros: RegistroNumerosUnidade[] }>(
      `${this.url}/${encodeURIComponent(unidadeId)}`,
      { withCredentials: true, params }
    );
  }

  salvar(unidadeId: string, ano: number, mes: number, valores: ValoresNumerosUnidade): Observable<{
    registro: RegistroNumerosUnidade;
  }> {
    return this.http.put<{ registro: RegistroNumerosUnidade }>(
      this.urlCompetencia(unidadeId, ano, mes), { valores }, this.options
    );
  }

  confirmar(unidadeId: string, ano: number, mes: number): Observable<{ registro: RegistroNumerosUnidade }> {
    return this.http.post<{ registro: RegistroNumerosUnidade }>(
      `${this.urlCompetencia(unidadeId, ano, mes)}/confirmar`, {}, this.options
    );
  }

  reabrir(unidadeId: string, ano: number, mes: number): Observable<{ registro: RegistroNumerosUnidade }> {
    return this.http.post<{ registro: RegistroNumerosUnidade }>(
      `${this.urlCompetencia(unidadeId, ano, mes)}/reabrir`, {}, this.options
    );
  }

  copiarAnterior(unidadeId: string, ano: number, mes: number): Observable<{ registro: RegistroNumerosUnidade }> {
    return this.http.post<{ registro: RegistroNumerosUnidade }>(
      `${this.urlCompetencia(unidadeId, ano, mes)}/copiar-anterior`, {}, this.options
    );
  }
}
