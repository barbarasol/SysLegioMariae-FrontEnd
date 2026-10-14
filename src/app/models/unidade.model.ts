export type TipoUnidadeCodigo =
  | 'CONCILIUM'
  | 'SENATUS'
  | 'REGIA'
  | 'COMITIUM'
  | 'CURIA'
  | 'PRAESIDIUM'
  | 'PATRICIOS'
  | 'VELITE';

export interface CriarUnidadeRequest {
  tipoCodigo: TipoUnidadeCodigo;
  nome: string;
  nomeReduzido?: string | null;
  cidade?: string | null;
  estadoRegiao?: string | null;
  paisCodigo?: string | null;
  dataConstituicao?: string | null;
  unidadeSuperiorId?: string | null;
  observacao?: string | null;
}

export interface UnidadeCriadaResponse {
  id: string;
  nome: string;
  tipo: string;
  cidade: string | null;
  estadoRegiao: string | null;
  statusAprovacao: string;
}

export interface UnidadeResumo {
  id: string;
  nome: string;
  nomeReduzido: string | null;
  tipo: string;
  cidade: string | null;
  estadoRegiao: string | null;
  unidadeSuperiorId: string | null;
  statusAprovacao: string;
}