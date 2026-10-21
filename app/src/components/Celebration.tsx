'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationProps {
  vendedor: string;
  onClose: () => void;
}

export function Celebration({ vendedor, onClose }: CelebrationProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Dispara confete nas bordas da tela
    const duration = 3000;
    const end = Date.now() + duration;
    
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00f0ff', '#ff00aa', '#ffe600'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00f0ff', '#ff00aa', '#ffe600'],
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
    
    // Toca som de comemoração
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    
    // Fecha popup automaticamente após 5 segundos
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <audio ref={audioRef} src="/sounds/celebration.mp3" />
      <div className="text-center p-12 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/20 shadow-2xl animate-bounce">
        <h2 className="text-5xl font-bold text-white mb-4">
          🎉 MAIS UMA VENDA! 🎉
        </h2>
        <p className="text-3xl text-cyan-300">
          É UM PASSO A MAIS PRA META
        </p>
        <p className="text-4xl font-black text-white mt-6">
          PARABÉNS, {vendedor.toUpperCase()}!
        </p>
      </div>
    </div>
  );
}
