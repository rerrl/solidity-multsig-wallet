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
      bad_signer
    ] = await ethers.getSigners();

    const MultisigWalletFactory = await ethers.getContractFactory(
      "MultisigWallet"
    );
    const multisig_wallet = await MultisigWalletFactory.deploy(2, 3);

    return { multisig_wallet, owner, signer1, signer2, signer3, bad_signer };
  }

  describe("Deployment", function() {
    it("Should revert if bad contract deployment parameters", async () => {
      const [owner] = await ethers.getSigners();
      const MultisigWalletFactory = await ethers.getContractFactory(
        "MultisigWallet"
      );
      let has_errored = false;
      try {
        await MultisigWalletFactory.deploy(3, 2);
      } catch (error) {
        has_errored = true;
        expect(error.method).to.equal("estimateGas");
      }
      expect(has_errored).to.equal(true);
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
});
