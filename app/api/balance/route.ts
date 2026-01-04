/**
 * API Route para obtener el balance de una cuenta en Casper.
 * 
 * Este endpoint permite obtener el balance de CSPR de una cuenta
 * usando su clave pública.
 * 
 * Runtime: Node.js (no Edge)
 * Método: GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { casperClient } from '@/lib/casper/client';
import { CLPublicKey } from 'casper-js-sdk';

/**
 * Configuración del runtime para Node.js
 */
export const runtime = 'nodejs';

/**
 * Tipos para el response exitoso
 */
interface BalanceResponse {
  balance: string; // Balance en motes
  balanceCSPR: string; // Balance en CSPR (formateado)
  publicKey: string;
}

/**
 * Tipos para el response de error
 */
interface BalanceErrorResponse {
  error: string;
}

/**
 * Handler GET para obtener el balance de una cuenta.
 * 
 * Query params:
 * - publicKey: Clave pública de la cuenta (requerido)
 * 
 * @param request - Request de Next.js
 * @returns Response con balance o error
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<BalanceResponse | BalanceErrorResponse>> {
  try {
    // Obtener publicKey de los query params
    const searchParams = request.nextUrl.searchParams;
    const publicKeyHex = searchParams.get('publicKey');

    if (!publicKeyHex) {
      return NextResponse.json(
        { error: 'El parámetro publicKey es requerido' },
        { status: 400 }
      );
    }

    // Validar y crear CLPublicKey
    let publicKey: CLPublicKey;
    try {
      publicKey = CLPublicKey.fromHex(publicKeyHex);
    } catch (error) {
      return NextResponse.json(
        { error: 'La clave pública tiene un formato inválido' },
        { status: 400 }
      );
    }

    // Obtener el balance desde la red
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
    // Manejar números grandes correctamente
    const balanceBigInt = BigInt(balanceMotes);
    const csprBalance = Number(balanceBigInt) / 1_000_000_000;
    
    // Formatear con más decimales si es necesario, pero mostrar hasta 2 decimales
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
      : 'Error inesperado al procesar la solicitud';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

