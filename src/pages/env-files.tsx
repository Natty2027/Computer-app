import { useParams } from "wouter";
import { useRef, useState } from "react";
import {
  useListEnvironmentFiles,
  getListEnvironmentFilesQueryKey,
  useAddEnvironmentFile,
  useDeleteEnvironmentFile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Upload, Loader2 } from "lucide-react";
import { UploadError, uploadFileToStorage, validateBatch } from "@/lib/uploadFile";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  uploaded: { label: "Queued", cls: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200" },
  analyzing: { label: "Analyzing", cls: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200" },
  ready: { label: "Ready", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200" },
  failed: { label: "Failed", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" },
};

export default function EnvFilesPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const { data, isLoading } = useListEnvironmentFiles(id, {
    query: {
      queryKey: getListEnvironmentFilesQueryKey(id),
      refetchInterval: (q) => {
        const list: any = q.state.data;
        if (Array.isArray(list) && list.some((f) => f.status === "analyzing" || f.status === "uploaded")) return 3000;
        return false;
      },
    },
  });
  const addFile = useAddEnvironmentFile();
  const delFile = useDeleteEnvironmentFile();

  async function handleUpload(list: FileList | null) {
    if (!list) return;
    const { accepted, rejected } = validateBatch(Array.from(list));
    if (accepted.length === 0) {
      toast({
        title: "Nothing to upload",
        description: rejected[0]?.reason ?? "No valid files were selected.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    // Continue-on-failure: one bad file must not abort the rest. A file counts
    // as uploaded only when BOTH the storage PUT and the registration succeed.
    let uploaded = 0;
    const failures: string[] = [...rejected.map((r) => r.name)];
    try {
      for (const f of accepted) {
        try {
          const meta = await uploadFileToStorage(f);
          await addFile.mutateAsync({ id, data: meta });
          uploaded += 1;
        } catch (e) {
          failures.push(f.name);
          const msg = e instanceof UploadError ? e.userMessage : "Upload failed.";
          // eslint-disable-next-line no-console
          if (import.meta.env.DEV) console.error(`[upload] ${f.name}:`, e);
          toast({ title: `Couldn't upload ${f.name}`, description: msg, variant: "destructive" });
        }
      }
      qc.invalidateQueries({ queryKey: getListEnvironmentFilesQueryKey(id) });
      if (uploaded > 0) {
        toast({
          title: `${uploaded} file${uploaded === 1 ? "" : "s"} uploaded`,
          description:
            failures.length > 0
              ? `${failures.length} skipped or failed. Cognivate is re-analyzing your environment.`
              : "Cognivate is re-analyzing your environment.",
        });
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <EnvLayout id={id}>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Source materials</h2>
        <Button onClick={() => inputRef.current?.click()} disabled={uploading} className="gap-2" data-testid="button-add-files">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Add files
        </Button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} data-testid="input-add-files" />
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">No materials yet — add a file to get started.</CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {data.map((f) => {
            const s = STATUS_LABEL[f.status] ?? STATUS_LABEL.uploaded;
            return (
              <li key={f.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3" data-testid={`row-file-${f.id}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate" data-testid={`text-file-name-${f.id}`}>{f.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(f.size / 1024)} KB · {f.contentType}
                      {f.pageCount ? ` · ${f.pageCount} pages` : ""}
                    </div>
                    {f.analysisError && <div className="text-xs text-red-700 dark:text-red-300 mt-1">{f.analysisError}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`} data-testid={`badge-status-${f.id}`}>{s.label}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Remove ${f.name}?`)) {
                        delFile.mutate({ id, fileId: f.id }, {
                          onSuccess: () => qc.invalidateQueries({ queryKey: getListEnvironmentFilesQueryKey(id) }),
                        });
                      }
                    }}
                    data-testid={`button-delete-file-${f.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </EnvLayout>
  );
}
