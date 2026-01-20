# Project Structure & Data Analysis Summary

## 🎯 Overall Assessment: **GOOD** (8/10)

The project has a solid foundation with good data capture and analytics capabilities. The recent LLM-based topic extraction significantly improves topic classification.

---

## ✅ Strengths

### 1. **Well-Structured Database Schema**
- Comprehensive session tracking
- Flexible JSONB metadata fields
- Proper foreign key relationships
- Good indexing strategy

### 2. **Multi-Level Data Capture**
- **Session level**: lifecycle, duration, abandonment
- **Message level**: full conversation history
- **Interaction level**: user behavior tracking
- **Feedback level**: satisfaction and votes

### 3. **Analytics Dashboard**
- Comprehensive metrics
- Date filtering
- Micro-interaction segmentation
- Topic-based analysis (now with LLM topics!)

### 4. **Recent Improvements**
- ✅ LLM-based topic extraction (replaces generic categories)
- ✅ Increased topic field length (64 → 255 chars)
- ✅ Better conversation context analysis

---

## ⚠️ Issues Found & Recommendations

### 🔴 Critical Issues

#### 1. **Session Manager Memory Leak Risk**
**Location:** `lib/session-manager.ts`

**Problem:**
```typescript
// Runs only in browser, but sessions grow unbounded in server
if (typeof window !== 'undefined') {
  setInterval(() => this.cleanupOldSessions(), 5 * 60 * 1000);
}
```

**Impact:** Server-side sessions never get cleaned up, causing memory leaks in production.

**Fix:**
```typescript
constructor() {
  // Cleanup works both client and server
  setInterval(() => this.cleanupOldSessions(), 5 * 60 * 1000);
}
```

#### 2. **Missing Error Handling in Topic Extraction**
**Location:** `app/api/extract-topic/route.ts`

**Problem:** API errors fail silently, returning generic "Conversa geral"

**Impact:** Can't monitor or debug topic extraction failures

**Fix:** Add error logging and monitoring

#### 3. **Race Condition in Session Creation**
**Location:** Multiple API routes

**Problem:** Multiple requests can try to create the same session simultaneously

**Impact:** Database constraint violations or duplicate session attempts

**Fix:** Use `INSERT ... ON CONFLICT DO NOTHING` or proper locking

---

### 🟡 Medium Priority Issues

#### 4. **Incomplete Dashboard Metrics**
**Location:** `app/api/dashboard/stats/route.ts`

**Problems:**
- `avgConfidence` always returns 0 (not calculated)
- `redirectedSessions`, `skippedSessions` always 0
- `medianMs`, `avgWithMicroMs`, etc. not calculated
- Topic stats missing detailed calculations

**Impact:** Dashboard shows incomplete/misleading data

#### 5. **No Message-Level Analytics**
**Problem:** Can't analyze individual message quality

**Missing:**
- Response time tracking
- Token usage per message
- Error rates per message
- Message complexity metrics

**Impact:** Can't identify which AI responses are problematic

#### 6. **Limited Interaction Type Tracking**
**Current types:**
- `suggestion_click`
- `typed_message`
- `end_modal_shown_idle`
- `end_modal_answer_yes/no`
- `feedback_skipped`
- `post_feedback_redirect`

**Missing:**
- Message edits/retries
- Attachment usage
- Copy/paste actions
- Scroll behavior
- Time between messages

**Impact:** Limited understanding of user behavior patterns

---

### 🟢 Low Priority Improvements

#### 7. **Topic Validation**
Add confidence scores and validation for LLM-extracted topics

#### 8. **Conversation Flow Analysis**
Track topic switches, question types, conversation depth

#### 9. **A/B Testing Framework**
Test different prompts, UI variations, feedback triggers

#### 10. **Predictive Analytics**
Predict satisfaction, churn, topic classification

---

## 🔧 Immediate Action Items

### Must Fix (This Week)

1. **Fix Session Manager Memory Leak**
```typescript
// lib/session-manager.ts
constructor() {
  setInterval(() => this.cleanupOldSessions(), 5 * 60 * 1000);
}
```

2. **Add Error Logging to Topic Extraction**
```typescript
// app/api/extract-topic/route.ts
catch (error) {
  console.error('Topic extraction failed:', error);
  // Send to monitoring service
  return Response.json({ topic: 'Conversa geral', error: true });
}
```

3. **Fix Session Creation Race Condition**
```sql
-- Use upsert pattern
INSERT INTO chat_sessions (id, user_id, with_micro_interactions)
VALUES ($1, $2, $3)
ON CONFLICT (id) DO NOTHING;
```

### Should Fix (Next Sprint)

4. **Complete Dashboard Calculations**
- Calculate actual `avgConfidence`
- Track redirected/skipped sessions properly
- Calculate session duration metrics by category

5. **Add Message Metadata**
```sql
ALTER TABLE chat_messages ADD COLUMN metadata JSONB;
-- Store: response_time_ms, token_count, model_used
```

6. **Enhanced Interaction Tracking**
Add interaction types:
- `message_edit`
- `message_retry`
- `attachment_added`
- `copy_message`

### Nice to Have (Future)

7. Create `conversation_events` table for flow analysis
8. Add topic confidence tracking
9. Implement error logging table
10. Build A/B testing framework

---

## 📊 Data Quality Score: 7.5/10

| Category | Score | Notes |
|----------|-------|-------|
| Schema Design | 9/10 | Well structured, flexible |
| Data Capture | 7/10 | Good coverage, missing message-level details |
| Analytics | 7/10 | Comprehensive but incomplete calculations |
| Error Handling | 5/10 | Silent failures, no error tracking |
| Performance | 6/10 | Memory leak risk, potential race conditions |
| Scalability | 8/10 | Good use of indexes, JSONB for flexibility |

---

## 🎯 Conclusion

**The project is well-structured with good fundamentals.** The recent LLM-based topic extraction is a significant improvement. However, there are critical issues (memory leak, race conditions) that need immediate attention.

**Priority:**
1. Fix critical bugs (memory leak, race conditions)
2. Complete dashboard calculations
3. Add message-level analytics
4. Implement error tracking

With these fixes, the project will have excellent data capture and analytics capabilities.
