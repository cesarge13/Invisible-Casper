/**
 * Script para generar un nuevo par de claves Ed25519 para el sponsor.
 * 
 * Ejecutar con: npx tsx scripts/generate-sponsor-keys.ts
 * 
 * Este script genera un par de claves Ed25519 válido para usar como sponsor.
 * Las claves se muestran en la consola para que puedas copiarlas a tu .env.local
 */

import { Keys } from 'casper-js-sdk';

console.log('🔑 Generando nuevo par de claves Ed25519 para el sponsor...\n');

try {
  // Generar nuevo par de claves Ed25519
  const keyPair = Keys.Ed25519.new();

  // Obtener la clave pública en formato hex
  const publicKeyHex = keyPair.publicKey.toHex();

  // Obtener la clave privada en formato hex
  const privateKeyBytes = keyPair.privateKey;
  const privateKeyHex = Buffer.from(privateKeyBytes).toString('hex');

  console.log('✅ Par de claves generado exitosamente!\n');
  console.log('📋 Copia estas líneas a tu archivo .env.local:\n');
  console.log('─'.repeat(80));
  console.log(`SPONSOR_PUBLIC_KEY=${publicKeyHex}`);
  console.log(`SPONSOR_PRIVATE_KEY=ed25519:${privateKeyHex}`);
  console.log('─'.repeat(80));
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   1. Guarda estas claves de forma segura');
  console.log('   2. NO las compartas ni las subas a git');
  console.log('   3. Asegúrate de tener CSPR en la cuenta del sponsor para pagar fees');
  console.log(`   4. La clave pública es: ${publicKeyHex}`);
  console.log(`\n💡 Para obtener CSPR en testnet, visita: https://testnet.cspr.live/`);
  console.log(`   O usa el faucet: https://testnet.cspr.live/tools/faucet`);
} catch (error) {
  console.error('❌ Error al generar las claves:', error);
  process.exit(1);
}

