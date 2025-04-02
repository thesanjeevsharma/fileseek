# FileSeek

A Next.js application for enhancing file discoverability on Filecoin.

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn UI
- Supabase

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/             # Next.js app router pages
├── components/      # Reusable UI components
├── lib/            
│   └── supabase/   # Supabase client and utilities
├── types/          # TypeScript type definitions
└── hooks/          # Custom React hooks
```

## Features

- File metadata management
- Tag-based search
- Social features (upvotes, comments)
- User authentication with MetaMask
- Reward system for tagging files 