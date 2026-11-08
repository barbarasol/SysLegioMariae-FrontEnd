export interface RegistroVisita {
  id: string;
  unidade_id: string;
  ano: number;
  data_visita: string;
  visitantes: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  usu_inc_id: string | null;
  usu_alt_id: string | null;
}
export interface FormVisita {
  data_visita: string;
  visitantes: string;
  observacoes: string;
}
export function visitaVazia(): FormVisita {
  return { data_visita: '', visitantes: '', observacoes: '' };
}
