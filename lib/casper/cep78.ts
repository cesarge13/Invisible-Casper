/**
 * Utilidades para interactuar con contratos CEP-78 (NFT Standard) en Casper.
 * 
 * Este archivo puede ejecutarse tanto en cliente como en servidor.
 * 
 * CEP-78 es el estándar de NFT de Casper Network.
 * 
 * Documentación:
 * - CEP-78 Client JS: https://github.com/casper-ecosystem/cep-78-enhanced-nft/blob/dev/client-js/README.md
 * - CEP-78 Contract: https://github.com/casper-ecosystem/cep-78-enhanced-nft
 * - Casper JS SDK: https://docs.casper.network/developers/dapps/sdk/script-sdk
 * 
 * Este código sigue la especificación del cliente oficial CEP-78:
 * https://raw.githubusercontent.com/casper-ecosystem/cep-78-enhanced-nft/dev/client-js/README.md
 */

import { DeployUtil, CLPublicKey, RuntimeArgs, CLValueBuilder } from 'casper-js-sdk';

/**
 * Metadata de un NFT según CEP-78.
 * 
 * Según la documentación oficial del cliente CEP-78:
 * https://github.com/casper-ecosystem/cep-78-enhanced-nft/blob/dev/client-js/README.md#minting-a-new-token
 * 
 * El campo `tokenMetaData` es un objeto que se convierte a JSON string internamente.
 * Los campos disponibles dependen del `jsonSchema` configurado durante la instalación del contrato.
 * 
 * Ejemplo de la documentación oficial:
 * ```typescript
 * tokenMetaData: {
 *   ucid: tokenHash,
 *   ipfs_cid: 'QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR',
 *   color: 'Blue',
 * }
 * ```
 * 
 * Campos comunes (pueden variar según la configuración del contrato):
 * - name: string (comúnmente requerido)
 * - token_uri: string (opcional, URL del token)
 * - description: string (opcional)
 * - image: string (opcional, URL de la imagen)
 * - attributes: Array (opcional, atributos del NFT)
 * 
 * También se pueden incluir campos adicionales según el jsonSchema del contrato.
 */
export interface NFTMetadata {
  name: string;
  token_uri?: string;
  checksum?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  [key: string]: unknown; // Permitir campos adicionales
}

/**
 * Opciones para crear un deploy de mint de CEP-78.
 * 
 * Según la documentación oficial del cliente CEP-78:
 * https://github.com/casper-ecosystem/cep-78-enhanced-nft/blob/dev/client-js/README.md#minting
 * 
 * El método mint requiere:
 * - tokenOwner: PublicKey del dueño del NFT
 * - tokenMetaData: Objeto con la metadata del token (se convierte a JSON string internamente)
 * - tokenHash: (opcional) Hash personalizado del token
 */
export interface MintDeployOptions {
  /** Clave pública del usuario que crea el deploy (hex) */
  userPublicKey: string;
  /** Clave pública del dueño del NFT (hex, puede ser el mismo que userPublicKey) */
  tokenOwner: string;
  /** Metadata del NFT (se convertirá a JSON string según especificación CEP-78) */
  tokenMeta: NFTMetadata;
  /** Nombre de la red (ej: 'casper-test', 'testnet', 'mainnet') */
  networkName: string;
  /** Clave pública del sponsor (para configurar como payer) */
  sponsorPublicKey: string;
  /** Hash del contrato CEP-78 (opcional, se intentará importar desde contract.ts) */
  contractHash?: string;
  /** Hash personalizado del token (opcional, según documentación oficial) */
  tokenHash?: string;
}

/**
 * Intenta importar el contract hash desde contract.ts.
 * Si no existe, retorna null (el usuario deberá proporcionarlo).
 */
function getContractHash(): string | null {
  try {
    // Intentar importar dinámicamente (puede fallar si el archivo no existe)
    const contractModule = require('./contract');
    return contractModule.CEP78_CONTRACT_HASH || null;
  } catch {
    return null;
  }
}

/**
 * Crea un deploy para mintar un NFT usando el contrato CEP-78.
 * 
 * Este método sigue la especificación oficial del cliente CEP-78:
 * https://github.com/casper-ecosystem/cep-78-enhanced-nft/blob/dev/client-js/README.md#minting-a-new-token
 * 
 * Según la documentación oficial, el método mint requiere:
 * - token_owner: Key (AccountHash del dueño)
 * - token_meta_data: String (JSON metadata del token)
 * - token_hash: (opcional) String con hash personalizado del token
 * 
 * Este método:
 * 1. Crea un deploy que llama al método `mint` del contrato CEP-78 usando el SDK
 * 2. Configura los parámetros del deploy según la documentación oficial (gasPrice, ttl)
 * 3. Convierte la metadata a JSON string (según especificación CEP-78)
 * 4. Configura el payer como el sponsor (para gasless) en el header del JSON
 * 5. Retorna el deploy como DeployUtil.Deploy del SDK (para firmar directamente)
 * 
 * @param options - Opciones para crear el deploy de mint
 * @returns DeployUtil.Deploy del SDK listo para ser firmado con signDeploy()
 * 
 * @see {@link https://github.com/casper-ecosystem/cep-78-enhanced-nft/blob/dev/client-js/README.md#minting | CEP-78 Client Documentation}
 * @see {@link https://docs.casper.network/developers/dapps/sdk/script-sdk | Casper SDK Documentation}
 * 
 * @example
 * ```typescript
 * const deploy = createMintDeploy({
 *   userPublicKey: '01abc...',
 *   tokenOwner: '01abc...',
 *   tokenMeta: {
 *     name: 'My NFT',
 *     description: 'A cool NFT',
 *     image: 'https://example.com/image.png'
 *   },
 *   networkName: 'casper-test',
 *   sponsorPublicKey: '01sponsor...',
 *   tokenHash: 'my_custom_hash' // opcional
 * });
 * 
 * // Firmar directamente con la wallet
 * const signedDeploy = await wallet.signDeploy(deploy, publicKey);
 * ```
 */
export function createMintDeploy(options: MintDeployOptions): DeployUtil.Deploy {
  const {
    userPublicKey,
    tokenOwner,
    tokenMeta,
    networkName,
    sponsorPublicKey,
    contractHash: providedContractHash,
    tokenHash,
  } = options;

  // 1. Obtener el contract hash (del parámetro o del archivo contract.ts)
  const contractHash = providedContractHash || getContractHash();
  
  if (!contractHash) {
    throw new Error(
      'Contract hash no disponible. ' +
      'Por favor, ejecuta el script deploy-cep78.ts primero o proporciona el contractHash en las opciones.'
    );
  }

  // 2. Validar y crear CLPublicKey del usuario
  let userKey: CLPublicKey;
  try {
    userKey = CLPublicKey.fromHex(userPublicKey);
  } catch (error) {
    throw new Error(
      `Clave pública del usuario inválida: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // 3. Validar y crear CLPublicKey del dueño del token
  let ownerKey: CLPublicKey;
  try {
    ownerKey = CLPublicKey.fromHex(tokenOwner);
  } catch (error) {
    throw new Error(
      `Clave pública del dueño del token inválida: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // 4. Validar metadata
  if (!tokenMeta.name || typeof tokenMeta.name !== 'string' || tokenMeta.name.trim() === '') {
    throw new Error('El campo "name" es requerido en tokenMeta y debe ser un string no vacío');
  }

  // 5. Convertir metadata a JSON string (según especificación CEP-78)
  // Según la documentación oficial del cliente CEP-78:
  // https://github.com/casper-ecosystem/cep-78-enhanced-nft/blob/dev/client-js/README.md#minting-a-new-token
  // El cliente oficial recibe tokenMetaData como objeto y lo convierte internamente a JSON string.
  // Nosotros hacemos lo mismo aquí para mantener compatibilidad con el contrato.
  // 
  // Ejemplo de la documentación: tokenMetaData es un objeto con campos personalizados
  // según el jsonSchema del contrato (ej: ucid, ipfs_cid, color, etc.)
  const tokenMetaJson = JSON.stringify(tokenMeta);

  // 6. Crear parámetros del deploy
  // Según la documentación oficial de Casper SDK:
  // https://docs.casper.network/developers/dapps/sdk/script-sdk
  // DeployParams requiere: publicKey, networkName, gasPrice, ttl
  // 
  // gasPrice: Para contratos inteligentes, típicamente se usa 1
  // ttl: Tiempo de validez del deploy en milisegundos (default: 1800000 ms = 30 minutos)
  const gasPrice = 1; // Precio del gas para contratos (según documentación oficial)
  const ttl = 1800000; // 30 minutos en milisegundos (según documentación oficial)
  
  const deployParams = new DeployUtil.DeployParams(
    userKey,
    networkName,
    gasPrice,
    ttl
  );

  // 7. Crear RuntimeArgs para el método `mint` de CEP-78
  // Según la documentación oficial del cliente CEP-78:
  // https://github.com/casper-ecosystem/cep-78-enhanced-nft/blob/dev/client-js/README.md#minting-a-new-token
  // El método mint requiere:
  // - token_owner: Key (AccountHash del dueño) - REQUERIDO
  // - token_meta_data: String (JSON metadata del token) - REQUERIDO
  // - token_hash: String (opcional) - Hash personalizado del token
  // 
  // NOTA: El nombre del argumento es "token_meta_data", no "token_meta"
  const runtimeArgsMap: Record<string, any> = {
    token_owner: CLValueBuilder.key(ownerKey),
    token_meta_data: CLValueBuilder.string(tokenMetaJson),
  };
  
  // Agregar token_hash si se proporciona (opcional según documentación)
  if (tokenHash && typeof tokenHash === 'string' && tokenHash.trim() !== '') {
    runtimeArgsMap.token_hash = CLValueBuilder.string(tokenHash.trim());
  }
  
  const runtimeArgs = RuntimeArgs.fromMap(runtimeArgsMap);

  // 8. Procesar el contract hash
  // El contract hash puede venir en diferentes formatos:
  // - hash-xxx (32 bytes hex)
  // - contract-hash-xxx
  // - Solo el hash sin prefijo (64 caracteres hex)
  let cleanHash: string;
  try {
    // Remover prefijos comunes
    if (contractHash.startsWith('hash-')) {
      cleanHash = contractHash.replace('hash-', '');
    } else if (contractHash.startsWith('contract-hash-')) {
      cleanHash = contractHash.replace('contract-hash-', '');
    } else {
      cleanHash = contractHash;
    }
    
    // Validar que sea hexadecimal válido
    if (!/^[0-9a-fA-F]{64}$/.test(cleanHash)) {
      throw new Error(`Contract hash debe tener 64 caracteres hexadecimales, recibido: ${cleanHash.length} caracteres`);
    }
  } catch (error) {
    throw new Error(
      `Contract hash inválido: ${contractHash}. ` +
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // 9. Convertir el hash a Uint8Array (32 bytes)
  const contractHashBytes = Uint8Array.from(Buffer.from(cleanHash, 'hex'));

  // 10. Crear el ExecutableDeployItem para llamar al contrato
  // Según la documentación oficial de CEP-78:
  // https://docs.casper.network/resources/tokens/using-casper-client
  // Podemos invocar directamente el entrypoint "mint" usando:
  // - newStoredContractByHash (por contract hash)
  // - newStoredVersionedContractByHash (por package hash con versión)
  // 
  // Usamos newStoredContractByHash para llamar directamente al entrypoint "mint"
  // Esto es más eficiente que usar el cliente Wasm y reduce el costo de gas
  const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
    contractHashBytes,
    'mint', // Nombre del entrypoint según CEP-78
    runtimeArgs
  );

  // 11. Crear el pago estándar (fees)
  // Según la documentación oficial del cliente CEP-78:
  // https://github.com/casper-ecosystem/cep-78-enhanced-nft/blob/dev/client-js/README.md#minting-a-new-token
  // El payment amount para mint es típicamente 5_000_000_000 motes (5 CSPR)
  // Ejemplo de la documentación: paymentAmount: String(5_000_000_000)
  // 
  // NOTA: Usamos 5 CSPR según la documentación oficial del cliente
  const payment = DeployUtil.standardPayment(5_000_000_000); // 5 CSPR en motes (según documentación oficial)

  // 12. Crear el deploy completo
  // Según la documentación oficial de Casper SDK:
  // https://docs.casper.network/developers/dapps/sdk/script-sdk
  // DeployUtil.makeDeploy crea un deploy con:
  // - DeployParams (account, network, gasPrice, ttl)
  // - Session (el contrato y método a llamar)
  // - Payment (las fees)
  const deploy = DeployUtil.makeDeploy(deployParams, session, payment);

  // 13. Configurar el payer en el header del deploy
  // El payer debe configurarse en el JSON antes de firmar, pero necesitamos
  // convertirlo a JSON, modificar, y rehidratar para mantener el formato correcto
  const deployJson = DeployUtil.deployToJson(deploy);
  const deployObj = typeof deployJson === 'string' 
    ? JSON.parse(deployJson) 
    : deployJson;

  // 14. Asegurarse de que tenga estructura { deploy: {...} } que espera el SDK
  let finalDeployObj: any;
  if (deployObj.deploy) {
    finalDeployObj = deployObj;
  } else {
    finalDeployObj = { deploy: deployObj };
  }

  // 15. Establecer el payer en el header del JSON
  if (finalDeployObj.deploy && finalDeployObj.deploy.header) {
    finalDeployObj.deploy.header.payer = sponsorPublicKey;
  }

  // 16. Rehidratar el deploy desde JSON con el payer configurado
  // Esto asegura que el deploy tenga el formato correcto del SDK
  const deployResult = DeployUtil.deployFromJson(finalDeployObj);
  try {
    return deployResult.unwrap();
  } catch (error) {
    throw new Error(
      `Error al rehidratar el deploy con payer configurado: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Helper para crear metadata de NFT con campos comunes.
 * 
 * Según la documentación oficial de CEP-78:
 * https://docs.casper.network/resources/tokens/using-casper-client
 * 
 * Los campos estándar incluyen:
 * - name: string (requerido)
 * - token_uri: string (opcional, URL del token)
 * - checksum: string (opcional, hash del token)
 * 
 * @param name - Nombre del NFT (requerido)
 * @param description - Descripción del NFT (opcional)
 * @param image - URL de la imagen del NFT (opcional, se mapea a token_uri si está disponible)
 * @param attributes - Atributos adicionales del NFT (opcional)
 * @returns Objeto NFTMetadata
 */
export function createNFTMetadata(
  name: string,
  description?: string,
  image?: string,
  attributes?: Array<{ trait_type: string; value: string | number }>
): NFTMetadata {
  const metadata: NFTMetadata = { name };
  
  // Si se proporciona image, usarla como token_uri (estándar CEP-78)
  if (image) {
    metadata.token_uri = image;
    metadata.image = image; // También mantenerlo para compatibilidad
  }
  
  if (description) {
    metadata.description = description;
  }
  
  if (attributes && attributes.length > 0) {
    metadata.attributes = attributes;
  }
  
  return metadata;
}

