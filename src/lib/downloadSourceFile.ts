import { getStorageObject, ApiError } from "@workspace/api-client-react";

/**
 * Reusable browser download for a private source file (PDF / DOC / DOCX / …).
 *
 * The API streams the raw bytes back from GET /api/storage/objects/:objectPath
 * as an authenticated, tenant-scoped Blob — we never receive (or expose) a
 * signed URL or object path. This helper fetches those bytes, saves them under
 * the original filename, and maps failures to vague, safe messages.
 *
 * Mirrors uploadFile.ts's contract: we never surface the raw HTTP status,
 * response body, or storage diagnostics to the user — `userMessage` is safe to
 * show, and the real detail (status only) is logged to the dev console.
 */

/**
 * A download failure. `userMessage` is safe to show a student (vague, no
 * status/URL/path); `httpStatus` is for the dev console only.
 */
export class DownloadError extends Error {
  readonly name = "DownloadError";
  readonly httpStatus?: number;
  readonly userMessage: string;

  constructor(userMessage: string, httpStatus?: number) {
    super(`download failed${httpStatus ? ` (${httpStatus})` : ""}`);
    this.userMessage = userMessage;
    this.httpStatus = httpStatus;
  }
}

/** The minimal shape needed to download — matches SourceFile from the API. */
export interface DownloadableFile {
  name: string;
  objectPath: string;
}

/**
 * Distinct, safe messages per outcome so the UI can tell the user whether to
 * re-authenticate, that they lack access, that the file is gone, or that
 * storage is briefly down — without leaking anything about the provider.
 */
function messageForStatus(status: number | undefined): string {
  switch (status) {
    case 401:
      return "Your session expired. Please sign in again to download this file.";
    case 403:
      return "You don't have access to this file.";
    case 404:
      return "This file is no longer available. Try re-uploading it.";
    case 503:
      return "The file download is temporarily unavailable. Please try again shortly.";
    default:
      return "We couldn't download this file. Please try again.";
  }
}

/**
 * Fetch a source file's bytes and save them under its original name. Throws a
 * {@link DownloadError} with a user-safe `userMessage` on any failure.
 */
export async function downloadSourceFile(file: DownloadableFile): Promise<void> {
  // Never silently ignore a missing objectPath — a file row without a storage
  // reference can't be downloaded, and swallowing it would make the click look
  // like a no-op. Surface it as an explicit, actionable message.
  const objectPath = file?.objectPath?.trim();
  if (!objectPath) {
    throw new DownloadError(
      "This file can't be downloaded — it's missing its storage reference. Try re-uploading it.",
    );
  }

  let blob: Blob;
  try {
    blob = await getStorageObject(objectPath);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : undefined;
    if (import.meta.env.DEV) {
      // Status only — never the response body, signed URL, or object path.
      // eslint-disable-next-line no-console
      console.error(`[download] ${file.name}: http=${status ?? "—"}`, err);
    }
    throw new DownloadError(messageForStatus(status), status);
  }

  triggerBrowserDownload(blob, file.name);
}

/** Save a Blob to disk under `filename` using a transient object URL. */
function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    // Preserve the original filename regardless of the server's
    // Content-Disposition (which we also set defensively on the API side).
    anchor.download = filename || "download";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // Release on the next tick so the click has a chance to start the save
    // before the object URL is revoked.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
