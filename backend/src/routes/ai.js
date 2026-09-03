// backend/src/routes/ai.js
import { Router } from "express";
import {
  summarizeConversation,
  flagConversationImportance,
  getDigest,
  draftConversationReply,
  composeFirstMessage,
} from "../controllers/ai.js";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimiter } from "../middleware/aiRateLimiter.js";

const router = Router();

router.post(
  "/conversations/:conversationId/summary",
  requireAuth,
  aiRateLimiter,
  summarizeConversation,
);
router.post(
  "/conversations/:conversationId/importance",
  requireAuth,
  aiRateLimiter,
  flagConversationImportance,
);
router.get("/digest", requireAuth, aiRateLimiter, getDigest);
router.post(
  "/conversations/:conversationId/draft-reply",
  requireAuth,
  aiRateLimiter,
  draftConversationReply,
);
router.post(
  "/compose-message",
  requireAuth,
  aiRateLimiter,
  composeFirstMessage,
);

export default router;
