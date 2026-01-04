'use client';

/**
 * Dashboard page with Casper functionality.
 * 
 * Includes:
 * - Connected account information
 * - CSPR transfers
 * - Sponsored deploy creation and submission
 */

import { WalletNav, getCasperWallet } from "@/components/web3/WalletNav";
import { MintButton } from "@/components/web3/MintButton";
import { Logo, LogoIcon } from "@/components/Logo";
import { useState, useEffect } from "react";
import { DeployUtil, CLPublicKey } from "casper-js-sdk";
import { createTransferDeploy } from "@/lib/casper/transfer";
import Link from "next/link";

// Variable to store public configuration
let publicConfig: { sponsorPublicKey: string; networkName: string } | null = null;

export default function Dashboard() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferRecipient, setTransferRecipient] = useState<string>('');
  const [transferStatus, setTransferStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get public configuration and public key from connected wallet
  useEffect(() => {
    // Load public configuration
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
    // Only check every 30 seconds (less frequent)
    const interval = setInterval(checkWallet, 30000);
    return () => clearInterval(interval);
  }, []);

  // getCasperWallet is already imported from WalletNav

  // Get balance
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

  // Create and send transfer using the sponsorship system
  const handleTransfer = async () => {
    if (!publicKey || !transferAmount || !transferRecipient) {
      setTransferStatus('❌ Please fill in all fields');
      return;
    }

    const wallet = getCasperWallet();
    if (!wallet) {
      setTransferStatus('❌ Error: Wallet not connected');
      return;
    }

    setIsLoading(true);
    setTransferStatus('Creating transfer deploy...');

    try {
      // Validate amount
      const amount = parseFloat(transferAmount);
      if (isNaN(amount) || amount <= 0) {
        setTransferStatus('❌ Amount must be a number greater than 0');
        setIsLoading(false);
        return;
      }

      // Validate recipient public key
      try {
        CLPublicKey.fromHex(transferRecipient);
      } catch {
        setTransferStatus('❌ Recipient public key is invalid');
        setIsLoading(false);
        return;
      }

      setTransferStatus('Creating deploy...');

      // 1. Get sponsor configuration
      if (!publicConfig) {
        const configResponse = await fetch('/api/config');
        if (!configResponse.ok) {
          throw new Error('Could not get sponsor configuration');
        }
        publicConfig = await configResponse.json();
      }

      if (!publicConfig) {
        throw new Error('Could not get sponsor configuration');
      }

      // 2. Create transfer deploy (returns JSON with payer configured)
      const deployJson = createTransferDeploy(
        publicKey,
        transferRecipient,
        amount,
        publicConfig.networkName,
        publicConfig.sponsorPublicKey
      );

      setTransferStatus('Signing deploy with your wallet...');

      // 3. Rehydrate deploy from JSON to sign it
      const deployResult = DeployUtil.deployFromJson(deployJson);
      // deployFromJson returns Result<Deploy, Error>
      let deploy: DeployUtil.Deploy;
      try {
        deploy = deployResult.unwrap();
      } catch (error) {
        throw new Error(`Error creating deploy: ${error instanceof Error ? error.message : String(error)}`);
      }

      // 4. Sign deploy with user's wallet
      if (!wallet.signDeploy) {
        throw new Error('Wallet does not have signDeploy method available');
      }

      const signedDeploy = await wallet.signDeploy(deploy, publicKey);
      
      if (!signedDeploy) {
        throw new Error('Error signing deploy');
      }

      setTransferStatus('Sending sponsored deploy...');

      // 5. Convert to JSON to send to server
      const signedDeployJson = DeployUtil.deployToJson(signedDeploy);

      // 5. Send to sponsorship system
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
        throw new Error(error.error || 'Error sending deploy');
      }

      const result = await response.json();
      
      setTransferStatus(`✅ Transfer sent successfully! Hash: ${result.deployHash}`);
      
      // Clear form
      setTransferAmount('');
      setTransferRecipient('');
      
      // Update balance after a few seconds
      setTimeout(() => {
        if (publicKey) {
          fetchBalance(publicKey);
        }
      }, 3000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

        {/* Account Information */}
        {publicKey && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Account Information
            </h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Public Key:</span>
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

        {/* CSPR Transfer */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Transfer CSPR
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (CSPR)
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
                Recipient (Public Key)
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
              {isLoading ? 'Processing...' : 'Transfer'}
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
                Create and mint NFTs without paying gas fees
              </p>
            </div>
          </div>
          <MintButton 
            label="Mint NFT (Gas 0)"
            onSuccess={(hash) => {
              setTransferStatus(`✅ NFT minted successfully! Hash: ${hash}`);
              // Update balance after a few seconds
              setTimeout(() => {
                if (publicKey) {
                  fetchBalance(publicKey);
                }
              }, 3000);
            }}
            onError={(error) => {
              setTransferStatus(`❌ Error minting NFT: ${error}`);
            }}
          />
        </div>

        {/* Additional Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Available Features
          </h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>✅ Casper Wallet connection</li>
            <li>✅ Real-time balance display</li>
            <li>✅ CSPR transfers</li>
            <li>✅ Deploy sponsorship system</li>
            <li>✅ API to get account balance</li>
            <li>✅ MintButton - Gasless actions</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

