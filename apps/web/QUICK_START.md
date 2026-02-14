# 🚀 QUICK START: VOOK-webApp2 Production Deploy

## ⚡ 3-Minute Deployment

### Option 1: Automated Script (Recommended)
```bash
cd apps/web
./deploy.sh
```

### Option 2: Manual Steps

#### 1. Create `.env.local`
```bash
cd apps/web
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://gjxbxjzjikrwfhqwafic.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeGJ4anpraWtyd2ZocXdhZmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NTY0NDksImV4cCI6MjA4NjQ1NjQ0OX0.NGJQTL9gTzCnjukI6QKpgQ2sBEyIoXzVlKf_TSNH5Gc
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=
EOF
```

#### 2. Test Locally
```bash
npm install
npm run dev
# Open http://localhost:3000/feed
# Check console for: ✅ Realtime ACTIVE
```

#### 3. Deploy to GitHub
```bash
cd ../..  # Go to repo root
git add .
git commit -m "🚀 PRODUCTION READY: Supabase Realtime + Next.js 15 + Redis"
git push origin2 main  # or: git push -u origin2 main
```

#### 4. Vercel Auto-Deploys
- Check: https://vercel.com/dashboard
- Vercel will auto-deploy on push to main

---

## ✅ Success Checklist

- [ ] `.env.local` created
- [ ] `npm run dev` works
- [ ] Console shows: `✅ Realtime ACTIVE`
- [ ] `npm run build` passes
- [ ] Git push successful
- [ ] Vercel deployment triggered

---

## 🎯 Expected Results

- ✅ WebSocket: FIXED
- ✅ Lighthouse: 90+
- ✅ API: <100ms
- ✅ Realtime: ACTIVE
- ✅ Production: READY

**See `DEPLOYMENT_GUIDE.md` for detailed instructions.**
