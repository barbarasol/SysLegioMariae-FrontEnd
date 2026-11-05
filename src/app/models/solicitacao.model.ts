export type SolicitacaoStatus =
  | 'PENDENTE'
  | 'APROVADA'
  | 'REJEITADA'
  | 'CANCELADA';

export interface SolicitacaoUnidade {
  /** Registro antigo sem processo na tabela solicitacao_unidade. */
  cadastroAnterior?: boolean;
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

/** Documento associado à solicitação/unidade, retornado apenas se existir. */
export interface AnexoSolicitacao {
  id: string;
  nome: string;
  url: string;
}

/** Dados completos da solicitação e da unidade para a tela Visualizar. */
export interface SolicitacaoDetalhe extends SolicitacaoUnidade {
  resposta: string | null;
  analisadorNome: string | null;
  nomeReduzido: string | null;
  statusUnidade: string;
  dataFundacao: string | null;
  dataElevacao: string | null;
  codigoPostal: string | null;
  logradouro: string | null;
  numeroLogradouro: string | null;
  complemento: string | null;
  bairro: string | null;
  municipioNome: string | null;
  ufNome: string | null;
  paisNome: string | null;
  subdivisaoNome: string | null;
  igrejaNome: string | null;
  email: string | null;
  celular: string | null;
  telefone: string | null;
  site: string | null;
  diaReuniaoNome: string | null;
  horarioInicio: string | null;
  horarioFim: string | null;
  fusoHorario: string | null;
  anexos: AnexoSolicitacao[];
}
