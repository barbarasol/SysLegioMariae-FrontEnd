import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Aniversariante,
  CargoOficial,
  FiltrosOficiais,
  Oficial,
  ResumoOficiais
} from '../models/oficial.model';

@Injectable({
  providedIn: 'root'
})
export class OficialService {

  constructor(private http: HttpClient) {}

  listar(
    filtros: FiltrosOficiais = {}
  ): Observable<Oficial[]> {
    let params = new HttpParams();

    if (filtros.busca?.trim()) {
      params = params.set('busca', filtros.busca.trim());
    }

    if (filtros.unidadeId) {
      params = params.set('unidadeId', filtros.unidadeId);
    }

    if (filtros.cargo) {
      params = params.set('cargo', filtros.cargo);
    }

    if (filtros.somenteVigentes) {
      params = params.set('vigentes', 'true');
    }

    return this.http.get<Oficial[]>(
      `${environment.apiUrl}/oficiais`,
      { params, withCredentials: true }
    );
  }

  /**
   * Sem `mes`, devolve os aniversariantes dos próximos `dias`.
   * Com `mes` (1-12), devolve todos do mês.
   */
  aniversariantes(
    mes?: number | null,
    dias?: number
  ): Observable<Aniversariante[]> {
    let params = new HttpParams();

    if (mes) {
      params = params.set('mes', String(mes));
    } else if (dias) {
      params = params.set('dias', String(dias));
    }

    return this.http.get<Aniversariante[]>(
      `${environment.apiUrl}/oficiais/aniversariantes`,
      { params, withCredentials: true }
    );
  }

  resumo(mes?: number): Observable<ResumoOficiais> {
    let params = new HttpParams();

    if (mes) {
      params = params.set('mes', String(mes));
    }

    return this.http.get<ResumoOficiais>(
      `${environment.apiUrl}/oficiais/resumo`,
      { params, withCredentials: true }
    );
  }

  cargos(): Observable<CargoOficial[]> {
    return this.http.get<CargoOficial[]>(
      `${environment.apiUrl}/oficiais/cargos`,
      { withCredentials: true }
    );
  }
}
