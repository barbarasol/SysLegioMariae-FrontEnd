import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface TipoUnidadeOpcao {
  codigo: string;
  nome: string;
  ordemHierarquica: number | null;
  tiposSuperiorPermitidos: string[];
}

export interface DiaReuniaoOpcao {
  id: string;
  nome: string;
}

export interface FusoHorarioOpcao {
  nome: string;
  abreviacao: string | null;
  offsetUtc: string | null;
  horarioVerao: boolean;
}

export interface UnidadeResumoCadastro {
  id: string;
  nome: string;
  nomeReduzido: string | null;
  tipo: string;
  cidade: string | null;
  estadoRegiao: string | null;
  unidadeSuperiorId: string | null;
  statusAprovacao: string;
}

export interface IndicadoresEstrutura {
  ano: number;
  mes: number;
  status: 'CONFIRMADO' | 'RASCUNHO';
  qtd_comitia: number | null;
  qtd_curiae: number | null;
  qtd_curiae_juv: number | null;
  qtd_praesidia: number | null;
  qtd_praesidia_juv: number | null;
  qtd_velites: number | null;
  qtd_praticios: number | null;
  qtd_pretorianos: number | null;
  qtd_adjutores: number | null;
  qtd_ativos_com_promessa: number | null;
  qtd_ativos_sem_promessa: number | null;
  qtd_auxiliares_permanentes: number | null;
  qtd_auxiliares_provisorios: number | null;
  qtd_mescs: number | null;
  qtd_catequistas: number | null;
  qtd_coroinhas: number | null;
  qtd_praesidia_total: number | null;
}

export interface UnidadeEstrutura {
  id: string;
  nome: string;
  nomeReduzido: string | null;
  tipo: string;
  tipoNome: string;
  unidadeSuperiorId: string | null;
  unidadeSuperiorNome: string | null;
  cidade: string | null;
  estadoRegiao: string | null;
  ufSigla: string | null;
  subdivisaoLocalNome: string | null;
  statusAprovacao: string;
  ativo: boolean;
  numeros?: IndicadoresEstrutura | null;
}

export interface UnidadeDetalhe {
  id: string;
  tipoCodigo: string;
  nome: string;
  nomeReduzido: string | null;
  email: string | null;
  celular: string | null;
  telefone: string | null;
  site: string | null;
  municipioId: string;
  igrejaId: string;
  paisId: string;
  ufId: string;
  subdivisaoLocalId: string | null;
  codigoPostal: string | null;
  sedeEnderecoProprio: boolean;
  sedeSubdivisaoLocalId: string | null;
  sedeCodigoPostal: string | null;
  sedeLogradouro: string | null;
  sedeNumeroLogradouro: string | null;
  sedeComplemento: string | null;
  sedeBairro: string | null;
  dataConstituicao: string | null;
  dataElevacao: string | null;
  diaReuniaoId: string | null;
  horarioInicioReuniao: string | null;
  horarioFimReuniao: string | null;
  fusoHorario: string | null;
  unidadeSuperiorId: string | null;
  observacao: string | null;
  statusAprovacao: string;
  ativo: boolean;
}

export interface PaisOpcao {
  id: string;
  nome: string;
  sigla: string | null;
  sigla3: string | null;
}

export interface UfOpcao {
  id: string;
  nome: string;
  sigla: string | null;
  codigoIso: string | null;
}

export interface MunicipioOpcao {
  id: string;
  nome: string;
}

export interface SubdivisaoLocalOpcao {
  id: string;
  municipioId: string;
  nome: string;
  tipo: string | null;
  codigo: string | null;
}

export interface CodigoPostalOpcao {
  id: string;
  paisId: string;
  ufId: string | null;
  municipioId: string | null;
  subdivisaoLocalId: string | null;
  codigoPostal: string;
  tipoLogradouro: string | null;
  logradouro: string | null;
  bairro: string | null;
  localidade: string | null;
  fonte: string | null;
  municipioNome: string | null;
  ufNome: string | null;
  ufSigla: string | null;
  subdivisaoLocalNome: string | null;
  subdivisaoLocalTipo: string | null;
  subdivisaoLocalCodigo: string | null;
  paisNome: string;
  paisSigla: string | null;
}

export interface BuscarCodigoPostalResponse {
  encontrado: boolean;
  quantidade: number;
  resultados: CodigoPostalOpcao[];
}

export interface IgrejaOpcao {
  id: string;
  nome: string;
  padre: string | null;
  status: string;
  subdivisaoLocalId: string | null;
  codigoPostal: string | null;
  logradouro: string | null;
  numeroLogradouro: string | null;
  complemento: string | null;
  bairro: string | null;
  celular: string | null;
  telefone: string | null;
  telefone2: string | null;
  email: string | null;
  site: string | null;
}

export interface CriarUfRequest {
  paisId: string;
  nome: string;
  sigla?: string | null;
  codigoIso?: string | null;
}

export interface CriarMunicipioRequest {
  ufId: string;
  nome: string;
}

export interface CriarSubdivisaoLocalRequest {
  municipioId: string;
  nome: string;
  tipo?: string | null;
  codigo?: string | null;
}


export interface CriarIgrejaRequest {
  nome: string;
  padre?: string | null;
  municipioId: string;
  subdivisaoLocalId?: string | null;
  codigoPostal?: string | null;
  tipoLogradouro?: string | null;
  logradouro?: string | null;
  bairro?: string | null;
  localidade?: string | null;
  numeroLogradouro?: string | null;
  complemento?: string | null;
  celular?: string | null;
  telefone?: string | null;
  telefone2?: string | null;
  email?: string | null;
  site?: string | null;
}

export interface CriarUnidadeRequest {
  tipoCodigo: string;
  nome: string;
  nomeReduzido?: string | null;
  email?: string | null;
  celular?: string | null;
  telefone?: string | null;
  site?: string | null;
  municipioId: string;
  igrejaId: string;
  subdivisaoLocalId?: string | null;
  sedeEnderecoProprio?: boolean;
  copiarEnderecoParoquia?: boolean;
  sedeSubdivisaoLocalId?: string | null;
  sedeCodigoPostal?: string | null;
  sedeLogradouro?: string | null;
  sedeNumeroLogradouro?: string | null;
  sedeComplemento?: string | null;
  sedeBairro?: string | null;
  dataConstituicao: string;
  dataElevacao?: string | null;
  diaReuniaoId?: string | null;
  horarioInicioReuniao?: string | null;
  horarioFimReuniao?: string | null;
  fusoHorario?: string | null;
  unidadeSuperiorId?: string | null;
  observacao?: string | null;
}

export interface UnidadeCriada {
  id: string;
  nome: string;
  tipo: string;
  cidade: string | null;
  estadoRegiao: string | null;
  statusAprovacao: string;
}

@Injectable({
  providedIn: 'root'
})
export class CadastroUnidadeService {
  private readonly baseUrl = `${environment.apiUrl}/unidades`;

  constructor(private http: HttpClient) {}

  listarTipos(): Observable<TipoUnidadeOpcao[]> {
    return this.http.get<TipoUnidadeOpcao[]>(
      `${this.baseUrl}/tipos`,
      { withCredentials: true }
    );
  }

  listarDiasReuniao(
    filtro?: string
  ): Observable<DiaReuniaoOpcao[]> {
    let params = new HttpParams();

    if (filtro?.trim()) {
      params = params.set('q', filtro.trim());
    }

    return this.http.get<DiaReuniaoOpcao[]>(
      `${this.baseUrl}/dias-reuniao`,
      {
        params,
        withCredentials: true
      }
    );
  }

  listarFusosHorarios(
    filtro?: string
  ): Observable<FusoHorarioOpcao[]> {
    let params = new HttpParams();

    if (filtro?.trim()) {
      params = params.set('q', filtro.trim());
    }

    return this.http.get<FusoHorarioOpcao[]>(
      `${this.baseUrl}/fusos-horarios`,
      {
        params,
        withCredentials: true
      }
    );
  }

  listarUnidades(tipo?: string): Observable<UnidadeResumoCadastro[]> {
    let params = new HttpParams();

    if (tipo) {
      params = params.set('tipo', tipo);
    }

    return this.http.get<UnidadeResumoCadastro[]>(
      this.baseUrl,
      {
        params,
        withCredentials: true
      }
    );
  }

  listarPaises(): Observable<PaisOpcao[]> {
    return this.http.get<PaisOpcao[]>(
      `${this.baseUrl}/paises`,
      { withCredentials: true }
    );
  }

  listarUfs(
    paisId: string,
    filtro?: string
  ): Observable<UfOpcao[]> {
    let params = new HttpParams().set('paisId', paisId);

    if (filtro?.trim()) {
      params = params.set('q', filtro.trim());
    }

    return this.http.get<UfOpcao[]>(
      `${this.baseUrl}/ufs`,
      {
        params,
        withCredentials: true
      }
    );
  }

  criarUf(payload: CriarUfRequest): Observable<UfOpcao> {
    return this.http.post<UfOpcao>(
      `${this.baseUrl}/ufs`,
      payload,
      { withCredentials: true }
    );
  }

  listarMunicipios(
    ufId: string,
    filtro?: string
  ): Observable<MunicipioOpcao[]> {
    let params = new HttpParams().set('ufId', ufId);

    if (filtro?.trim()) {
      params = params.set('q', filtro.trim());
    }

    return this.http.get<MunicipioOpcao[]>(
      `${this.baseUrl}/municipios`,
      {
        params,
        withCredentials: true
      }
    );
  }

  criarMunicipio(
    payload: CriarMunicipioRequest
  ): Observable<MunicipioOpcao> {
    return this.http.post<MunicipioOpcao>(
      `${this.baseUrl}/municipios`,
      payload,
      { withCredentials: true }
    );
  }

  listarSubdivisoesLocais(
    municipioId: string,
    filtro?: string
  ): Observable<SubdivisaoLocalOpcao[]> {
    let params = new HttpParams().set(
      'municipioId',
      municipioId
    );

    if (filtro?.trim()) {
      params = params.set('q', filtro.trim());
    }

    return this.http.get<SubdivisaoLocalOpcao[]>(
      `${this.baseUrl}/subdivisoes-locais`,
      {
        params,
        withCredentials: true
      }
    );
  }

  criarSubdivisaoLocal(
    payload: CriarSubdivisaoLocalRequest
  ): Observable<SubdivisaoLocalOpcao> {
    return this.http.post<SubdivisaoLocalOpcao>(
      `${this.baseUrl}/subdivisoes-locais`,
      payload,
      { withCredentials: true }
    );
  }

  buscarCodigosPostais(
    paisId: string,
    codigoPostal: string
  ): Observable<BuscarCodigoPostalResponse> {
    const params = new HttpParams()
      .set('paisId', paisId)
      .set('codigoPostal', codigoPostal);

    return this.http.get<BuscarCodigoPostalResponse>(
      `${this.baseUrl}/codigos-postais`,
      {
        params,
        withCredentials: true
      }
    );
  }

  listarIgrejas(
    municipioId: string,
    subdivisaoLocalId?: string
  ): Observable<IgrejaOpcao[]> {
    let params = new HttpParams().set(
      'municipioId',
      municipioId
    );

    if (subdivisaoLocalId) {
      params = params.set(
        'subdivisaoLocalId',
        subdivisaoLocalId
      );
    }

    return this.http.get<IgrejaOpcao[]>(
      `${this.baseUrl}/igrejas`,
      {
        params,
        withCredentials: true
      }
    );
  }

  atualizarIgreja(id: string, payload: CriarIgrejaRequest): Observable<IgrejaOpcao> {
    return this.http.put<IgrejaOpcao>(
      `${this.baseUrl}/igrejas/${encodeURIComponent(id)}`,
      payload,
      { withCredentials: true }
    );
  }

  criarIgreja(
    payload: CriarIgrejaRequest
  ): Observable<IgrejaOpcao> {
    return this.http.post<IgrejaOpcao>(
      `${this.baseUrl}/igrejas`,
      payload,
      { withCredentials: true }
    );
  }

  criarUnidade(
    payload: CriarUnidadeRequest
  ): Observable<UnidadeCriada> {
    return this.http.post<UnidadeCriada>(
      this.baseUrl,
      payload,
      { withCredentials: true }
    );
  }

  listarEstrutura(): Observable<UnidadeEstrutura[]> {
    return this.http.get<UnidadeEstrutura[]>(
      `${this.baseUrl}/estrutura`,
      { withCredentials: true }
    );
  }

  obterUnidade(id: string): Observable<UnidadeDetalhe> {
    return this.http.get<UnidadeDetalhe>(
      `${this.baseUrl}/${id}`,
      { withCredentials: true }
    );
  }

  atualizarUnidade(
    id: string,
    payload: CriarUnidadeRequest
  ): Observable<UnidadeCriada> {
    return this.http.put<UnidadeCriada>(
      `${this.baseUrl}/${id}`,
      payload,
      { withCredentials: true }
    );
  }

  excluirUnidade(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${id}`,
      { withCredentials: true }
    );
  }

}
