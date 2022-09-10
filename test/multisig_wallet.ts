import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultisigWallet", function() {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMultisigWalletTwoOfThreeFixture() {
    // Contracts are deployed using the first signer/account by default
    const [
      owner,
      signer1,
      signer2,
      signer3,
      signer4,
      payee,
      bad_signer
    ] = await ethers.getSigners();

    const MultisigWalletFactory = await ethers.getContractFactory(
      "MultisigWallet"
    );
    const multisig_wallet = await MultisigWalletFactory.deploy(2, 3);

    return {
      multisig_wallet,
      owner,
      signer1,
      signer2,
      signer3,
      signer4,
      payee,
      bad_signer
    };
  }

  describe("Deployment", function() {
    it("Should revert if bad contract deployment parameters", async () => {
      const [owner] = await ethers.getSigners();
      const MultisigWalletFactory = await ethers.getContractFactory(
        "MultisigWallet"
      );
      // dont need to await if we expect to revert
      expect(MultisigWalletFactory.deploy(3, 2)).to.be.reverted;
    });

    it("Should set the correct owner of this contract", async function() {
      const { multisig_wallet, owner } = await loadFixture(
        deployMultisigWalletTwoOfThreeFixture
      );
      expect(owner.address).to.equal(await multisig_wallet.owner());
    });

    it("Should set the proper multisig parameters", async () => {
      const { multisig_wallet } = await loadFixture(
        deployMultisigWalletTwoOfThreeFixture
      );
      expect(await multisig_wallet.signers_required()).to.equal(2);
      expect(await multisig_wallet.max_wallets()).to.equal(3);
    });
  });

  describe("Core", async () => {
    it("Should only allow owner to add signer wallets", async () => {
      const { multisig_wallet, bad_signer } = await loadFixture(
        deployMultisigWalletTwoOfThreeFixture
      );
      expect(
        multisig_wallet.connect(bad_signer).addSigner(bad_signer.address)
      ).to.be.revertedWith("Only the owner can access this function.");
    });

    it("Should add signer if max number of valid wallets not met", async () => {
      const {
        multisig_wallet,
        owner,
        signer1,
        signer2,
        signer3,
        signer4,
        bad_signer
      } = await loadFixture(deployMultisigWalletTwoOfThreeFixture);
      await multisig_wallet.addSigner(signer1.address);
      await multisig_wallet.addSigner(signer2.address);
      await multisig_wallet.addSigner(signer3.address);
      expect(multisig_wallet.addSigner(signer4.address)).to.be.revertedWith(
        "Adding another wallet will exceed max wallet amount."
      );
    });

    it("Should not add signer if wallet is already a signer", async () => {
      const { multisig_wallet, signer1 } = await loadFixture(
        deployMultisigWalletTwoOfThreeFixture
      );

      await multisig_wallet.addSigner(signer1.address);
      expect(multisig_wallet.addSigner(signer1.address)).to.be.revertedWith(
        "This address is already a valid signer!"
      );
    });

    it("Should create the transaction and fund the account", async () => {
      const { multisig_wallet, signer1, payee, owner } = await loadFixture(
        deployMultisigWalletTwoOfThreeFixture
      );
      await multisig_wallet.addSigner(signer1.address);
      // await multisig_wallet.connect(signer1);

      expect(
        multisig_wallet.connect(signer1).createTransaction(payee, 500000000000)
      ).to.be.revertedWith(
        "Not enough Ether in this account to create transaction."
      );

      // fund the contract with the owners money
      let ether = "1000000000000000000";

      let transaction = {
        to: multisig_wallet.address,
        value: ether
      };

      await owner.sendTransaction(transaction);

      expect(
        await ethers.provider.getBalance(multisig_wallet.address)
      ).to.equal(ether);

      await multisig_wallet
        .connect(signer1)
        .createTransaction(payee.address, 500000000000);

      // will fail if index does not exist
      await multisig_wallet.pendingTransactions(0);
    });

    it("Should only allow valid signer to sign transaction and send", async () => {
      const {
        multisig_wallet,
        owner,
        signer1,
        signer2,
        payee,
        bad_signer
      } = await loadFixture(deployMultisigWalletTwoOfThreeFixture);

      await multisig_wallet.addSigner(signer1.address);
      await multisig_wallet.addSigner(signer2.address);
      let gasFees: number = 0;

      // fund the contract with the owners money
      let ether = "1000000000000000000";
      let transaction = {
        to: multisig_wallet.address,
        value: ether
      };
      await owner.sendTransaction(transaction);
      let txn_amount: number = 500000000000;

      await multisig_wallet
        .connect(signer1)
        .createTransaction(payee.address, txn_amount);

      await multisig_wallet.connect(signer1).signTransaction(0);

      // signTxn with another guy and trigger the send
      let txn2 = await multisig_wallet.connect(signer2).signTransaction(0);
    });
  });
});
