# Casper Contracts

This folder contains WASM files for Casper smart contracts.

## CEP-78 NFT Contract

To deploy the CEP-78 contract, you need the contract WASM file.

### Get the CEP-78 Contract

1. Clone the official repository:
   ```bash
   git clone https://github.com/casper-ecosystem/cep-78-enhanced-nft.git
   cd cep-78-enhanced-nft
   ```

2. Compile the contract (requires Rust and cargo):
   ```bash
   make build-contract
   ```

3. Copy the compiled WASM file:
   ```bash
   cp target/wasm32-unknown-unknown/release/cep78-enhanced-nft.wasm ../Casper/contracts/cep78.wasm
   ```

### Alternative: Download Pre-compiled

If you don't want to compile, you can find a pre-compiled version of the CEP-78 contract at:
- https://github.com/casper-ecosystem/cep-78-enhanced-nft/releases
- Or use the contract from the official repository

### Expected Structure

```
contracts/
  └── cep78.wasm  ← CEP-78 contract WASM file
```
