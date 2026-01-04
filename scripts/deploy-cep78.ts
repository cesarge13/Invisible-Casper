/**
 * Script para desplegar un contrato CEP-78 (NFT Standard) en Casper Testnet.
 * 
 * Este script:
 * 1. Lee las variables de entorno (SPONSOR_PRIVATE_KEY, NODE_ADDRESS, NETWORK_NAME)
 * 2. Crea un deploy de instalación del contrato CEP-78
 * 3. Firma el deploy con la clave del sponsor
 * 4. Envía el deploy a la red
 * 5. Imprime el contract hash y package hash
 * 6. Guarda el contract hash en /lib/casper/contract.ts
 * 
 * Para ejecutar:
 *   pnpm tsx scripts/deploy-cep78.ts
 * 
 * Requisitos:
 *   - Variables de entorno configuradas en .env.local
 *   - El sponsor debe tener suficiente balance para pagar los fees
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { 
  CasperClient, 
  DeployUtil, 
  Keys, 
  CLPublicKey, 
  RuntimeArgs, 
  CLValueBuilder
} from 'casper-js-sdk';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

/**
 * Carga la clave privada del sponsor desde diferentes formatos.
 * 
 * Esta función es idéntica a la de sponsor.ts para mantener consistencia.
 */
function loadSponsorKeyPair(
  privateKeyString: string,
  publicKeyHex: string
): Keys.AsymmetricKey {
  try {
    const trimmedKey = privateKeyString.trim();

    // Intentar cargar desde formato PEM
    if (trimmedKey.includes('BEGIN') || trimmedKey.includes('PRIVATE KEY')) {
      // Formato PEM - usar loadKeyPairFromPrivateFile con archivo temporal
      const tempDir = require('os').tmpdir();
      const tempFilePath = path.join(tempDir, `casper-key-${Date.now()}.pem`);
      
      try {
        // Escribir la clave PEM al archivo temporal
        fs.writeFileSync(tempFilePath, trimmedKey, 'utf8');
        
        // Convertir PEM a formato ed25519:hex primero (casper-js-sdk tiene problemas con formato EC)
        const crypto = require('crypto');
        const keyObj = crypto.createPrivateKey(trimmedKey);
        
        // Exportar clave privada
        const privateKeyDer = keyObj.export({ format: 'der', type: 'pkcs8' });
        const privateKeyBytes = privateKeyDer.slice(-32);
        
        if (privateKeyBytes.length !== 32) {
          throw new Error(`No se pudo extraer clave privada Ed25519. Longitud: ${privateKeyBytes.length}`);
        }
        
        // Derivar clave pública directamente desde la clave privada (esto asegura que coincidan)
        const publicKeyObj = crypto.createPublicKey(keyObj);
        const publicKeyDer = publicKeyObj.export({ format: 'der', type: 'spki' });
        const publicKeyBytes = publicKeyDer.slice(-32);
        
        if (publicKeyBytes.length !== 32) {
          throw new Error(`No se pudo derivar clave pública. Longitud: ${publicKeyBytes.length}`);
        }
        
        // Construir keypair usando las claves derivadas (que garantizan que coinciden)
        const keyPair = Keys.Ed25519.parseKeyPair(publicKeyBytes, privateKeyBytes);
        
        // Verificar que la clave pública derivada coincide con la proporcionada (solo para validación)
        const derivedPublicKeyHex = keyPair.publicKey.toHex();
        let expectedPublicKeyHex = publicKeyHex.toLowerCase();
        
        // Normalizar para comparar
        if (expectedPublicKeyHex.length > 64) {
          expectedPublicKeyHex = expectedPublicKeyHex.slice(-64);
        } else if (expectedPublicKeyHex.length === 66 && (expectedPublicKeyHex.startsWith('01') || expectedPublicKeyHex.startsWith('02'))) {
          expectedPublicKeyHex = expectedPublicKeyHex.substring(2);
        }
        
        const normalizedDerived = derivedPublicKeyHex.toLowerCase();
        if (normalizedDerived !== expectedPublicKeyHex) {
          console.warn(`⚠️  Advertencia: La clave pública derivada (${normalizedDerived.substring(0, 16)}...) no coincide con SPONSOR_PUBLIC_KEY (${expectedPublicKeyHex.substring(0, 16)}...).`);
          console.warn(`   Usando la clave pública derivada desde la clave privada (esto es correcto).`);
        }
        
        // Limpiar el archivo temporal
        try {
          fs.unlinkSync(tempFilePath);
        } catch {
          // Ignorar errores al eliminar el archivo temporal
        }
        
        // Validar que la clave pública coincide
        const loadedPublicKeyHex = keyPair.publicKey.toHex();
        // Normalizar para comparar (puede tener diferentes formatos)
        const normalizedLoaded = loadedPublicKeyHex.toLowerCase();
        let normalizedExpected = publicKeyHex.toLowerCase();
        
        // Remover prefijos comunes para comparar
        if (normalizedExpected.length > 64) {
          normalizedExpected = normalizedExpected.slice(-64);
        } else if (normalizedExpected.length === 66 && (normalizedExpected.startsWith('01') || normalizedExpected.startsWith('02'))) {
          normalizedExpected = normalizedExpected.substring(2);
        }
        
        // Comparar solo los últimos 64 caracteres (la clave real)
        const loadedKey = normalizedLoaded.length > 64 ? normalizedLoaded.slice(-64) : normalizedLoaded;
        const expectedKey = normalizedExpected.length > 64 ? normalizedExpected.slice(-64) : normalizedExpected;
        
        if (loadedKey !== expectedKey) {
          console.warn(`⚠️  Advertencia: La clave pública cargada puede no coincidir exactamente con SPONSOR_PUBLIC_KEY.`);
          console.warn(`   Cargada: ${loadedKey.substring(0, 16)}...`);
          console.warn(`   Esperada: ${expectedKey.substring(0, 16)}...`);
          console.warn(`   Continuando de todas formas...`);
        }
        
        return keyPair;
      } catch (error) {
        // Limpiar el archivo temporal en caso de error
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch {
          // Ignorar errores al eliminar
        }
        
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(
          'No se pudo cargar la clave privada desde formato PEM. ' +
          'Asegúrate de que el formato PEM sea válido o considera convertirla a formato ed25519:hex'
        );
      }
    }

    // Formato ed25519:hex
    if (trimmedKey.startsWith('ed25519:')) {
      const hexKey = trimmedKey.replace('ed25519:', '');
      const privateKeyBytes = Buffer.from(hexKey, 'hex');
      
      if (privateKeyBytes.length !== 32) {
        throw new Error(`Clave privada inválida. Longitud: ${privateKeyBytes.length}, esperado: 32 bytes`);
      }
      
      // Derivar la clave pública desde la clave privada usando @noble/ed25519
      try {
        const ed25519 = require('@noble/ed25519');
        const crypto = require('crypto');
        
        // Configurar SHA512 para @noble/ed25519
        ed25519.utils.sha512Sync = (...m: any[]) => {
          const hasher = crypto.createHash('sha512');
          for (const msg of m) {
            hasher.update(Buffer.from(msg));
          }
          return hasher.digest();
        };
        
        const publicKeyBytes = Buffer.from(ed25519.getPublicKey(privateKeyBytes));
        
        if (publicKeyBytes.length !== 32) {
          throw new Error(`Clave pública derivada inválida. Longitud: ${publicKeyBytes.length}`);
        }
        
        // Crear el keypair con las claves que sabemos que coinciden
        const keyPair = Keys.Ed25519.parseKeyPair(publicKeyBytes, privateKeyBytes);
        
        // Validar contra la clave pública proporcionada (solo advertencia)
        let cleanPublicKeyHex = publicKeyHex.toLowerCase();
        if (cleanPublicKeyHex.length > 64) {
          cleanPublicKeyHex = cleanPublicKeyHex.slice(-64);
        } else if (cleanPublicKeyHex.length === 66 && (cleanPublicKeyHex.startsWith('01') || cleanPublicKeyHex.startsWith('02'))) {
          cleanPublicKeyHex = cleanPublicKeyHex.substring(2);
        }
        
        const derivedPublicKeyHex = keyPair.publicKey.toHex().toLowerCase();
        if (derivedPublicKeyHex !== cleanPublicKeyHex) {
          console.warn(`⚠️  Advertencia: La clave pública derivada no coincide con SPONSOR_PUBLIC_KEY.`);
          console.warn(`   Derivada: ${derivedPublicKeyHex.substring(0, 16)}...`);
          console.warn(`   Esperada: ${cleanPublicKeyHex.substring(0, 16)}...`);
          console.warn(`   Esto significa que la clave privada y pública no corresponden al mismo par.`);
          console.warn(`   Usando la clave pública derivada desde la clave privada (esto es correcto).`);
        }
        
        return keyPair;
      } catch (nobleError) {
        // Si @noble/ed25519 no está disponible, intentar usar la clave pública proporcionada
        console.warn(`⚠️  No se pudo derivar clave pública con @noble/ed25519: ${nobleError instanceof Error ? nobleError.message : String(nobleError)}`);
        console.warn(`   Intentando usar la clave pública proporcionada directamente...`);
        
        let cleanPublicKeyHex = publicKeyHex;
        if (cleanPublicKeyHex.length > 64) {
          cleanPublicKeyHex = cleanPublicKeyHex.slice(-64);
        } else if (cleanPublicKeyHex.length === 66 && (cleanPublicKeyHex.startsWith('01') || cleanPublicKeyHex.startsWith('02'))) {
          cleanPublicKeyHex = cleanPublicKeyHex.substring(2);
        }
        
        const publicKeyBytes = Buffer.from(cleanPublicKeyHex, 'hex');
        return Keys.Ed25519.parseKeyPair(publicKeyBytes, privateKeyBytes);
      }
    }

    // Hexadecimal directo
    if (/^[0-9a-fA-F]+$/.test(trimmedKey)) {
      const privateKeyBytes = Buffer.from(trimmedKey, 'hex');
      const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
      return Keys.Ed25519.parseKeyPair(publicKeyBytes, privateKeyBytes);
    }

    throw new Error('Formato de clave privada no reconocido');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Error al cargar la clave privada: ${String(error)}`);
  }
}

/**
 * Crea los RuntimeArgs para instalar el contrato CEP-78.
 */
function createCEP78InstallArgs(): RuntimeArgs {
  // Crear un objeto Record para los argumentos de instalación
  const installArgs: Record<string, any> = {};

  // collection_name: String
  installArgs['collection_name'] = CLValueBuilder.string('GaslessGifterNFT');

  // collection_symbol: String
  installArgs['collection_symbol'] = CLValueBuilder.string('GFT');

  // total_token_supply: U256 (número razonable, ej: 10,000)
  installArgs['total_token_supply'] = CLValueBuilder.u256(10000);

  // ownership_mode: U8 (0 = Transferable, 1 = Minter, 2 = Owned)
  // Transferable = 0
  installArgs['ownership_mode'] = CLValueBuilder.u8(0);

  // Crear RuntimeArgs desde el Record
  return RuntimeArgs.fromMap(installArgs);
}

/**
 * Función principal para desplegar el contrato CEP-78.
 */
async function deployCEP78() {
  try {
    // 1. Leer variables de entorno
    const nodeAddress = process.env.NODE_ADDRESS?.trim();
    const networkName = process.env.NETWORK_NAME?.trim();
    const sponsorPublicKey = process.env.SPONSOR_PUBLIC_KEY?.trim();
    
    // 2. Leer la clave privada directamente del archivo .env.local
    // (dotenv puede tener problemas con valores multi-línea en PEM)
    const envPath = path.join(process.cwd(), '.env.local');
    let sponsorPrivateKey: string | undefined;
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      // Buscar SPONSOR_PRIVATE_KEY y leer hasta encontrar la siguiente variable o fin de archivo
      const keyMatch = envContent.match(/SPONSOR_PRIVATE_KEY=(.*?)(?=\n[A-Z_][A-Z0-9_]*=|$)/s);
      if (keyMatch && keyMatch[1]) {
        sponsorPrivateKey = keyMatch[1].trim();
      }
    }
    
    // Fallback a process.env si no se pudo leer del archivo
    if (!sponsorPrivateKey) {
      sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY;
      if (sponsorPrivateKey && sponsorPrivateKey.includes('BEGIN')) {
        sponsorPrivateKey = sponsorPrivateKey.replace(/\\n/g, '\n');
      } else if (sponsorPrivateKey) {
        sponsorPrivateKey = sponsorPrivateKey.trim();
      }
    }

    if (!nodeAddress || !networkName || !sponsorPublicKey || !sponsorPrivateKey) {
      throw new Error(
        'Faltan variables de entorno requeridas:\n' +
        '  - NODE_ADDRESS\n' +
        '  - NETWORK_NAME\n' +
        '  - SPONSOR_PUBLIC_KEY\n' +
        '  - SPONSOR_PRIVATE_KEY\n' +
        '\nAsegúrate de tenerlas configuradas en .env.local'
      );
    }

    console.log('📋 Configuración:');
    console.log(`   NODE_ADDRESS: ${nodeAddress}`);
    console.log(`   NETWORK_NAME: ${networkName}`);
    console.log(`   SPONSOR_PUBLIC_KEY: ${sponsorPublicKey.substring(0, 20)}...`);
    console.log('');

    // 2. Crear cliente de Casper
    const casperClient = new CasperClient(nodeAddress);

    // 3. Cargar clave del sponsor
    console.log('🔑 Cargando clave del sponsor...');
    const sponsorKeyPair = loadSponsorKeyPair(sponsorPrivateKey, sponsorPublicKey);
    const sponsorPublicKeyObj = CLPublicKey.fromHex(sponsorPublicKey);
    console.log('✅ Clave cargada correctamente');
    console.log('');

    // 4. Crear parámetros del deploy
    console.log('📦 Creando deploy de instalación...');
    const deployParams = new DeployUtil.DeployParams(
      sponsorPublicKeyObj,
      networkName
    );

    // 5. Crear RuntimeArgs para la instalación
    const installArgs = createCEP78InstallArgs();
    console.log('✅ Argumentos de instalación creados:');
    console.log('   - collection_name: GaslessGifterNFT');
    console.log('   - collection_symbol: GFT');
    console.log('   - total_token_supply: 10000');
    console.log('   - ownership_mode: Transferable (0)');
    console.log('');

    // 6. Crear el ExecutableDeployItem para instalación
    // NOTA: Para CEP-78, necesitarías el código WASM del contrato
    // Por ahora, creamos un deploy genérico que el usuario debe completar
    // con el código WASM real del contrato CEP-78
    
    // IMPORTANTE: Necesitas el archivo WASM del contrato CEP-78
    // Puedes obtenerlo de: https://github.com/casper-ecosystem/cep-78-enhanced-nft
    const wasmPath = path.join(process.cwd(), 'contracts', 'cep78.wasm');
    
    if (!fs.existsSync(wasmPath)) {
      throw new Error(
        `No se encontró el archivo WASM del contrato en: ${wasmPath}\n` +
        'Por favor, descarga el contrato CEP-78 desde:\n' +
        'https://github.com/casper-ecosystem/cep-78-enhanced-nft\n' +
        'Y colócalo en la carpeta contracts/cep78.wasm'
      );
    }

    const wasmBytes = fs.readFileSync(wasmPath);
    const session = DeployUtil.ExecutableDeployItem.newModuleBytes(
      wasmBytes,
      installArgs
    );

    // 7. Crear el pago estándar (fees)
    const payment = DeployUtil.standardPayment(50000000000); // 50 CSPR en motes

    // 8. Crear el deploy completo
    const deploy = DeployUtil.makeDeploy(deployParams, session, payment);

    // 9. Firmar el deploy
    console.log('✍️  Firmando deploy...');
    const signedDeploy = DeployUtil.signDeploy(deploy, sponsorKeyPair);
    console.log('✅ Deploy firmado');
    console.log('');

    // 10. Enviar el deploy a la red
    console.log('📤 Enviando deploy a la red...');
    const deployHash = await casperClient.putDeploy(signedDeploy);
    console.log(`✅ Deploy enviado exitosamente!`);
    console.log(`   Deploy Hash: ${deployHash}`);
    console.log('');

    // 11. Esperar a que el deploy se procese y obtener el contract hash
    console.log('⏳ Esperando procesamiento del deploy...');
    console.log('   (Esto puede tomar varios segundos)');
    console.log('   NOTA: El script esperará hasta 60 segundos para obtener el contract hash.');
    console.log('   Si no se obtiene automáticamente, consulta el deploy en el explorador.');
    console.log('');
    
    let contractHash: string | null = null;
    let packageHash: string | null = null;
    
    // Intentar obtener el resultado del deploy
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
      
      try {
        const [deploy, deployResult] = await casperClient.getDeploy(deployHash);
        
        if (deployResult.execution_results && deployResult.execution_results.length > 0) {
          const executionResult = deployResult.execution_results[0];
          
          if (executionResult.result.Success) {
            const transforms = executionResult.result.Success.effect.transforms;
            
            // Buscar el contract hash en los transforms
            for (const transform of transforms) {
              if (transform.transform && typeof transform.transform === 'object') {
                if ('WriteContract' in transform.transform) {
                  const writeContract = (transform.transform as any).WriteContract;
                  contractHash = writeContract.contract_package_hash || writeContract.contract_hash;
                }
                if ('WriteContractPackage' in transform.transform) {
                  const writePackage = (transform.transform as any).WriteContractPackage;
                  packageHash = writePackage.hash;
                }
              }
            }
            
            if (contractHash || packageHash) {
              break;
            }
          } else if (executionResult.result.Failure) {
            throw new Error(`Deploy falló: ${JSON.stringify(executionResult.result.Failure)}`);
          }
        }
      } catch (error) {
        // Continuar intentando
        if (i === 29) {
          console.warn('⚠️  No se pudo obtener el contract hash automáticamente.');
          console.warn('   Por favor, consulta el deploy hash en el explorador:');
          console.warn(`   https://testnet.cspr.live/deploy/${deployHash}`);
          console.warn('   Una vez que tengas el contract hash, puedes guardarlo manualmente en lib/casper/contract.ts');
        }
      }
    }

    // 12. Imprimir resultados
    console.log('');
    console.log('🎉 ¡Deploy completado!');
    console.log('');
    console.log('📊 Resultados:');
    console.log(`   Deploy Hash: ${deployHash}`);
    if (contractHash) {
      console.log(`   Contract Hash: ${contractHash}`);
    }
    if (packageHash) {
      console.log(`   Package Hash: ${packageHash}`);
    }
    console.log('');

    // 13. Guardar el contract hash en /lib/casper/contract.ts
    if (contractHash) {
      const contractFilePath = path.join(process.cwd(), 'lib', 'casper', 'contract.ts');
      const contractFileContent = `/**
 * Hash del contrato CEP-78 desplegado.
 * 
 * Este archivo se genera automáticamente por el script deploy-cep78.ts
 * 
 * Contract: GaslessGifterNFT (GFT)
 * Deploy Hash: ${deployHash}
 * Fecha: ${new Date().toISOString()}
 */

export const CEP78_CONTRACT_HASH = '${contractHash}';

export const CEP78_PACKAGE_HASH = '${packageHash || 'N/A'}';

export const CEP78_DEPLOY_HASH = '${deployHash}';

/**
 * Información del contrato
 */
export const CEP78_CONTRACT_INFO = {
  collectionName: 'GaslessGifterNFT',
  collectionSymbol: 'GFT',
  totalTokenSupply: 10000,
  ownershipMode: 'Transferable',
  network: '${networkName}',
  deployHash: '${deployHash}',
  contractHash: '${contractHash}',
  packageHash: '${packageHash || 'N/A'}',
} as const;
`;

      // Asegurarse de que el directorio existe
      const contractDir = path.dirname(contractFilePath);
      if (!fs.existsSync(contractDir)) {
        fs.mkdirSync(contractDir, { recursive: true });
      }

      fs.writeFileSync(contractFilePath, contractFileContent, 'utf8');
      console.log(`✅ Contract hash guardado en: ${contractFilePath}`);
      console.log('');
    }

    console.log('🔗 Enlaces útiles:');
    console.log(`   Explorador: https://testnet.cspr.live/deploy/${deployHash}`);
    if (contractHash) {
      console.log(`   Contract: https://testnet.cspr.live/contract/${contractHash}`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error al desplegar el contrato:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  }
}

// Ejecutar el script
deployCEP78();

