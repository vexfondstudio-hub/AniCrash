import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Dices, Play } from 'lucide-react';
import { Anime } from '../types';
import { EnhancedImage } from './EnhancedImage';

interface AnimeRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeList: Anime[];
  onSelect: (anime: Anime) => void;
}

export const AnimeRouletteModal: React.FC<AnimeRouletteModalProps> = ({
  isOpen,
  onClose,
  animeList,
  onSelect,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Anime | null>(null);
  const [strip, setStrip] = useState<Anime[]>([]);
  const ITEM_HEIGHT = 200; // Match the container height exactly

  // Initialize strip when modal opens
  useEffect(() => {
    if (isOpen && animeList.length > 0) {
      setIsSpinning(false);
      setWinner(null);
      // Generate initial strip
      const initialStrip = Array.from({ length: 5 }, () => animeList[Math.floor(Math.random() * animeList.length)]);
      setStrip(initialStrip);
    }
  }, [isOpen, animeList]);

  const handleSpin = () => {
    if (isSpinning || animeList.length === 0) return;
    
    setIsSpinning(true);
    setWinner(null);
    
    const STRIP_LENGTH = 40; // 40 items to scroll through
    const newStrip = Array.from({ length: STRIP_LENGTH }, () => animeList[Math.floor(Math.random() * animeList.length)]);
    
    // Choose winner (last element)
    const winningAnime = newStrip[newStrip.length - 1];
    setStrip(newStrip);

    // After animation duration, show winner buttons
    setTimeout(() => {
      setIsSpinning(false);
      setWinner(winningAnime);
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isSpinning ? onClose : undefined}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center p-6"
        >
          <button
            onClick={!isSpinning ? onClose : undefined}
            disabled={isSpinning}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 z-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
              <Dices className="w-6 h-6 text-rose-500" />
              Аниме Рулетка
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-mono">Не знаешь, что посмотреть? Доверься случаю.</p>
          </div>

          <div className="relative w-[140px] h-[200px] bg-zinc-900 rounded-xl overflow-hidden border-2 border-zinc-800 shadow-[0_0_30px_rgba(225,29,72,0.15)] mb-8">
            {/* Slot machine center highlight */}
            <div className="absolute inset-0 top-0 h-full z-10 pointer-events-none shadow-[inset_0_40px_20px_-20px_rgba(9,9,11,1),inset_0_-40px_20px_-20px_rgba(9,9,11,1)] border-y-2 border-rose-500/50" />
            
            <div className="w-full h-full relative flex justify-center">
              <motion.div
                className="absolute top-0 w-[140px]"
                animate={{
                  y: isSpinning || winner
                    ? -(strip.length - 1) * ITEM_HEIGHT
                    : 0
                }}
                transition={{
                  duration: 4,
                  ease: [0.15, 0.95, 0.2, 1], // Custom slot machine slow down ease
                }}
                style={{ y: 0 }}
              >
                {strip.map((anime, idx) => (
                  <div 
                    key={`${anime.id}-${idx}`} 
                    className="w-[140px] h-[200px] flex items-center justify-center p-1"
                  >
                    <EnhancedImage
                      src={anime.poster}
                      className="w-full h-full object-cover rounded-lg shadow-lg border border-zinc-700/50"
                      enhanceLevel="standard"
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          <div className="w-full space-y-3 min-h-[96px] flex flex-col justify-end">
            {winner ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center w-full"
              >
                <div className="text-center mb-4">
                  <div className="font-bold text-white text-lg line-clamp-1">{winner.title}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{winner.year} • {winner.genres[0]}</div>
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={handleSpin}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold tracking-wide flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  >
                    Еще раз
                  </button>
                  <button
                    onClick={() => {
                      onSelect(winner);
                      onClose();
                    }}
                    className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Смотреть
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={handleSpin}
                disabled={isSpinning || animeList.length === 0}
                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Dices className="w-5 h-5" />
                {isSpinning ? 'Крутим...' : 'Крутить Рулетку'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
