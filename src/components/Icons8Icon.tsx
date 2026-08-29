import React, { useState } from 'react';

export type IconStyle = 'fluency' | 'color' | 'isometric' | '3d-fluency' | 'pulsar-color';

interface Icons8IconProps {
  name: string;
  size?: number;
  className?: string;
  alt?: string;
  style?: IconStyle;
  fallbackIcon?: React.ReactNode;
}

export const Icons8Icon: React.FC<Icons8IconProps> = ({
  name,
  size = 24,
  className = '',
  alt = 'icon',
  style = 'fluency',
  fallbackIcon,
}) => {
  const [errorLevel, setErrorLevel] = useState<number>(0);

  // Render high-DPI image source
  const pixelSize = Math.max(48, Math.min(128, size * 2));
  
  let currentStyle = style;
  if (errorLevel === 1) currentStyle = 'color';
  if (errorLevel === 2) currentStyle = 'fluency';

  const src = `https://img.icons8.com/${currentStyle}/${pixelSize}/${name}.png`;

  if (errorLevel >= 3) {
    if (fallbackIcon) return <>{fallbackIcon}</>;
    return (
      <span
        className={`inline-block bg-zinc-800/80 rounded-md shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`inline-block object-contain select-none shrink-0 transition-transform ${className}`}
      loading="lazy"
      onError={() => setErrorLevel((prev) => prev + 1)}
      referrerPolicy="no-referrer"
    />
  );
};

