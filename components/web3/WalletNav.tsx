'use client';

/**
 * Componente de navegación de wallet que muestra el estado de conexión
 * y permite conectar/desconectar la wallet.
 * 
 * Muestra:
 * - Botón "Connect" si no hay conexión
 * - Public key truncada y balance si hay conexión
 * 
 * Usa Casper Wallet directamente (sin CSPR.click).
 */

import { useEffect, useState } from 'react';

/**
 * Verifica si Casper Wallet está disponible en window
 * Casper Wallet puede exponer su API de diferentes formas
 * También verifica CSPR.live y otras extensiones compatibles
 * 
 * EXPORTADA para uso en otros componentes
 */
export function getCasperWallet() {
  if (typeof window === 'undefined') return null;
  
  // Intentar diferentes formas de acceder a la API de Casper Wallet
  // 1. window.casperlabsHelper (API tradicional de Casper Signer)
  // 2. window.casperWallet (posible nombre alternativo)
  // 3. window.CasperWallet (con mayúscula)
  // 4. window.csprLive (CSPR.live extension)
  // 5. window.CSPRLive (CSPR.live con mayúsculas)
  
  const possibleNames = [
    'CasperWalletProvider', // API oficial según documentación
    'casperlabsHelper', // API tradicional de Casper Signer
    'casperWallet',
    'CasperWallet',
    'csprLive',
    'CSPRLive',
    'csprlive',
    'CasperSigner',
    'casperSigner'
  ];
  
  for (const name of possibleNames) {
    const helper = (window as any)[name];
    
    // CasperWalletProvider puede ser un constructor o un objeto ya instanciado
    if (name === 'CasperWalletProvider') {
      // Si es una función, intentar instanciarlo
      if (typeof helper === 'function') {
        try {
          // Crear una instancia del provider según la documentación oficial
          const provider = helper({
            timeout: 30 * 60 * 1000 // 30 minutos
          });
          if (provider && typeof provider === 'object') {
            // Verificar que tenga los métodos necesarios
            if (typeof provider.requestConnection === 'function' || 
                typeof provider.isConnected === 'function' ||
                typeof provider.getActivePublicKey === 'function') {
              return provider;
            }
          }
        } catch (error) {
          // Si falla la instanciación, continuar buscando
          if (process.env.NODE_ENV === 'development') {
            console.log('[WalletNav] Error instantiating CasperWalletProvider:', error);
          }
        }
      }
      // Si es un objeto, verificar que tenga los métodos necesarios
      else if (helper && typeof helper === 'object' && !Array.isArray(helper)) {
        if (typeof helper.requestConnection === 'function' || 
            typeof helper.isConnected === 'function' ||
            typeof helper.getActivePublicKey === 'function' ||
            typeof helper.connect === 'function' ||
            typeof helper.signIn === 'function') {
          return helper;
        }
      }
    }
    
    // Para otros casos, verificar si es un objeto con métodos
    if (name !== 'CasperWalletProvider' && helper && typeof helper === 'object' && !Array.isArray(helper)) {
      // Verificar que tenga los métodos necesarios
      if (typeof helper.requestConnection === 'function' || 
          typeof helper.isConnected === 'function' ||
          typeof helper.getActivePublicKey === 'function' ||
          typeof helper.connect === 'function' ||
          typeof helper.signIn === 'function') {
        return helper;
      }
    }
  }
  
  // También buscar cualquier objeto en window que tenga métodos relacionados
  const allKeys = Object.keys(window);
  for (const key of allKeys) {
    if (key.toLowerCase().includes('casper') || 
        key.toLowerCase().includes('cspr') ||
        key.toLowerCase().includes('wallet')) {
      const obj = (window as any)[key];
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        // Verificar si tiene métodos de conexión
        const hasConnectionMethod = 
          typeof obj.requestConnection === 'function' ||
          typeof obj.connect === 'function' ||
          typeof obj.signIn === 'function' ||
          typeof obj.isConnected === 'function' ||
          typeof obj.getActivePublicKey === 'function';
        
        if (hasConnectionMethod) {
          return obj;
        }
      }
    }
  }
  
  return null;
}

/**
 * Trunca una clave pública para mostrarla de forma legible.
 * 
 * @param publicKey - Clave pública completa
 * @param startLength - Longitud de caracteres al inicio (default: 4)
 * @param endLength - Longitud de caracteres al final (default: 4)
 * @returns Clave pública truncada (ej: "01ab…99ff")
 */
function truncatePublicKey(
  publicKey: string,
  startLength: number = 4,
  endLength: number = 4
): string {
  if (publicKey.length <= startLength + endLength) {
    return publicKey;
  }
  return `${publicKey.slice(0, startLength)}…${publicKey.slice(-endLength)}`;
}

/**
 * Formatea un balance para mostrarlo de forma legible.
 * 
 * @param balance - Balance en motes (unidad más pequeña)
 * @returns Balance formateado en CSPR
 */
function formatBalance(balance: string | number | undefined): string {
  if (!balance) {
    return '0.00';
  }
  
  // Convertir motes a CSPR (1 CSPR = 1,000,000,000 motes)
  const balanceNumber = typeof balance === 'string' ? parseFloat(balance) : balance;
  const cspr = balanceNumber / 1_000_000_000;
  
  return cspr.toFixed(2);
}

/**
 * Componente WalletNav que muestra el estado de la wallet.
 */
export function WalletNav() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [isWalletInstalled, setIsWalletInstalled] = useState<boolean>(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);

  // Verificar si Casper Wallet está instalado y estado de conexión
  useEffect(() => {
    let hasLoggedDebug = false; // Solo loggear una vez
    
    const checkWallet = async () => {
      // Esperar un momento para que la extensión se cargue completamente
      // Las extensiones pueden tardar en inyectar su script
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Debug: verificar qué hay en window (solo una vez)
      if (typeof window !== 'undefined' && !hasLoggedDebug && process.env.NODE_ENV === 'development') {
        const hasCasperWalletProvider = !!(window as any).CasperWalletProvider;
        const hasCasperlabsHelper = !!(window as any).casperlabsHelper;
        
        const casperKeys = Object.keys(window).filter(key => 
          key.toLowerCase().includes('casper') || 
          key.toLowerCase().includes('wallet') ||
          key.toLowerCase().includes('cspr')
        );
        
        console.log('[WalletNav] Casper Wallet Detection:', {
          CasperWalletProvider: hasCasperWalletProvider,
          casperlabsHelper: hasCasperlabsHelper,
          foundKeys: casperKeys,
          // Mostrar detalles de CasperWalletProvider si existe
          CasperWalletProviderDetails: hasCasperWalletProvider ? {
            type: typeof (window as any).CasperWalletProvider,
            isFunction: typeof (window as any).CasperWalletProvider === 'function',
            isObject: typeof (window as any).CasperWalletProvider === 'object',
            methods: typeof (window as any).CasperWalletProvider === 'object' 
              ? Object.keys((window as any).CasperWalletProvider).slice(0, 10)
              : null
          } : null
        });
        
        hasLoggedDebug = true; // Marcar como loggeado
      }
      
      const wallet = getCasperWallet();
      setIsWalletInstalled(!!wallet);
      
      if (wallet) {
        try {
          // Verificar estado de conexión
          // Algunas versiones pueden no tener isConnected, intentar getActivePublicKey directamente
          let connected = false;
          
          if (typeof wallet.isConnected === 'function') {
            connected = await wallet.isConnected();
          } else {
            // Si no tiene isConnected, intentar obtener la clave directamente
            try {
              const key = await wallet.getActivePublicKey();
              connected = !!key;
            } catch {
              connected = false;
            }
          }
          
          if (connected) {
            const activeKey = await wallet.getActivePublicKey();
            if (activeKey) {
              setIsConnected(true);
              setPublicKey(activeKey);
              // Obtener balance real
              fetchBalance(activeKey);
              return;
            }
          }
        } catch (error) {
          // Error al verificar - wallet puede no estar lista aún
          if (process.env.NODE_ENV === 'development') {
            console.log('[WalletNav] Error checking wallet:', error);
          }
        }
      }
      
      setIsConnected(false);
      setPublicKey(null);
    };

    // Verificar inmediatamente
    checkWallet();
    
    // Verificar periódicamente el estado de conexión (cada 30 segundos - menos frecuente)
    const interval = setInterval(checkWallet, 30000);
    
    // También escuchar eventos de cambio de ventana (cuando el usuario vuelve de la extensión)
    const handleFocus = () => {
      setTimeout(checkWallet, 500);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Función para conectar con Casper Wallet
  const connectWallet = async () => {
    try {
      const wallet = getCasperWallet();
      
      if (!wallet) {
        // Si no está instalado, abrir página de descarga
        if (process.env.NODE_ENV === 'development') {
          console.log('[WalletNav] Wallet not found, opening download page');
        }
        window.open('https://casperwallet.io/', '_blank');
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[WalletNav] Attempting to connect to wallet');
      }

      // Solicitar conexión - requestConnection abre un popup en la extensión
      if (typeof wallet.requestConnection === 'function') {
        await wallet.requestConnection();
      } else {
        // Si no tiene requestConnection, intentar métodos alternativos
        console.warn('[WalletNav] requestConnection not available, trying alternative methods');
        // Algunas versiones pueden usar signIn o connect
        if (typeof (wallet as any).signIn === 'function') {
          await (wallet as any).signIn();
        } else if (typeof (wallet as any).connect === 'function') {
          await (wallet as any).connect();
        }
      }
      
      // Esperar un momento para que la extensión procese la conexión
      // La extensión puede tomar tiempo en procesar la conexión
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verificar estado de conexión después de solicitar
      let connected = false;
      if (typeof wallet.isConnected === 'function') {
        connected = await wallet.isConnected();
      } else {
        // Si no tiene isConnected, intentar obtener la clave directamente
        try {
          const activeKey = await wallet.getActivePublicKey();
          connected = !!activeKey;
          if (connected && activeKey) {
            setIsConnected(true);
            setPublicKey(activeKey);
            return;
          }
        } catch {
          connected = false;
        }
      }
      
      if (connected) {
        const activeKey = await wallet.getActivePublicKey();
        if (activeKey) {
          setIsConnected(true);
          setPublicKey(activeKey);
          // Obtener balance real
          fetchBalance(activeKey);
        }
      }
    } catch (error) {
      // Error al conectar - puede ser que el usuario canceló o la wallet no está disponible
      if (process.env.NODE_ENV === 'development') {
        console.error('[WalletNav] Error connecting to wallet:', error);
      }
      // No hacer nada, el usuario puede intentar de nuevo
    }
  };

  // Función para obtener el balance real desde la API
  const fetchBalance = async (publicKeyToFetch: string) => {
    if (!publicKeyToFetch) return;
    
    setIsLoadingBalance(true);
    try {
      const response = await fetch(`/api/balance?publicKey=${encodeURIComponent(publicKeyToFetch)}`);
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balanceCSPR || '0.00');
      } else {
        const error = await response.json();
        console.error('[WalletNav] Error fetching balance:', error.error);
        setBalance('0.00');
      }
    } catch (error) {
      console.error('[WalletNav] Error fetching balance:', error);
      setBalance('0.00');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Función para desconectar
  const disconnectWallet = async () => {
    try {
      // Casper Wallet no tiene método disconnect explícito
      // Simplemente limpiar el estado local
      // La wallet puede seguir conectada pero la app ya no la usa
      setIsConnected(false);
      setPublicKey(null);
    } catch (error) {
      // Si hay error, limpiar el estado de todas formas
      setIsConnected(false);
      setPublicKey(null);
    }
  };

  // Si NO hay conexión, mostrar botón "Connect"
  if (!isConnected || !publicKey) {
    return (
      <div className="flex items-center gap-4">
        <button
          onClick={connectWallet}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {isWalletInstalled ? 'Connect Wallet' : 'Install Wallet'}
        </button>
        {!isWalletInstalled && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Casper Wallet no detectado
          </span>
        )}
      </div>
    );
  }

  // Si hay conexión, mostrar public key truncada y balance
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
          {truncatePublicKey(publicKey)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {isLoadingBalance ? '...' : `${balance} CSPR`}
        </span>
      </div>
      <button
        onClick={disconnectWallet}
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
      >
        Disconnect
      </button>
    </div>
  );
}
