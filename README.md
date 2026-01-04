# Invisible Casper

Allows any user to enter and execute on-chain actions —such as minting an NFT— without paying gas or having tokens.

## 🚀 Features

- **NFT Minting Gasless**: Mint NFTs without paying gas fees
- **Sponsorship System**: Server automatically pays transaction fees
- **Casper Wallet Integration**: Full support for Casper Wallet and CSPR.click
- **Interactive Dashboard**: Modern interface to manage your NFTs and transfers

## 🛠️ Technologies

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Casper JS SDK** for blockchain interaction
- **CEP-78** for NFT standard

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- Casper Wallet installed in your browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/cesarge13/Invisible-Casper.git
cd Invisible-Casper
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy the environment variables file:
```bash
cp .env.local.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
NODE_ADDRESS=https://rpc.testnet.casperlabs.io
NETWORK_NAME=casper-test
SPONSOR_PUBLIC_KEY=your_sponsor_public_key
SPONSOR_PRIVATE_KEY=your_sponsor_private_key
```

5. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
Invisible-Casper/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── balance/        # Balance query
│   │   ├── config/         # Public configuration
│   │   └── sponsor/        # Sponsorship system
│   ├── dashboard/          # Main dashboard
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── Logo.tsx            # Invisible Casper logo
│   └── web3/               # Web3 components
│       ├── ClickWrapper.tsx # CSPR.click wrapper
│       ├── MintButton.tsx  # NFT mint button
│       └── WalletNav.tsx   # Wallet navigation
├── lib/                    # Utilities
│   └── casper/             # Casper utilities
│       ├── cep78.ts        # CEP-78 functions
│       ├── client.ts       # Casper client
│       ├── config.ts       # Configuration
│       ├── sponsor.ts      # Sponsorship service
│       └── walletSigning.ts # Transaction signing
├── contracts/              # Smart contracts
│   └── cep78.wasm         # CEP-78 contract
└── scripts/               # Utility scripts
```

## 🔐 Environment Variables

See `.env.local.example` for the complete list of required environment variables.

**Important**: Never upload your `.env.local` to the repository. It contains sensitive information.

## 🎨 UI Features

- **Animated Logo**: Custom logo with animations
- **Dark Mode**: Full dark mode support
- **Responsive**: Design adaptable to all devices
- **Modern Gradients**: Attractive visual design

## 📝 Usage

1. **Connect your Wallet**: Use the "Connect Wallet" button in the top right corner
2. **Go to Dashboard**: Navigate to the dashboard to see your options
3. **Mint NFTs**: Use the "Mint NFT (Gas 0)" button to create NFTs without paying gas
4. **Transfer CSPR**: Make transfers using the sponsorship system

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [GitHub Repository](https://github.com/cesarge13/Invisible-Casper)
- [Casper Documentation](https://docs.casper.network/)
- [CEP-78 Standard](https://github.com/casper-ecosystem/cep-78-enhanced-nft)

## ⚠️ Security

**IMPORTANT**: 
- Never share your sponsor private key
- Do not upload `.env.local` files to the repository
- Use secure environment variables in production
- Check `SECURITY.md` for more information

---

Made with ❤️ for the Casper community
