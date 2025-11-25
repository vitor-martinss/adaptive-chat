import { createDocumentHandler } from "@/lib/artifacts/server";

// Disabled spreadsheet generation for Gatapreta shoe business chatbot
export const sheetDocumentHandler = createDocumentHandler<"sheet">({
  kind: "sheet",
  onCreateDocument: async () => {
    return "Name,Price\nSpreadsheet generation disabled,0";
  },
  onUpdateDocument: async () => {
    return "Name,Price\nSpreadsheet generation disabled,0";
  },
});
