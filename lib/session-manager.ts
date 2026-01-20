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
  private readonly SESSION_TTL = 30 * 60 * 1000; // 30 min

  constructor() {
    // Cleanup old sessions every 5 minutes
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupOldSessions(), 5 * 60 * 1000);
    }
  }

  private cleanupOldSessions() {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.startTime > this.SESSION_TTL) {
        this.sessions.delete(id);
      }
    }
  }

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

  async addMessage(sessionId: string, message: string): Promise<{
    shouldShowFeedback: boolean;
    caseType: CaseType;
    trigger: string;
    topic?: string;
  }> {
    const session = this.getOrCreateSession(sessionId);
    session.messages.push(message);
    session.interactionCount++;

    // Classify based on ALL messages for better accuracy
    const allText = session.messages.join(' ');
    const newCaseType = classifyTopic(allText);
    
    // Update case type if we found a specific one (not geral)
    if (newCaseType !== 'geral' || session.caseType === 'geral') {
      session.caseType = newCaseType;
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

    let extractedTopic: string | undefined;
    if (shouldShow) {
      session.feedbackShown = true;
      session.lastFeedbackTime = Date.now();
      
      // Extract topic using LLM when showing feedback
      const { extractTopicFromConversation } = await import('@/lib/case-classification');
      extractedTopic = await extractTopicFromConversation(session.messages);
    }

    return {
      shouldShowFeedback: shouldShow,
      caseType: session.caseType,
      trigger: this.determineTrigger(session, context),
      topic: extractedTopic
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