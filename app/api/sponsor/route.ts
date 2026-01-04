/**
 * API Route for sponsoring deploys on Casper.
 * 
 * This endpoint allows the frontend to send deploys to be
 * signed and submitted by the sponsor.
 * 
 * Runtime: Node.js (not Edge)
 * Method: POST only
 */

import { NextRequest, NextResponse } from 'next/server';
import { SponsorService } from '@/lib/casper/sponsor';

/**
 * Runtime configuration for Node.js
 */
export const runtime = 'nodejs';

/**
 * Types for request body
 */
interface SponsorRequest {
  deployJson: unknown;
  signer: string;
  signature: string;
}

/**
 * Types for successful response
 */
interface SponsorResponse {
  deployHash: string;
}

/**
 * Types for error response
 */
interface SponsorErrorResponse {
  error: string;
}

/**
 * POST handler to sponsor deploys.
 * 
 * Flow:
 * 1. Parse request body JSON
 * 2. Validate that payload (deploy JSON) exists
 * 3. Instantiate SponsorService
 * 4. Call sponsorService.signAsPayerAndSubmit(deployJson, signer, signature)
 * 5. Return JSON Response with deployHash
 * 
 * @param request - Next.js request
 * @returns Response with deployHash or error
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
        { error: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    // Step 2: Validate that all required fields exist
    if (!body.deployJson) {
      return NextResponse.json(
        { error: 'deployJson field is required in request body' },
        { status: 400 }
      );
    }

    if (!body.signer || typeof body.signer !== 'string') {
      return NextResponse.json(
        { error: 'signer field (signer public key) is required and must be a string' },
        { status: 400 }
      );
    }

    if (!body.signature || typeof body.signature !== 'string') {
      return NextResponse.json(
        { error: 'signature field (hexadecimal signature) is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate signature format (must be 128 character hex)
    if (!/^[0-9a-fA-F]{128}$/.test(body.signature)) {
      return NextResponse.json(
        { error: 'Signature must be a 128 character hexadecimal string' },
        { status: 400 }
      );
    }

    // Validate that deployJson is an object or valid JSON string
    if (typeof body.deployJson !== 'object' && typeof body.deployJson !== 'string') {
      return NextResponse.json(
        { error: 'deployJson field must be a JSON object or valid JSON string' },
        { status: 400 }
      );
    }

    // Step 3: Instantiate SponsorService
    let sponsorService: SponsorService;
    
    try {
      sponsorService = new SponsorService();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error initializing SponsorService';
      
      return NextResponse.json(
        { error: `Configuration error: ${errorMessage}` },
        { status: 500 }
      );
    }

    // Step 4: Call sponsorService.signAsPayerAndSubmit with deployJson, signer and signature
    let deployHash: string;
    
    try {
      deployHash = await sponsorService.signAsPayerAndSubmit(
        body.deployJson,
        body.signer,
        body.signature
      );
    } catch (error) {
      // If validation, signing or submission fails, return 500 error with clear message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error processing deploy';
      
      // Do not filter sensitive information in response (per requirements)
      // but ensure we don't expose private keys
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // Step 5: Return JSON Response with deployHash
    return NextResponse.json(
      { deployHash },
      { status: 200 }
    );
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unexpected error processing request';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

