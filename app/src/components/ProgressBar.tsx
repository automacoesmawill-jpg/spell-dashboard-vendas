'use client';

import React from 'react';

interface ProgressBarProps {
  valor: number;      // Valor atual
  meta: number;       // Meta
  cor?: string;       // Cor da barra
}

export function ProgressBar({ valor, meta, cor = '#00f0ff' }: ProgressBarProps) {
  // Calcula percentual, limitando em 100% para a barra visual
  const percentual = Math.min((valor / meta) * 100, 100);
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1 text-white/80">
        <span>R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        <span>Meta: R$ {meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentual}%`, backgroundColor: cor }}
        />
      </div>
      <div className="text-right text-xs text-white/60 mt-1">
        {percentual.toFixed(1)}%
      </div>
    </div>
  );
}
