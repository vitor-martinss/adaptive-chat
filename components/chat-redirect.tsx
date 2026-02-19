"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateUUID } from "@/lib/utils";

export function ChatRedirect() {
  const router = useRouter();

  useEffect(() => {
    const lastChatId = sessionStorage.getItem("lastChatId");
    
    if (lastChatId) {
      router.replace(`/chat/${lastChatId}`);
    } else {
      const newId = generateUUID();
      sessionStorage.setItem("lastChatId", newId);
      router.replace(`/chat/${newId}`);
    }
  }, [router]);

  return null;
}
