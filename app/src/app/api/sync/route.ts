import { NextResponse } from 'next/server';
import { fetchSheetData, parseCurrency, parseDate } from '@/lib/sheets';
import { supabaseServer } from '@/lib/supabase';

// Endpoint executado pelo cron do Vercel
export async function GET() {
  try {
    // 1. Busca dados brutos do Google Sheets
    const rawData = await fetchSheetData();
    
    // 2. Transforma dados para o formato do banco
    const vendas = rawData
      .filter(row => row['DATA DE ENTRADA'] && row['VENDEDOR'] && row['VALOR VENDA'])
      .map(row => ({
        data_entrada: parseDate(row['DATA DE ENTRADA']),
        vendedor: row['VENDEDOR'].trim(),
        valor_venda: parseCurrency(row['VALOR VENDA']),
      }));
    
    // 3. Limpa tabela atual (estratégia full load para simplificar)
    await supabaseServer.from('vendas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // 4. Insere novos dados
    if (vendas.length > 0) {
      const { error } = await supabaseServer.from('vendas').insert(vendas);
      if (error) throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: `${vendas.length} vendas sincronizadas`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
