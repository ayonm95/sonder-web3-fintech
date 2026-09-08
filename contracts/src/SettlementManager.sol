// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SettlementManager
 * @notice Manages royalty settlement cycles, commits Merkle roots of distribution calculations,
 *         and references off-chain IPFS audit manifests for transparent creator payouts.
 */
contract SettlementManager {
    address public operator;
    address public emergencyAdmin;
    bool public isPaused;

    struct Period {
        bytes32 merkleRoot;
        uint256 totalPool;       // Total distributable pool in wei or token units
        bytes32 ipfsMetadataHash; // IPFS multihash digest of the full calculation ledger
        uint256 committedAt;
        bool finalized;
    }

    // periodId => Period
    mapping(uint256 => Period) public periods;
    uint256 public currentPeriodId;

    event PeriodCommitted(
        uint256 indexed periodId,
        bytes32 indexed merkleRoot,
        uint256 totalPool,
        bytes32 ipfsMetadataHash,
        uint256 timestamp
    );
    event PeriodFinalized(uint256 indexed periodId);
    event EmergencyPauseToggled(bool isPaused);

    modifier onlyOperator() {
        require(msg.sender == operator, "Caller is not operator");
        _;
    }

    modifier onlyEmergencyAdmin() {
        require(msg.sender == emergencyAdmin, "Caller is not emergency admin");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Contract is currently paused");
        _;
    }

    constructor(address _operator, address _emergencyAdmin) {
        require(_operator != address(0) && _emergencyAdmin != address(0), "Invalid addresses");
        operator = _operator;
        emergencyAdmin = _emergencyAdmin;
    }

    function togglePause() external onlyEmergencyAdmin {
        isPaused = !isPaused;
        emit EmergencyPauseToggled(isPaused);
    }

    /**
     * @notice Commits a cryptographic Merkle root for a completed settlement cycle.
     * @param root The Merkle root calculated from all eligible (creatorId, amount, periodId) tuples.
     * @param totalPool The total amount distributable to creators for this period.
     * @param ipfsHash The IPFS CID hash of the canonical settlement breakdown audit pack.
     */
    function commitPeriodRoot(
        bytes32 root,
        uint256 totalPool,
        bytes32 ipfsHash
    ) external onlyOperator whenNotPaused returns (uint256) {
        require(root != bytes32(0), "Invalid Merkle root");
        require(totalPool > 0, "Pool amount must be positive");

        currentPeriodId++;
        periods[currentPeriodId] = Period({
            merkleRoot: root,
            totalPool: totalPool,
            ipfsMetadataHash: ipfsHash,
            committedAt: block.timestamp,
            finalized: false
        });

        emit PeriodCommitted(currentPeriodId, root, totalPool, ipfsHash, block.timestamp);
        return currentPeriodId;
    }

    function finalizePeriod(uint256 periodId) external onlyOperator whenNotPaused {
        require(periods[periodId].committedAt > 0, "Period does not exist");
        require(!periods[periodId].finalized, "Period already finalized");

        periods[periodId].finalized = true;
        emit PeriodFinalized(periodId);
    }

    function getPeriod(uint256 periodId) external view returns (
        bytes32 merkleRoot,
        uint256 totalPool,
        bytes32 ipfsMetadataHash,
        uint256 committedAt,
        bool finalized
    ) {
        Period memory p = periods[periodId];
        return (p.merkleRoot, p.totalPool, p.ipfsMetadataHash, p.committedAt, p.finalized);
    }
}
