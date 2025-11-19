"use client";

import { memo } from "react";

function PureChatHeader() {
  return (
    <header className="sticky top-0 flex items-center justify-center gap-2 bg-background px-4 py-3 border-b">
      <h1 className="text-lg font-semibold text-center">
        Gatapreta Sapatilhas - Assistente Virtual
      </h1>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
