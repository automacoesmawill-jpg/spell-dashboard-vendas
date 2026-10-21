import { VendaBruta } from '@/types';

// Função que busca o CSV público do Google Sheets e converte em JSON
export async function fetchSheetData(): Promise<VendaBruta[]> {
  const url = process.env.GOOGLE_SHEETS_CSV_URL!;
  
  // Faz requisição GET para o CSV público
  const response = await fetch(url, { cache: 'no-store' });
  const csvText = await response.text();
  
  // Converte CSV em array de objetos
  const lines = csvText.trim().split('\n');
  const headers = parseLine(lines[0]); // Primeira linha = títulos
  
  const data: VendaBruta[] = [];
  
  // Percorre cada linha de dados (ignora cabeçalho)
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row as VendaBruta);
  }
  
  return data;
}

// Função auxiliar para separar colunas do CSV respeitando aspas
function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Converte texto de moeda brasileira para número
export function parseCurrency(value: string): number {
  if (!value) return 0;
  return Number(
    value
      .replace('R$', '')        // Remove o símbolo
      .replace(/\./g, '')       // Remove pontos de milhar
      .replace(',', '.')        // Converte vírgula decimal para ponto
      .trim()
  );
}

// Converte data DD/MM/AAAA para YYYY-MM-DD
export function parseDate(value: string): string {
  if (!value) return '';
  const [day, month, year] = value.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
