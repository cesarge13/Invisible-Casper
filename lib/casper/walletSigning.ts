/**
 * Utilidades para firmar deploys con diferentes wallets.
 * 
 * Este archivo centraliza la lógica de firma con CSPR.click, Casper Wallet, etc.
 */

import { DeployUtil } from 'casper-js-sdk';
import { cleanJson, normalizeDeployJson, rehydrateDeploy, deployToJsonString, devLog } from './deployHelpers';
import { getCasperWallet } from '@/components/web3/WalletNav';

/**
 * Resultado de una operación de firma
 */
export interface SignResult {
  deploy: DeployUtil.Deploy | any; // Puede ser DeployUtil.Deploy o JSON
  isJson: boolean; // true si es JSON, false si es DeployUtil.Deploy
}

/**
 * Firma un deploy usando CSPR.click signDeploy
 */
export async function signWithCSPRClickSignDeploy(
  clickRef: any,
  deploy: DeployUtil.Deploy,
  publicKey: string
): Promise<SignResult> {
  const signedDeploy = await clickRef.signDeploy(deploy, publicKey);
  return {
    deploy: signedDeploy,
    isJson: false, // signDeploy retorna DeployUtil.Deploy
  };
}

/**
 * Firma un deploy usando CSPR.click sign (genérico)
 */
export async function signWithCSPRClickSign(
  clickRef: any,
  deploy: DeployUtil.Deploy | any,
  originalDeployJson: any,
  publicKey: string
): Promise<SignResult> {
  // Convertir deploy a JSON string si es necesario
  const deployJsonForSign = deploy !== null 
    ? DeployUtil.deployToJson(deploy)
    : originalDeployJson;
  
  const deployJsonString = typeof deployJsonForSign === 'string'
    ? deployJsonForSign
    : deployToJsonString(deployJsonForSign);
  
  const signedJson = await clickRef.sign(deployJsonString, publicKey);
  
  // Normalizar respuesta
  const signedJsonObj = typeof signedJson === 'string' 
    ? JSON.parse(signedJson)
    : signedJson;
  
  // Intentar rehidratar
  try {
    const rehydrated = rehydrateDeploy(signedJsonObj);
    return {
      deploy: rehydrated,
      isJson: false,
    };
  } catch {
    // Si falla, retornar como JSON
    return {
      deploy: normalizeDeployJson(signedJsonObj),
      isJson: true,
    };
  }
}

/**
 * Firma un deploy usando Casper Wallet signDeploy
 */
export async function signWithCasperWalletSignDeploy(
  wallet: any,
  deploy: DeployUtil.Deploy,
  publicKey: string
): Promise<SignResult> {
  const signedDeploy = await wallet.signDeploy(deploy, publicKey);
  devLog.log('[WalletSigning] Firmado exitosamente con signDeploy');
  return {
    deploy: signedDeploy,
    isJson: false,
  };
}

/**
 * Firma un deploy usando Casper Wallet sign
 */
export async function signWithCasperWalletSign(
  wallet: any,
  deploy: DeployUtil.Deploy | null,
  originalDeployJson: any,
  publicKey: string
): Promise<SignResult> {
  // Obtener publicKey de la wallet si no está disponible
  let signingPublicKey = publicKey;
  if (!signingPublicKey && wallet?.getActivePublicKey) {
    const activeKey = await wallet.getActivePublicKey();
    if (activeKey && typeof activeKey === 'string') {
      signingPublicKey = activeKey;
    }
  }
  
  if (!signingPublicKey) {
    throw new Error('No se pudo obtener la clave pública para firmar');
  }
  
  // Convertir deploy a JSON string
  let deployJsonForWallet: string;
  if (deploy !== null) {
    deployJsonForWallet = deployToJsonString(deploy);
  } else {
    deployJsonForWallet = deployToJsonString(originalDeployJson);
  }
  
  devLog.log('[WalletSigning] Firmando con wallet.sign()', {
    deployLength: deployJsonForWallet.length,
    publicKey: signingPublicKey.substring(0, 20) + '...',
  });
  
  // Intentar firmar (algunas versiones solo aceptan un argumento)
  let signedJson: any;
  try {
    signedJson = await wallet.sign(deployJsonForWallet);
    devLog.log('[WalletSigning] Firmado con un solo argumento');
  } catch {
    signedJson = await wallet.sign(deployJsonForWallet, signingPublicKey);
    devLog.log('[WalletSigning] Firmado con ambos argumentos');
  }
  
  // Procesar respuesta
  const signedJsonObj = typeof signedJson === 'string' 
    ? JSON.parse(signedJson)
    : signedJson;
  
  devLog.log('[WalletSigning] Wallet retornó:', {
    type: typeof signedJson,
    hasDeploy: 'deploy' in signedJsonObj,
    hasHash: 'hash' in signedJsonObj,
    hasSignatureHex: 'signatureHex' in signedJsonObj,
    keys: Object.keys(signedJsonObj),
  });
  
  // Si retornó solo la firma, retornar como JSON para agregar manualmente
  if (signedJsonObj.signatureHex && !signedJsonObj.deploy && !signedJsonObj.hash) {
    devLog.log('[WalletSigning] Wallet retornó solo la firma');
    return {
      deploy: {
        signatureHex: signedJsonObj.signatureHex,
        cancelled: signedJsonObj.cancelled || false,
      },
      isJson: true, // Necesita procesamiento especial
    };
  }
  
  // Intentar rehidratar
  try {
    const rehydrated = rehydrateDeploy(signedJsonObj);
    return {
      deploy: rehydrated,
      isJson: false,
    };
  } catch (error) {
    devLog.warn('[WalletSigning] No se pudo rehidratar, retornando como JSON', error);
    return {
      deploy: normalizeDeployJson(signedJsonObj),
      isJson: true,
    };
  }
}

/**
 * Firma un deploy usando window.casperlabsHelper
 */
export async function signWithCasperHelper(
  deploy: DeployUtil.Deploy,
  publicKey: string
): Promise<SignResult> {
  const casperHelper = (window as any).casperlabsHelper;
  if (!casperHelper?.signDeploy) {
    throw new Error('casperlabsHelper.signDeploy no está disponible');
  }
  
  const signedDeploy = await casperHelper.signDeploy(deploy, publicKey);
  return {
    deploy: signedDeploy,
    isJson: false,
  };
}

/**
 * Intenta firmar un deploy usando todos los métodos disponibles
 */
export async function signDeployWithAvailableWallet(
  deploy: DeployUtil.Deploy | null,
  originalDeployJson: any,
  publicKey: string,
  clickRef?: any
): Promise<SignResult> {
  // 1. Intentar con CSPR.click signDeploy
  if (clickRef && typeof (clickRef as any).signDeploy === 'function' && deploy !== null) {
    try {
      return await signWithCSPRClickSignDeploy(clickRef, deploy, publicKey);
    } catch (error) {
      devLog.warn('[WalletSigning] CSPR.click signDeploy falló, intentando siguiente método', error);
    }
  }
  
  // 2. Intentar con CSPR.click sign
  if (clickRef && typeof (clickRef as any).sign === 'function') {
    try {
      return await signWithCSPRClickSign(clickRef, deploy, originalDeployJson, publicKey);
    } catch (error) {
      devLog.warn('[WalletSigning] CSPR.click sign falló, intentando siguiente método', error);
    }
  }
  
  // 3. Intentar con Casper Wallet usando getCasperWallet() (método robusto)
  const wallet = getCasperWallet();
  
  if (wallet) {
    devLog.log('[WalletSigning] Wallet detectada, verificando métodos disponibles', {
      hasSignDeploy: typeof wallet.signDeploy === 'function',
      hasSign: typeof wallet.sign === 'function',
      walletKeys: Object.keys(wallet).slice(0, 10),
      walletType: typeof wallet,
    });
    
    // 3a. Intentar con signDeploy
    if (typeof wallet.signDeploy === 'function' && deploy !== null) {
      try {
        devLog.log('[WalletSigning] Intentando firmar con wallet.signDeploy');
        return await signWithCasperWalletSignDeploy(wallet, deploy, publicKey);
      } catch (error) {
        devLog.warn('[WalletSigning] Casper Wallet signDeploy falló, intentando siguiente método', error);
      }
    }
    
    // 3b. Intentar con sign
    if (typeof wallet.sign === 'function') {
      try {
        devLog.log('[WalletSigning] Intentando firmar con wallet.sign');
        return await signWithCasperWalletSign(wallet, deploy, originalDeployJson, publicKey);
      } catch (error) {
        devLog.warn('[WalletSigning] Casper Wallet sign falló, intentando siguiente método', error);
      }
    }
    
    devLog.warn('[WalletSigning] Wallet detectada pero no tiene métodos signDeploy ni sign disponibles');
  } else {
    devLog.warn('[WalletSigning] No se pudo obtener wallet usando getCasperWallet()');
  }
  
  // 4. Último intento: window.casperlabsHelper directamente (fallback para compatibilidad)
  if (typeof window !== 'undefined') {
    const casperHelper = (window as any).casperlabsHelper;
    if (deploy !== null && casperHelper && casperHelper !== wallet) {
      try {
        devLog.log('[WalletSigning] Intentando firmar con casperlabsHelper directamente');
        return await signWithCasperHelper(deploy, publicKey);
      } catch (error) {
        devLog.warn('[WalletSigning] casperlabsHelper falló', error);
      }
    }
  }
  
  throw new Error(
    'No se encontró método de firma disponible. ' +
    'Por favor, asegúrate de tener Casper Wallet o CSPR.click instalado y conectado.'
  );
}

