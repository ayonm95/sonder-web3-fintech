import { ethers } from 'ethers';

export interface MerkleAllocationItem {
  creatorId: string;
  walletAddress: string;
  netAmountMinor: bigint;
  periodNumber: number;
}

export interface MerkleTreeResult {
  root: string;
  leaves: string[];
  itemsWithProofs: {
    creatorId: string;
    walletAddress: string;
    netAmountMinor: bigint;
    periodNumber: number;
    leaf: string;
    proof: string[];
  }[];
}

/**
 * Generates an EVM-compatible leaf hash:
 * keccak256(abi.encodePacked(address, uint256, uint256))
 */
export function generateAllocationLeaf(
  walletAddress: string,
  netAmountMinor: bigint,
  periodNumber: number
): string {
  // Normalize address to checksummed format or lowercased hex
  const cleanAddress = ethers.getAddress(walletAddress.toLowerCase());
  return ethers.solidityPackedKeccak256(
    ['address', 'uint256', 'uint256'],
    [cleanAddress, netAmountMinor.toString(), periodNumber]
  );
}

/**
 * Hashes a pair of nodes using OpenZeppelin's standard sorted pair ordering
 */
export function hashPair(a: string, b: string): string {
  const aBig = BigInt(a);
  const bBig = BigInt(b);

  if (aBig <= bBig) {
    return ethers.solidityPackedKeccak256(['bytes32', 'bytes32'], [a, b]);
  } else {
    return ethers.solidityPackedKeccak256(['bytes32', 'bytes32'], [b, a]);
  }
}

/**
 * Builds a deterministic OpenZeppelin-compatible Merkle Tree
 */
export function buildAllocationMerkleTree(items: MerkleAllocationItem[]): MerkleTreeResult {
  if (items.length === 0) {
    throw new Error('Cannot construct Merkle tree with 0 allocation items.');
  }

  // 1. Generate leaves for each item
  const mappedItems = items.map((item) => {
    const leaf = generateAllocationLeaf(item.walletAddress, item.netAmountMinor, item.periodNumber);
    return {
      ...item,
      leaf,
    };
  });

  const leaves = mappedItems.map((m) => m.leaf);

  // 2. Build tree levels
  const levels: string[][] = [];
  levels.push([...leaves]);

  while (levels[levels.length - 1].length > 1) {
    const currentLevel = levels[levels.length - 1];
    const nextLevel: string[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
      } else {
        // Odd node out is carried forward
        nextLevel.push(currentLevel[i]);
      }
    }

    levels.push(nextLevel);
  }

  const root = levels[levels.length - 1][0];

  // 3. Generate individual audit proofs for each leaf
  const itemsWithProofs = mappedItems.map((item, leafIndex) => {
    const proof: string[] = [];
    let currentIndex = leafIndex;

    for (let levelIndex = 0; levelIndex < levels.length - 1; levelIndex++) {
      const level = levels[levelIndex];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < level.length) {
        proof.push(level[siblingIndex]);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      ...item,
      proof,
    };
  });

  return {
    root,
    leaves,
    itemsWithProofs,
  };
}

/**
 * Independent verification function (matches OpenZeppelin MerkleProof.verify)
 */
export function verifyAllocationProof(proof: string[], root: string, leaf: string): boolean {
  let computedHash = leaf;

  for (const proofElement of proof) {
    computedHash = hashPair(computedHash, proofElement);
  }

  return computedHash.toLowerCase() === root.toLowerCase();
}
