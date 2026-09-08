// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SettlementManager.sol";

/**
 * @title CreatorClaims
 * @notice Verifies cryptographic Merkle proofs for creator streaming allocations and executes claims.
 *         Protects against double-claiming and second preimage attacks using standard double-hashing.
 */
contract CreatorClaims {
    SettlementManager public immutable settlementManager;
    address public treasuryVault;
    address public owner;

    // periodId => (creatorAddress => claimed)
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    // periodId => total amount claimed so far
    mapping(uint256 => uint256) public totalClaimedPerPeriod;

    event RoyaltyClaimed(
        uint256 indexed periodId,
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner authorized");
        _;
    }

    constructor(address _settlementManager) {
        require(_settlementManager != address(0), "Invalid SettlementManager");
        settlementManager = SettlementManager(_settlementManager);
        owner = msg.sender;
    }

    function setTreasuryVault(address _treasuryVault) external onlyOwner {
        require(_treasuryVault != address(0), "Invalid TreasuryVault");
        treasuryVault = _treasuryVault;
    }

    /**
     * @notice Computes leaf hash according to OpenZeppelin standard:
     *         keccak256(bytes.concat(keccak256(abi.encode(creator, amount, periodId))))
     */
    function computeLeaf(
        address creator,
        uint256 amount,
        uint256 periodId
    ) public pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(creator, amount, periodId))));
    }

    /**
     * @notice Claims creator allocation by providing a Merkle inclusion proof.
     * @param periodId Settlement cycle identifier.
     * @param amount The allocated payout amount.
     * @param proof Cryptographic sibling hashes leading to the committed root.
     */
    function claim(
        uint256 periodId,
        uint256 amount,
        bytes32[] calldata proof
    ) external returns (bool) {
        address creator = msg.sender;
        require(!hasClaimed[periodId][creator], "Already claimed for this period");

        (bytes32 root, uint256 totalPool, , , ) = settlementManager.getPeriod(periodId);
        require(root != bytes32(0), "Period root not committed");

        // Verify invariant: total claimed cannot exceed committed pool
        require(totalClaimedPerPeriod[periodId] + amount <= totalPool, "Claim exceeds available pool");

        // Generate leaf and verify Merkle proof
        bytes32 leaf = computeLeaf(creator, amount, periodId);
        require(verifyProof(proof, root, leaf), "Invalid Merkle proof");

        // Mark as claimed and update pool balance
        hasClaimed[periodId][creator] = true;
        totalClaimedPerPeriod[periodId] += amount;

        emit RoyaltyClaimed(periodId, creator, amount, block.timestamp);
        return true;
    }

    /**
     * @notice Pure cryptographic Merkle proof verification algorithm.
     */
    function verifyProof(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) public pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                // Hash(current, proofElement)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(proofElement, current)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == root;
    }
}
