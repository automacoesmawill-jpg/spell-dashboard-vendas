// Define o formato de uma venda dentro do sistema
export interface Venda {
  id: string;                    // UUID gerado pelo Supabase
  data_entrada: string;          // Data no formato YYYY-MM-DD
  vendedor: string;              // Nome do vendedor
  valor_venda: number;           // Valor numérico da venda
  created_at: string;            // Data/hora de inserção
}

// Formato bruto vindo do Google Sheets (CSV)
export interface VendaBruta {
  'DATA DE ENTRADA': string;     // Texto no formato DD/MM/AAAA
  'VENDEDOR': string;            // Nome do vendedor
  'VALOR VENDA': string;         // Texto no formato R$0.000,00
}

// Dados agregados por vendedor
export interface RankingVendedor {
  nome: string;                  // Nome do vendedor
  total: number;                 // Soma das vendas
  meta: number;                  // Meta a atingir
  percentual: number;            // Percentual de atingimento
}
