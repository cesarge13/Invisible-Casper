/**
 * Invisible Casper Logo - NFT Mint
 * Logo with NFT mint theme and invisible/ghost aesthetic
 */

import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const sizeMap = {
  sm: { icon: 24, text: 'text-sm' },
  md: { icon: 32, text: 'text-base' },
  lg: { icon: 48, text: 'text-lg' },
  xl: { icon: 64, text: 'text-2xl' },
};

export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const { icon: iconSize, text: textSize } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icono SVG del logo */}
      <div className="relative">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Fondo circular con gradiente */}
          <circle
            cx="32"
            cy="32"
            r="30"
            fill="url(#gradient1)"
            className="animate-pulse"
            opacity="0.9"
          />
          
          {/* NFT Frame / Card */}
          <rect
            x="16"
            y="14"
            width="32"
            height="40"
            rx="4"
            fill="url(#gradient2)"
            stroke="url(#gradient3)"
            strokeWidth="2"
            className="drop-shadow-md"
          />
          
          {/* Efecto de brillo invisible en el frame */}
          <rect
            x="16"
            y="14"
            width="32"
            height="20"
            rx="4"
            fill="url(#gradient4)"
            opacity="0.3"
          />
          
          {/* Líneas decorativas tipo NFT */}
          <line
            x1="20"
            y1="36"
            x2="44"
            y2="36"
            stroke="url(#gradient3)"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <line
            x1="20"
            y1="42"
            x2="44"
            y2="42"
            stroke="url(#gradient3)"
            strokeWidth="1.5"
            opacity="0.4"
          />
          
          {/* Punto de verificación (checkmark) para mint */}
          <circle
            cx="32"
            cy="48"
            r="6"
            fill="url(#gradient5)"
            className="animate-pulse"
          />
          <path
            d="M29 48L31 50L35 46"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Efecto de partículas/estrellas alrededor */}
          <circle cx="12" cy="18" r="2" fill="url(#gradient5)" opacity="0.7">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="52" cy="20" r="1.5" fill="url(#gradient5)" opacity="0.8">
            <animate
              attributeName="opacity"
              values="0.5;1;0.5"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="14" cy="48" r="1.5" fill="url(#gradient5)" opacity="0.6">
            <animate
              attributeName="opacity"
              values="0.4;1;0.4"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="50" cy="50" r="2" fill="url(#gradient5)" opacity="0.7">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Gradientes */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
            </linearGradient>
            
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#312e81" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.9" />
            </linearGradient>
            
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            
            <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.2" />
            </linearGradient>
            
            <linearGradient id="gradient5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Efecto de brillo adicional */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse" />
      </div>
      
      {/* Texto del logo */}
      {showText && (
        <div className={`flex flex-col ${textSize}`}>
          <span className="font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
            Invisible
          </span>
          <span className="font-semibold text-gray-700 dark:text-gray-300 -mt-1">
            Casper
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Logo solo con icono (para favicon o iconos pequeños)
 */
export function LogoIcon({ className = '', size = 'md' }: Omit<LogoProps, 'showText'>) {
  return <Logo className={className} size={size} showText={false} />;
}

