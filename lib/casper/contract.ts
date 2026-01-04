/**
 * Hash del contrato CEP-78 desplegado.
 * 
 * ⚠️ TEMPORAL - Este es un hash de prueba.
 * 
 * Para producción, ejecuta el script deploy-cep78.ts:
 *   pnpm deploy:cep78
 * 
 * Esto generará automáticamente este archivo con el hash real del contrato.
 */

// Hash temporal para pruebas (64 caracteres hexadecimales)
// Reemplazar con el hash real después de ejecutar deploy-cep78.ts
export const CEP78_CONTRACT_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export const CEP78_PACKAGE_HASH = 'N/A';

export const CEP78_DEPLOY_HASH = 'N/A';

/**
 * Información del contrato
 */
export const CEP78_CONTRACT_INFO = {
  collectionName: 'GaslessGifterNFT',
  collectionSymbol: 'GFT',
  totalTokenSupply: 10000,
  ownershipMode: 'Transferable',
  network: 'casper-test',
  deployHash: 'N/A',
  contractHash: '0000000000000000000000000000000000000000000000000000000000000000',
  packageHash: 'N/A',
} as const;

