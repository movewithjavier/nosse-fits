# Nosse Fits

A mobile-first web application designed to help parents efficiently manage and track their children's clothing inventory.

## Features

- 📱 Mobile-first responsive design optimized for phones and tablets
- 📷 Photo-based clothing inventory management
- 🔐 Secure authentication with Supabase
- ☁️ Cloud storage for images
- 🚀 PWA support for app-like experience

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/javierpgomez/nosse-fits.git
cd nosse-fits
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Set up Supabase database:
   - Create a new Supabase project
   - Run the SQL commands from `supabase-setup.sql` in the Supabase SQL editor
   - Enable Google OAuth in Supabase Auth settings

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Supabase Setup

Run the following SQL commands in your Supabase SQL editor:

\`\`\`sql
-- See supabase-setup.sql for the complete schema
\`\`\`

## Usage

1. **Sign In**: Use Google OAuth to authenticate
2. **Add Items**: Tap the "+" button to photograph and add clothing items
3. **View Inventory**: Browse your clothing items in the main grid view
4. **Delete Items**: Tap the "×" button on any item to remove it

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Home page with inventory grid
│   ├── add/
│   │   └── page.tsx      # Add new item page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── ItemCard.tsx      # Individual clothing item card
│   └── ItemGrid.tsx      # Grid layout for items
└── lib/
    └── supabase.ts       # Supabase client and helpers
```

## License

MIT License

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>