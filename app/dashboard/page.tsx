'use client';

/**
 * Página de dashboard con funcionalidades de Casper.
 * 
 * Incluye:
 * - Información de la cuenta conectada
 * - Transferencias de CSPR
 * - Creación y envío de deploys patrocinados
 */

import { WalletNav, getCasperWallet } from "@/components/web3/WalletNav";
import { MintButton } from "@/components/web3/MintButton";
import { Logo, LogoIcon } from "@/components/Logo";
import { useState, useEffect } from "react";
import { DeployUtil, CLPublicKey } from "casper-js-sdk";
import { createTransferDeploy } from "@/lib/casper/transfer";
import Link from "next/link";

// Variable para almacenar la configuración pública
let publicConfig: { sponsorPublicKey: string; networkName: string } | null = null;

export default function Dashboard() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferRecipient, setTransferRecipient] = useState<string>('');
  const [transferStatus, setTransferStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Obtener configuración pública y public key de la wallet conectada
  useEffect(() => {
    // Cargar configuración pública
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          publicConfig = await response.json();
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };
    loadConfig();

    const checkWallet = async () => {
      const wallet = getCasperWallet();
      if (wallet) {
        try {
          const connected = await wallet.isConnected();
          if (connected) {
            const activeKey = await wallet.getActivePublicKey();
            if (activeKey) {
              setPublicKey(activeKey);
              fetchBalance(activeKey);
            }
          }
        } catch (error) {
          console.error('Error checking wallet:', error);
        }
      }
    };

    checkWallet();
    // Solo verificar cada 30 segundos (menos frecuente)
    const interval = setInterval(checkWallet, 30000);
    return () => clearInterval(interval);
  }, []);

  // getCasperWallet ya está importado desde WalletNav

  // Obtener balance
  const fetchBalance = async (publicKeyToFetch: string) => {
    try {
      const response = await fetch(`/api/balance?publicKey=${encodeURIComponent(publicKeyToFetch)}`);
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balanceCSPR || '0.00');
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  // Crear y enviar transferencia usando el sistema de patrocinio
  const handleTransfer = async () => {
    if (!publicKey || !transferAmount || !transferRecipient) {
      setTransferStatus('❌ Por favor completa todos los campos');
      return;
    }

    const wallet = getCasperWallet();
    if (!wallet) {
      setTransferStatus('❌ Error: Wallet no conectada');
      return;
    }

    setIsLoading(true);
    setTransferStatus('Creando deploy de transferencia...');

    try {
      // Validar cantidad
      const amount = parseFloat(transferAmount);
      if (isNaN(amount) || amount <= 0) {
        setTransferStatus('❌ La cantidad debe ser un número mayor a 0');
        setIsLoading(false);
        return;
      }

      // Validar clave pública del destinatario
      try {
        CLPublicKey.fromHex(transferRecipient);
      } catch {
        setTransferStatus('❌ La clave pública del destinatario no es válida');
        setIsLoading(false);
        return;
      }

      setTransferStatus('Creando deploy...');

      // 1. Obtener la configuración del sponsor
      if (!publicConfig) {
        const configResponse = await fetch('/api/config');
        if (!configResponse.ok) {
          throw new Error('No se pudo obtener la configuración del sponsor');
        }
        publicConfig = await configResponse.json();
      }

      if (!publicConfig) {
        throw new Error('No se pudo obtener la configuración del sponsor');
      }

      // 2. Crear el deploy de transferencia (retorna JSON con payer configurado)
      const deployJson = createTransferDeploy(
        publicKey,
        transferRecipient,
        amount,
        publicConfig.networkName,
        publicConfig.sponsorPublicKey
      );

      setTransferStatus('Firmando deploy con tu wallet...');

      // 3. Rehidratar el deploy desde JSON para firmarlo
      const deployResult = DeployUtil.deployFromJson(deployJson);
      // deployFromJson retorna Result<Deploy, Error>
      let deploy: DeployUtil.Deploy;
      try {
        deploy = deployResult.unwrap();
      } catch (error) {
        throw new Error(`Error al crear el deploy: ${error instanceof Error ? error.message : String(error)}`);
      }

      // 4. Firmar el deploy con la wallet del usuario
      if (!wallet.signDeploy) {
        throw new Error('La wallet no tiene el método signDeploy disponible');
      }

      const signedDeploy = await wallet.signDeploy(deploy, publicKey);
      
      if (!signedDeploy) {
        throw new Error('Error al firmar el deploy');
      }

      setTransferStatus('Enviando deploy patrocinado...');

      // 5. Convertir a JSON para enviar al servidor
      const signedDeployJson = DeployUtil.deployToJson(signedDeploy);

      // 5. Enviar al sistema de patrocinio
      const response = await fetch('/api/sponsor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployJson: signedDeployJson,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar el deploy');
      }

      const result = await response.json();
      
      setTransferStatus(`✅ Transferencia enviada exitosamente! Hash: ${result.deployHash}`);
      
      // Limpiar formulario
      setTransferAmount('');
      setTransferRecipient('');
      
      // Actualizar balance después de unos segundos
      setTimeout(() => {
        if (publicKey) {
          fetchBalance(publicKey);
        }
      }, 3000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setTransferStatus(`❌ Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20 dark:from-gray-900 dark:via-indigo-950/20 dark:to-purple-950/20 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size="lg" />
          </Link>
          <WalletNav />
        </div>

        {/* Información de la cuenta */}
        {publicKey && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Información de la Cuenta
            </h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Clave Pública:</span>
                <p className="font-mono text-sm break-all text-gray-900 dark:text-white">
                  {publicKey}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {balance} CSPR
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transferencia de CSPR */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Transferir CSPR
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cantidad (CSPR)
              </label>
              <input
                type="number"
                step="0.000000001"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0.0"
                disabled={isLoading || !publicKey}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destinatario (Clave Pública)
              </label>
              <input
                type="text"
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                placeholder="01ab..."
                disabled={isLoading || !publicKey}
              />
            </div>
            <button
              onClick={handleTransfer}
              disabled={isLoading || !publicKey || !transferAmount || !transferRecipient}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? 'Procesando...' : 'Transferir'}
            </button>
            {transferStatus && (
              <div className={`p-3 rounded-lg text-sm ${
                transferStatus.includes('✅') 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : transferStatus.includes('❌')
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {transferStatus}
              </div>
            )}
          </div>
        </div>

        {/* MintButton - NFT Mint Gasless */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border-l-4" style={{ borderLeftColor: '#6366f1' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
              <LogoIcon size="sm" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                NFT Mint (Gasless)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Crea y mintea NFTs sin pagar fees de gas
              </p>
            </div>
          </div>
          <MintButton 
            label="Mint NFT (Gas 0)"
            onSuccess={(hash) => {
              setTransferStatus(`✅ NFT minted exitosamente! Hash: ${hash}`);
              // Actualizar balance después de unos segundos
              setTimeout(() => {
                if (publicKey) {
                  fetchBalance(publicKey);
                }
              }, 3000);
            }}
            onError={(error) => {
              setTransferStatus(`❌ Error al mintear NFT: ${error}`);
            }}
          />
        </div>

        {/* Información adicional */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Funcionalidades Disponibles
          </h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>✅ Conexión con Casper Wallet</li>
            <li>✅ Visualización de balance en tiempo real</li>
            <li>✅ Transferencias de CSPR</li>
            <li>✅ Sistema de patrocinio de deploys</li>
            <li>✅ API para obtener balance de cuentas</li>
            <li>✅ MintButton - Acciones gasless</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

