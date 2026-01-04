import { WalletNav } from "@/components/web3/WalletNav";
import { Logo } from "@/components/Logo";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-indigo-950/30 dark:to-purple-950/30">
      <div className="absolute top-8 right-8">
        <WalletNav />
      </div>
      <div className="z-10 max-w-5xl w-full items-center justify-center flex flex-col">
        {/* Logo */}
        <div className="mb-8">
          <Logo size="xl" />
        </div>
        
        <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
          NFT Mint Platform
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-2xl">
          Create and mint NFTs on Casper blockchain with zero gas fees. 
          Powered by invisible sponsorship technology.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Start Minting
          </Link>
        </div>
      </div>
    </main>
  );
}

