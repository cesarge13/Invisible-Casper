import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClickWrapper } from "@/components/web3/ClickWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Invisible Casper - NFT Mint",
  description: "Mint NFTs on Casper blockchain with gasless sponsorship",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClickWrapper>
          {children}
        </ClickWrapper>
      </body>
    </html>
  );
}

