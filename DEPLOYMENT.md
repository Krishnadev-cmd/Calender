# 🚀 Vercel Deployment Guide

This guide will help you deploy your Calendar Appointment Booking System to Vercel.

## Prerequisites

- [Vercel account](https://vercel.com) (free tier is sufficient)
- [Vercel CLI](https://vercel.com/cli) installed (optional but recommended)
- Your project pushed to GitHub/GitLab/Bitbucket
- Supabase project set up
- Google Cloud Console project with Calendar API configured

## Step-by-Step Deployment

### 1. Prepare Your Project

Ensure your project is ready for deployment:

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. **Visit [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your Git repository**
4. **Configure project settings:**
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
cd c:\Krishnadev\New_Projects\calender
vercel

# Follow the prompts:
# - Link to existing project? N
# - What's your project's name? calendar-booking-system
# - In which directory is your code located? ./
```

### 3. Configure Environment Variables

In your Vercel dashboard, go to your project → Settings → Environment Variables and add:

#### Production Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

**Important Notes:**
- Make sure to update `NEXT_PUBLIC_APP_URL` with your actual Vercel domain
- All environment variables should be added for "Production", "Preview", and "Development" environments
- Never commit your `.env.local` file to version control

### 4. Update Google OAuth Settings

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Navigate to APIs & Services → Credentials**
3. **Edit your OAuth 2.0 Client ID**
4. **Add your Vercel domain to Authorized redirect URIs:**
   ```
   https://your-vercel-app.vercel.app/api/auth/google/callback
   ```
5. **Add your domain to Authorized JavaScript origins:**
   ```
   https://your-vercel-app.vercel.app
   ```

### 5. Update Supabase Settings

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication → Settings**
3. **Add your Vercel domain to Site URL:**
   ```
   https://your-vercel-app.vercel.app
   ```
4. **Add to Redirect URLs:**
   ```
   https://your-vercel-app.vercel.app/auth/callback
   ```

### 6. Deploy and Test

After configuring all settings:

1. **Trigger a new deployment:**
   ```bash
   # If using CLI
   vercel --prod
   
   # Or push to your git repository to trigger auto-deployment
   git push origin main
   ```

2. **Visit your deployed app:**
   ```
   https://your-vercel-app.vercel.app
   ```

3. **Test key functionality:**
   - User registration/login
   - Google Calendar OAuth flow
   - Appointment booking
   - Role selection (buyer/seller)

## Troubleshooting

### Common Issues

#### 1. **Environment Variables Not Loading**
- **Solution:** Ensure all environment variables are set in Vercel dashboard
- **Check:** Go to Project Settings → Environment Variables
- **Verify:** Variables are set for all environments (Production, Preview, Development)

#### 2. **Google OAuth Errors**
- **Error:** "redirect_uri_mismatch"
- **Solution:** Verify redirect URIs in Google Cloud Console match your Vercel domain exactly
- **Check:** `https://your-vercel-app.vercel.app/api/auth/google/callback`

#### 3. **Supabase Connection Issues**
- **Error:** "Invalid API key" or connection refused
- **Solution:** Verify Supabase URL and keys are correct in Vercel environment variables
- **Check:** Supabase dashboard → Settings → API

#### 4. **Build Failures**
- **Error:** TypeScript or ESLint errors during build
- **Solution:** Fix errors locally first, or temporarily disable in `next.config.ts`
- **Check:** Build logs in Vercel dashboard

#### 5. **API Routes Not Working**
- **Error:** 404 on API endpoints
- **Solution:** Ensure API routes are in `app/api/` directory with proper `route.ts` files
- **Check:** Vercel function logs in dashboard

### Performance Optimization

1. **Enable Analytics:**
   - Go to Vercel dashboard → Analytics
   - Enable Web Analytics for performance insights

2. **Monitor Functions:**
   - Check Functions tab in Vercel dashboard
   - Monitor execution time and errors

3. **Optimize Images:**
   - Use Next.js Image component for automatic optimization
   - Images are automatically optimized by Vercel

## Custom Domain (Optional)

To use a custom domain:

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Domains**
3. **Add your custom domain**
4. **Update DNS settings as instructed**
5. **Update environment variables and OAuth settings with new domain**

## Monitoring and Maintenance

### Regular Checks
- Monitor Vercel dashboard for build failures
- Check function execution logs for errors
- Monitor Supabase usage and performance
- Verify Google OAuth tokens are refreshing properly

### Updates and Deployments
```bash
# For future updates
git add .
git commit -m "Update feature XYZ"
git push origin main
# Vercel will automatically deploy
```

## Security Considerations

1. **Environment Variables:**
   - Never expose sensitive keys in client-side code
   - Use `NEXT_PUBLIC_` prefix only for non-sensitive variables

2. **CORS:**
   - Properly configured in `vercel.json`
   - Restrict origins in production if needed

3. **Database Security:**
   - Ensure RLS policies are properly configured
   - Use service role key only for server-side operations

## Support

If you encounter issues:

1. **Check Vercel Build Logs:** Project Dashboard → Functions → View Function Logs
2. **Check Browser Console:** For client-side errors
3. **Supabase Logs:** For database-related issues
4. **Google Cloud Console:** For OAuth-related issues

## Success Checklist

- [ ] Project deployed to Vercel
- [ ] All environment variables configured
- [ ] Google OAuth redirect URIs updated
- [ ] Supabase redirect URLs updated
- [ ] User registration/login working
- [ ] Google Calendar integration working
- [ ] Appointment booking functional
- [ ] Custom domain configured (if applicable)

---

**🎉 Congratulations! Your Calendar Booking System is now live on Vercel!**

Your app should now be accessible at: `https://your-vercel-app.vercel.app`