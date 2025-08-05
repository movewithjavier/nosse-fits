# Nosse Fits - Deployment Guide

## 🚀 Quick Start Deployment

### 1. Supabase Setup (Required First)

1. **Create Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project
   - Wait for setup to complete

2. **Run Database Setup**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase-setup.sql`
   - Execute the script

3. **Configure Authentication**
   - Go to Authentication > Settings > Auth Providers
   - Enable Google OAuth provider
   - Add your domain to allowed redirect URLs (add Vercel domain later)

4. **Get API Keys**
   - Go to Settings > API
   - Copy the `Project URL` and `anon public` key
   - You'll need these for Vercel deployment

### 2. Vercel Deployment

1. **Push to GitHub**
   ```bash
   # If repository doesn't exist yet, create it on GitHub first
   git remote set-url origin https://github.com/YOUR_USERNAME/nosse-fits.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Framework preset should auto-detect as "Next.js"

3. **Set Environment Variables**
   Add these in Vercel dashboard under Settings > Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Update Supabase Redirect URLs**
   - After deployment, copy your Vercel domain
   - Go back to Supabase > Authentication > Settings
   - Add your Vercel URL to Site URL and Redirect URLs

### 3. Test Deployment

1. Visit your deployed app
2. Try signing in with Google
3. Test adding a clothing item with photo
4. Verify items appear in the grid

## 📱 Mobile Testing

Test on these devices/browsers:
- iOS Safari (iPhone/iPad)
- Android Chrome
- Desktop browsers

## 🔧 Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check Supabase redirect URLs include your domain
   - Verify environment variables are set correctly

2. **Images not uploading**
   - Check Supabase storage policies
   - Verify bucket is created and public

3. **Build fails**
   - Run `npm run build` locally first
   - Check for TypeScript errors

### Environment Variables

Make sure these are set in Vercel:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🎯 Production Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed (`supabase-setup.sql`)
- [ ] Storage bucket created with policies
- [ ] Google OAuth configured
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Environment variables set
- [ ] Authentication working
- [ ] Image upload working
- [ ] Mobile responsive design tested
- [ ] PWA manifest working

## 📊 Performance

Current build metrics:
- Total bundle size: ~148KB
- Static pages: 3
- PWA ready: ✅
- Mobile optimized: ✅

---

🤖 Generated with [Claude Code](https://claude.ai/code)