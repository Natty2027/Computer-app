import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  useCreateEnvironment,
  useAddEnvironmentFile,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { uploadFileAndRegister } from "@/lib/uploadFile";
import { useToast } from "@/hooks/use-toast";

export default function NewEnvPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const createEnv = useCreateEnvironment();
  const addFile = useAddEnvironmentFile();

  function pickFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Give your environment a name", variant: "destructive" });
      return;
    }
    if (files.length === 0) {
      toast({ title: "Add at least one file", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const env = await createEnv.mutateAsync({ data: { title: title.trim() } });
      for (const [i, f] of files.entries()) {
        setProgress(`Uploading ${i + 1} of ${files.length}: ${f.name}`);
        const meta = await uploadFileAndRegister(f);
        await addFile.mutateAsync({ id: env.id, data: meta });
      }
      toast({ title: "Materials uploaded", description: "Cognivate is analyzing them now." });
      setLocation(`/env/${env.id}`);
    } catch (err) {
      toast({ title: "Upload failed", description: String(err instanceof Error ? err.message : err), variant: "destructive" });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">New study environment</h1>
        <p className="text-muted-foreground mt-2">Upload anything that helps you study: PDFs, slides, photos of notes or homework, lecture transcripts.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="env-title">Name this environment</Label>
              <Input
                id="env-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midterm — Week 1 to 5"
                data-testid="input-env-title"
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label>Source materials</Label>
              <div
                className="rounded-xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center cursor-pointer hover:bg-secondary/60 transition-colors"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pickFiles(e.dataTransfer.files);
                }}
                data-testid="dropzone-files"
              >
                <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm">Drop files here, or <span className="underline">browse</span></p>
                <p className="text-xs text-muted-foreground mt-1">PDF, text, markdown, images. Up to 10MB each.</p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => pickFiles(e.target.files)}
                  data-testid="input-files"
                  accept=".pdf,.txt,.md,.markdown,image/*,.docx,.pptx"
                />
              </div>
              {files.length > 0 && (
                <ul className="space-y-1.5 mt-3">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm" data-testid={`row-file-${i}`}>
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground">{Math.round(f.size / 1024)} KB</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-foreground"
                        data-testid={`button-remove-file-${i}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
        {progress && <p className="text-sm text-muted-foreground" data-testid="text-upload-progress">{progress}</p>}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={() => setLocation("/")} disabled={busy} data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" disabled={busy} data-testid="button-create-env" className="gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Working…" : "Create environment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
