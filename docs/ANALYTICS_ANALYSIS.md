# Data Structure & Analytics Analysis

## ✅ Current Data Capture (Well Structured)

### 1. **Chat Sessions** (`chat_sessions`)
- ✅ Session lifecycle tracking (created, updated, ended, abandoned)
- ✅ User association (`userId`)
- ✅ Micro-interactions flag (`withMicroInteractions`)
- ✅ Topic classification (`topic` - now 255 chars for LLM-extracted topics)
- ✅ Case type (`caseType` - entrega, preços, etc.)
- ✅ Metadata (JSONB for flexible data)

### 2. **Chat Messages** (`chat_messages`)
- ✅ Full conversation history
- ✅ Role tracking (user/assistant)
- ✅ Timestamp tracking
- ✅ Session association

### 3. **User Interactions** (`user_interactions`)
- ✅ Interaction type tracking
- ✅ Content capture
- ✅ Topic association
- ✅ Metadata (JSONB)
- ✅ Timestamp tracking

**Tracked Interaction Types:**
- `suggestion_click` - User clicked a suggested action
- `typed_message` - User typed a message
- `end_modal_shown_idle` - Feedback modal shown after idle
- `end_modal_answer_yes` - User said problem was solved
- `end_modal_answer_no` - User said problem not solved
- `feedback_skipped` - User skipped detailed feedback
- `post_feedback_redirect` - User redirected after feedback

### 4. **Chat Feedback** (`chat_feedback`)
- ✅ Satisfaction rating (1-5)
- ✅ Confidence rating (1-5)
- ✅ Free-text comments
- ✅ Session association

### 5. **Chat Votes** (`chat_votes`)
- ✅ Message-level upvote/downvote
- ✅ Per-message granularity

---

## 🔍 Analytics Capabilities

### Current Dashboard Metrics:
1. **Session Analytics**
   - Total sessions
   - Unique users
   - Sessions with/without micro-interactions
   - Abandonment rate
   - Session duration (avg)
   - Daily breakdown

2. **Engagement Metrics**
   - Total messages
   - Avg messages per session
   - Suggestion click rate
   - Typed vs suggested message ratio

3. **Feedback Metrics**
   - Feedback completion rate
   - Average satisfaction
   - Upvote/downvote ratio

4. **Topic Analysis**
   - Sessions by topic (now with LLM-extracted topics!)
   - Avg duration per topic
   - Avg messages per topic
   - Satisfaction by topic

---

## ⚠️ Gaps & Missing Data

### 1. **Message-Level Analytics** ❌
**Problem:** Can't analyze individual message quality or conversation flow

**Missing:**
- Message length/complexity
- Response time (AI latency)
- Message sentiment
- Error/retry tracking

**Impact:** Can't identify which messages cause confusion or where AI fails

---

### 2. **Conversation Flow Analysis** ❌
**Problem:** No tracking of conversation patterns or user journey

**Missing:**
- Conversation state transitions
- Topic switches within session
- Question types (informational, transactional, etc.)
- Conversation depth (follow-up questions)

**Impact:** Can't optimize conversation flow or identify drop-off points

---

### 3. **User Behavior Patterns** ⚠️ (Partial)
**Problem:** Limited behavioral insights

**Have:**
- Suggestion clicks vs typed messages
- Session abandonment

**Missing:**
- Time between messages (user thinking time)
- Edit/retry behavior
- Scroll behavior
- Attachment usage patterns
- Copy/paste actions

**Impact:** Can't understand user engagement patterns or friction points

---

### 4. **Feedback Context** ⚠️ (Partial)
**Problem:** Feedback not linked to specific conversation moments

**Have:**
- Session-level feedback
- Message-level votes

**Missing:**
- Which specific messages led to feedback
- Feedback trigger context (why feedback was shown)
- Feedback timing (how long after interaction)

**Impact:** Hard to correlate feedback with specific AI responses

---

### 5. **Error & Edge Cases** ❌
**Problem:** No systematic error tracking

**Missing:**
- API failures
- Timeout errors
- Invalid inputs
- Rate limiting hits
- Model fallback usage

**Impact:** Can't identify reliability issues or improve error handling

---

### 6. **Topic Classification Accuracy** ❌
**Problem:** No validation of LLM-extracted topics

**Missing:**
- Topic confidence scores
- Topic reclassification events
- Manual topic corrections
- Topic drift tracking

**Impact:** Can't measure or improve topic extraction quality

---

### 7. **User Satisfaction Drivers** ⚠️ (Partial)
**Problem:** Can't identify what drives satisfaction

**Have:**
- Overall satisfaction rating
- Message votes

**Missing:**
- Aspect-based feedback (speed, accuracy, helpfulness)
- Satisfaction correlation with conversation features
- Negative feedback reasons

**Impact:** Can't prioritize improvements based on user needs

---

## 🎯 Recommendations

### High Priority (Implement Now)

1. **Add Message Metadata**
```sql
ALTER TABLE chat_messages ADD COLUMN metadata JSONB;
-- Store: response_time_ms, token_count, model_used, error_occurred
```

2. **Track Conversation Events**
```sql
CREATE TABLE conversation_events (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id),
  event_type VARCHAR(64), -- topic_switch, clarification_needed, error, etc.
  message_id UUID,
  metadata JSONB,
  created_at TIMESTAMP
);
```

3. **Enhanced Interaction Tracking**
Add to existing `user_interactions`:
- `message_edit`
- `message_retry`
- `attachment_added`
- `scroll_to_message`
- `copy_message`

### Medium Priority (Next Sprint)

4. **Topic Confidence Tracking**
```sql
ALTER TABLE chat_sessions ADD COLUMN topic_confidence DECIMAL(3,2);
ALTER TABLE chat_sessions ADD COLUMN topic_history JSONB;
```

5. **Feedback Aspects**
```sql
ALTER TABLE chat_feedback ADD COLUMN aspects JSONB;
-- Store: {speed: 5, accuracy: 4, helpfulness: 5, clarity: 3}
```

6. **Error Logging**
```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY,
  session_id UUID,
  error_type VARCHAR(64),
  error_message TEXT,
  stack_trace TEXT,
  metadata JSONB,
  created_at TIMESTAMP
);
```

### Low Priority (Future)

7. **A/B Testing Framework**
8. **User Cohort Analysis**
9. **Predictive Analytics** (churn prediction, satisfaction prediction)

---

## 📊 Current Data Quality: 7/10

**Strengths:**
- ✅ Solid session tracking
- ✅ Good feedback collection
- ✅ Flexible metadata fields (JSONB)
- ✅ LLM-based topic extraction (new!)

**Weaknesses:**
- ❌ Limited message-level insights
- ❌ No error tracking
- ❌ Missing conversation flow analysis
- ❌ No topic validation

**Overall:** Good foundation, but needs deeper instrumentation for actionable insights.
