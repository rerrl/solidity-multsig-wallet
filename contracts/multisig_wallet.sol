// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";
/*
  2/3 Multisig
  active txn array so multiple txns can be awaiting signature
*/

contract MultisigWallet {
    address public owner;
    uint8 immutable public signers_required;
    uint8 immutable public max_wallets;
    address[] private validSigners;

    struct Transaction {
      address created_by;
      address to;
      uint256 amount_wei;
      uint256 signatures;
      mapping(address => bool) hasSigned;
    }


    mapping(uint256 => Transaction) public transactionId_to_transaction;
    uint256 public transactionId;
    uint256[] public pendingTransactions;

    modifier onlyOwner(){
      require(msg.sender == owner, "Only the owner can access this function.");
      _;
    }

    modifier onlyValidSigner() {
      bool isValid = false;
      for(uint256 i = 0; i < validSigners.length; i++) {
        if(msg.sender == validSigners[i]){
          isValid = true;
          break;
        }
      }
      require(isValid, "The current address is not in the validSigners array");
      _;
    }

    constructor(uint8 _signers_required, uint8 _max_wallets){
      require(_signers_required > 0 && _max_wallets >= _signers_required, "This multisig wallet cannot be created with the desired configuration.");
      owner = msg.sender;
      signers_required = _signers_required;
      max_wallets = _max_wallets;
    }

    function addSigner(address _address) onlyOwner external {
      require(validSigners.length < max_wallets, "Adding another wallet will exceed max wallet amount.");

      for(uint256 i = 0; i < validSigners.length; i++){
        require(validSigners[i] != _address, "This address is already a valid signer!");
      }
      validSigners.push(_address);
    }

    // any valid signer can create a transaction
    function createTransaction(address _to, uint256 _amount_wei) onlyValidSigner external {
      require(address(this).balance >= _amount_wei, "Not enough Ether in this account to create transaction.");
      Transaction storage txn = transactionId_to_transaction[transactionId];
      txn.created_by = msg.sender;
      txn.to = _to;
      txn.amount_wei = _amount_wei;
      txn.signatures = 0;
      pendingTransactions.push(transactionId);
      transactionId++;
    }

    function signTransaction(uint256 _txn_id) onlyValidSigner external {
      Transaction storage txn = transactionId_to_transaction[_txn_id];
      require(txn.hasSigned[msg.sender] == false, "This signer has already signed this transaction!");
      txn.hasSigned[msg.sender] = true;
      txn.signatures++;
      console.log("Transaction %s signed by: %s", _txn_id, msg.sender);
      if(txn.signatures == signers_required){
        processTransaction(_txn_id);
      }
    }

    function removeTransaction(uint256 index) private {
        if (index >= pendingTransactions.length) return;
        for (uint256 i = index; i < pendingTransactions.length-1; i++){
            pendingTransactions[i] = pendingTransactions[i+1];
        }
        pendingTransactions.pop();
        delete transactionId_to_transaction[index];
    }

    function processTransaction(uint256 _txn_id) private {
      Transaction storage txn = transactionId_to_transaction[_txn_id];
      console.log("%s: sending %s to %s", _txn_id, txn.amount_wei, txn.to);
      payable(txn.to).transfer(txn.amount_wei);
      removeTransaction(_txn_id);
    }

    receive() external payable {}
}
