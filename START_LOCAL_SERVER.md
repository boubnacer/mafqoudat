# Testing Password Reset Locally

## Steps to test the new password reset feature locally:

### 1. Start the Backend Server

```bash
cd server
npm start
# or
node server.js
```

The server should start on `http://localhost:3500`

### 2. Start the Frontend (in a new terminal)

```bash
cd client
npm start
```

The frontend should open on `http://localhost:3000`

### 3. Test the Password Reset Flow

1. Go to `http://localhost:3000/login`
2. Click "Reset Password" button
3. Enter a phone number or email
4. Submit the request
5. You should see a success message

### 4. Verify in Admin Panel

1. Log in as admin
2. Go to Admin Dashboard
3. Click the "Password Reset Requests" tab
4. You should see your test request

---

## Quick Test Script

You can also run this test script to verify the backend route:

```bash
# From the project root directory
node test-password-reset-route.js
```

This will test if the password reset endpoint is responding correctly.

