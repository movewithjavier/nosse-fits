# Nosse Fits 👕

A mobile-first wardrobe management app for busy parents to track their children's clothing inventory.

## Features ✨

- **📱 Mobile-optimized** - Designed for phone and tablet use with responsive layouts
- **📷 Photo capture** - Quick item entry with camera integration and automatic compression
- **🔍 Smart search** - Find items quickly in your wardrobe and when selecting matches
- **🎯 Item matching** - Track which items go well together with bidirectional relationships
- **🚀 Fast uploads** - Automatic image compression for faster mobile uploads
- **💾 Reliable storage** - Secure cloud storage with Supabase
- **📱 PWA ready** - Install as an app on your device

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

## Usage 📖

1. **Browse Wardrobe**: View all your clothing items in a responsive grid
2. **Search Items**: Use the search bar to quickly find specific items by name or description
3. **Add New Items**: 
   - Tap the "+" button to add new clothing items
   - Take a photo or upload from gallery (automatically compressed for speed)
   - Optionally select which items "go with" this new item
4. **View Item Details**: Tap any item to see full details and matching items
5. **Manage Matches**: 
   - See which items go together in the sidebar (iPad) or below (mobile)
   - Edit matches to build complete outfit combinations
   - Relationships are bidirectional (A matches B means B matches A)
6. **Delete Items**: Tap the "×" button on any item to remove it (removes all matches automatically)

## Project Structure 📁

```
nosse-fits/
├── docs/                     # Documentation
│   ├── deployment.md         # Deployment guide
│   ├── product-requirements.md # Product specifications
│   └── technical-guide.md    # Technical implementation details
├── migrations/               # Database schema migrations
├── src/
│   ├── app/
│   │   ├── page.tsx          # Home page with inventory grid and search
│   │   ├── add/page.tsx      # Add new item page with matching selection
│   │   ├── item/[id]/
│   │   │   ├── page.tsx      # Item detail view with matching sidebar
│   │   │   └── edit/page.tsx # Edit item matches
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── ItemCard.tsx      # Individual clothing item card (clickable)
│   │   ├── ItemGrid.tsx      # Grid layout for items
│   │   └── ItemSelector.tsx  # Multi-select component with search
│   └── lib/
│       └── supabase.ts       # Supabase client and database functions
├── public/                   # Static assets and PWA files
└── private/                  # Sensitive configs (gitignored)
```

## Documentation 📚

- **[Deployment Guide](./docs/deployment.md)** - Complete setup and deployment instructions
- **[Product Requirements](./docs/product-requirements.md)** - Product specifications and user stories
- **[Technical Guide](./docs/technical-guide.md)** - Architecture and implementation details

## License

MIT License

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>