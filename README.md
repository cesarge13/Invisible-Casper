# Casper Next.js App

A Next.js 14 application with App Router, TypeScript, Tailwind CSS, and Casper blockchain integration.

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Copy the environment variables file:
```bash
cp .env.local.example .env.local
```

3. Fill in your environment variables in `.env.local`

4. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - React components
- `/components/web3` - Web3/Casper-specific components
- `/lib` - Utility functions and libraries
- `/lib/casper` - Casper blockchain utilities
- `/app/api` - API routes
- `/app/api/sponsor` - Sponsor-related API endpoints

## Environment Variables

See `.env.local.example` for required environment variables and their descriptions.

