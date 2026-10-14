export type SolicitacaoStatus =
  | 'PENDENTE'
  | 'APROVADA'
  | 'REJEITADA'
  | 'CANCELADA';

export interface SolicitacaoUnidade {
  id: string;
  status: SolicitacaoStatus;
  justificativa: string | null;
  solicitadoEm: string;
  analisadoEm: string | null;
  unidadeId: string;
  unidadeNome: string;
  unidadeTipo: string;
  unidadeCidade: string | null;
  unidadeEstado: string | null;
  unidadeSuperior: string | null;
  solicitanteNome: string | null;
  solicitanteEmail: string | null;
}

export interface ResumoStatus {
  pendentes: number;
  aprovadas: number;
  rejeitadas: number;
}