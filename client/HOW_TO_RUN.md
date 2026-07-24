# Frontend Setup & Running Guide

## Project Overview

This is a **React + TypeScript** frontend application for the Apartment Manager system, built with:

- **React 19.2.0** - UI framework
- **Vite 6.2.0** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **TypeScript** - Type-safe development
- **Recharts** - Data visualization
- **Lucide React** - Icon library

The application includes both **Resident** and **Admin** dashboards with authentication and role-based access control.

---

## Prerequisites

Before running this application, ensure you have:

- **Node.js** (version 16.x or higher recommended)
- **npm** (comes with Node.js) or **yarn**

To check if Node.js is installed:

```bash
node --version
npm --version
```

---

## Installation Steps

### 1. Navigate to the Client Folder

```bash
cd /Users/hoangducanh/Documents/tmp_hust/ApartmentManagerBackend/client
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies listed in `package.json`:

- React and React DOM
- React Router DOM for navigation
- Recharts for charts and graphs
- Lucide React for icons
- TypeScript and Vite development tools

---

## Configuration

### Environment Variables

The application uses environment variables defined in `.env.local`:

```env
GEMINI_API_KEY=PLACEHOLDER_API_KEY
```

**Note:** If your application requires a Gemini API key, update the `.env.local` file with your actual API key. Otherwise, this can be left as is.

---

## Running the Application

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

**Default Access:**

- The app will run on: `http://localhost:3000`
- The server is configured to be accessible from any network interface (`0.0.0.0`)

### Build for Production

Create an optimized production build:

```bash
npm run build
```

The build output will be in the `dist/` folder.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

---

## Application Structure

```
client/
├── components/          # Reusable UI components
│   └── Layout.tsx      # Main layout wrapper
├── pages/              # Page components
│   ├── Login.tsx       # Login page
│   ├── Register.tsx    # Registration page
│   ├── admin/          # Admin pages
│   │   ├── AdminDashboard.tsx
│   │   ├── FeeManager.tsx
│   │   ├── HouseholdManager.tsx
│   │   ├── RequestManager.tsx
│   │   └── ResidentManager.tsx
│   └── resident/       # Resident pages
│       ├── ResidentDashboard.tsx
│       ├── FeeList.tsx
│       ├── PaymentHistory.tsx
│       └── ResidentProfile.tsx
├── services/           # API and data services
│   ├── authService.ts  # Authentication logic
│   ├── feeService.ts   # Fee management
│   ├── householdService.ts
│   └── mockData.ts     # Mock data for development
├── App.tsx             # Main app component with routing
├── index.tsx           # Application entry point
├── types.ts            # TypeScript type definitions
└── vite.config.ts      # Vite configuration
```

---

## Available Features

### For Residents:

- View personal dashboard
- View and manage fees
- View payment history
- Update personal profile

### For Admins:

- Admin dashboard with statistics
- Manage households
- Manage residents
- Handle requests
- Manage fees

---

## Routing

The application uses **HashRouter** for client-side routing:

- `/` - Login page
- `/register` - Registration page
- `/resident/*` - Resident pages (protected)
- `/admin/*` - Admin pages (protected, admin role only)

---

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can:

1. Stop the process using port 3000
2. Or modify the port in `vite.config.ts`:
   ```typescript
   server: {
     port: 3001, // Change to any available port
     host: '0.0.0.0',
   }
   ```

### Dependencies Installation Issues

If you encounter issues during `npm install`:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### TypeScript Errors

Ensure TypeScript is properly installed:

```bash
npm install --save-dev typescript
```

---

## Backend API Setup (REQUIRED)

⚠️ **IMPORTANT:** This frontend application requires the backend API to be running. The client connects to the Spring Boot backend at `http://localhost:8080` (or via ngrok tunnel).

### Prerequisites for Backend

Before starting the frontend, ensure you have:

- **Java 17** or higher
- **Docker** (for PostgreSQL database)
- **Gradle** (included in the project)

Check if you have them installed:

```bash
java -version      # Should show version 17+
docker --version   # Should show Docker version
```

### Backend Setup Steps

#### 1. Navigate to the API Folder

```bash
cd /Users/hoangducanh/Documents/tmp_hust/ApartmentManagerBackend/api
```

#### 2. Start PostgreSQL Database

Start the PostgreSQL container using Docker:

```bash
# Start PostgreSQL with Docker Compose
docker-compose up -d

# Wait for database to initialize (5 seconds)
sleep 5

# Import test data (includes sample users and households)
docker exec -i apartment_postgres psql -U myuser -d apartment_db < backup_test

# Verify database is ready (should list tables)
docker exec apartment_postgres psql -U myuser -d apartment_db -c "\dt"
```

**Database Configuration:**

- **Host:** localhost
- **Port:** 5432
- **Database:** apartment_db
- **Username:** myuser
- **Password:** mysecretpassword

#### 3. Start the Spring Boot Application

Choose one of the following methods:

**Option A: Using Gradle (Recommended)**

```bash
./gradlew bootRun
```

**Option B: Using the Quick Start Script**

```bash
chmod +x tmp/start.sh
./tmp/start.sh
```

**Option C: Using VS Code Spring Boot Dashboard**

1. Open the `api` folder in VS Code
2. Look for **Spring Boot Dashboard** in the left sidebar
3. Find `demo-api` and click the **▶️ Play button**

The backend API will start on: **http://localhost:8080**

#### 4. Verify Backend is Running

Open your browser or use curl:

```bash
# Check if backend is accessible (should return 404 - that's normal, no root endpoint)
curl http://localhost:8080

# Or test the health endpoint if available
curl http://localhost:8080/api/auth/login
```

### Test Accounts

The imported test database includes sample accounts. You can register a new account or use existing ones:

**To Register a New Account:**

```bash
# Using curl
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "residentCode": "1",
    "phoneNumber": "0123456789",
    "email": "admin@test.com",
    "password": "Password123!"
  }'
```

**To View Existing Accounts:**

```bash
docker exec apartment_postgres psql -U myuser -d apartment_db \
  -c "SELECT accountid, email, role FROM useraccount;"
```

### Backend API Endpoints

The backend provides these main endpoints:

**Authentication (Public):**

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

**Households (Authenticated):**

- `GET /api/households` - List all households
- `GET /api/households/{id}` - Get household details
- `POST /api/households` - Create household (Admin only)
- `PUT /api/households/{id}` - Update household (Admin only)

**For more API documentation, see:** `/api/tmp/README.md`

### Stopping the Backend

```bash
# Stop the Spring Boot application
# Press Ctrl+C in the terminal running the app

# Stop the PostgreSQL container
docker-compose down

# Or to stop and remove all data
docker-compose down -v
```

### Troubleshooting Backend

**Port 8080 Already in Use:**

```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

**Database Connection Issues:**

```bash
# Check if PostgreSQL container is running
docker ps | grep apartment_postgres

# Restart the container
docker-compose restart

# Check database logs
docker logs apartment_postgres
```

**Reset Database:**

```bash
# Stop and remove containers
docker-compose down -v

# Start fresh and reimport data
docker-compose up -d
sleep 5
docker exec -i apartment_postgres psql -U myuser -d apartment_db < backup_test
```

---

## ⚠️ IMPORTANT: Connecting Frontend to Backend (Local Development)

### The Problem

By default, the frontend is configured to connect to a **remote ngrok URL**:

```
https://superobjectionable-karol-faultlessly.ngrok-free.dev/api
```

If you're running your backend **locally** on `http://localhost:8080`, the frontend won't be able to connect, and **login will fail**.

### The Solution

You need to update the API URL in **three service files** to point to your local backend:

#### Step-by-Step Fix:

**1. Open `services/authService.ts`**

Find line 3:

```typescript
const API_BASE_URL =
  "https://superobjectionable-karol-faultlessly.ngrok-free.dev/api";
```

Replace it with:

```typescript
const API_BASE_URL = "http://localhost:8080/api";
```

**2. Open `services/feeService.ts`**

Find line 3:

```typescript
const API_BASE_URL =
  "https://superobjectionable-karol-faultlessly.ngrok-free.dev/api";
```

Replace it with:

```typescript
const API_BASE_URL = "http://localhost:8080/api";
```

**3. Open `services/householdService.ts`**

Find line 3:

```typescript
const API_BASE_URL =
  "https://superobjectionable-karol-faultlessly.ngrok-free.dev/api";
```

Replace it with:

```typescript
const API_BASE_URL = "http://localhost:8080/api";
```

**4. Save all files**

The frontend will automatically reload (hot reload) and now connect to your local backend!

### Verify the Connection

After updating the files, check your browser's Developer Console (F12):

- Go to the **Network** tab
- Try to login
- You should see API requests going to `http://localhost:8080/api/auth/login`
- If you see errors about `superobjectionable-karol-faultlessly.ngrok-free.dev`, you missed updating a file

### Quick Test

1. Make sure your backend is running on `http://localhost:8080`
2. Open browser: `http://localhost:3000`
3. Open Developer Console (F12) → Console tab
4. Try to login
5. If connection fails, check the Console for error messages

---

## How to Login Successfully

### Prerequisites Checklist:

✅ **Backend is running** on `http://localhost:8080`

```bash
# Test backend is accessible
curl http://localhost:8080/api/auth/login
# Should return 405 or 401 error (that's good - endpoint exists)
```

✅ **Database has users**

```bash
# View existing accounts
docker exec apartment_postgres psql -U myuser -d apartment_db \
  -c "SELECT accountid, email, role FROM useraccount;"
```

✅ **Frontend service files updated** to use `http://localhost:8080/api`

✅ **Frontend is running** on `http://localhost:3000`

### Login Steps:

#### Option 1: Register a New Account

1. Go to `http://localhost:3000`
2. Click **"Register"** (if available) or go to `http://localhost:3000/#/register`
3. Fill in the form:
   - **Resident Code:** Get from database (see below)
   - **Phone Number:** e.g., `0123456789`
   - **Email:** e.g., `test@example.com`
   - **Password:** e.g., `Password123!`
4. Click **Register**
5. After successful registration, login with your email and password

**To get a valid Resident Code from database:**

```bash
# List available resident codes (apartments without accounts)
docker exec apartment_postgres psql -U myuser -d apartment_db \
  -c "SELECT apartmentid, apartmentnumber, building FROM apartment LIMIT 10;"

# Use the apartmentid as the residentCode
```

#### Option 2: Use Existing Account

1. **Find existing accounts in database:**

```bash
docker exec apartment_postgres psql -U myuser -d apartment_db \
  -c "SELECT accountid, email, role FROM useraccount;"
```

2. **If accounts exist but you don't know passwords:**
   - Either register a new account (Option 1)
   - Or create an admin account via SQL (see below)

#### Option 3: Create Admin Account via SQL

```bash
# Create a test admin account
docker exec apartment_postgres psql -U myuser -d apartment_db << EOF
INSERT INTO useraccount (email, password, role, phonenumber)
VALUES (
  'admin@test.com',
  '\$2a\$10\$N9qo8uLOickgx2ZMRZoMye/v7M1vYfHYP3V.Vu3VUJ1TcGVBsYHUC',  -- Password is: Password123!
  'ADMIN',
  '0987654321'
);
EOF
```

Then login with:

- **Email:** `admin@test.com`
- **Password:** `Password123!`

### Common Login Issues:

**Issue 1: "Failed to fetch" or "Network Error"**

- ✅ Backend is not running → Start it: `./gradlew bootRun`
- ✅ Wrong API URL in service files → Update to `http://localhost:8080/api`
- ✅ CORS issue → Backend should have CORS configured (check logs)

**Issue 2: "Invalid credentials" or "User not found"**

- ✅ Email/password incorrect
- ✅ User doesn't exist in database → Register new account
- ✅ Check database for existing users (see command above)

**Issue 3: "Can't access /admin routes"**

- ✅ You need to login with an account that has `ADMIN` role
- ✅ Check your user's role in database
- ✅ Create admin account using SQL command above

**Issue 4: Console shows errors about ngrok URL**

- ✅ You forgot to update the API URL in service files
- ✅ Update all three files and save
- ✅ Refresh the browser (Ctrl+R)

### Debug Tools:

**Check API Connection:**

```javascript
// Open browser console (F12) and run:
fetch("http://localhost:8080/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@test.com",
    password: "Password123!",
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("Success:", data))
  .catch((err) => console.error("Error:", err));
```

**Check Current API URL:**

```javascript
// In browser console, check current localStorage
console.log("Current token:", localStorage.getItem("token"));
console.log(
  "Current user:",
  JSON.parse(localStorage.getItem("user") || "null")
);

// Clear session if needed
localStorage.clear();
```

---

## Complete Startup Sequence

**Step 1: Start Backend**

```bash
# In the api folder
cd /Users/hoangducanh/Documents/tmp_hust/ApartmentManagerBackend/api

# Start database
docker-compose up -d
sleep 5
docker exec -i apartment_postgres psql -U myuser -d apartment_db < backup_test

# Start backend
./gradlew bootRun
```

**Step 2: Start Frontend**

```bash
# In a NEW terminal, navigate to client folder
cd /Users/hoangducanh/Documents/tmp_hust/ApartmentManagerBackend/client

# Install dependencies (first time only)
npm install

# Start frontend
npm run dev
```

**Step 3: Access the Application**

- Open browser: `http://localhost:3000`
- Login or register a new account
- For admin access, ensure your account has `ADMIN` role in the database

---

## Development Tips

- **Hot Reload:** Changes to the code will automatically reload in the browser
- **TypeScript:** The project uses TypeScript for type safety - check `types.ts` for type definitions
- **Mock Data:** During development, mock data is available in `services/mockData.ts`
- **Styling:** The application uses React components with inline styles and CSS

---

## Next Steps

1. Start the backend API server
2. Run `npm install` in the client folder
3. Run `npm run dev` to start the frontend
4. Navigate to `http://localhost:3000` in your browser
5. Login with appropriate credentials (resident or admin)

---

## Additional Commands

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Run TypeScript type checking
npx tsc --noEmit
```

---

## 🚀 AWS Deployment Guide

This section explains how to deploy your full-stack application (Frontend + Backend + Database) to AWS using GitHub.

### Deployment Architecture

Your application will be deployed as:

- **Frontend:** AWS Amplify (React static site)
- **Backend:** AWS Elastic Beanstalk or ECS (Spring Boot API)
- **Database:** AWS RDS PostgreSQL (managed database)

---

## Prerequisites for AWS Deployment

Before deploying to AWS, you need:

1. **AWS Account** - Sign up at https://aws.amazon.com
2. **GitHub Account** - Your code must be in a GitHub repository
3. **AWS CLI** (optional but recommended) - Install from https://aws.amazon.com/cli/
4. **IAM User with appropriate permissions** for Amplify, Beanstalk, RDS

---

## Part 1: Code Changes Before Deployment

### 1.1 Frontend Changes

**Create environment-specific configuration:**

**Option A: Using Environment Variables (Recommended)**

Create `.env.production` in the `client` folder:

```env
VITE_API_URL=http://apartment-manager-api-env.eba-szyaeqjz.ap-southeast-1.elasticbeanstalk.com/api
```

Update all service files to use environment variable:

**In `services/authService.ts`:**

```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";
```

**In `services/feeService.ts`:**

```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";
```

**In `services/householdService.ts`:**

```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";
```

**Option B: Using Config File**

Create `config.ts` in the `client` folder:

```typescript
export const config = {
  apiUrl:
    process.env.NODE_ENV === "production"
      ? "http://apartment-manager-api-env.eba-szyaeqjz.ap-southeast-1.elasticbeanstalk.com/api"
      : "http://localhost:8080/api",
};
```

Then update service files to import from config.

### 1.2 Backend Changes

**Update `application-prod.properties`:**

```properties
# RDS Database URL (use your actual RDS endpoint)
spring.datasource.url=jdbc:postgresql://apartment-db.c5a0asik4hoo.ap-southeast-1.rds.amazonaws.com:5432/apartment_db
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# Don't auto-create tables in production
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

# JWT Settings
jwt.access-token.secret=${JWT_ACCESS_SECRET}
jwt.refresh-token.secret=${JWT_REFRESH_SECRET}
jwt.access-token.expiration-ms=900000
jwt.refresh-token.expiration-ms=604800000
jwt.response-cookie.secure=true

# Logging
logging.level.org.hibernate.SQL=INFO
logging.level.org.hibernate.orm.jdbc.bind=INFO
```

**Update CORS Configuration:**

In `SecurityConfig.java`, update CORS to allow your frontend domain:

```java
// Replace * with your actual Amplify domain
configuration.setAllowedOriginPatterns(List.of(
    "https://your-app-name.amplifyapp.com",
    "https://main.your-app-id.amplifyapp.com",
    "http://localhost:3000"  // For local development
));
```

**Create `buildspec.yml` for Elastic Beanstalk (optional):**

```yaml
version: 0.2
phases:
  build:
    commands:
      - echo Build started on `date`
      - ./gradlew clean build
artifacts:
  files:
    - build/libs/*.jar
```

### 1.3 Database Migration Script

Create `init-db.sql` in `api` folder with your schema:

```sql
-- Export your current database schema
-- Run this on local database to generate:
docker exec apartment_postgres pg_dump -U myuser -d apartment_db --schema-only > init-db.sql
```

---

## Part 2: GitHub Setup

### 2.1 Create GitHub Repository

```bash
cd /Users/hoangducanh/Documents/tmp_hust/ApartmentManagerBackend

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Apartment Manager Application"

# Create repository on GitHub, then add remote
git remote add origin https://github.com/YOUR_USERNAME/apartment-manager.git

# Push to GitHub
git push -u origin main
```

### 2.2 Branch Strategy

**Recommended Branches:**

- `main` - Production-ready code (deploy to AWS)
- `develop` - Development branch (for testing)
- `feature/*` - Feature branches

**For deployment, use the `main` branch.**

### 2.3 Create `.gitignore` (if not exists)

```gitignore
# Node
node_modules/
dist/
.env.local

# Java
.gradle/
build/
*.jar
!gradle-wrapper.jar

# IDE
.idea/
.vscode/
*.iml

# Environment
.env
*.log
```

---

## Part 3: Deploy Database (AWS RDS)

### 3.1 Create RDS PostgreSQL Instance

**Using AWS Console:**

1. Go to **AWS Console** → **RDS** → **Create Database**
2. Choose **PostgreSQL** (version 15 or 17 recommended)
3. Choose **Free tier** or appropriate instance class (e.g., `db.t3.micro`)
4. **Settings:**
   - DB Instance Identifier: `apartment-db`
   - Master username: `postgres`
   - Master password: (create strong password)
5. **Connectivity:**
   - VPC: Default VPC
   - Public access: **Yes** (for initial setup; restrict later)
   - Security group: Create new (allow PostgreSQL port 5432)
   - Availability Zone: Choose your preferred region (e.g., ap-southeast-1)
6. **Database name:** `apartment_db`
7. Click **Create Database**

**Wait 5-10 minutes for RDS to be available.**

### 3.2 Get RDS Endpoint

After RDS is created:

1. Go to RDS Console → Databases → `apartment-db`
2. Copy the **Endpoint** (e.g., `apartment-db.c5a0asik4hoo.ap-southeast-1.rds.amazonaws.com`)

### 3.3 Configure Security Group

1. Go to **EC2** → **Security Groups**
2. Find the security group for your RDS
3. Add **Inbound Rule:**
   - Type: PostgreSQL
   - Port: 5432
   - Source: Your IP (for initial setup) + Elastic Beanstalk security group (later)

### 3.4 Import Database Schema

**Connect to RDS and import schema:**

```bash
# Export current schema from local
docker exec apartment_postgres pg_dump -U myuser -d apartment_db > backup_production.sql

# Connect to RDS
psql -h apartment-db.c5a0asik4hoo.ap-southeast-1.rds.amazonaws.com -U postgres -d apartment_db

# Or import directly
psql -h apartment-db.c5a0asik4hoo.ap-southeast-1.rds.amazonaws.com -U postgres -d apartment_db < backup_production.sql
```

---

## Part 4: Deploy Backend (AWS Elastic Beanstalk)

### 4.1 Build Production JAR

```bash
cd api

# Build with production profile
./gradlew clean build -Pspring.profiles.active=prod

# JAR file will be in: build/libs/demo-api-0.0.1-SNAPSHOT.jar
```

### 4.2 Deploy Using Elastic Beanstalk Console

1. Go to **AWS Console** → **Elastic Beanstalk** → **Create Application**
2. **Application name:** `apartment-manager-api`
3. **Platform:** Java (Corretto 17)
4. **Application code:** Upload your JAR file from `build/libs/`
5. Click **Create Application**

### 4.3 Configure Environment Variables

After creation, go to:
**Configuration** → **Software** → **Environment Properties**

Add these variables:

```
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=5000
DB_USERNAME=postgres
DB_PASSWORD=your-rds-password
JWT_ACCESS_TOKEN_SECRET=tKIc7RZEAoAo5dnVO7bhCrZuVU6PCzGO
JWT_REFRESH_TOKEN_SECRET=58484E6D3A5164B36C493BFB6E1D1PCzGO
JWT_ACCESS_TOKEN_EXPIRATION=3600000
JWT_REFRESH_TOKEN_EXPIRATION=86400000
SPRING_DATASOURCE_URL=jdbc:postgresql://apartment-db.c5a0asik4hoo.ap-southeast-1.rds.amazonaws.com:5432/apartment_db
```

**Click Apply**

### 4.4 Update Security Group for RDS Access

1. Go to **RDS Console** → Security Groups
2. Add **Inbound Rule:**
   - Source: Elastic Beanstalk security group

### 4.5 Get Backend URL

After deployment completes:

- Your backend URL will be: `http://apartment-manager-api-env.eba-szyaeqjz.ap-southeast-1.elasticbeanstalk.com`
- Test: `curl http://apartment-manager-api-env.eba-szyaeqjz.ap-southeast-1.elasticbeanstalk.com/api/auth/login`
- Expected response: 405 or 500 error (endpoint exists but needs POST method)

---

## Part 5: Deploy Frontend (AWS Amplify)

### 5.1 Update Frontend API URL

**Before deploying, update the API URL in your code:**

**In `.env.production`:**

```env
VITE_API_URL=http://apartment-manager-api-env.eba-szyaeqjz.ap-southeast-1.elasticbeanstalk.com/api
```

**Commit and push to GitHub:**

```bash
cd client
git add .
git commit -m "Update API URL for production"
git push
```

### 5.2 Deploy Using AWS Amplify Console

1. Go to **AWS Console** → **AWS Amplify** → **New App** → **Host web app**
2. Choose **GitHub** as source
3. **Authorize** Amplify to access your GitHub account
4. **Select repository:** `apartment-manager`
5. **Select branch:** `main`
6. **App name:** `apartment-manager-frontend`

### 5.3 Configure Build Settings

Amplify will auto-detect Vite. Update the build settings if needed:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd client
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: client/dist
    files:
      - "**/*"
  cache:
    paths:
      - client/node_modules/**/*
```

### 5.4 Add Environment Variables

In Amplify Console:
**App settings** → **Environment variables** → **Add**

```
VITE_API_URL=http://apartment-manager-api-env.eba-szyaeqjz.ap-southeast-1.elasticbeanstalk.com/api
```

### 5.5 Deploy

Click **Save and Deploy**

Wait 5-10 minutes for build and deployment.

### 5.6 Get Frontend URL

After deployment:

- Your frontend URL: `https://main.your-app-id.amplifyapp.com`
- Test by opening in browser

---

## Part 6: Update CORS in Backend

**Important:** After getting your Amplify URL, update CORS configuration:

1. Update `SecurityConfig.java`:

```java
configuration.setAllowedOriginPatterns(List.of(
    "https://main.your-app-id.amplifyapp.com"
));
```

2. Rebuild and redeploy backend:

```bash
./gradlew clean build
```

3. Upload new JAR to Elastic Beanstalk

---

## Part 7: Enable HTTPS (Optional but Recommended)

### 7.1 For Backend (Elastic Beanstalk)

1. Get an SSL certificate from **AWS Certificate Manager** (free)
2. Configure **Load Balancer** in Elastic Beanstalk
3. Add HTTPS listener with certificate

### 7.2 For Frontend (Amplify)

Amplify provides HTTPS by default! ✅

---

## Deployment Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] RDS security group allows Elastic Beanstalk access
- [ ] Backend API is accessible (test with curl)
- [ ] Frontend can connect to backend
- [ ] CORS configured correctly
- [ ] HTTPS enabled (recommended)
- [ ] JWT secrets are strong and secure
- [ ] Database has initial data/schema
- [ ] Test login functionality
- [ ] Test all critical features

---

## Cost Estimates (AWS Free Tier)

**Free Tier (First 12 months):**

- RDS: 750 hours/month of db.t3.micro ✅ FREE
- Elastic Beanstalk: EC2 included in Free Tier ✅ FREE
- Amplify: 1000 build minutes/month + hosting ✅ FREE

**After Free Tier (~$20-50/month):**

- RDS: ~$15/month (db.t3.micro)
- Elastic Beanstalk: ~$15/month (t3.micro)
- Amplify: ~$5/month

**To minimize costs:**

- Use smallest instance types
- Stop non-production environments when not in use
- Use RDS scheduled scaling

---

## Alternative Deployment Options

### Option 2: Deploy Everything on EC2

**Pros:** More control, potentially cheaper
**Cons:** More manual setup, no auto-scaling

**Steps:**

1. Launch EC2 instance (t2.micro)
2. Install Java, Node.js, PostgreSQL
3. Clone GitHub repo
4. Run backend and frontend manually
5. Use Nginx as reverse proxy

### Option 3: Use Docker + ECS

**Pros:** Containerized, scalable
**Cons:** More complex setup

**Steps:**

1. Create Dockerfile for backend
2. Push to ECR (Elastic Container Registry)
3. Deploy using ECS Fargate
4. Use RDS for database
5. Deploy frontend to Amplify

---

## Continuous Deployment

### Set Up Auto-Deploy from GitHub

**Amplify:** Automatically deploys on push to `main` branch ✅

**Elastic Beanstalk:**

1. Go to **Configuration** → **Application versions**
2. Enable **CodePipeline** integration with GitHub
3. Auto-deploy on push to `main` branch

---

## Troubleshooting Deployment

### Frontend can't connect to Backend

**Check:**

- API URL is correct in `.env.production`
- Backend is running and accessible
- CORS allows frontend domain

### Backend won't start

**Check:**

- RDS connection string is correct
- Environment variables are set
- Security groups allow RDS access

### Database connection fails

**Check:**

- RDS is publicly accessible
- Security group allows port 5432
- Credentials are correct

---

## Monitoring & Logs

**Elastic Beanstalk Logs:**

```bash
# Download logs from console
AWS Console → Elastic Beanstalk → Logs → Request Logs
```

**Amplify Logs:**

```bash
AWS Console → Amplify → Your App → Build History
```

**RDS Logs:**

```bash
AWS Console → RDS → Your DB → Logs & Events
```

---

**Happy Deploying! 🚀☁️**
