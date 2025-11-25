import { createDocumentHandler } from "@/lib/artifacts/server";

// Disabled code generation for Gatapreta shoe business chatbot
export const codeDocumentHandler = createDocumentHandler<"code">({
  kind: "code",
  onCreateDocument: async () => {
    return "// Code generation disabled for this chatbot";
  },
  onUpdateDocument: async () => {
    return "// Code generation disabled for this chatbot";
  },
});
