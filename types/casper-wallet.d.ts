/**
 * Tipos TypeScript para la API de Casper Wallet (Casper Signer)
 * 
 * La extensión Casper Wallet expone su API globalmente como window.casperlabsHelper
 */

interface CasperLabsHelper {
  /**
   * Verifica si la wallet está conectada a la aplicación
   * @returns Promise que resuelve a true si está conectada, false en caso contrario
   */
  isConnected: () => Promise<boolean>;

  /**
   * Obtiene la clave pública activa de la wallet conectada
   * @returns Promise que resuelve a la clave pública o null si no hay conexión
   */
  getActivePublicKey: () => Promise<string | null>;

  /**
   * Solicita conexión con la wallet
   * Abre un popup en la extensión para que el usuario apruebe la conexión
   * @returns Promise que puede resolver a la clave pública o void
   */
  requestConnection: () => Promise<string | null | void>;

  /**
   * Firma un mensaje con la clave privada de la wallet
   * @param message - Mensaje a firmar
   * @param signingPublicKey - Clave pública con la que firmar
   * @returns Promise que resuelve a la firma
   */
  sign: (message: string, signingPublicKey: string) => Promise<string>;

  /**
   * Firma un deploy de Casper
   * @param deploy - Deploy a firmar
   * @param signingPublicKey - Clave pública con la que firmar
   * @returns Promise que resuelve al deploy firmado
   */
  signDeploy?: (deploy: unknown, signingPublicKey: string) => Promise<unknown>;
}

declare global {
  interface Window {
    /**
     * API de Casper Wallet (Casper Signer) expuesta globalmente
     * Disponible cuando la extensión está instalada
     */
    casperlabsHelper?: CasperLabsHelper;
    
    /**
     * CasperWalletProvider - Constructor oficial de la API de Casper Wallet
     * Según la documentación oficial: https://docs.casper.network/next/developers/dapps/template-frontend
     */
    CasperWalletProvider?: new (options?: { timeout?: number }) => CasperLabsHelper;
  }
}

export {};

