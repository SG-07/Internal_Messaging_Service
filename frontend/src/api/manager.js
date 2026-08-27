// src/api/manager.js

import { request } from "./client";

// ============================================================
// MANAGER - TEAMS
// ============================================================

// GET /api/manager/teams
export async function getManagerTeams() {
  const endpoint = "/api/manager/teams";

  return request(endpoint);
}

// ============================================================
// MANAGER - TEAM DETAILS
// ============================================================

// GET /api/manager/teams/:teamId
export async function managerGetTeam(teamId) {
  const endpoint = `/api/manager/teams/${teamId}`;

  return request(endpoint);
}

// ============================================================
// MANAGER - TEAM MEMBERS
// ============================================================

// GET /api/manager/teams/:teamId/members
export async function managerGetTeamMembers(teamId) {
  const endpoint = `/api/manager/teams/${teamId}/members`;

  return request(endpoint);
}

// POST /api/manager/teams/:teamId/members
export async function managerAddTeamMember(teamId, userId) {
  const endpoint = `/api/manager/teams/${teamId}/members`;

  return request(endpoint, {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
    }),
  });
}

// DELETE /api/manager/teams/:teamId/members/:userId
export async function managerRemoveTeamMember(teamId, userId) {
  const endpoint =
    `/api/manager/teams/${teamId}/members/${userId}`;

  return request(endpoint, {
    method: "DELETE",
  });
}

// ============================================================
// MANAGER - DEPARTMENT USERS
// ============================================================

// GET /api/manager/department/users
export async function managerGetDepartmentUsers() {
  const endpoint = "/api/manager/department/users";

  return request(endpoint);
}

// GET /api/manager/department/users/:userId
export async function managerGetDepartmentUser(userId) {
  const endpoint =
    `/api/manager/department/users/${userId}`;

  return request(endpoint);
}

// ============================================================
// MANAGER - REPORT OVERSIGHT
// ============================================================

// GET /api/manager/reported-items
export async function managerGetReportedItems() {
  const endpoint = "/api/manager/reported-items";

  return request(endpoint);
}

// GET /api/manager/reported-items/:reportId
export async function managerGetReportedItem(reportId) {
  const endpoint =
    `/api/manager/reported-items/${reportId}`;

  return request(endpoint);
}

// GET /api/manager/reports
export async function managerGetReports() {
  const endpoint = "/api/manager/reports";

  return request(endpoint);
}

// PATCH /api/manager/reports/:reportId
export async function managerReviewReport(
  reportId,
  payload
) {
  const endpoint =
    `/api/manager/reports/${reportId}`;

  return request(endpoint, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
