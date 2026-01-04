/**
 * API Route para patrocinio de deploys en Casper.
 * 
 * Este endpoint permite que el frontend envíe deploys para que sean
 * firmados y enviados por el sponsor (patrocinador).
 * 
 * Runtime: Node.js (no Edge)
 * Método: POST únicamente
 */

import { NextRequest, NextResponse } from 'next/server';
import { SponsorService } from '@/lib/casper/sponsor';

/**
 * Configuración del runtime para Node.js
 */
export const runtime = 'nodejs';

/**
 * Tipos para el request body
 */
interface SponsorRequest {
  deployJson: unknown;
  signer: string;
  signature: string;
}

/**
 * Tipos para el response exitoso
 */
interface SponsorResponse {
  deployHash: string;
}

/**
 * Tipos para el response de error
 */
interface SponsorErrorResponse {
  error: string;
}

/**
 * Handler POST para patrocinar deploys.
 * 
 * Flujo:
 * 1. Parsea el body JSON del request
 * 2. Valida que exista payload (deploy JSON)
 * 3. Instancia SponsorService
 * 4. Llama sponsorService.signAsPayerAndSubmit(deployJson)
 * 5. Retorna Response JSON con deployHash
 * 
 * @param request - Request de Next.js
 * @returns Response con deployHash o error
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SponsorResponse | SponsorErrorResponse>> {
  try {
    // Paso 1: Parsear el body JSON del request
    let body: SponsorRequest;
    
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'El body del request debe ser un JSON válido' },
        { status: 400 }
      );
    }

    // Paso 2: Validar que existan todos los campos requeridos
    if (!body.deployJson) {
      return NextResponse.json(
        { error: 'El campo deployJson es requerido en el body del request' },
        { status: 400 }
      );
    }

    if (!body.signer || typeof body.signer !== 'string') {
      return NextResponse.json(
        { error: 'El campo signer (clave pública del firmante) es requerido y debe ser un string' },
        { status: 400 }
      );
    }

    if (!body.signature || typeof body.signature !== 'string') {
      return NextResponse.json(
        { error: 'El campo signature (firma hexadecimal) es requerido y debe ser un string' },
        { status: 400 }
      );
    }

    // Validar formato de la firma (debe ser hex de 128 caracteres)
    if (!/^[0-9a-fA-F]{128}$/.test(body.signature)) {
      return NextResponse.json(
        { error: 'La signature debe ser un string hexadecimal de 128 caracteres' },
        { status: 400 }
      );
    }

    // Validar que deployJson sea un objeto o string JSON válido
    if (typeof body.deployJson !== 'object' && typeof body.deployJson !== 'string') {
      return NextResponse.json(
        { error: 'El campo deployJson debe ser un objeto JSON o un string JSON válido' },
        { status: 400 }
      );
    }

    // Paso 3: Instanciar SponsorService
    let sponsorService: SponsorService;
    
    try {
      sponsorService = new SponsorService();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al inicializar SponsorService';
      
      return NextResponse.json(
        { error: `Error de configuración: ${errorMessage}` },
        { status: 500 }
      );
    }

    // Paso 4: Llamar sponsorService.signAsPayerAndSubmit con deployJson, signer y signature
    let deployHash: string;
    
    try {
      deployHash = await sponsorService.signAsPayerAndSubmit(
        body.deployJson,
        body.signer,
        body.signature
      );
    } catch (error) {
      // Si falla la validación, firma o envío, retornar error 500 con mensaje claro
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al procesar el deploy';
      
      // No filtrar información sensible en el response (según requisitos)
      // pero asegurarse de que no exponemos claves privadas
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // Paso 5: Retornar Response JSON con deployHash
    return NextResponse.json(
      { deployHash },
      { status: 200 }
    );
  } catch (error) {
    // Manejo de errores inesperados
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error inesperado al procesar la solicitud';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

