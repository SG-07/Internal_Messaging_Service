# API Reference - Quick Guide

## Group Management

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/groups/createGroup | User | Create new group | DONE
| GET | /api/groups | User | List all groups | Done
| GET | /api/groups/:id | User | Get group details |   
| PATCH | /api/groups/:id | Creator/Admin/Manager | Update group |
| DELETE | /api/groups/:id | Creator/Admin | Delete group |
| POST | /api/groups/:id/join | User | Join group |
| POST | /api/groups/:id/leave | Member | Leave group |

## Membership

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | /api/groups/:id/members | User | List members |
| POST | /api/groups/:id/members | Admin/Manager | Add member |
| DELETE | /api/groups/:id/members/:uid | Admin/Manager | Remove member |

## Join Requests

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | /api/groups/:id/requests | Creator/Admin/Manager | List requests |
| PATCH | /api/groups/:id/requests/:rid/approve | Creator/Admin/Manager | Approve request |
| PATCH | /api/groups/:id/requests/:rid/reject | Creator/Admin/Manager | Reject request |

## Reporting

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/conversations/:id/report | Participant | Report conversation |
| GET | /api/reports | Admin/Manager | List reports |
| PATCH | /api/reports/:id | Admin/Manager | Review report |

---

## Status Values

**Group Status:** pending, approved, rejected

**Group Visibility:** open, closed

**Membership Status:** not_member, member, left

**Join Request Status:** pending, approved, rejected

**Report Status:** pending, reviewed, dismissed, resolved

---

## Response Format

**Success (200/201):**
```json
{
  "success": true,
  "message": "...",
  "data": { /* response data */ },
  "pagination": { "page": 1, "limit": 20, "total": X, "has_more": false }
}
```

**Error (400/403/404/500):**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Common Query Parameters

- `page` - Pagination (default: 1)
- `status` - Filter by status
- `department` - Filter by department
- `is_open` - Filter by open/closed
- `sort_by` - Sort order (newest/oldest)

---

## Permission Summary

| Action | User | Manager | Admin |
|--------|------|---------|-------|
| Create group (dept) | ✅ | ✅ | ✅ |
| Create group (no dept) | ❌ | ❌ | ✅ |
| Add/Remove members | ❌ | ✅ | ✅ |
| Approve join requests | Creator | ✅ | ✅ |
| Delete group | Creator | ❌ | ✅ |
| Review reports | ❌ | ✅ | ✅ |
