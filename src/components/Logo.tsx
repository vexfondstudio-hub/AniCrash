import React, { useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showBadge = true,
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // Original logo image URL from postimg
  const originalLogoUrl = 'https://i.postimg.cc/13Yj85TG/35725-removebg-preview.png';

  const hSizes = {
    sm: 'h-16 sm:h-20',
    md: 'h-20 sm:h-28',
    lg: 'h-24 sm:h-36',
  };

  const textSizes = {
    sm: 'text-2xl',
    md: 'text-3xl sm:text-5xl',
    lg: 'text-4xl sm:text-6xl',
  };

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {!imgFailed ? (
        <img
          src={originalLogoUrl}
          alt="AniCrash"
          onError={() => setImgFailed(true)}
          className={`${hSizes[size]} w-auto object-contain brightness-0 invert opacity-95 hover:opacity-100 transition-opacity pointer-events-none select-none`}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-rose-600 to-rose-700 flex items-center justify-center font-black text-white text-sm sm:text-base shadow-md shadow-rose-950/50">
            A
          </div>
          <div className={`font-black tracking-tight ${textSizes[size]} flex items-center leading-none`}>
            <span className="text-white">Ani</span>
            <span className="text-rose-500">Crash</span>
          </div>
        </div>
      )}

      {showBadge && (
        <span className="hidden min-[400px]:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
          0% ADS
        </span>
      )}
    </div>
  );
};

