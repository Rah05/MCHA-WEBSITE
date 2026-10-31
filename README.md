# MCHA-WEBSITE
CSC 190 - Team Code Blooded - M.CHA Website

## Steps to update your local setup
1. git checkout main && git pull origin main
2. npm install

## We don't have a database set up. So assuming the database is completed....:
3. Copy .env.example to .env and set DATABASE_URL (the team will share how to get one)
4. Create .env.local with AUTH_SECRET: run `npx auth secret`, or if that fails:
   node -e "console.log('AUTH_SECRET=\"' + require('crypto').randomBytes(33).toString('base64') + '\"')" >> .env.local
5. npx prisma generate
6. If you have your own database: npx prisma migrate dev
   (the first person to set up the database runs: npx prisma migrate dev --name init, then commits prisma/migrations)
7. npm run dev