import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import {
  useListQuizzes,
  getListQuizzesQueryKey,
  useGenerateQuiz,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EnvQuizzesPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useListQuizzes(id, { query: { queryKey: getListQuizzesQueryKey(id) } });
  const generate = useGenerateQuiz();
  const [focus, setFocus] = useState("");
  const [count, setCount] = useState(6);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  return (
    <EnvLayout id={id}>
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-serif text-lg">Generate a quiz</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quiz-focus">Focus (optional)</Label>
              <Input id="quiz-focus" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Chapter 3" data-testid="input-quiz-focus" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quiz-count">Questions</Label>
              <Input id="quiz-count" type="number" min={5} max={200} value={count} onChange={(e) => setCount(Number(e.target.value) || 6)} data-testid="input-quiz-count" />
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                <SelectTrigger data-testid="select-quiz-difficulty"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              disabled={generate.isPending}
              onClick={() => {
                generate.mutate(
                  { id, data: { focus: focus || undefined, questionCount: count, difficulty } },
                  {
                    onSuccess: (q) => {
                      qc.invalidateQueries({ queryKey: getListQuizzesQueryKey(id) });
                      setLocation(`/env/${id}/quizzes/${q.id}`);
                    },
                    onError: (e) => toast({ title: "Could not generate quiz", description: String(e), variant: "destructive" }),
                  },
                );
              }}
              className="gap-2"
              data-testid="button-generate-quiz"
            >
              {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-serif text-lg">Your quizzes</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quizzes yet — generate your first one above.</p>
        ) : (
          <ul className="space-y-2">
            {data.map((q) => (
              <li key={q.id}>
                <Link href={`/env/${id}/quizzes/${q.id}`} data-testid={`row-quiz-${q.id}`} className="block">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium" data-testid={`text-quiz-title-${q.id}`}>{q.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {q.questions.length} questions · {q.difficulty}
                          {q.lastScore != null ? ` · last score ${Math.round(q.lastScore * 100)}%` : ""}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </EnvLayout>
  );
}
