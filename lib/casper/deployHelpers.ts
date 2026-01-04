/**
 * Utilidades para normalizar y procesar deploys de Casper.
 * 
 * Este archivo contiene funciones helper para trabajar con deploys JSON
 * y normalizar diferentes formatos que pueden venir de diferentes wallets.
 */

import { DeployUtil } from 'casper-js-sdk';

/**
 * Limpia un objeto JSON convirtiendo BigInt a string y undefined a null
 */
export function cleanJson(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value === undefined) return null;
    if (typeof value === 'bigint') return value.toString();
    return value;
  }));
}

/**
 * Normaliza el formato del deploy JSON para asegurar estructura { deploy: {...} }
 */
export function normalizeDeployJson(deployJson: any): any {
  let deployObj: any;
  
  if (deployJson.deploy) {
    // Ya tiene estructura { deploy: {...} }
    deployObj = cleanJson(deployJson);
  } else if (deployJson.hash || deployJson.header) {
    // Es el deploy directamente, envolverlo
    deployObj = { deploy: cleanJson(deployJson) };
  } else {
    // Formato desconocido, intentar envolverlo
    deployObj = { deploy: cleanJson(deployJson) };
  }
  
  return deployObj;
}

/**
 * Intenta rehidratar un deploy desde JSON con múltiples formatos
 */
export function rehydrateDeploy(deployJson: any): DeployUtil.Deploy {
  // Normalizar el formato primero
  const normalized = normalizeDeployJson(deployJson);
  
  // Limpiar el JSON
  const cleaned = cleanJson(normalized);
  
  // Intentar rehidratar
  let result = DeployUtil.deployFromJson(cleaned);
  
  try {
    return result.unwrap();
  } catch (error) {
    // Intentar sin wrapper si tiene deploy
    if (cleaned.deploy) {
      const withoutWrapper = cleanJson(cleaned.deploy);
      result = DeployUtil.deployFromJson(withoutWrapper);
      try {
        return result.unwrap();
      } catch {
        // Continuar con el siguiente intento
      }
    }
    
    // Intentar con wrapper si no lo tiene
    if (!cleaned.deploy && (cleaned.hash || cleaned.header)) {
      const withWrapper = cleanJson({ deploy: cleaned });
      result = DeployUtil.deployFromJson(withWrapper);
      try {
        return result.unwrap();
      } catch {
        // Continuar con el siguiente intento
      }
    }
    
    // Si todo falla, lanzar el error original
    throw new Error(`No se pudo rehidratar el deploy: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convierte un deploy a JSON string limpio
 */
export function deployToJsonString(deploy: DeployUtil.Deploy | any): string {
  if (deploy && typeof deploy === 'object' && 'hash' in deploy && !('deploy' in deploy)) {
    // Es un DeployUtil.Deploy
    const json = DeployUtil.deployToJson(deploy);
    if (typeof json === 'string') {
      return json;
    }
    return JSON.stringify(json, (key, value) => {
      if (typeof value === 'bigint') return value.toString();
      if (value === undefined) return null;
      return value;
    });
  }
  
  // Ya es JSON, solo limpiarlo
  return JSON.stringify(cleanJson(deploy), (key, value) => {
    if (typeof value === 'bigint') return value.toString();
    if (value === undefined) return null;
    return value;
  });
}

/**
 * Agrega una firma al deploy JSON original
 */
export function addSignatureToDeploy(
  originalDeployJson: any,
  signatureHex: string,
  signerPublicKey: string
): any {
  // Validar que la firma es válida
  if (!signatureHex || typeof signatureHex !== 'string' || signatureHex.length !== 128) {
    throw new Error(
      `Firma inválida: debe ser un string hex de 128 caracteres, recibido: ${typeof signatureHex} de longitud ${signatureHex?.length || 0}`
    );
  }

  // Normalizar la estructura del deploy
  const deployObj = normalizeDeployJson(originalDeployJson);
  const deployData = deployObj.deploy;
  
  // Validar campos requeridos
  if (!deployData.hash) {
    throw new Error('El deploy JSON no tiene el campo hash requerido');
  }
  if (!deployData.header) {
    throw new Error('El deploy JSON no tiene el campo header requerido');
  }
  
  // Inicializar el array de aprobaciones si no existe
  if (!deployData.approvals) {
    deployData.approvals = [];
  }
  
  // Agregar la aprobación
  deployData.approvals.push({
    signer: signerPublicKey,
    signature: signatureHex
  });
  
  // Limpiar el objeto final antes de enviarlo
  return cleanJson(deployObj);
}

/**
 * Logger helper para desarrollo
 */
export const devLog = {
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, data || '');
    }
  },
  error: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(message, data || '');
    }
  },
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(message, data || '');
    }
  },
};

