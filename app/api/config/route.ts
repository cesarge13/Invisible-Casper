/**
 * API Route para obtener la configuración pública de Casper.
 * 
 * Solo expone información pública (no sensible).
 */

import { NextResponse } from 'next/server';
import { casperConfig } from '@/lib/casper/config';

/**
 * Configuración del runtime para Node.js
 */
export const runtime = 'nodejs';

/**
 * Handler GET para obtener la configuración pública.
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        sponsorPublicKey: casperConfig.sponsorPublicKey,
        networkName: casperConfig.networkName,
        nodeAddress: casperConfig.nodeAddress,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener la configuración' },
      { status: 500 }
    );
  }
}

