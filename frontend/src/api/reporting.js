// src/api/reporting.js

import { request } from "./client";

// ============================================================
// REPORTING - CREATE REPORT
// ============================================================

export async function createReport(payload) {
  const endpoint = "/api/reports";

  console.log("[REPORTING] CREATE REPORT → Request", {
    endpoint,
    method: "POST",
    payload,
  });

  try {
    const response = await request(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.log("[REPORTING] CREATE REPORT ← Response", {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    console.error("[REPORTING] CREATE REPORT ← Error", {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}

// ============================================================
// REPORTING - MY REPORTS
// ============================================================

export async function getMyReports() {
  const endpoint = "/api/reports/my-reports";

  console.log("[REPORTING] MY REPORTS → Request", {
    endpoint,
    method: "GET",
  });

  try {
    const response = await request(endpoint);

    console.log("[REPORTING] MY REPORTS ← Response", {
      endpoint,
      response,
    });

    return response;
  } catch (error) {
    console.error("[REPORTING] MY REPORTS ← Error", {
      endpoint,
      error: error.message,
    });

    throw error;
  }
}

// ============================================================
// REPORTING - REPORT DETAILS
// ============================================================

export async function getReport(reportId) {
  const endpoint = `/api/reports/${reportId}`;

  console.log("[REPORTING] REPORT DETAILS → Request", {
    endpoint,
    method: "GET",
    reportId,
  });

  try {
    const response = await request(endpoint);

    console.log("[REPORTING] REPORT DETAILS ← Response", {
      endpoint,
      reportId,
      response,
    });

    return response;
  } catch (error) {
    console.error("[REPORTING] REPORT DETAILS ← Error", {
      endpoint,
      reportId,
      error: error.message,
    });

    throw error;
  }
}