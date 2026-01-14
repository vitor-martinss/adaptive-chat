import { classifyTopic, shouldTriggerFeedback, type CaseType } from './case-classification';
import { analyzeConversationContext } from './conversation-analysis';

interface SessionState {
  id: string;
  caseType: CaseType;
  interactionCount: number;
  startTime: number;
  lastFeedbackTime: number;
  messages: string[];
  feedbackShown: boolean;
}

class SessionManager {
  private sessions = new Map<string, SessionState>();
  private readonly FEEDBACK_COOLDOWN = 10 * 60 * 1000; // 10 min

  getOrCreateSession(sessionId: string): SessionState {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        caseType: 'geral',
        interactionCount: 0,
        startTime: Date.now(),
        lastFeedbackTime: 0,
        messages: [],
        feedbackShown: false
      });
    }
    return this.sessions.get(sessionId)!;
  }

  addMessage(sessionId: string, message: string): {
    shouldShowFeedback: boolean;
    caseType: CaseType;
    trigger: string;
  } {
    const session = this.getOrCreateSession(sessionId);
    session.messages.push(message);
    session.interactionCount++;

    // Classify only once or when significant change detected
    if (session.interactionCount === 1 || this.shouldReclassify(session, message)) {
      session.caseType = classifyTopic(message);
    }

    const context = analyzeConversationContext(session.messages);
    const sessionDuration = (Date.now() - session.startTime) / 1000;
    const canShowFeedback = Date.now() - session.lastFeedbackTime > this.FEEDBACK_COOLDOWN;

    const shouldShow = !session.feedbackShown && 
                      canShowFeedback && 
                      shouldTriggerFeedback(
                        session.caseType, 
                        session.interactionCount, 
                        sessionDuration, 
                        message, 
                        context
                      );

    if (shouldShow) {
      session.feedbackShown = true;
      session.lastFeedbackTime = Date.now();
    }

    return {
      shouldShowFeedback: shouldShow,
      caseType: session.caseType,
      trigger: this.determineTrigger(session, context)
    };
  }

  private shouldReclassify(session: SessionState, message: string): boolean {
    const newType = classifyTopic(message);
    return newType !== session.caseType && newType !== 'geral';
  }

  private determineTrigger(session: SessionState, context: any): string {
    if (context.hasNegativeSignals) return 'negative_signal';
    if (context.seemsResolved) return 'resolution_detected';
    return 'interaction_threshold';
  }

  resetFeedback(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.feedbackShown = false;
    }
  }

  cleanup(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}

export const sessionManager = new SessionManager();