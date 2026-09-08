// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CreatorRegistry
 * @notice Maintains the canonical on-chain registry of verified creators and their settlement wallets.
 *         No PII is stored on-chain — only creator identifier hashes and wallet addresses.
 */
contract CreatorRegistry {
    address public owner;

    struct CreatorInfo {
        address settlementWallet;
        bool isEligible;
        uint256 registeredAt;
    }

    // Mapping from creatorId hash (keccak256 of off-chain UUID) to CreatorInfo
    mapping(bytes32 => CreatorInfo) private creators;
    // Mapping from wallet address to creatorId hash
    mapping(address => bytes32) private walletToCreator;

    event CreatorRegistered(bytes32 indexed creatorIdHash, address indexed wallet, uint256 timestamp);
    event CreatorWalletUpdated(bytes32 indexed creatorIdHash, address indexed oldWallet, address indexed newWallet);
    event CreatorEligibilityUpdated(bytes32 indexed creatorIdHash, bool isEligible);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function registerCreator(bytes32 creatorIdHash, address wallet) external onlyOwner {
        require(wallet != address(0), "Invalid wallet address");
        require(creators[creatorIdHash].settlementWallet == address(0), "Creator already registered");

        creators[creatorIdHash] = CreatorInfo({
            settlementWallet: wallet,
            isEligible: true,
            registeredAt: block.timestamp
        });
        walletToCreator[wallet] = creatorIdHash;

        emit CreatorRegistered(creatorIdHash, wallet, block.timestamp);
    }

    function setEligibility(bytes32 creatorIdHash, bool eligible) external onlyOwner {
        require(creators[creatorIdHash].settlementWallet != address(0), "Creator not registered");
        creators[creatorIdHash].isEligible = eligible;
        emit CreatorEligibilityUpdated(creatorIdHash, eligible);
    }

    function updateWallet(bytes32 creatorIdHash, address newWallet) external {
        require(newWallet != address(0), "Invalid new wallet");
        CreatorInfo storage info = creators[creatorIdHash];
        require(msg.sender == owner || msg.sender == info.settlementWallet, "Not authorized to update wallet");

        address oldWallet = info.settlementWallet;
        delete walletToCreator[oldWallet];

        info.settlementWallet = newWallet;
        walletToCreator[newWallet] = creatorIdHash;

        emit CreatorWalletUpdated(creatorIdHash, oldWallet, newWallet);
    }

    function getCreator(bytes32 creatorIdHash) external view returns (address settlementWallet, bool isEligible, uint256 registeredAt) {
        CreatorInfo memory info = creators[creatorIdHash];
        return (info.settlementWallet, info.isEligible, info.registeredAt);
    }

    function getCreatorByWallet(address wallet) external view returns (bytes32) {
        return walletToCreator[wallet];
    }
}
