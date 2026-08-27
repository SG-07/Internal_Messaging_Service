// src/components/reporting/reportConstants.js

export const REPORT_REASONS = [
  {
    value: "inappropriate_language",
    label: "Inappropriate language",
  },
  {
    value: "spam",
    label: "Spam",
  },
  {
    value: "harassment",
    label: "Harassment",
  },
  {
    value: "violence",
    label: "Violence",
  },
  {
    value: "hate_speech",
    label: "Hate speech",
  },
  {
    value: "misinformation",
    label: "Misinformation",
  },
  {
    value: "copyright_violation",
    label: "Copyright violation",
  },
  {
    value: "other",
    label: "Other",
  },
];

export const REPORT_ENTITY_TYPES = {
  CONVERSATION: "conversation",
  GROUP: "group",
  TEAM: "team",
  MESSAGE: "message",
  USER: "user",
};