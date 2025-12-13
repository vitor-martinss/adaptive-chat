/**
 * Enhances AI responses with contextual emojis when micro-interactions are enabled
 */

export function enhanceWithEmojis(text: string, withMicroInteractions: boolean): string {
  if (!withMicroInteractions) return text;

  // Let the AI decide which emojis to use by providing contextual suggestions
  // The AI can choose to include emojis in its responses when appropriate
  // This is more natural than forced pattern matching
  
  return text; // Return as-is, let AI handle emoji placement
}

// Helper function for AI to get contextual emoji suggestions
export function getContextualEmoji(messageType: string): string {
  const emojiMap: Record<string, string> = {
    greeting: '👋',
    product: '👠', 
    help: '😊',
    success: '✅',
    question: '❓'
  };

  return emojiMap[messageType] || '';
}