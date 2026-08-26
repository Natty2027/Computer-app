import { useParams } from "wouter";
import { useState, useRef, useEffect } from "react";
import {
  useListTutorMessages,
  getListTutorMessagesQueryKey,
  useSendTutorMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SourceBadge, SourceCitations } from "@/components/SourceBadge";
import { TutorMessageContent } from "@/components/tutor/TutorMessageContent";
import { SimplifyButton } from "@/components/SimplifyButton";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES: Array<{ key: "explain" | "hint" | "step_by_step" | "check_my_work"; label: string }> = [
  { key: "explain", label: "Explain" },
  { key: "hint", label: "Hint" },
  { key: "step_by_step", label: "Step by step" },
  { key: "check_my_work", label: "Check my work" },
];

export default function EnvTutorPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data } = useListTutorMessages(id, { query: { queryKey: getListTutorMessagesQueryKey(id) } });
  const send = useSendTutorMessage();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<typeof MODES[number]["key"]>("explain");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [data?.length, send.isPending]);

  function handleSend() {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    send.mutate(
      // supportsVisuals isn't in the codegen'd request type yet; the server
      // reads it inline (same pattern as voiceMode) and the mutator
      // JSON.stringifies the whole body, so the flag reaches the API.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id, data: { content, mode, supportsVisuals: true } as any },
      {
        onSuccess: () => qc.invalidateQueries({ queryKey: getListTutorMessagesQueryKey(id) }),
      },
    );
  }

  return (
    <EnvLayout id={id}>
      <Card className="flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
        <CardContent className="p-0 flex flex-col flex-1 min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {!data || data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ask anything about your uploaded material. Cognivate will stay grounded in what you've uploaded.
              </p>
            ) : (
              data.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  data-testid={`msg-${m.id}`}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "max-w-[85%] bg-primary text-primary-foreground"
                        : "max-w-[95%] bg-secondary text-secondary-foreground",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <TutorMessageContent content={m.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                    {m.role === "assistant" && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2">
                          {m.sourceStatus && <SourceBadge status={m.sourceStatus} />}
                          <SimplifyButton envId={id} text={m.content} />
                        </div>
                        <SourceCitations refs={m.sourceReferences} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {send.isPending && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-border p-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMode(m.key)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs",
                    mode === m.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary",
                  )}
                  data-testid={`button-mode-${m.key}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask the tutor about your material…"
                className="min-h-[44px] max-h-32 resize-none"
                data-testid="input-tutor-message"
              />
              <Button onClick={handleSend} disabled={!text.trim() || send.isPending} data-testid="button-send-tutor" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </EnvLayout>
  );
}
