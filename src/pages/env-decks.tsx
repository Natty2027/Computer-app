import { useParams } from "wouter";
import { useState } from "react";
import { Plus, Trash2, BookMarked, Loader2 } from "lucide-react";

import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LockedFeature } from "@/components/study/LockedFeature";
import { useToast } from "@/hooks/use-toast";
import { useListDecks, useCreateDeck, useDeleteDeck } from "@/lib/api/decks";
import { isPremiumError } from "@/lib/api/premium";

export default function EnvDecksPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const decks = useListDecks(id);
  const createDeck = useCreateDeck(id);
  const deleteDeck = useDeleteDeck(id);

  const [title, setTitle] = useState("");
  const [focusPrompt, setFocusPrompt] = useState("");
  const [description, setDescription] = useState("");

  if (decks.isError && isPremiumError(decks.error)) {
    return (
      <EnvLayout id={id}>
        <LockedFeature
          title="Custom decks are a Premium feature"
          description="Build focused study decks around a topic and generate quizzes scoped to them with Cognivate Premium."
        />
      </EnvLayout>
    );
  }

  function handleCreate() {
    if (!title.trim() || !focusPrompt.trim()) return;
    createDeck.mutate(
      { title: title.trim(), focusPrompt: focusPrompt.trim(), description: description.trim() || null },
      {
        onSuccess: () => { setTitle(""); setFocusPrompt(""); setDescription(""); },
        onError: (e) => toast({ title: "Could not create deck", description: String(e), variant: "destructive" }),
      },
    );
  }

  return (
    <EnvLayout id={id}>
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-bold">New deck</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="deck-title">Title</Label>
                <Input id="deck-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 3 — Derivatives" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deck-focus">Focus prompt</Label>
                <Input id="deck-focus" value={focusPrompt} onChange={(e) => setFocusPrompt(e.target.value)} placeholder="What should quizzes emphasize?" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deck-desc">Description (optional)</Label>
              <Textarea id="deck-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <Button
              onClick={handleCreate}
              disabled={createDeck.isPending || !title.trim() || !focusPrompt.trim()}
              className="gap-2 bg-brand text-brand-foreground hover:opacity-90"
            >
              {createDeck.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create deck
            </Button>
          </CardContent>
        </Card>

        {decks.isLoading ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">Loading decks…</CardContent></Card>
        ) : (decks.data ?? []).length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No decks yet. Create one above to focus your studying.</CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {decks.data!.map((deck) => (
              <Card key={deck.id}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{deck.title}</h3>
                    {deck.description && <p className="text-sm text-muted-foreground">{deck.description}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">Focus: {deck.focusPrompt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteDeck.mutate({ deckId: deck.id })}
                    className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete deck"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </EnvLayout>
  );
}
