"use client";

import { memo } from "react";

function PureChatHeader() {
  return (
    <header className="sticky top-0 flex justify-between items-center gap-3 bg-background px-4 py-3 border-b">
      <img 
        src="https://www.gatapretasapatilhas.com.br/media/logo/stores/1/logo.png" 
        alt="Gatapreta Sapatilhas" 
        className="h-8 w-auto"
      />
      <h1 className="text-lg font-semibold">
        Assistente Virtual
      </h1>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
