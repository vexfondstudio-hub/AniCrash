import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Zap, Shield, Sparkles, Terminal, Layers, Play, CheckCircle2 } from 'lucide-react';

interface SiteAssemblyLoaderProps {
  onComplete: () => void;
}

const ASSEMBLY_STEPS = [
  { id: 'core', name: 'Инициализация Ядра (Spiral Core)', icon: Zap, detail: 'Загрузка квантовых матриц...' },
  { id: 'nav', name: 'Сборка Навигационного Модуля', icon: Layers, detail: 'Монтаж панелей управления...' },
  { id: 'db', name: 'Калибровка Базы Аниме', icon: Terminal, detail: 'Синхронизация каталога и серверов...' },
  { id: 'media', name: 'Интеграция Плеера и Стриминга', icon: Play, detail: 'Подключение HLS-кодеков...' },
  { id: 'ui', name: 'Запуск Интерфейса и HUD', icon: Sparkles, detail: 'Финальная сборка визуальных слоев...' },
];

export const SiteAssemblyLoader: React.FC<SiteAssemblyLoaderProps> = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    let progressTimer: any;

    // Smooth progress simulation
    progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        const next = prev + 2;
        if (next < 25) setCurrentStepIndex(0);
        else if (next < 50) setCurrentStepIndex(1);
        else if (next < 75) setCurrentStepIndex(2);
        else if (next < 92) setCurrentStepIndex(3);
        else setCurrentStepIndex(4);
        return next;
      });
    }, 30);

    timer = setTimeout(() => {
      setIsFinished(true);
      setTimeout(() => {
        onComplete();
      }, 600); // Wait for exit animation
    }, 1800);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] bg-[#090a0f] text-white flex flex-col items-center justify-center p-6 overflow-hidden select-none"
        >
          {/* Cyberpunk grid background & scanning lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-red-950/20 via-transparent to-cyan-950/20 pointer-events-none" />
          
          {/* Glowing center reactor core */}
          <div className="relative w-40 h-40 md:w-56 md:h-56 mb-8 flex items-center justify-center">
            {/* Outer rotating ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-red-500/40"
            />
            {/* Inner counter-rotating ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-3 rounded-full border border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.3)]"
            />
            {/* Core pulse */}
            <motion.div
              animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-6 rounded-full bg-gradient-to-br from-red-600/30 to-orange-500/20 blur-xl"
            />
            
            {/* Center icon / assembly part */}
            <div className="relative z-10 w-20 h-20 rounded-2xl bg-zinc-900/90 border border-red-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              {React.createElement(ASSEMBLY_STEPS[currentStepIndex]?.icon || Cpu, {
                className: 'w-10 h-10 text-red-400 animate-pulse',
              })}
            </div>

            {/* Floating mechanical detail brackets */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-red-500 shadow-[0_0_10px_#ef4444]" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          </div>

          {/* Title and Status */}
          <div className="text-center max-w-md w-full relative z-10 mb-8">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono uppercase tracking-widest mb-3"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Сборка системы [ANICRASH v3.0]
            </motion.div>
            
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Монтаж платформы
            </h1>
            <p className="text-sm font-mono text-zinc-400 h-6">
              {ASSEMBLY_STEPS[currentStepIndex]?.name || 'Сборка завершена...'}
            </p>
          </div>

          {/* Progress Bar & Details */}
          <div className="w-full max-w-md relative z-10 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 backdrop-blur-xl shadow-2xl">
            <div className="flex justify-between items-center text-xs font-mono text-zinc-400 mb-2">
              <span>ПРОГРЕСС СБОРКИ</span>
              <span className="text-red-400 font-bold">{progress}%</span>
            </div>
            
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-4 p-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* Assembly Steps checklist */}
            <div className="space-y-2 mt-4 pt-4 border-t border-zinc-800/80">
              {ASSEMBLY_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIndex || progress >= 100;
                const isCurrent = idx === currentStepIndex && progress < 100;
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between text-xs transition-colors duration-200 ${
                      isCompleted ? 'text-zinc-300' : isCurrent ? 'text-white font-medium' : 'text-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-700 bg-zinc-800" />
                      )}
                      <span>{step.name}</span>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-mono text-red-400 animate-pulse">СБОРКА...</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skip button */}
          <button
            onClick={onComplete}
            className="absolute bottom-6 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            [ ПРОПУСТИТЬ АНИМАЦИЮ ]
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
