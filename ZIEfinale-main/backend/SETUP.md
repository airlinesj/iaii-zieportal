# ZIE Backend Setup Guide

## Prerequisites

- **Node.js** v16 or higher
- **MongoDB** (local or Atlas cloud)
- **npm** or **yarn**

## Installation on New Machine

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd ZIEfinale-main/backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the example environment file and update it with your configuration:

```bash
cp .env.example .env
```

Edit `.env` and update the following:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/zie-db
# OR for Atlas: mongodb+srv://username:password@cluster.mongodb.net/zie-db

# JWT Secret (generate a strong random string)
JWT_SECRET=your_very_secure_random_secret_key

# Email Configuration (Gmail or your SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (where the Angular app runs)
FRONTEND_URL=http://localhost:4200

# Production Settings
NODE_ENV=development  # or 'production'
PORT=5000
PRODUCTION_DOMAIN=https://zie.co.zw
```

### Step 4: Build the Project
```bash
npm run build
```

### Step 5: Start the Backend

**Development mode (watches for changes):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The backend will run on `http://localhost:5000` by default.

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | Database connection | `mongodb://localhost:27017/zie-db` |
| `JWT_SECRET` | Token signing key | Generate a strong random string |
| `SMTP_HOST` | Email server | `smtp.gmail.com` |
| `SMTP_USER` | Email sender | `admin@zie.co.zw` |
| `FRONTEND_URL` | Frontend app URL | `http://localhost:4200` |
| `PRODUCTION_DOMAIN` | Production domain | `https://zie.co.zw` |

## MongoDB Setup

### Option 1: Local MongoDB
```bash
# On Windows
mongod

# On macOS (with Homebrew)
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

### Option 2: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/zie-db`
4. Add to `.env`: `MONGODB_URI=mongodb+srv://...`

## Gmail SMTP Setup (for email notifications)

1. Enable 2-factor authentication on your Gmail account
2. Generate an app password: https://myaccount.google.com/apppasswords
3. Use the 16-character password in `.env` as `SMTP_PASS`

## Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000
# Kill process if needed
kill -9 <PID>
```

### MongoDB connection error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` is correct
- For Atlas, whitelist your IP address

### Port already in use
Change the `PORT` variable in `.env` to a different port (e.g., 5001)

## Development Tips

### Run with auto-reload
```bash
npm run dev
```

### Build and watch
```bash
npm run build -- --watch
```

### View logs
```bash
tail -f backend.log
```

## Deployment

### Before Deploying:
1. Set `NODE_ENV=production`
2. Use a production MongoDB URL (Atlas recommended)
3. Use strong, random `JWT_SECRET`
4. Configure emails with your domain email
5. Set `PRODUCTION_DOMAIN` to your actual domain

### Deploy to Services:
- **Heroku**: `git push heroku main`
- **Render**: Connect GitHub repo
- **AWS/Azure**: Use Docker or VM
- **DigitalOcean**: SSH + manual deployment

## Need Help?

See the main project README for more information.
