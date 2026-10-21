'use client';

import { useEffect, useState, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { Venda } from '@/types';
import { ProgressBar } from '@/components/ProgressBar';
import { Celebration } from '@/components/Celebration';
import { SlideContainer } from '@/components/SlideContainer';

// Metas do negócio
const META_DIA = 7000;
const META_SEMANA = 35000;
const META_TOTAL_SEMANA = 140000;

// Intervalo de sincronização com Google Sheets (5 minutos)
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export default function Dashboard() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [ultimaVenda, setUltimaVenda] = useState<Venda | null>(null);
  const [mostrarCelebracao, setMostrarCelebracao] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Ref para controlar se é o primeiro load (evita celebrar vendas antigas)
  const primeiroLoadRef = useRef(true);

  // Busca vendas iniciais
  useEffect(() => {
    fetchVendas().then(() => {
      primeiroLoadRef.current = false;
      setCarregando(false);
    });

    // Configura realtime para detectar novas vendas
    const channel = supabaseBrowser
      .channel('vendas-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vendas' },
        (payload) => {
          const novaVenda = payload.new as Venda;

          // Atualiza lista de vendas
          setVendas((prev) => [novaVenda, ...prev]);

          // Só celebra se não for o carregamento inicial
          if (!primeiroLoadRef.current) {
            setUltimaVenda(novaVenda);
            setMostrarCelebracao(true);
          }
        }
      )
      .subscribe();

    // Fallback: sincroniza com Google Sheets a cada 5 minutos
    // (substitui o cron job bloqueado no plano Hobby da Vercel)
    const syncTimer = setInterval(() => {
      fetch('/api/sync', { method: 'GET' }).catch((err) => {
        console.error('Erro ao sincronizar com Google Sheets:', err);
      });
    }, SYNC_INTERVAL_MS);

    // Força uma sincronização ao abrir o dashboard
    fetch('/api/sync', { method: 'GET' }).catch((err) => {
      console.error('Erro na sincronização inicial:', err);
    });

    return () => {
      supabaseBrowser.removeChannel(channel);
      clearInterval(syncTimer);
    };
  }, []);

  async function fetchVendas() {
    const { data, error } = await supabaseBrowser
      .from('vendas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar vendas:', error);
      return;
    }

    if (data) setVendas(data);
  }

  // Data de hoje no formato YYYY-MM-DD (fuso horário de Brasília)
  const hojeBrasilia = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'America/Sao_Paulo',
  });

  // Calcula início e fim da semana vigente (segunda a domingo)
  const hojeDate = new Date();
  const diaSemana = hojeDate.getDay(); // 0=domingo, 1=segunda...
  const diffSegunda =
    hojeDate.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
  const inicioSemana = new Date(hojeDate.setDate(diffSegunda))
    .toISOString()
    .split('T')[0];
  const fimSemana = new Date(hojeDate.setDate(hojeDate.getDate() + 6))
    .toISOString()
    .split('T')[0];

  // Filtra vendas do dia
  const vendasHoje = vendas.filter((v) => v.data_entrada === hojeBrasilia);

  // Filtra vendas da semana
  const vendasSemana = vendas.filter(
    (v) => v.data_entrada >= inicioSemana && v.data_entrada <= fimSemana
  );

  // Agrupa vendas por vendedor
  function agruparPorVendedor(lista: Venda[]) {
    const map = new Map<string, number>();
    lista.forEach((v) => {
      map.set(v.vendedor, (map.get(v.vendedor) || 0) + v.valor_venda);
    });
    return Array.from(map, ([nome, total]) => ({ nome, total }));
  }

  // Top 5 do dia
  const topDia = agruparPorVendedor(vendasHoje)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((v) => ({
      ...v,
      meta: META_DIA,
      percentual: Math.min((v.total / META_DIA) * 100, 100),
    }));

  // Top 5 da semana
  const topSemana = agruparPorVendedor(vendasSemana)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((v) => ({
      ...v,
      meta: META_SEMANA,
      percentual: Math.min((v.total / META_SEMANA) * 100, 100),
    }));

  // Total da semana
  const totalSemana = vendasSemana.reduce((acc, v) => acc + v.valor_venda, 0);

  if (carregando) {
    return (
      <main className="w-screen h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-cyan-400 mb-4">
            CARREGANDO DASHBOARD...
          </div>
          <div className="text-white/60">Buscando dados do Supabase</div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-screen h-screen bg-[#0a0a0f] text-white overflow-hidden font-sans">
      {/* Cabeçalho */}
      <header className="h-[8vh] flex items-center justify-between px-10 border-b border-white/10 bg-white/5">
        <h1 className="text-3xl font-bold tracking-wider text-cyan-400">
          DASHBOARD DE VENDAS
        </h1>
        <div className="text-xl text-white/70">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </header>

      {/* Área de slides */}
      <div className="h-[92vh] p-8">
        <SlideContainer interval={15000}>
          {/* Slide 1: Top 5 do dia */}
          <section className="h-full flex flex-col justify-center">
            <h2 className="text-4xl font-bold mb-8 text-center text-white">
              🏆 TOP 5 VENDEDORES DO DIA
            </h2>
            <p className="text-center text-white/60 mb-10 text-xl">
              Meta por vendedor: R${' '}
              {META_DIA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="space-y-8 max-w-5xl mx-auto w-full">
              {topDia.map((v, i) => (
                <div
                  key={v.nome}
                  className="bg-white/5 p-6 rounded-2xl border border-white/10"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-3xl font-black text-cyan-400">
                      #{i + 1}
                    </span>
                    <span className="text-2xl font-semibold">{v.nome}</span>
                  </div>
                  <ProgressBar valor={v.total} meta={v.meta} cor="#00f0ff" />
                </div>
              ))}
              {topDia.length === 0 && (
                <p className="text-center text-white/40 text-2xl">
                  Nenhuma venda hoje ainda.
                </p>
              )}
            </div>
          </section>

          {/* Slide 2: Top 5 da semana */}
          <section className="h-full flex flex-col justify-center">
            <h2 className="text-4xl font-bold mb-8 text-center text-white">
              📊 TOP 5 VENDEDORES DA SEMANA
            </h2>
            <p className="text-center text-white/60 mb-10 text-xl">
              Meta semanal por vendedor: R${' '}
              {META_SEMANA.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </p>
            <div className="space-y-8 max-w-5xl mx-auto w-full">
              {topSemana.map((v, i) => (
                <div
                  key={v.nome}
                  className="bg-white/5 p-6 rounded-2xl border border-white/10"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-3xl font-black text-purple-400">
                      #{i + 1}
                    </span>
                    <span className="text-2xl font-semibold">{v.nome}</span>
                  </div>
                  <ProgressBar valor={v.total} meta={v.meta} cor="#a855f7" />
                </div>
              ))}
              {topSemana.length === 0 && (
                <p className="text-center text-white/40 text-2xl">
                  Nenhuma venda na semana.
                </p>
              )}
            </div>
          </section>

          {/* Slide 3: Total da semana */}
          <section className="h-full flex flex-col justify-center items-center">
            <h2 className="text-4xl font-bold mb-8 text-center text-white">
              💰 TOTAL DE VENDAS DA SEMANA
            </h2>
            <div className="text-7xl font-black text-green-400 mb-8">
              R${' '}
              {totalSemana.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="w-full max-w-4xl">
              <ProgressBar
                valor={totalSemana}
                meta={META_TOTAL_SEMANA}
                cor="#4ade80"
              />
            </div>
            <p className="text-center text-white/60 mt-8 text-2xl">
              Meta semanal: R${' '}
              {META_TOTAL_SEMANA.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </p>
          </section>
        </SlideContainer>
      </div>

      {/* Popup de comemoração */}
      {mostrarCelebracao && ultimaVenda && (
        <Celebration
          vendedor={ultimaVenda.vendedor}
          onClose={() => setMostrarCelebracao(false)}
        />
      )}
    </main>
  );
}
