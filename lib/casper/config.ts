/**
 * Configuración de Casper para uso exclusivo en el servidor.
 * 
 * Este archivo solo debe ejecutarse en el lado del servidor (Server Components,
 * API Routes, Server Actions). NO usar variables NEXT_PUBLIC_* aquí.
 * 
 * La validación se ejecuta al importar el módulo, por lo que la aplicación
 * fallará al iniciar si las variables de entorno requeridas no están configuradas.
 */

export interface CasperConfig {
  nodeAddress: string;
  networkName: string;
  sponsorPublicKey: string;
  sponsorPrivateKey: string;
}

/**
 * Valores permitidos para NETWORK_NAME según la documentación de Casper.
 */
const ALLOWED_NETWORK_NAMES = [
  'mainnet',
  'testnet',
  'casper-test', // Testnet oficial de Casper
  'localhost',
  'integration-test',
] as const;

/**
 * Valida que una URL tenga un formato válido.
 * 
 * @param url - URL a validar
 * @returns true si la URL es válida, false en caso contrario
 */
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * Valida que una cadena tenga formato hexadecimal.
 * 
 * @param str - Cadena a validar
 * @returns true si la cadena es hexadecimal válida, false en caso contrario
 */
function isValidHex(str: string): boolean {
  return /^[0-9a-fA-F]+$/.test(str);
}

/**
 * Valida y retorna la configuración de Casper desde las variables de entorno.
 * 
 * Realiza las siguientes validaciones:
 * - Verifica que todas las variables requeridas estén definidas
 * - Valida que NODE_ADDRESS sea una URL válida (http:// o https://)
 * - Valida que NETWORK_NAME sea uno de los valores permitidos
 * - Valida que SPONSOR_PUBLIC_KEY tenga formato hexadecimal básico
 * 
 * @returns {CasperConfig} Configuración validada de Casper
 * @throws {Error} Si alguna variable de entorno requerida no está definida o tiene formato inválido
 * 
 * @example
 * ```typescript
 * import { casperConfig } from '@/lib/casper/config';
 * console.log(casperConfig.nodeAddress); // 'http://localhost:7777/rpc'
 * ```
 */
export function getCasperConfig(): CasperConfig {
  const nodeAddress = process.env.NODE_ADDRESS?.trim();
  const networkName = process.env.NETWORK_NAME?.trim();
  const sponsorPublicKey = process.env.SPONSOR_PUBLIC_KEY?.trim();
  const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY;

  // Validar NODE_ADDRESS
  if (!nodeAddress) {
    throw new Error(
      '[CasperConfig] NODE_ADDRESS no está definida en las variables de entorno.\n' +
      'Por favor, configura NODE_ADDRESS en tu archivo .env.local\n' +
      'Ejemplo: NODE_ADDRESS=http://localhost:7777/rpc'
    );
  }

  if (!isValidUrl(nodeAddress)) {
    throw new Error(
      `[CasperConfig] NODE_ADDRESS tiene un formato inválido: "${nodeAddress}"\n` +
      'Debe ser una URL válida con protocolo http:// o https://\n' +
      'Ejemplo: NODE_ADDRESS=http://localhost:7777/rpc'
    );
  }

  // Validar NETWORK_NAME
  if (!networkName) {
    throw new Error(
      '[CasperConfig] NETWORK_NAME no está definida en las variables de entorno.\n' +
      'Por favor, configura NETWORK_NAME en tu archivo .env.local\n' +
      'Valores permitidos: mainnet, testnet, casper-test, localhost, integration-test'
    );
  }

  if (!ALLOWED_NETWORK_NAMES.includes(networkName as typeof ALLOWED_NETWORK_NAMES[number])) {
    throw new Error(
      `[CasperConfig] NETWORK_NAME tiene un valor inválido: "${networkName}"\n` +
      `Valores permitidos: ${ALLOWED_NETWORK_NAMES.join(', ')}\n` +
      'Ejemplo: NETWORK_NAME=testnet'
    );
  }

  // Validar SPONSOR_PUBLIC_KEY
  if (!sponsorPublicKey) {
    throw new Error(
      '[CasperConfig] SPONSOR_PUBLIC_KEY no está definida en las variables de entorno.\n' +
      'Por favor, configura SPONSOR_PUBLIC_KEY en tu archivo .env.local\n' +
      'Debe ser una clave pública en formato hexadecimal'
    );
  }

  // Validar formato hexadecimal básico (puede ser account hash o public key)
  // Las claves públicas Ed25519 en Casper suelen empezar con '01' o '02'
  // También pueden venir con prefijo 'account-hash-'
  const cleanKey = sponsorPublicKey.startsWith('account-hash-')
    ? sponsorPublicKey.replace('account-hash-', '')
    : sponsorPublicKey;

  if (!isValidHex(cleanKey)) {
    throw new Error(
      `[CasperConfig] SPONSOR_PUBLIC_KEY tiene un formato inválido: "${sponsorPublicKey}"\n` +
      'Debe ser una clave pública en formato hexadecimal\n' +
      'Ejemplo: SPONSOR_PUBLIC_KEY=0123456789abcdef... (formato Ed25519)'
    );
  }

  // Validar longitud mínima (las claves públicas Ed25519 tienen 66 caracteres con prefijo 01/02)
  // o 64 sin prefijo, account-hash tiene 64 caracteres
  if (cleanKey.length < 64) {
    throw new Error(
      `[CasperConfig] SPONSOR_PUBLIC_KEY es demasiado corta: "${sponsorPublicKey}"\n` +
      'Debe tener al menos 64 caracteres hexadecimales\n' +
      'Ejemplo: SPONSOR_PUBLIC_KEY=0123456789abcdef... (66 caracteres con prefijo)'
    );
  }

  // Validar SPONSOR_PRIVATE_KEY
  if (!sponsorPrivateKey) {
    throw new Error(
      '[CasperConfig] SPONSOR_PRIVATE_KEY no está definida en las variables de entorno.\n' +
      'Por favor, configura SPONSOR_PRIVATE_KEY en tu archivo .env.local\n' +
      'Puede estar en formato PEM o ed25519:...'
    );
  }

  return {
    nodeAddress,
    networkName,
    sponsorPublicKey,
    sponsorPrivateKey,
  };
}

/**
 * Configuración de Casper exportada.
 * 
 * Se valida automáticamente al importar este módulo.
 * Si alguna validación falla, la aplicación no iniciará.
 * 
 * @example
 * ```typescript
 * import { casperConfig } from '@/lib/casper/config';
 * 
 * // Usar en Server Components o API Routes
 * const nodeAddress = casperConfig.nodeAddress;
 * const networkName = casperConfig.networkName;
 * ```
 */
export const casperConfig: CasperConfig = getCasperConfig();
