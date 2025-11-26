import { Suspense } from "react";
import { ChatWithFeedback } from "@/components/chat-with-feedback";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";

export default async function Page() {
  const id = generateUUID();

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <ChatWithFeedback
          autoResume={false}
          id={id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          initialVisibilityType="private"
          isReadonly={false}
          key={id}
        />
      </Suspense>
      <DataStreamHandler />
    </>
  );
}
