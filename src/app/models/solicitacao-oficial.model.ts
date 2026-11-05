export type OrigemOficial = 'MEMBRO_EXISTENTE' | 'PESSOA_NOVA';

export type StatusSolicitacao =
  | 'PENDENTE'
  | 'APROVADA'
  | 'REJEITADA'
  | 'CANCELADA';

export interface SolicitacaoOficial {
  id: string;
  origem: OrigemOficial;
  status: StatusSolicitacao;

  membroId: string | null;
  pessoaId: string | null;

  nome: string;
  nomePreferido: string | null;
  cpf: string | null;
  email: string | null;
  celular: string | null;
  telefone: string | null;
  dataNascimento: string | null;

  unidadeId: string;
  unidadeNome: string;
  unidadeTipo: string;
  cidade: string | null;
  estadoRegiao: string | null;

  cargoId: number;
  cargoCodigo: string;
  cargoNome: string;

  numeroMandato: number | null;
  dataInicio: string;
  dataFim: string | null;

  justificativa: string | null;
  resposta: string | null;

  solicitanteNome: string | null;
  solicitadoEm: string;
  analisadorNome: string | null;
  analisadoEm: string | null;
}

export interface ResumoOficialPendente {
  pendentes: number;
  aprovadas: number;
  rejeitadas: number;
  canceladas: number;
}

export interface MembroEncontrado {
  membroId: string;
  nome: string;
  nomePreferido: string | null;
  cpf: string | null;
  email: string | null;
  celular: string | null;
  jaEhOficial: boolean;
}

export interface UnidadeOpcao {
  id: string;
  nome: string;
  tipo: string;
  cidade: string | null;
}

export interface CargoOpcao {
  id: number;
  codigo: string;
  nome: string;
}

export interface CatalogosOficial {
  unidades: UnidadeOpcao[];
  cargos: CargoOpcao[];
}

export interface CriarSolicitacaoOficial {
  origem: OrigemOficial;

  membroId?: string | null;

  pessoaNome?: string | null;
  pessoaNomePreferido?: string | null;
  pessoaCpf?: string | null;
  pessoaDataNascimento?: string | null;
  pessoaEmail?: string | null;
  pessoaCelular?: string | null;
  pessoaTelefone?: string | null;

  dtIngresso?: string | null;
  dtCompromisso?: string | null;
  pretoriano?: boolean;
  adjutor?: boolean;
  mesc?: boolean;
  catequista?: boolean;
  coroinha?: boolean;

  unidadeId: string;
  cargoId: number;
  numeroMandato?: number | null;
  dataInicio: string;
  dataFim?: string | null;

  justificativa?: string | null;
}

export interface FiltrosSolicitacaoOficial {
  status?: string;
  unidadeId?: string;
  busca?: string;
}