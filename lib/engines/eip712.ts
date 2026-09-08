import { ethers } from 'ethers';

export const ATTESTATION_LEGAL_STATEMENT =
  'I irrevocably warrant that I am the sole owner or authorized licensor of all master recordings and underlying musical works for this track, free of uncredited samples or third-party encumbrances.';

export interface RightsAttestationMessage {
  creator: string;
  trackId: string;
  titleHash: string;
  audioFingerprint: string;
  statement: string;
  timestamp: number;
  nonce: number;
}

export function getEIP712Domain(chainId: number = 80002) {
  const rawContract =
    process.env.NEXT_PUBLIC_CREATOR_CLAIMS_ADDRESS ||
    '0xb61136b637f5d6ff87123a11c238622c83c27f51';

  return {
    name: 'Sonder Royalty Platform',
    version: '1',
    chainId,
    verifyingContract: ethers.getAddress(rawContract.toLowerCase()),
  };
}

export const ATTESTATION_TYPES = {
  RightsAttestation: [
    { name: 'creator', type: 'address' },
    { name: 'trackId', type: 'string' },
    { name: 'titleHash', type: 'bytes32' },
    { name: 'audioFingerprint', type: 'string' },
    { name: 'statement', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
};

/**
 * Prepares the typed data structure for MetaMask / ethers signTypedData
 */
export function createAttestationPayload(params: {
  creatorAddress: string;
  trackId: string;
  trackTitle: string;
  audioFingerprint?: string;
  nonce?: number;
  timestamp?: number;
  chainId?: number;
}) {
  const chainId = params.chainId || 80002;
  const domain = getEIP712Domain(chainId);
  const titleHash = ethers.keccak256(ethers.toUtf8Bytes(params.trackTitle));
  const audioFingerprint = params.audioFingerprint || ethers.keccak256(ethers.toUtf8Bytes(params.trackId));
  const timestamp = params.timestamp || Math.floor(Date.now() / 1000);
  const nonce = params.nonce !== undefined ? params.nonce : Math.floor(Math.random() * 1000000);

  const message: RightsAttestationMessage = {
    creator: ethers.getAddress(params.creatorAddress.toLowerCase()),
    trackId: params.trackId,
    titleHash,
    audioFingerprint,
    statement: ATTESTATION_LEGAL_STATEMENT,
    timestamp,
    nonce,
  };

  return {
    domain,
    types: ATTESTATION_TYPES,
    message,
    primaryType: 'RightsAttestation',
  };
}

/**
 * Server-side recovery and verification of EIP-712 signature
 */
export function verifyAttestationSignature(params: {
  message: RightsAttestationMessage;
  signature: string;
  expectedSigner: string;
  chainId?: number;
}): { isValid: boolean; recoveredSigner: string; computedHash: string } {
  const domain = getEIP712Domain(params.chainId || 80002);

  const recoveredSigner = ethers.verifyTypedData(
    domain,
    ATTESTATION_TYPES,
    params.message,
    params.signature
  );

  const computedHash = ethers.TypedDataEncoder.hash(domain, ATTESTATION_TYPES, params.message);

  const isSignerMatch = recoveredSigner.toLowerCase() === params.expectedSigner.toLowerCase();

  return {
    isValid: isSignerMatch,
    recoveredSigner,
    computedHash,
  };
}
