# Mafkoudat Server - Deployment Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- PM2 (for production process management)

## Environment Setup

1. Copy the environment example file:
```bash
cp env.example .env
```

2. Configure the following environment variables in `.env`:

### Required Variables
- `DATABASE_URI`: MongoDB connection string
- `ACCESS_TOKEN_SECRET`: JWT access token secret (generate a strong random string)
- `REFRECH_TOKEN_SECRET`: JWT refresh token secret (generate a strong random string)

### Optional Variables
- `PORT`: Server port (default: 3500)
- `NODE_ENV`: Environment (development/production)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create required directories:
```bash
mkdir -p uploads logs
```

3. Seed the database with initial data:
```bash
npm run seed
```

## Database Setup

The application requires the following collections to be seeded:
- Countries (with multilingual support)
- FoundLost options (FOUND/LOST)
- Categories (with multilingual support)

Run the seed script to populate these:
```bash
npm run seed
```

## Production Deployment

### Using PM2

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the application:
```bash
pm2 start server.js --name "mafkoudat-server"
```

3. Save PM2 configuration:
```bash
pm2 save
```

4. Setup PM2 to start on system boot:
```bash
pm2 startup
```

### Using Docker

1. Build the Docker image:
```bash
docker build -t mafkoudat-server .
```

2. Run the container:
```bash
docker run -d -p 3500:3500 --name mafkoudat-server mafkoudat-server
```

## Health Check

The server provides a health check endpoint:
```
GET /health
```

Returns:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

## API Endpoints

### Authentication
- `POST /auth` - Login
- `GET /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Posts
- `GET /posts` - Get all posts (with pagination and filtering)
- `POST /posts` - Create new post
- `PATCH /posts` - Update post
- `DELETE /posts` - Delete post
- `GET /posts/:id` - Get single post

### Users
- `GET /users` - Get all users
- `POST /users` - Create new user
- `PATCH /users` - Update user
- `DELETE /users` - Delete user

### Countries
- `GET /countries` - Get all countries
- `POST /countries` - Create new country
- `PUT /countries/:id` - Update country
- `DELETE /countries/:id` - Delete country
- `GET /countries/search` - Search countries

### Categories
- `GET /categories` - Get all categories

### Found/Lost Options
- `GET /floptions` - Get all found/lost options

### Dependencies
- `POST /dependencies/category` - Create new category
- `POST /dependencies/foundlost` - Create new found/lost option

### Reports
- `POST /reports` - Create new report
- `GET /reports` - Get all reports
- `GET /reports/:id` - Get single report
- `DELETE /reports/:id` - Delete report

### Dashboard
- `GET /dashboard` - Get dashboard data

## File Upload

The server supports image uploads for posts:
- Supported formats: JPEG, JPG, PNG, GIF, WebP
- Maximum file size: 5MB
- Files are stored in the `uploads/` directory

## Logging

Logs are stored in the `logs/` directory:
- `reqLog.log` - Request logs
- `errLog.log` - Error logs
- `mongoErrLog.log` - MongoDB error logs

## Security Considerations

1. **JWT Secrets**: Use strong, unique secrets for JWT tokens
2. **CORS**: Configure allowed origins properly
3. **Rate Limiting**: Login attempts are rate-limited
4. **File Upload**: Only image files are allowed
5. **Input Validation**: All inputs are validated

## Monitoring

Monitor the application using:
- PM2 status: `pm2 status`
- PM2 logs: `pm2 logs mafkoudat-server`
- Health check endpoint: `GET /health`

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MongoDB is running
   - Verify DATABASE_URI is correct
   - Check network connectivity

2. **JWT Errors**
   - Verify JWT secrets are set
   - Check token expiration times

3. **File Upload Issues**
   - Ensure uploads directory exists
   - Check file size limits
   - Verify file type restrictions

4. **CORS Errors**
   - Update ALLOWED_ORIGINS in .env
   - Check client origin matches allowed origins

### Logs

Check logs for detailed error information:
```bash
tail -f logs/errLog.log
tail -f logs/reqLog.log
```

## Backup

Regularly backup:
- Database (MongoDB)
- Uploaded files (`uploads/` directory)
- Environment configuration (`.env`)

## Updates

To update the application:
1. Pull latest code
2. Install new dependencies: `npm install`
3. Run migrations if needed: `npm run migrate`
4. Restart the application: `pm2 restart mafkoudat-server` 