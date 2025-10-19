# Deployment Guide - LuxuryHotelPro.com

## Architecture Overview

This application uses a **dual-deployment architecture**:

1. **Frontend (React SPA)** → Deployed to **Vercel**
2. **Backend (Edge Functions)** → Deployed to **Supabase**

These are **separate deployments** that communicate via API calls.

---

## Frontend Deployment (Vercel)

### Prerequisites
- GitHub repository connected to Vercel
- Node.js 18+ for build process

### Configuration Files

#### `vercel.json`
Handles SPA routing and build configuration:
- Redirects all requests to `index.html` for client-side routing
- Optimizes asset caching
- Specifies build command and output directory

#### `public/_redirects`
Fallback configuration for SPA routing (Netlify-style, works with some CDNs)

### Environment Variables

**Required Environment Variables in Vercel Dashboard:**

```bash
VITE_SUPABASE_URL=https://dxisnnjsbuuiunjmzzqj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aXNubmpzYnV1aXVuam16enFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg2MDMsImV4cCI6MjA3Mzg2NDYwM30.nmuC7AAV-6PMpIPvOed28P0SAlL04PIUNibaq4OogU8
```

**How to Add Environment Variables:**
1. Go to your Vercel project → Settings
2. Navigate to "Environment Variables"
3. Add both variables above
4. Click "Save"
5. Redeploy your application

### Build Process

**Automatic Deployment:**
- Push to GitHub → Vercel automatically builds and deploys
- Build command: `npm run build`
- Output directory: `dist/`

**Manual Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Troubleshooting Frontend

| Issue | Solution |
|-------|----------|
| 404 on page refresh | Ensure `vercel.json` rewrites are configured |
| Environment variables not working | Check Vercel dashboard settings, redeploy |
| Build fails | Check build logs, verify dependencies |
| Assets not loading | Check `public/` folder structure |

---

## Backend Deployment (Supabase Edge Functions)

### Important Note

**Edge Functions are NOT deployed through GitHub/Vercel!**

They must be deployed separately to Supabase infrastructure.

### Option 1: Supabase CLI (Recommended)

**Installation:**
```bash
npm install -g supabase
```

**Login and Link Project:**
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref dxisnnjsbuuiunjmzzqj
```

**Deploy All Functions:**
```bash
supabase functions deploy
```

**Deploy Specific Function:**
```bash
supabase functions deploy trial-signup
supabase functions deploy health-check
```

**View Logs:**
```bash
supabase functions logs trial-signup
```

### Option 2: Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/dxisnnjsbuuiunjmzzqj/functions
2. Click "Deploy new function"
3. Upload function code manually
4. Configure environment variables (secrets)

### Option 3: GitHub Actions (Automated CI/CD)

Create `.github/workflows/deploy-edge-functions.yml`:

```yaml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Deploy functions
        run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Edge Function Secrets

**Required Secrets:**
- Configure in Supabase Dashboard → Project Settings → Edge Functions
- Or use CLI: `supabase secrets set SECRET_NAME=value`

**Common Secrets:**
- `AWS_ACCESS_KEY_ID` (for SES email)
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- Any API keys for third-party services

### Troubleshooting Edge Functions

| Issue | Solution |
|-------|----------|
| Function not found (404) | Deploy function using Supabase CLI |
| Function timeout | Check logs, optimize queries, add timeouts |
| RLS policy errors | Review database policies in Supabase |
| CORS errors | Check function CORS headers configuration |

**View Edge Function Logs:**
- Dashboard: https://supabase.com/dashboard/project/dxisnnjsbuuiunjmzzqj/functions
- CLI: `supabase functions logs <function-name>`

---

## Testing Deployment

### 1. Test Frontend Routing
```bash
# Visit these URLs and refresh each page
https://your-domain.vercel.app/
https://your-domain.vercel.app/auth
https://your-domain.vercel.app/dashboard
https://your-domain.vercel.app/tenants
```

**Expected:** No 404 errors on refresh

### 2. Test Edge Functions
```bash
# Health check
curl https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/health-check

# Trial signup (replace with test email)
curl -X POST https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/trial-signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","companyName":"Test Company"}'
```

### 3. Test End-to-End
1. Visit deployed frontend
2. Complete signup flow
3. Check Supabase database for new tenant
4. Verify email sent (if configured)
5. Test login with created account

---

## Monitoring & Debugging

### Frontend Monitoring (Vercel)
- **Dashboard:** https://vercel.com/dashboard
- **Logs:** Available in Vercel deployment logs
- **Analytics:** Built-in Vercel Analytics

### Backend Monitoring (Supabase)
- **Edge Function Logs:** https://supabase.com/dashboard/project/dxisnnjsbuuiunjmzzqj/functions
- **Database Logs:** https://supabase.com/dashboard/project/dxisnnjsbuuiunjmzzqj/logs
- **Auth Logs:** https://supabase.com/dashboard/project/dxisnnjsbuuiunjmzzqj/auth/logs

### Common Issues

**Issue: "404 NOT_FOUND" on Vercel**
- **Cause:** SPA routing not configured
- **Fix:** Ensure `vercel.json` exists with rewrites

**Issue: "Edge function not deployed"**
- **Cause:** Functions only exist in GitHub, not deployed to Supabase
- **Fix:** Deploy using Supabase CLI: `supabase functions deploy`

**Issue: "Environment variables undefined"**
- **Cause:** Not configured in Vercel
- **Fix:** Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel settings

**Issue: "Function timeout"**
- **Cause:** Database query or external API taking too long
- **Fix:** Check function logs, optimize queries, add timeout protection

---

## Deployment Checklist

### Initial Setup
- [ ] Connect GitHub repository to Vercel
- [ ] Add environment variables to Vercel
- [ ] Install Supabase CLI
- [ ] Link Supabase project with CLI

### For Each Deployment
- [ ] Test locally first
- [ ] Push code to GitHub (frontend auto-deploys to Vercel)
- [ ] Deploy Edge Functions to Supabase separately
- [ ] Test frontend routing (no 404s)
- [ ] Test Edge Functions via API calls
- [ ] Check logs for errors
- [ ] Verify end-to-end user flows

### Post-Deployment
- [ ] Monitor error rates in Vercel/Supabase dashboards
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Document any issues in incident log

---

## Quick Reference

**Vercel Project:**
- Dashboard: https://vercel.com/dashboard

**Supabase Project:**
- Project ID: `dxisnnjsbuuiunjmzzqj`
- Dashboard: https://supabase.com/dashboard/project/dxisnnjsbuuiunjmzzqj
- Functions: https://supabase.com/dashboard/project/dxisnnjsbuuiunjmzzqj/functions
- Database: https://supabase.com/dashboard/project/dxisnnjsbuuiunjmzzqj/editor

**Important Endpoints:**
- Frontend: `https://your-domain.vercel.app`
- Edge Functions: `https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/`

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Project Troubleshooting Guide](./PHASE_9-11_IMPLEMENTATION.md)
