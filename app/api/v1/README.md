# API v1 Documentation

**Base URL**: `https://yourapp.com/api/v1`  
**Authentication**: Required for all endpoints  
**Format**: JSON

---

## Authentication

All API requests require authentication via Supabase Auth.

```typescript
// Headers required:
Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN
Content-Type: application/json
```

---

## Endpoints

### Residents

#### List Residents
```
GET /api/v1/residents?page=1&limit=20&neighborhoodId=xxx&search=John
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `neighborhoodId` (optional): Filter by neighborhood
- `lotId` (optional): Filter by lot
- `familyUnitId` (optional): Filter by family unit
- `search` (optional): Search by name

**Response**:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

#### Get Single Resident
```
GET /api/v1/residents/:id
```

---

### Events

#### List Events
```
GET /api/v1/events?page=1&limit=20&categoryId=xxx&startDate=2024-01-01
```

**Query Parameters**:
- `page`, `limit`: Pagination
- `categoryId` (optional): Filter by category
- `startDate` (optional): Filter events starting after date
- `endDate` (optional): Filter events ending before date
- `visibilityScope` (optional): community | neighborhood | invite_only

#### Get Single Event
```
GET /api/v1/events/:id
```

#### RSVP to Event
```
POST /api/v1/events/:id/rsvp
```

**Body**:
```json
{
  "status": "yes" // or "no", "maybe"
}
```

---

### Locations

#### List Locations
```
GET /api/v1/locations?type=facility&neighborhoodId=xxx
```

**Query Parameters**:
- `type` (optional): Filter by location type
- `neighborhoodId` (optional): Filter by neighborhood

#### Get Single Location
```
GET /api/v1/locations/:id
```

---

### Exchange

#### List Exchange Listings
```
GET /api/v1/exchange/listings?page=1&categoryId=xxx&listingType=offer
```

**Query Parameters**:
- `page`, `limit`: Pagination
- `categoryId` (optional): Filter by category
- `listingType` (optional): offer | request
- `search` (optional): Search in title/description

#### Get Single Listing
```
GET /api/v1/exchange/listings/:id
```

---

### Notifications

#### List Notifications
```
GET /api/v1/notifications?page=1&unreadOnly=true
```

**Query Parameters**:
- `page`, `limit`: Pagination
- `unreadOnly` (optional): Only unread notifications (default: false)

#### Mark as Read
```
PATCH /api/v1/notifications/:id/read
```

---

### Check-ins

#### List Check-ins
```
GET /api/v1/check-ins?page=1&locationId=xxx&userId=xxx
```

**Query Parameters**:
- `page`, `limit`: Pagination
- `locationId` (optional): Filter by location
- `userId` (optional): Filter by user

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {...} // optional
  }
}
```

**HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request / Validation Error
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error

---

## Tenant Isolation

All requests are automatically scoped to the authenticated user's tenant. Cross-tenant access is denied unless the user has `super_admin` role.

---

## Testing

### Using curl:

```bash
# Get your auth token from Supabase
TOKEN="your_supabase_jwt_token"

# List events
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/events

# Get specific event
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/events/event-id-here
```

### Using Postman:

1. Set Authorization header: `Bearer YOUR_TOKEN`
2. Set Content-Type: `application/json`
3. Make requests to endpoints

---

## Implementation Status

✅ **Complete**:
- All endpoint routes created
- Authentication middleware
- Tenant isolation
- Error handling
- Pagination helpers

**Note**: Some POST/PATCH operations reference existing server actions and need integration. All GET operations are functional.
