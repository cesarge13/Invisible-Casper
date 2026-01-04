/**
 * Utilidades para crear deploys de transferencia en Casper.
 * 
 * Este archivo puede ejecutarse tanto en cliente como en servidor.
 */

import { DeployUtil, CLPublicKey } from 'casper-js-sdk';

/**
 * Crea un deploy de transferencia de CSPR.
 * El payer se configurará en el servidor cuando se procese el deploy.
 * 
 * @param senderPublicKey - Clave pública del remitente (hex)
 * @param recipientPublicKey - Clave pública del destinatario (hex)
 * @param amountCSPR - Cantidad en CSPR (se convertirá a motes)
 * @param networkName - Nombre de la red
 * @param sponsorPublicKey - Clave pública del sponsor (para configurar en JSON)
 * @returns Objeto JSON del deploy listo para ser firmado
 */
export function createTransferDeploy(
  senderPublicKey: string,
  recipientPublicKey: string,
  amountCSPR: number,
  networkName: string,
  sponsorPublicKey: string
): any {
  // Convertir CSPR a motes (1 CSPR = 1,000,000,000 motes)
  const amountMotes = BigInt(Math.floor(amountCSPR * 1_000_000_000));

  // Crear CLPublicKey desde hex
  const senderKey = CLPublicKey.fromHex(senderPublicKey);
  const recipientKey = CLPublicKey.fromHex(recipientPublicKey);

  // Crear parámetros del deploy básicos
  const deployParams = new DeployUtil.DeployParams(
    senderKey,
    networkName
  );

  // Crear el ExecutableDeployItem para transferencia
  // newTransfer requiere 4 argumentos: amount, target, transferId, sourcePurse
  const runtimeArgs = DeployUtil.ExecutableDeployItem.newTransfer(
    amountMotes,
    recipientKey,
    null as any, // transferId (null para generar automáticamente)
    null as any  // sourcePurse (null para usar la cuenta principal)
  );

  // Crear el pago estándar (fees)
  const payment = DeployUtil.standardPayment(100_000_000_000); // 100 CSPR en motes

  // Crear el deploy completo
  const deploy = DeployUtil.makeDeploy(deployParams, runtimeArgs, payment);

  // Convertir a JSON y configurar el payer
  const deployJson = DeployUtil.deployToJson(deploy);
  const deployObj = typeof deployJson === 'string' ? JSON.parse(deployJson) : deployJson;
  
  // Establecer el payer en el header del JSON
  if (deployObj.header) {
    deployObj.header.payer = sponsorPublicKey;
    
    // Asegurarse de que TTL y timestamp sean números, no BigInt
    if (deployObj.header.ttl) {
      deployObj.header.ttl = Number(deployObj.header.ttl);
    }
    if (deployObj.header.timestamp) {
      deployObj.header.timestamp = Number(deployObj.header.timestamp);
    }
  }
  
  // Serializar y deserializar para convertir cualquier BigInt a string
  const jsonString = JSON.stringify(deployObj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
  
  return JSON.parse(jsonString);
}

/**
 * Función de compatibilidad - el payer ya se configura en createTransferDeploy.
 */
export function setDeployPayer(
  deploy: DeployUtil.Deploy,
  sponsorPublicKey: string
): DeployUtil.Deploy {
  return deploy;
}
