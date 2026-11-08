import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AtualizarDadosInstitucionais, DadosInstitucionais } from '../models/unidade-institucional.model';

@Injectable({ providedIn: 'root' })
export class UnidadeInstitucionalService {
  private readonly url = `${environment.apiUrl}/unidade-institucional`;
  private readonly options = { withCredentials: true };
  constructor(private readonly http: HttpClient) {}
  obter(unidadeId: string): Observable<{dados: DadosInstitucionais; permissoes: {editar: boolean}}> {
    return this.http.get<{dados: DadosInstitucionais; permissoes: {editar: boolean}}>(
      `${this.url}/${encodeURIComponent(unidadeId)}`, this.options
    );
  }
  salvar(unidadeId: string, dados: AtualizarDadosInstitucionais): Observable<{dados: DadosInstitucionais}> {
    return this.http.put<{dados: DadosInstitucionais}>(
      `${this.url}/${encodeURIComponent(unidadeId)}`, dados, this.options
    );
  }
}
