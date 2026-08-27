// src/api/reporting.js

import { request } from "./client";

// ============================================================
// REPORTING - CREATE REPORT
// ============================================================

// POST /api/reports
export async function createReport(payload) {
  const endpoint = "/api/reports";

  return request(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ============================================================
// REPORTING - MY REPORTS
// ============================================================

// GET /api/reports/my-reports
export async function getMyReports() {
  const endpoint = "/api/reports/my-reports";

  return request(endpoint);
}

// ============================================================
// REPORTING - REPORT DETAILS
// ============================================================

// GET /api/reports/:reportId
export async function getReport(reportId) {
  const endpoint = `/api/reports/${reportId}`;

  return request(endpoint);
}