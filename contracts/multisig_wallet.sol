// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";
/*
  2/3 Multisig
  owner does initial wallet set up AFTER deploying the contract
  active txn array so multiple txns can be awaiting signature
*/

contract MultisigWallet {
    address public owner;
    uint8 immutable public signers_required;
    uint8 immutable public max_wallets;

    constructor(uint8 _signers_required, uint8 _max_wallets){
      require(_signers_required > 0 && _max_wallets >= _signers_required, "This multisig wallet cannot be created with the desired configuration.");
      owner = msg.sender;
      signers_required = _signers_required;
      max_wallets = _max_wallets;
    }
}
