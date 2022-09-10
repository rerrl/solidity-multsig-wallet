# Multisig Wallet

This project is an ethereum x of y multisig wallet (defined at contract construction).
There is also a suite of tests ensuring this contract performs as originally intended.

TODO:
simplify tests on a functional basis as tests are overlapping and some are more complex.
(example, remove "CORE", and add another section that does basic checks per function)
Then add core tests that assume modifiers to be working.

```shell
npx hardhat help
npx hardhat test
GAS_REPORT=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```
