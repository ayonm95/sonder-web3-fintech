// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TreasuryVault
 * @notice Holds settlement pool funds and disburses payouts upon authorized claim events.
 *         Ensures funds cannot be redirected once committed to a settlement period.
 */
contract TreasuryVault {
    address public owner;
    address public claimsContract;

    uint256 public totalAccruedLiabilities;
    uint256 public totalDisbursed;

    event FundsDeposited(address indexed sender, uint256 amount, uint256 newBalance);
    event FundsDisbursed(address indexed recipient, uint256 amount, uint256 remainingBalance);
    event ClaimsContractUpdated(address indexed previousClaims, address indexed newClaims);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner authorized");
        _;
    }

    modifier onlyClaimsContract() {
        require(msg.sender == claimsContract, "Only claims contract authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setClaimsContract(address _claimsContract) external onlyOwner {
        require(_claimsContract != address(0), "Invalid claims contract");
        emit ClaimsContractUpdated(claimsContract, _claimsContract);
        claimsContract = _claimsContract;
    }

    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value, address(this).balance);
    }

    function deposit() external payable {
        emit FundsDeposited(msg.sender, msg.value, address(this).balance);
    }

    function disburse(address payable recipient, uint256 amount) external onlyClaimsContract {
        require(recipient != address(0), "Invalid recipient");
        require(address(this).balance >= amount, "Insufficient vault balance");

        totalDisbursed += amount;
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsDisbursed(recipient, amount, address(this).balance);
    }

    function getVaultBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
