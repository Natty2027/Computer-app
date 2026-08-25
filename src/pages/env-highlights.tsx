import { useParams } from "wouter";
import { useState } from "react";
import {
  useListHighlights,
  getListHighlightsQueryKey,
  useCreateHighlight,
  useDeleteHighlight,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Highlighter, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COLORS = [
  { key: "yellow", cls: "bg-yellow-200 dark:bg-yellow-900/40" },
  { key: "green", cls: "bg-green-200 dark:bg-green-900/40" },
  { key: "blue", cls: "bg-blue-200 dark:bg-blue-900/40" },
  { key: "pink", cls: "bg-pink-200 dark:bg-pink-900/40" },
];

export default function EnvHighlightsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useListHighlights(id, { query: { queryKey: getListHighlightsQueryKey(id) } });
  const create = useCreateHighlight();
  const del = useDeleteHighlight();
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [context, setContext] = useState("");
  const [color, setColor] = useState("yellow");

  return (
    <EnvLayout id={id}>
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Highlighter className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-serif text-lg">Save a highlight</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hl-text">Highlighted passage</Label>
            <Textarea id="hl-text" value={text} onChange={(e) => setText(e.target.value)} rows={2} data-testid="input-highlight-text" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hl-context">Where it's from (optional)</Label>
              <Input id="hl-context" value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. lecture-3.pdf p.4" data-testid="input-highlight-context" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hl-note">Your note (optional)</Label>
              <Input id="hl-note" value={note} onChange={(e) => setNote(e.target.value)} data-testid="input-highlight-note" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Color</span>
            {COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColor(c.key)}
                className={`h-6 w-6 rounded-full border-2 ${c.cls} ${color === c.key ? "border-primary" : "border-transparent"}`}
                data-testid={`button-color-${c.key}`}
              />
            ))}
            <div className="flex-1" />
            <Button
              disabled={!text.trim() || create.isPending}
              onClick={() => {
                create.mutate(
                  { id, data: { text: text.trim(), color, context: context || "(unspecified)", note: note || undefined } },
                  {
                    onSuccess: () => {
                      setText(""); setNote(""); setContext("");
                      qc.invalidateQueries({ queryKey: getListHighlightsQueryKey(id) });
                    },
                    onError: (e) => toast({ title: "Could not save", description: String(e), variant: "destructive" }),
                  },
                );
              }}
              className="gap-2"
              data-testid="button-save-highlight"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save highlight
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-10 text-center text-muted-foreground">No highlights yet.</CardContent></Card>
      ) : (
        <ul className="space-y-3">
          {data.map((h) => {
            const cls = COLORS.find((c) => c.key === h.color)?.cls ?? COLORS[0].cls;
            return (
              <li key={h.id} data-testid={`row-highlight-${h.id}`}>
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className={`rounded-md p-3 ${cls}`}>
                      <p className="text-sm leading-relaxed">{h.text}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{h.context}{h.note ? ` · ${h.note}` : ""}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Delete this highlight?")) {
                            del.mutate({ id, highlightId: h.id }, {
                              onSuccess: () => qc.invalidateQueries({ queryKey: getListHighlightsQueryKey(id) }),
                            });
                          }
                        }}
                        data-testid={`button-delete-highlight-${h.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </EnvLayout>
  );
}
