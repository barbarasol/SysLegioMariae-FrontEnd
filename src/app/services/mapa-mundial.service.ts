import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaisMapa {
  paisId: string;
  paisNome: string;
  paisSigla: string | null;
  total: number;
  tipos: Record<string, number>;
}
export interface UnidadeMapa {
  id: string;
  nome: string;
  tipoCodigo: string;
  tipoNome: string;
  unidadeSuperiorId: string | null;
  unidadeSuperiorNome: string | null;
  municipio: string;
  uf: string;
}
export interface UnidadesPaginadas {
  total: number;
  pagina: number;
  porPagina: number;
  unidades: UnidadeMapa[];
}
export interface CaminhoPais { code: string; name: string; path: string; }
export interface VetorMundo { width: number; height: number; countries: CaminhoPais[]; }
export const TIPOS_MAPA = [
  { codigo: 'CONCILIUM', nome: 'Concilium', cor: '#8B1E3F' },
  { codigo: 'SENATUS', nome: 'Senatus', cor: '#673AB7' },
  { codigo: 'REGIA', nome: 'Regiae', cor: '#2563EB' },
  { codigo: 'COMITIUM', nome: 'Comitia', cor: '#0D9488' },
  { codigo: 'CURIA', nome: 'Curiae', cor: '#16A34A' },
  { codigo: 'PRAESIDIUM', nome: 'Praesidia', cor: '#E9A23B' },
  { codigo: 'VELITE', nome: 'Velites', cor: '#EA580C' },
  { codigo: 'PATRICIOS', nome: 'Patrícios', cor: '#DB2777' },
] as const;
export function corTipo(codigo: string): string {
  const normalizado = codigo.toUpperCase();
  return TIPOS_MAPA.find(t => t.codigo === normalizado ||
    (t.codigo === 'PRAESIDIUM' && normalizado === 'PRAESIDIA') ||
    (t.codigo === 'COMITIUM' && normalizado === 'COMITIA') ||
    (t.codigo === 'CURIA' && normalizado === 'CURIAE') ||
    (t.codigo === 'VELITE' && normalizado === 'VELITES') ||
    (t.codigo === 'PATRICIOS' && ['PATRICIO','PRATICIOS','PATRICIOS'].includes(normalizado)))?.cor ?? '#64748b';
}
@Injectable({ providedIn: 'root' })
export class MapaMundialService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/mapa-mundial`;
  paises(): Observable<PaisMapa[]> {
    return this.http.get<PaisMapa[]>(`${this.base}/paises`, { withCredentials: true });
  }
  unidades(paisId: string, tipo: string, busca: string, pagina: number): Observable<UnidadesPaginadas> {
    let params = new HttpParams().set('paisId', paisId).set('pagina', pagina);
    if (tipo) params = params.set('tipo', tipo);
    if (busca.trim()) params = params.set('busca', busca.trim());
    return this.http.get<UnidadesPaginadas>(`${this.base}/unidades`, { params, withCredentials: true });
  }
  opcoesUnidades(paisId: string, tipo: string): Observable<UnidadeMapa[]> {
    let params = new HttpParams().set('paisId', paisId);
    if (tipo) params = params.set('tipo', tipo);
    return this.http.get<UnidadeMapa[]>(`${this.base}/opcoes`, { params, withCredentials: true });
  }
  vetor(): Observable<VetorMundo> {
    return this.http.get<VetorMundo>('/assets/mapas/world-mill.json');
  }
}
