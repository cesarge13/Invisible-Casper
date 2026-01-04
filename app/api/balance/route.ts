/**
 * API Route to get account balance on Casper.
 * 
 * This endpoint allows getting the CSPR balance of an account
 * using its public key.
 * 
 * Runtime: Node.js (not Edge)
 * Method: GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { casperClient } from '@/lib/casper/client';
import { CLPublicKey } from 'casper-js-sdk';

/**
 * Runtime configuration for Node.js
 */
export const runtime = 'nodejs';

/**
 * Types for successful response
 */
interface BalanceResponse {
  balance: string; // Balance in motes
  balanceCSPR: string; // Balance in CSPR (formatted)
  publicKey: string;
}

/**
 * Types for error response
 */
interface BalanceErrorResponse {
  error: string;
}

/**
 * GET handler to get account balance.
 * 
 * Query params:
 * - publicKey: Account public key (required)
 * 
 * @param request - Next.js request
 * @returns Response with balance or error
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<BalanceResponse | BalanceErrorResponse>> {
  try {
    // Get publicKey from query params
    const searchParams = request.nextUrl.searchParams;
    const publicKeyHex = searchParams.get('publicKey');

    if (!publicKeyHex) {
      return NextResponse.json(
        { error: 'publicKey parameter is required' },
        { status: 400 }
      );
    }

    // Validate and create CLPublicKey
    let publicKey: CLPublicKey;
    try {
      publicKey = CLPublicKey.fromHex(publicKeyHex);
    } catch (error) {
      return NextResponse.json(
        { error: 'Public key has invalid format' },
        { status: 400 }
      );
    }

    // Get balance from network
    let balanceMotes: string;
    try {
      const balanceResult = await casperClient.balanceOfByPublicKey(publicKey);
      
      // balanceOfByPublicKey puede retornar BigNumber, string, o number
      // Convertir a string primero
      if (typeof balanceResult === 'object' && balanceResult !== null) {
        // Es un BigNumber o similar
        if ('toString' in balanceResult && typeof balanceResult.toString === 'function') {
          balanceMotes = balanceResult.toString();
        } else if ('toNumber' in balanceResult && typeof balanceResult.toNumber === 'function') {
          balanceMotes = balanceResult.toNumber().toString();
        } else {
          balanceMotes = String(balanceResult);
        }
      } else {
        balanceMotes = String(balanceResult);
      }
    } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Unknown error getting balance';
        
        return NextResponse.json(
          { error: `Error getting balance: ${errorMessage}` },
          { status: 500 }
        );
      }

    // Convert motes to CSPR (1 CSPR = 1,000,000,000 motes)
    // Handle large numbers correctly
    const balanceBigInt = BigInt(balanceMotes);
    const csprBalance = Number(balanceBigInt) / 1_000_000_000;
    
    // Format with more decimals if needed, but show up to 2 decimal places
    const balanceCSPR = csprBalance.toFixed(2);

    return NextResponse.json(
      {
        balance: balanceMotes,
        balanceCSPR,
        publicKey: publicKeyHex,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unexpected error processing request';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

