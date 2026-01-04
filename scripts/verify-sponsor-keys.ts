/**
 * Script para verificar que las claves del sponsor son un par válido.
 * 
 * Ejecutar con: npx tsx scripts/verify-sponsor-keys.ts
 */

import { Keys, CLPublicKey } from 'casper-js-sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar variables de entorno
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('❌ No se encontró .env.local');
  process.exit(1);
}

const sponsorPublicKey = process.env.SPONSOR_PUBLIC_KEY?.trim();
const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY?.trim();

if (!sponsorPublicKey || !sponsorPrivateKey) {
  console.error('❌ SPONSOR_PUBLIC_KEY o SPONSOR_PRIVATE_KEY no están definidas en .env.local');
  process.exit(1);
}

console.log('🔍 Verificando par de claves del sponsor...\n');
console.log(`Clave pública: ${sponsorPublicKey.substring(0, 20)}...`);
console.log(`Clave privada: ${sponsorPrivateKey.substring(0, 20)}...\n`);

try {
  // Cargar la clave privada
  let keyPair: Keys.AsymmetricKey;
  
  if (sponsorPrivateKey.startsWith('ed25519:')) {
    const hexKey = sponsorPrivateKey.replace('ed25519:', '');
    const privateKeyBytes = Buffer.from(hexKey, 'hex');
    const publicKeyBytes = Buffer.from(sponsorPublicKey, 'hex');
    keyPair = Keys.Ed25519.parseKeyPair(publicKeyBytes, privateKeyBytes);
  } else if (sponsorPrivateKey.includes('BEGIN') || sponsorPrivateKey.includes('PRIVATE KEY')) {
    // Formato PEM
    const os = require('os');
    const tempFilePath = path.join(os.tmpdir(), `casper-key-verify-${Date.now()}.pem`);
    try {
      fs.writeFileSync(tempFilePath, sponsorPrivateKey, 'utf8');
      keyPair = Keys.Ed25519.loadKeyPairFromPrivateFile(tempFilePath);
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  } else {
    // Hexadecimal directo
    const privateKeyBytes = Buffer.from(sponsorPrivateKey, 'hex');
    const publicKeyBytes = Buffer.from(sponsorPublicKey, 'hex');
    keyPair = Keys.Ed25519.parseKeyPair(publicKeyBytes, privateKeyBytes);
  }
  
  // Verificar que la clave pública coincide
  const loadedPublicKeyHex = keyPair.publicKey.toHex();
  const expectedPublicKeyHex = sponsorPublicKey.toLowerCase();
  
  console.log(`Clave pública cargada: ${loadedPublicKeyHex}`);
  console.log(`Clave pública esperada: ${expectedPublicKeyHex}\n`);
  
  if (loadedPublicKeyHex.toLowerCase() === expectedPublicKeyHex.toLowerCase()) {
    console.log('✅ Las claves son un par válido!');
    console.log(`✅ La clave pública coincide: ${loadedPublicKeyHex}`);
  } else {
    console.error('❌ Las claves NO son un par válido!');
    console.error(`   Clave pública cargada: ${loadedPublicKeyHex}`);
    console.error(`   Clave pública esperada: ${expectedPublicKeyHex}`);
    console.error('\n💡 Solución: Genera un nuevo par de claves ejecutando:');
    console.error('   npx tsx scripts/generate-sponsor-keys.ts');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error al verificar las claves:', error instanceof Error ? error.message : String(error));
  console.error('\n💡 Posibles causas:');
  console.error('   1. La clave privada es EC (secp256k1) pero la pública es Ed25519');
  console.error('   2. El formato de la clave privada no es válido');
  console.error('   3. Las claves no corresponden al mismo par');
  console.error('\n💡 Solución: Genera un nuevo par de claves ejecutando:');
  console.error('   npx tsx scripts/generate-sponsor-keys.ts');
  process.exit(1);
}

