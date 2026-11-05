export interface Oficial {
  id: string;
  membroId: string;
  pessoaId: string;

  nome: string;
  nomePreferido: string | null;
  cpf: string | null;
  rg: string | null;
  email: string | null;
  celular: string | null;
  telefone: string | null;

  dataNascimento: string | null;
  diaAniversario: number | null;
  mesAniversario: number | null;
  idade: number | null;

  cargo: string;
  cargoNome: string;
  ordemCargo: number | null;

  unidadeId: string;
  unidadeNome: string;
  unidadeTipo: string;
  cidade: string | null;
  estadoRegiao: string | null;

  numeroMandato: number | null;
  dataInicio: string;
  dataFim: string | null;
  /** Meses completos desde o início do mandato. */
  mesesMandato: number | null;
  /** Fim previsto: 12 meses após o início. */
  fimPrevisto: string | null;
  mandatoVigente: boolean;

  status: string;
}

export interface Aniversariante {
  oficialId: string;
  nome: string;
  nomePreferido: string | null;
  celular: string | null;
  telefone: string | null;
  email: string | null;
  cargoNome: string;
  unidadeNome: string;
  unidadeTipo: string;
  dataNascimento: string;
  dia: number;
  mes: number;
  idadeCompleta: number;
  diasAte: number;
}

export interface ResumoOficiais {
  total: number;
  totalCargos: number;
  porCargo: Array<{
    cargo: string;
    cargoNome: string;
    total: number;
  }>;
  aniversariantesMes: number;
}

export interface CargoOficial {
  codigo: string;
  nome: string;
}

export interface FiltrosOficiais {
  busca?: string | null;
  unidadeId?: string | null;
  cargo?: string | null;
  somenteVigentes?: boolean;
}

/** Nome do mês em português, para o calendário. */
export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];