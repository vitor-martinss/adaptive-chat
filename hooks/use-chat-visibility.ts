// Chat visibility hook removed for TCC research app (single session mode)

export function useChatVisibility() {
  return {
    visibilityType: "public" as const,
    setVisibilityType: () => {},
  };
}
