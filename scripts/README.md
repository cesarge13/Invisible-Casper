# Deployment Scripts

This folder contains scripts to deploy smart contracts on the Casper network.

## Deploy CEP-78 NFT Contract

### Prerequisites

1. **Environment variables configured** in `.env.local`:
   ```bash
   NODE_ADDRESS=https://rpc.testnet.casperlabs.io
   NETWORK_NAME=casper-test
   SPONSOR_PUBLIC_KEY=01...
   SPONSOR_PRIVATE_KEY=ed25519:...
   ```

2. **Contract WASM file** in `contracts/cep78.wasm`:
   - See `contracts/README.md` for instructions on how to obtain it

3. **Sufficient balance** in the sponsor account to pay deployment fees

### Run the Script

```bash
pnpm deploy:cep78
```

Or directly with tsx:

```bash
pnpm tsx scripts/deploy-cep78.ts
```

### What the script does

1. ✅ Reads environment variables
2. ✅ Loads the sponsor private key
3. ✅ Creates an installation deploy with arguments:
   - `collection_name`: "GaslessGifterNFT"
   - `collection_symbol`: "GFT"
   - `total_token_supply`: 10000
   - `ownership_mode`: Transferable (0)
4. ✅ Signs the deploy with the sponsor key
5. ✅ Sends the deploy to the network
6. ✅ Waits for processing and gets the contract hash
7. ✅ Saves the contract hash in `lib/casper/contract.ts`

### Expected Output

```
📋 Configuration:
   NODE_ADDRESS: https://rpc.testnet.casperlabs.io
   NETWORK_NAME: casper-test
   SPONSOR_PUBLIC_KEY: 01...

🔑 Loading sponsor key...
✅ Key loaded successfully

📦 Creating installation deploy...
✅ Installation arguments created:
   - collection_name: GaslessGifterNFT
   - collection_symbol: GFT
   - total_token_supply: 10000
   - ownership_mode: Transferable (0)

✍️  Signing deploy...
✅ Deploy signed

📤 Sending deploy to network...
✅ Deploy sent successfully!
   Deploy Hash: abc123...

⏳ Waiting for deploy processing...
   (This may take several seconds)

🎉 Deploy completed!

📊 Results:
   Deploy Hash: abc123...
   Contract Hash: contract-abc123...
   Package Hash: package-abc123...

✅ Contract hash saved in: lib/casper/contract.ts

🔗 Useful links:
   Explorer: https://testnet.cspr.live/deploy/abc123...
   Contract: https://testnet.cspr.live/contract/contract-abc123...
```

### Troubleshooting

**Error: "WASM file not found"**
- Make sure you have the `contracts/cep78.wasm` file
- See `contracts/README.md` for instructions

**Error: "Missing environment variables"**
- Verify that `.env.local` has all required variables
- Make sure the file is in the project root

**Error: "Deploy failed"**
- Verify that the sponsor has sufficient balance
- Check deploy logs in the explorer
- Verify that contract arguments are correct
