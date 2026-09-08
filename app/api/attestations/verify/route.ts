import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAttestationSignature } from '@/lib/engines/eip712';
import { TrackState } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trackId, message, signature, expectedSigner, chainId } = body;

    if (!trackId || !message || !signature || !expectedSigner) {
      return NextResponse.json(
        { success: false, error: 'Missing required attestation parameters' },
        { status: 400 }
      );
    }

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: { artist: true },
    });

    if (!track) {
      return NextResponse.json({ success: false, error: 'Track not found' }, { status: 404 });
    }

    // Cryptographic verification
    const verification = verifyAttestationSignature({
      message,
      signature,
      expectedSigner,
      chainId: chainId || 80002,
    });

    if (!verification.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Signature recovery mismatch. Expected ${expectedSigner}, recovered ${verification.recoveredSigner}`,
        },
        { status: 400 }
      );
    }

    // Persist verified rights attestation and advance to MONETIZED
    const updatedTrack = await prisma.track.update({
      where: { id: trackId },
      data: {
        rightsAttestationSignature: signature,
        rightsAttestationSigner: verification.recoveredSigner,
        rightsAttestationHash: verification.computedHash,
        state: TrackState.MONETIZED,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'EIP-712 Rights Attestation verified successfully',
      data: {
        track: updatedTrack,
        attestationHash: verification.computedHash,
        recoveredSigner: verification.recoveredSigner,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
