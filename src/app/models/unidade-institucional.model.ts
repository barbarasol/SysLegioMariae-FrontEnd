export interface DadosInstitucionais {
  unidade_id: string;
  nome: string;
  num_ult_ata: number | null;
  num_ult_relatorio: number | null;
  dt_apresentacao_ult_relatorio: string | null;
  dt_ultimo_congresso: string | null;
}
export type AtualizarDadosInstitucionais = Omit<DadosInstitucionais,'unidade_id'|'nome'>;
export function dadosVazios(): AtualizarDadosInstitucionais {
  return { num_ult_ata: null, num_ult_relatorio: null, dt_apresentacao_ult_relatorio: null, dt_ultimo_congresso: null };
}
