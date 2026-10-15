export type MembroStatus = 'ATIVO' | 'INATIVO' | 'FALECIDO';

export interface MembroListado {
  id: string;
  nome: string;
  nomePreferido: string | null;
  cpf: string | null;
  email: string | null;
  celular: string | null;
  status: MembroStatus;

  /** Categoria do vínculo principal. */
  categoria: string | null;
  categoriaNome: string | null;

  /** Unidade do vínculo principal. */
  unidadeId: string | null;
  unidadeNome: string | null;
  unidadeTipo: string | null;

  /** Cargo ativo na unidade, quando houver. */
  cargo: string | null;
  cargoNome: string | null;

  dtIngresso: string | null;
  dtCompromisso: string | null;

  pretoriano: boolean;
  adjutor: boolean;
  mesc: boolean;
  catequista: boolean;
  coroinha: boolean;

  totalUnidades: number;
}

export interface ResumoMembros {
  total: number;
  ativos: number;
  inativos: number;
  falecidos: number;
}

export interface FiltrosMembros {
  busca?: string | null;
  status?: string | null;
  unidadeId?: string | null;
  categoriaCodigo?: string | null;
}

export interface CriarMembroRequest {
  // Dados pessoais
  nome: string;
  nomePreferido?: string | null;
  cpf?: string | null;
  rg?: string | null;
  dataNascimento?: string | null;
  email?: string | null;
  celular?: string | null;
  telefone?: string | null;

  // Dados legionários
  dtRecrutamento?: string | null;
  dtIngresso?: string | null;
  dtCompromisso?: string | null;
  formacaoEscolar?: string | null;
  aposentado?: boolean;
  pretoriano?: boolean;
  adjutor?: boolean;
  mesc?: boolean;
  catequista?: boolean;
  coroinha?: boolean;
  status?: MembroStatus;
  observacao?: string | null;

  // Estrutura
  unidadeId: string;
  categoriaCodigo: string;
  principal?: boolean;
  dataInicio?: string | null;

  // Cargo (opcional)
  cargoCodigo?: string | null;
  numeroMandato?: number | null;
}

export interface MembroCriadoResponse {
  membro: {
    id: string;
    status: string;
  };
  pessoa: {
    id: string;
    nome: string;
  };
  unidade: {
    id: string;
    nome: string;
  };
  categoria: string;
  cargo: string | null;
}

export interface CategoriaMembro {
  codigo: string;
  nome: string;
}

export interface CargoLegionario {
  codigo: string;
  nome: string;
  ehOficial: boolean;
}

export interface UnidadeCatalogo {
  id: string;
  nome: string;
  tipo: string;
  cidade: string | null;
  estadoRegiao: string | null;
}

export interface CatalogosMembro {
  categorias: CategoriaMembro[];
  cargos: CargoLegionario[];
  unidades: UnidadeCatalogo[];
}