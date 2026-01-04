# 🔒 Security and Configuration

## ⚠️ IMPORTANT: Private Keys

**NEVER** share your private keys in:
- Source code
- Public repositories
- Messages or chats
- Public documentation

## 📝 Environment Variables

All sensitive keys must be in `.env.local` which is in `.gitignore`:

```bash
# .env.local (DO NOT COMMIT)
SPONSOR_PRIVATE_KEY=ed25519:your_private_key_here
SPONSOR_PUBLIC_KEY=your_public_key_here
NODE_ADDRESS=https://rpc.testnet.casperlabs.io
NETWORK_NAME=casper-test
NEXT_PUBLIC_SPONSOR_PUBLIC_KEY=your_public_key_here
```

## 🔐 Generate New Keys

If you need to generate a new Ed25519 key pair for Casper:

```bash
node -e "const { Keys } = require('casper-js-sdk'); const keyPair = Keys.Ed25519.new(); const privateKeyHex = Buffer.from(keyPair.privateKey).toString('hex'); console.log('SPONSOR_PUBLIC_KEY=' + keyPair.publicKey.toHex()); console.log('SPONSOR_PRIVATE_KEY=ed25519:' + privateKeyHex);"
```

## ✅ Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] No hardcoded keys in the code
- [ ] Private keys are only in `.env.local`
- [ ] Repository is public only if it doesn't contain keys
