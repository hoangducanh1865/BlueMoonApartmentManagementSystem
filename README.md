# BlueMoon Apartment Management System

## Local Run Guidance

### Prerequisites

```
Java 17
PostgreSQL 17
Node.js
```

### The application uses:

```
Spring Boot 3.5.6 with Spring Security
JWT authentication (access token + refresh token via HttpOnly cookies)
PostgreSQL database with JPA/Hibernate
React with Vite and TypeScript for the frontend
```

### Database Setup

```
cd api
docker compose down -v
docker compose up -d
docker exec -i apartment_postgres pg_restore -U myuser -d apartment_db --no-owner --no-acl < backup_test.sql
docker exec -i apartment_postgres psql -U myuser -d apartment_db < V1_parking_management.sql
```

### Run the API (BE)

For MacOS:

```
./gradlew bootRun
```

For Window:

```
gradlew.bat bootRun
```

### Run the Client (FE)

```
cd client
npm i
npm run dev
```

### Run Face Recognition App

When a user accesses a face-recognition-required room, they need to verify their identity.

1. Run the verification system:
```bash
conda activate face_recognition
cd face_recognition
python -m src.main --mode verify --camera 0
```

2. Verification Process:
   - Stand in front of the camera.
   - Press `v` to check your face (must be previously registered in the system).

### Access Points

```
Frontend: http://localhost:3000
Backend: http://localhost:8080/api
```

# AWS Deploy Guidance

## Architecture Overview

```
RDS PostgreSQL: Database
Elastic Beanstalk: Spring Boot API (Java 17)
AWS Amplify: React Frontend hosting
CloudFront: CDN for frontend
```

## Setup RDS PostgreSQL Database

Create RDS Instance:

```
- Go to AWS Console -> Aurora and RDS -> Databases -> Create database
- Configuration:
  + Engine: PostgreSQL 17
  + DB instance size: Free tier
  + DB instance identifier: apartment-db
  + Master username: postgres
  + Master password: YourSecurePassword123! (save this!)
  + Publicly accessible: Yes (you may update this later, after the database is created)
  + VPC: Default VPC (or your custom VPC)
  + VPC Security group: default
- Click Create Database
- Security Group Configuration:
  + In tab Connectivity & security in your database -> Go to VPC security groups link -> Go to this	Security group ID link -> Edit inbound rules -> Add rule
  + Configuration:
    - Type: PostgreSQL
    - Source: My IP
```

After creation, get the endpoint:

```
Example: apartment-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
Port: 5432
```

Test connection and create database, from your local machine:

```apartment-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
psql -h apartment-db0.c5a0asik4hoo.ap-southeast-1.rds.amazonaws.com -U postgres -d postgres
CREATE DATABASE apartment_db;
\q
pg_restore \
  -h apartment-db0.c5a0asik4hoo.ap-southeast-1.rds.amazonaws.com \
  -U postgres \
  -d apartment_db \
  --no-owner \
  --no-acl \
  api/backup_test.sql
```

Check created database, from you local machine:

```
psql -h apartment-db0.c5a0asik4hoo.ap-southeast-1.rds.amazonaws.com -U postgres -d apartment_db
# Enter your password, then use these commands:

-- List all tables
\dt

-- Check table counts
SELECT 'households' as table_name, COUNT(*) as count FROM households
UNION ALL
SELECT 'residents', COUNT(*) FROM residents
UNION ALL
SELECT 'user_accounts', COUNT(*) FROM user_accounts
UNION ALL
SELECT 'fees', COUNT(*) FROM fees
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices;

-- View sample data from a table
SELECT * FROM user_accounts LIMIT 5;

-- Exit
\q
```

## Deploy Backend to Elastic Beanstalk

Build the JAR file:

```
cd api
./gradlew clean bootJar
```

The JAR file will be at:

```
api/build/libs/demo-api-0.0.1-SNAPSHOT.jar
```

Go to AWS Console -> Elastic Beanstalk -> Applications -> Create application. Configuration:

```
Application name: apartment-manager-api
```

Then click Create application.
Now still in Elastic Beanstalk -> Go to Create environment. Configuration:

```
Platform: Java
Platform branch: Corretto 17
Application code: Upload your code,
  + Version label: ver-1.0
  + Source code origin: Local file -> Select demo-api-0.0.1-SNAPSHOT.jar
```

Now in tab Configure service access (create the roles if they have not existed yet):

```
Service role: aws-elasticbeanstalk-service-role
EC2 instance profile: aws-elasticbeanstalk-ec2-role
```

Now in tab Configure instance traffic and scaling - optional, configuration:

```
EC2 security groups: select a security group that allows:
  + Inbound: HTTP (port 80) from anywhere (0.0.0.0/0)
  + Inbound: HTTPS (port 443) from anywhere (0.0.0.0/0) - if using HTTPS
  + Outbound: PostgreSQL (port 5432) to RDS security group
```

In my case, select:

```
sg-0fc6609393a560c73
```

Now in tab Configure updates, monitoring, and logging - optional, configuration:

```
Environment properties: add these new sources:
Name	Value
SERVER_PORT	5000
SPRING_DATASOURCE_URL	jdbc:postgresql://apartment-db0.c5a0asik4hoo.ap-southeast-1.rds.amazonaws.com:5432/apartment_db
SPRING_DATASOURCE_USERNAME	postgres
SPRING_DATASOURCE_PASSWORD	YourSecurePassword123!
SPRING_JPA_HIBERNATE_DDL_AUTO	update
JWT_ACCESS_TOKEN_SECRET	tKIc7RZEAoAo5dnVO7bhCrZuVU6PCzGO
JWT_REFRESH_TOKEN_SECRET	58484E6D3A5164B36C493BFB6E1D1PCzGO
JWT_ACCESS_TOKEN_EXPIRATION_MS	900000
JWT_REFRESH_TOKEN_EXPIRATION_MS	604800000
JWT_RESPONSE_COOKIE_SECURE	true
SPRING_PROFILES_ACTIVE	prod
```

Click next.

## Deploy React Frontend to AWS Amplify

Go to AWS Amplify -> Create new app. Configuration:

```
Source code provider: GitHub
Add repository and branch:
  + Repo: hoangducanh1865/ApartmentManagerBackend
  + Branch: dev
  + Root: client
App settings: Choose Edit YML file, then paste this:
version: 1
applications:
  - appRoot: client
    frontend:
      phases:
        preBuild:
          commands:
            - npm install
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
Environment variables: add new with:
  + Key: VITE_API_URL
  + Value: https://d1kyo8tlhbz0hy.cloudfront.net/api
```

To enable HTTPS, use CloudFront. In AWS Console -> Go to CloudFront -> Create distribution. Configuration:

```

```
