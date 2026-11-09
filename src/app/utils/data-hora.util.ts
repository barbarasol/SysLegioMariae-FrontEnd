/**
 * Formata instantes UTC/ISO 8601 no fuso HORÁRIO do dispositivo do usuário.
 * Ex.: 2026-11-09T20:15:00.000Z => 09/11/2026 17:15:00 em Brasília.
 *
 * Não passar valores SQL DATE (AAAA-MM-DD) por esta função: uma data civil
 * sem hora deve ser exibida sem qualquer conversão de fuso.
 */
export function formatarDataHoraLocal(
  valor: string | Date | null | undefined,
  fusoHorario?: string
): string {
  if (valor === null || valor === undefined || valor === '') return '—';

  // Sem offset/Z seria impossível saber a que instante o texto se refere.
  if (typeof valor === 'string' && !/(?:Z|[+-]\d{2}:\d{2})$/i.test(valor.trim())) {
    return '—';
  }
  const data = valor instanceof Date ? valor : new Date(valor);
  if (!Number.isFinite(data.getTime())) return '—';

  const formato = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
    ...(fusoHorario ? { timeZone: fusoHorario } : {})
  });
  return formato.format(data).replace(', ', ' ');
}

/** Datas DATE não possuem fuso e NÃO devem usar new Date('AAAA-MM-DD'). */
export function formatarDataCivil(valor: string | null | undefined): string {
  if (!valor) return '—';
  const texto = valor.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return '—';
  const [ano, mes, dia] = texto.split('-').map(Number);
  const verificada = new Date(Date.UTC(ano, mes - 1, dia));
  if (verificada.getUTCFullYear() !== ano || verificada.getUTCMonth() + 1 !== mes || verificada.getUTCDate() !== dia) {
    return '—';
  }
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
}
