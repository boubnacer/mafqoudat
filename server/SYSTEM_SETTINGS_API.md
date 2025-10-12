# System Settings API Documentation

## Overview

The System Settings API provides admin-only endpoints for managing application-wide configuration settings, specifically maintenance mode.

**Base URL**: `/system-settings`

**Authentication**: All routes require:
- Valid JWT token in `Authorization: Bearer <token>` header
- User role must be `'admin'`

---

## Endpoints

### 1. Get System Settings

Retrieve current system settings including maintenance mode configuration.

**Request:**
```http
GET /system-settings
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "maintenanceMode": {
      "isActive": false,
      "message": "We're currently performing scheduled maintenance. We'll be back soon! Thank you for your patience.",
      "estimatedReturn": "soon",
      "lastUpdatedBy": "admin",
      "lastUpdatedAt": "2025-01-12T14:30:00.000Z"
    },
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-12T14:30:00.000Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Error retrieving system settings",
  "error": "Error details (only in development mode)"
}
```

---

### 2. Toggle/Update Maintenance Mode

Update maintenance mode settings. Can toggle on/off or update message and estimated return time.

**Request:**
```http
PATCH /system-settings/maintenance
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body (All fields optional):**
```json
{
  "isActive": true,
  "message": "Scheduled maintenance in progress. We'll be back at 2 PM EST.",
  "estimatedReturn": "2 PM EST"
}
```

**Field Descriptions:**

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `isActive` | Boolean | No | - | Set to `true` to enable maintenance mode, `false` to disable. If not provided, current state is toggled. |
| `message` | String | No | 500 chars | Custom message to display during maintenance. |
| `estimatedReturn` | String | No | 100 chars | Estimated return time (e.g., "2 hours", "2 PM EST", "soon"). |

**Examples:**

**Example 1: Enable maintenance mode**
```json
{
  "isActive": true
}
```

**Example 2: Disable maintenance mode**
```json
{
  "isActive": false
}
```

**Example 3: Toggle with custom message**
```json
{
  "message": "Emergency maintenance - database migration in progress",
  "estimatedReturn": "30 minutes"
}
```

**Example 4: Update everything**
```json
{
  "isActive": true,
  "message": "Scheduled server upgrade. Thank you for your patience.",
  "estimatedReturn": "2 hours"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Maintenance mode enabled successfully",
  "data": {
    "maintenanceMode": {
      "isActive": true,
      "message": "Scheduled maintenance in progress. We'll be back at 2 PM EST.",
      "estimatedReturn": "2 PM EST",
      "lastUpdatedBy": "admin",
      "lastUpdatedAt": "2025-01-12T14:35:00.000Z"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "isActive must be a boolean value"
}
```

```json
{
  "success": false,
  "message": "message cannot exceed 500 characters"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "User authentication required"
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Error updating maintenance mode",
  "error": "Error details (only in development mode)"
}
```

---

## Usage Examples

### Using cURL

**Get system settings:**
```bash
curl -X GET http://localhost:3500/system-settings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Enable maintenance mode:**
```bash
curl -X PATCH http://localhost:3500/system-settings/maintenance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'
```

**Toggle maintenance mode (no body = toggle current state):**
```bash
curl -X PATCH http://localhost:3500/system-settings/maintenance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Update with custom message:**
```bash
curl -X PATCH http://localhost:3500/system-settings/maintenance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true,
    "message": "Emergency maintenance in progress",
    "estimatedReturn": "1 hour"
  }'
```

**Disable maintenance mode:**
```bash
curl -X PATCH http://localhost:3500/system-settings/maintenance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

---

### Using JavaScript (Axios)

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3500';
const adminToken = 'YOUR_ADMIN_TOKEN';

// Get system settings
async function getSystemSettings() {
  try {
    const response = await axios.get(`${API_URL}/system-settings`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    console.log('Settings:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Enable maintenance mode
async function enableMaintenance() {
  try {
    const response = await axios.patch(
      `${API_URL}/system-settings/maintenance`,
      {
        isActive: true,
        message: 'Scheduled maintenance in progress',
        estimatedReturn: '2 hours'
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Toggle maintenance mode
async function toggleMaintenance() {
  try {
    const response = await axios.patch(
      `${API_URL}/system-settings/maintenance`,
      {}, // Empty body = toggle
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

---

### Using React/RTK Query

```javascript
// In your API slice
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const systemSettingsApi = createApi({
  reducerPath: 'systemSettingsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3500',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getSystemSettings: builder.query({
      query: () => '/system-settings',
      providesTags: ['SystemSettings'],
    }),
    updateMaintenanceMode: builder.mutation({
      query: (body) => ({
        url: '/system-settings/maintenance',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['SystemSettings'],
    }),
  }),
});

export const { 
  useGetSystemSettingsQuery, 
  useUpdateMaintenanceModeMutation 
} = systemSettingsApi;
```

**Using the hooks:**
```javascript
import React from 'react';
import { 
  useGetSystemSettingsQuery, 
  useUpdateMaintenanceModeMutation 
} from './systemSettingsApi';

function AdminPanel() {
  const { data, isLoading, error } = useGetSystemSettingsQuery();
  const [updateMaintenance] = useUpdateMaintenanceModeMutation();

  const handleToggle = async () => {
    try {
      await updateMaintenance({}).unwrap();
      alert('Maintenance mode toggled!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleEnable = async () => {
    try {
      await updateMaintenance({
        isActive: true,
        message: 'Maintenance in progress',
        estimatedReturn: '1 hour'
      }).unwrap();
      alert('Maintenance mode enabled!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>System Settings</h1>
      <p>Maintenance Mode: {data.data.maintenanceMode.isActive ? 'ON' : 'OFF'}</p>
      <button onClick={handleToggle}>Toggle Maintenance</button>
      <button onClick={handleEnable}>Enable Maintenance</button>
    </div>
  );
}
```

---

## Authentication

### Getting an Admin Token

1. **Login as admin user:**
```bash
curl -X POST http://localhost:3500/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

2. **Response will contain token:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "role": "admin",
    ...
  }
}
```

3. **Use token in subsequent requests:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Error Handling

### Common Error Codes

| Status Code | Meaning | Description |
|-------------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User is not an admin |
| 500 | Internal Server Error | Server error occurred |

### Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (only in development)"
}
```

---

## Logging

All actions are logged for audit purposes:

**Location**: `server/logs/reqLog.log`

**Log Format**:
```
YYYYMMDD  HH:mm:ss  uuid  EVENT_TYPE  Details
```

**Events Logged**:
- `SYSTEM_SETTINGS_VIEWED` - Admin viewed settings
- `MAINTENANCE_MODE_ENABLED` - Maintenance mode turned on
- `MAINTENANCE_MODE_DISABLED` - Maintenance mode turned off
- `MAINTENANCE_UPDATE_ERROR` - Error updating maintenance
- `SYSTEM_SETTINGS_ERROR` - Error fetching settings

**Example Logs**:
```
20250112	14:30:45	uuid-123	SYSTEM_SETTINGS_VIEWED	By: admin
20250112	14:31:22	uuid-456	MAINTENANCE_MODE_ENABLED	By: admin	Message: Scheduled maintenance in progress...
20250112	16:45:10	uuid-789	MAINTENANCE_MODE_DISABLED	By: admin	Message: We're currently performing scheduled...
```

---

## Security Considerations

1. **Admin-Only Access**: All endpoints require admin role
2. **JWT Verification**: Tokens must be valid and not expired
3. **Input Validation**: All inputs are validated before processing
4. **Audit Trail**: All changes are logged with user and timestamp
5. **Error Handling**: Errors don't expose sensitive information in production
6. **Rate Limiting**: Consider adding rate limiting for production

---

## Best Practices

1. **Always check current state** before updating
2. **Provide clear messages** to users during maintenance
3. **Give time estimates** when possible (e.g., "2 hours" instead of "soon")
4. **Log out non-admin users** when enabling maintenance
5. **Test in staging** before production maintenance
6. **Have a rollback plan** ready
7. **Monitor logs** during maintenance
8. **Notify users in advance** when possible

---

## Related Documentation

- **System Settings Guide**: `server/SYSTEM_SETTINGS_GUIDE.md`
- **Quick Reference**: `server/SYSTEM_SETTINGS_QUICK_REFERENCE.md`
- **Maintenance Mode Guide**: `MAINTENANCE_MODE_GUIDE.md`

---

## Support

For issues or questions:
1. Check server logs in `server/logs/`
2. Verify JWT token is valid
3. Confirm user has admin role
4. Review this API documentation
5. Check database for SystemSettings document

---

**API Version**: 1.0  
**Last Updated**: January 2025

