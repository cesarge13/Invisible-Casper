'use client';

/**
 * Componente MintButton para realizar acciones gasless (sin pagar fees).
 * 
 * Este componente permite crear y enviar deploys de mint de NFT (CEP-78) patrocinados
 * usando CSPR.click o Casper Wallet para la autenticación y firma, y el sistema de
 * patrocinio del servidor para pagar los fees de las transacciones.
 * 
 * Flujo:
 * 1. Crear un deploy de mint de NFT usando CEP-78
 * 2. Solicitar al usuario que firme el deploy usando CSPR.click o Casper Wallet
 * 3. Enviar el deploy firmado al endpoint /api/sponsor
 * 4. El servidor firma como payer y envía a la blockchain
 */

import { useClickRef } from '@make-software/csprclick-ui';
import { useState, useEffect } from 'react';
import { DeployUtil } from 'casper-js-sdk';
import { createMintDeploy, createNFTMetadata } from '@/lib/casper/cep78';
import { getCasperWallet } from './WalletNav';
import { devLog, deployToJsonString } from '@/lib/casper/deployHelpers';

/**
 * Estados del componente
 */
type MintState = 'idle' | 'signing' | 'sponsoring' | 'submitted' | 'error';

/**
 * Props del componente MintButton
 */
interface MintButtonProps {
  /**
   * Texto del botón (opcional)
   * @default "Mint (Gas 0)"
   */
  label?: string;
  
  /**
   * Callback cuando la transacción es exitosa
   */
  onSuccess?: (deployHash: string) => void;
  
  /**
   * Callback cuando hay un error
   */
  onError?: (error: string) => void;
}

/**
 * MintButton component for gasless actions
 */
export function MintButton({ 
  label = 'Mint (Gas 0)', 
  onSuccess,
  onError 
}: MintButtonProps) {
  const clickRef = useClickRef();
  const [state, setState] = useState<MintState>('idle');
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [deployHash, setDeployHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Metadata del NFT
  const [nftName, setNftName] = useState<string>('My Gasless NFT');
  const [nftDescription, setNftDescription] = useState<string>('Minted with gasless sponsorship');
  const [nftImage, setNftImage] = useState<string>('');

  // getCasperWallet ya está importado desde WalletNav

  // Get user's public key (CSPR.click or Casper Wallet as fallback)
  useEffect(() => {
    const fetchPublicKey = async () => {
      // Esperar un momento para que la extensión se cargue completamente
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Intentar con CSPR.click primero
      if (clickRef) {
        try {
          const activeKey = await clickRef.getActivePublicKey();
          if (activeKey) {
            setPublicKey(activeKey);
            return;
          }
        } catch (error) {
          // CSPR.click no disponible o no conectado, continuar con fallback
        }
      }

      // Try multiple methods to get the public key
      // Method 1: window.casperlabsHelper directly (most common)
      const casperHelper = (window as any).casperlabsHelper;
      if (casperHelper && typeof casperHelper.getActivePublicKey === 'function') {
        try {
          const activeKey = await casperHelper.getActivePublicKey();
          if (activeKey) {
            // Convertir a string si no lo es
            const publicKeyStr = typeof activeKey === 'string' ? activeKey : String(activeKey);
            setPublicKey(publicKeyStr);
            // Solo loggear una vez cuando se obtiene exitosamente (evitar spam)
            return;
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[MintButton] Error con casperlabsHelper:', error);
          }
        }
      }

      // Method 2: use getCasperWallet()
      const wallet = getCasperWallet();
      if (wallet) {
        try {
          // Intentar getActivePublicKey directamente
          if (typeof wallet.getActivePublicKey === 'function') {
            try {
              const activeKey = await wallet.getActivePublicKey();
              if (activeKey) {
                // Convertir a string si no lo es (puede venir como objeto o array)
                const publicKeyStr = typeof activeKey === 'string' ? activeKey : String(activeKey);
                setPublicKey(publicKeyStr);
                // Solo loggear una vez cuando se obtiene exitosamente (evitar spam)
                return;
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[MintButton] Error con wallet.getActivePublicKey():', error);
              }
            }
          }
          
          // Intentar verificar conexión primero
          let connected = false;
          if (typeof wallet.isConnected === 'function') {
            try {
              connected = await wallet.isConnected();
            } catch {
              connected = false;
            }
          }
          
          if (connected && typeof wallet.getActivePublicKey === 'function') {
            const activeKey = await wallet.getActivePublicKey();
            if (activeKey) {
              // Convertir a string si no lo es
              const publicKeyStr = typeof activeKey === 'string' ? activeKey : String(activeKey);
              setPublicKey(publicKeyStr);
              return;
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[MintButton] Error al obtener clave pública desde wallet:', error);
          }
        }
      }

      // Si no se pudo obtener la clave pública
      if (process.env.NODE_ENV === 'development') {
        const casperHelperCheck = (window as any).casperlabsHelper;
        console.log('[MintButton] No se pudo obtener clave pública. Wallet encontrada:', !!wallet, 'casperlabsHelper:', !!casperHelperCheck);
      }
      setPublicKey(null);
    };

    fetchPublicKey();
    
    // Verificar periódicamente (cada 2 segundos)
    const interval = setInterval(fetchPublicKey, 2000);
    
    // También escuchar eventos de cambio de wallet
    const handleFocus = () => {
      setTimeout(fetchPublicKey, 500);
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [clickRef]);

  /**
   * Obtiene la configuración pública del servidor
   */
  const getPublicConfig = async () => {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error('No se pudo obtener la configuración del servidor');
    }
    return await response.json();
  };


  /**
   * Crea un deploy de mint de NFT usando CEP-78
   */
  const createMintNFTDeploy = async (userPublicKey: string) => {
    // Obtener configuración pública
    const config = await getPublicConfig();
    
    if (!config.sponsorPublicKey || !config.networkName) {
      throw new Error('Configuración del servidor incompleta');
    }

    // Crear metadata del NFT
    const tokenMeta = createNFTMetadata(
      nftName.trim() || 'My Gasless NFT',
      nftDescription.trim() || undefined,
      nftImage.trim() || undefined
    );

    // Crear el deploy de mint usando la función de cep78.ts
    // Retorna directamente un DeployUtil.Deploy del SDK (no JSON)
    const deploy = createMintDeploy({
      userPublicKey,
      tokenOwner: userPublicKey, // El NFT será propiedad del usuario
      tokenMeta,
      networkName: config.networkName,
      sponsorPublicKey: config.sponsorPublicKey,
      // contractHash se obtendrá automáticamente desde contract.ts si existe
    });

    return deploy;
  };

  /**
   * Handles button click
   */
  const handleMint = async () => {
    if (!publicKey) {
      setState('error');
      setErrorMessage('No wallet connected. Please connect first using the "Connect Wallet" button in the top right corner.');
      onError?.('No wallet connected');
      return;
    }

    try {
      setState('signing');
      setErrorMessage(null);

      // Step 1: Create NFT mint deploy (returns DeployUtil.Deploy directly)
      const deploy = await createMintNFTDeploy(publicKey);
      
      // Convertir hash a hex para el log
      let hashHex = '';
      if (typeof Buffer !== 'undefined') {
        hashHex = Buffer.from(deploy.hash).toString('hex');
      } else {
        const hashBytes = Array.from(new Uint8Array(deploy.hash));
        hashHex = hashBytes.map(b => b.toString(16).padStart(2, '0')).join('');
      }
      
      devLog.log('[MintButton] Deploy creado exitosamente', {
        hash: hashHex,
        approvalsCount: deploy.approvals?.length || 0,
      });

      // Paso 2: Convertir el deploy a JSON string para wallet.sign()
      // Casper Wallet espera el deploy completo serializado como JSON string
      const deployJsonString = deployToJsonString(deploy);
      
      devLog.log('[MintButton] Deploy convertido a JSON string', {
        jsonLength: deployJsonString.length,
      });
      
      // Step 3: Get deploy hash for reference and validation
      let deployHash: string;
      if (deploy.hash && typeof (deploy.hash as any).toHex === 'function') {
        deployHash = (deploy.hash as any).toHex();
      } else if (typeof Buffer !== 'undefined') {
        deployHash = Buffer.from(deploy.hash as any).toString('hex');
      } else {
        const hashBytes = deploy.hash instanceof Uint8Array 
          ? Array.from(deploy.hash)
          : Array.from(new Uint8Array(Object.values(deploy.hash as any)));
        deployHash = hashBytes.map((b: number) => b.toString(16).padStart(2, '0')).join('');
      }
      
      devLog.log('[MintButton] Hash del deploy obtenido', {
        hashPreview: deployHash.substring(0, 20) + '...',
        hashLength: deployHash.length,
      });
      
      // Step 4: Sign deploy using wallet.sign() with complete JSON
      // Casper Wallet puede retornar el deploy firmado completo o solo la firma
      const wallet = getCasperWallet();
      if (!wallet) {
        throw new Error('No wallet found. Please install Casper Wallet or CSPR.click.');
      }

      if (!wallet.sign || typeof wallet.sign !== 'function') {
        throw new Error(
          'Wallet does not have sign method available. ' +
          'Please make sure you have Casper Wallet installed and connected.'
        );
      }

      devLog.log('[MintButton] Firmando deploy JSON con wallet.sign()...', {
        jsonPreview: deployJsonString.substring(0, 100) + '...',
        publicKey: publicKey.substring(0, 20) + '...',
      });

      let signature: string;
      try {
        // wallet.sign() espera el deploy completo como JSON string
        // Intentar primero con un solo argumento, luego con ambos
        let signResult: any;
        try {
          signResult = await wallet.sign(deployJsonString);
          devLog.log('[MintButton] Firmado con un solo argumento');
        } catch (error) {
          signResult = await wallet.sign(deployJsonString, publicKey);
          devLog.log('[MintButton] Firmado con ambos argumentos');
        }
        
        // Procesar la respuesta: puede ser un string JSON o un objeto
        const signResultObj = typeof signResult === 'string' 
          ? JSON.parse(signResult)
          : signResult;
        
        devLog.log('[MintButton] Wallet retornó:', {
          type: typeof signResult,
          hasSignatureHex: 'signatureHex' in signResultObj,
          hasDeploy: 'deploy' in signResultObj,
          keys: Object.keys(signResultObj),
        });
        
        // Extraer la firma
        if (signResultObj.signatureHex && typeof signResultObj.signatureHex === 'string') {
          signature = signResultObj.signatureHex;
        } else if (signResultObj.deploy?.approvals?.[0]?.signature) {
          signature = signResultObj.deploy.approvals[0].signature;
        } else if (typeof signResult === 'string' && signResult.length === 128 && /^[0-9a-fA-F]{128}$/.test(signResult)) {
          // La wallet retornó directamente la firma como string hex
          signature = signResult;
        } else {
          throw new Error('No se pudo extraer la firma del resultado de wallet.sign()');
        }
        
        // La wallet puede retornar la firma directamente como string hex,
        // o como objeto con signatureHex
        if (typeof signResult === 'string') {
          signature = signResult;
        } else if (signResult && typeof signResult === 'object' && 'signatureHex' in signResult) {
          signature = signResult.signatureHex;
      } else {
          throw new Error('Formato de firma no reconocido');
        }
      } catch (error) {
        throw new Error(
          `Error al firmar el hash del deploy: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      if (!signature || signature.length !== 128) {
        throw new Error(
          `Firma inválida: debe tener 128 caracteres hexadecimales, recibido: ${signature?.length || 0}`
        );
      }

      devLog.log('[MintButton] Hash firmado exitosamente', {
        signaturePreview: signature.substring(0, 20) + '...',
        signatureLength: signature.length,
      });

      setState('sponsoring');

      // Step 4: Convert deploy to JSON to send to server
      // DeployUtil.deployToJson puede retornar string o objeto
      const deployJsonRaw = DeployUtil.deployToJson(deploy);
      let deployJson: any;
      
      if (typeof deployJsonRaw === 'string') {
        deployJson = JSON.parse(deployJsonRaw);
      } else {
        deployJson = deployJsonRaw;
      }
      
      // Asegurar que tenga la estructura { deploy: {...} } que espera el backend
      // El SDK puede retornar el deploy directamente o envuelto en { deploy: {...} }
      if (!deployJson.deploy && (deployJson.hash || deployJson.header)) {
        // Es el deploy directamente, envolverlo
        deployJson = { deploy: deployJson };
      }
      
      devLog.log('[MintButton] Deploy convertido a JSON para enviar al servidor', {
        hasDeployWrapper: 'deploy' in deployJson,
        hasHash: !!deployJson.deploy?.hash || !!deployJson.hash,
        hasSession: !!deployJson.deploy?.session || !!deployJson.session,
        hasPayment: !!deployJson.deploy?.payment || !!deployJson.payment,
      });

      // Step 5: Send POST to /api/sponsor with deployJson, signer and signature
      const response = await fetch('/api/sponsor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployJson,
          signer: publicKey,
          signature,
        }),
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          // Si no se puede parsear el JSON, usar el texto de la respuesta
          const text = await response.text();
          throw new Error(`Error ${response.status}: ${text || 'Error desconocido del servidor'}`);
        }
        
        // Log detallado del error para debugging
        devLog.error('[MintButton] Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error || errorData,
          fullResponse: errorData,
        });
        
        // Si el error es sobre claves inválidas, mostrar instrucciones claras
        if (errorData.error && errorData.error.includes('Invalid key pairs')) {
          devLog.error('\n🔴 PROBLEMA: Las claves del sponsor no son válidas.');
          devLog.error('💡 SOLUCIÓN:');
          devLog.error('   1. Ejecuta: npx tsx scripts/generate-sponsor-keys.ts');
          devLog.error('   2. Copia las nuevas claves a tu .env.local');
          devLog.error('   3. REINICIA el servidor (Ctrl+C y luego pnpm dev)');
          devLog.error('   4. Asegúrate de tener CSPR en la cuenta del sponsor para pagar fees\n');
        }
        
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const hash = result.deployHash;

      setDeployHash(hash);
      setState('submitted');
      onSuccess?.(hash);

    } catch (error) {
      const errorMsg = error instanceof Error 
        ? error.message 
        : 'Error desconocido';
      
      setState('error');
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
    }
  };

  /**
   * Renderiza el contenido del botón según el estado
   */
  const getButtonContent = () => {
    switch (state) {
      case 'idle':
        return label;
      case 'signing':
        return 'Firmando...';
      case 'sponsoring':
        return 'Enviando...';
      case 'submitted':
        return '✅ Enviado';
      case 'error':
        return '❌ Error';
      default:
        return label;
    }
  };

  /**
   * Determina si el botón debe estar deshabilitado
   */
  const isDisabled = () => {
    return state === 'signing' || 
           state === 'sponsoring' || 
           state === 'submitted' ||
           !publicKey;
  };

  /**
   * Obtiene las clases CSS según el estado
   */
  const getButtonClasses = () => {
    const baseClasses = 'px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
    
    switch (state) {
      case 'submitted':
        return `${baseClasses} bg-green-600 text-white hover:bg-green-700`;
      case 'error':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
      case 'signing':
      case 'sponsoring':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
      default:
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Campos de metadata del NFT */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre del NFT *
          </label>
          <input
            type="text"
            value={nftName}
            onChange={(e) => setNftName(e.target.value)}
            placeholder="Mi NFT Gasless"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            disabled={state !== 'idle'}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción (opcional)
          </label>
          <input
            type="text"
            value={nftDescription}
            onChange={(e) => setNftDescription(e.target.value)}
            placeholder="Descripción del NFT"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            disabled={state !== 'idle'}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            URL de la Imagen (opcional)
          </label>
          <input
            type="url"
            value={nftImage}
            onChange={(e) => setNftImage(e.target.value)}
            placeholder="https://example.com/image.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm font-mono"
            disabled={state !== 'idle'}
          />
        </div>
      </div>

      {/* Mint button */}
      <button
        onClick={handleMint}
        disabled={isDisabled() || !nftName.trim()}
        className={getButtonClasses()}
      >
        {getButtonContent()}
      </button>

      {/* Error message */}
      {state === 'error' && errorMessage && (
        <div className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Deploy hash when successful */}
      {state === 'submitted' && deployHash && (
        <div className="text-sm text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="font-semibold mb-1">✅ NFT Minted Successfully!</div>
          <div className="text-xs mb-2">Deploy Hash:</div>
          <div className="font-mono break-all text-xs">{deployHash}</div>
          <a
            href={`https://testnet.cspr.live/deploy/${deployHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline mt-2 inline-block"
          >
            View on explorer →
          </a>
        </div>
      )}

      {/* Connection status */}
      {!publicKey && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          Connect your wallet to continue
        </div>
      )}
    </div>
  );
}

