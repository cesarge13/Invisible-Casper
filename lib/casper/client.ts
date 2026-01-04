/**
 * Cliente de Casper para uso exclusivo en el servidor.
 * 
 * Este archivo solo debe ejecutarse en el lado del servidor (Server Components,
 * API Routes, Server Actions). NO usar variables NEXT_PUBLIC_* aquí.
 * 
 * Implementa el patrón Singleton para reutilizar una única instancia de
 * CasperClient en toda la aplicación del servidor.
 */

import { CasperClient } from 'casper-js-sdk';
import { casperConfig } from './config';

/**
 * Instancia única de CasperClient configurada con NODE_ADDRESS.
 * 
 * Se crea una sola vez al importar el módulo y se reutiliza en toda la aplicación.
 * Esto mejora el rendimiento al evitar crear múltiples conexiones al mismo nodo.
 * 
 * La configuración se valida automáticamente al importar el módulo 'config',
 * por lo que esta instancia siempre tendrá una configuración válida.
 * 
 * @see {@link https://docs.casper.network/developers/dapps/sdk/script-sdk | Casper SDK Documentation}
 * 
 * @example
 * ```typescript
 * import { casperClient } from '@/lib/casper/client';
 * 
 * // Usar directamente en Server Components o API Routes
 * const accountInfo = await casperClient.getAccountInfo(publicKey);
 * ```
 */
export const casperClient = new CasperClient(casperConfig.nodeAddress);

/**
 * Helper function para obtener la instancia de CasperClient.
 * 
 * Esta función proporciona una forma consistente de acceder al cliente,
 * aunque también puedes importar directamente 'casperClient' si prefieres.
 * 
 * @returns {CasperClient} Instancia única de CasperClient configurada
 * 
 * @example
 * ```typescript
 * import { getCasperClient } from '@/lib/casper/client';
 * 
 * // En una API Route
 * export async function GET() {
 *   const client = getCasperClient();
 *   const latestBlock = await client.getLatestBlockInfo();
 *   return Response.json({ block: latestBlock });
 * }
 * ```
 */
export function getCasperClient(): CasperClient {
  return casperClient;
}
