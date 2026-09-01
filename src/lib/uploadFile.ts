import { requestUploadUrl } from "@workspace/api-client-react";

/**
 * Web upload pipeline — the browser-side counterpart to the mobile app's
 * lib/upload.ts. Same contract, honored as closely as a browser allows:
 *
 *   1. reserve a signed URL from our API (cookie-authenticated),
 *   2. raw-binary PUT the exact bytes to the signed URL with the exact
 *      Content-Type we reserved — no multipart, no app cookies, any 2xx = ok,
 *   3. the caller registers the object on the environment; a file is only
 *      "uploaded" once BOTH the PUT and the registration succeed.
 *
 * Like the mobile fix we never trust the picker's declared MIME type: we sniff
 * the real type from the file's magic bytes so a PNG screenshot mislabeled as
 * JPEG (or an empty type) is reserved/registered honestly. HEIC/HEIF can't be
 * converted reliably in the browser, so we reject it with a clear message
 * rather than uploading bytes the downstream image analysis will fail on.
 *
 * We never surface the raw HTTP status, signed URL, or object path to the user;
 * failures carry a vague userMessage and the real detail is logged to the dev
 * console only.
 */

// Per-file and batch ceilings mirror the mobile client. The server remains the
// enforcing boundary; these give fast, friendly client-side rejection.
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_BATCH_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_BATCH_FILES = 10;

export type UploadStage = "reserve" | "storage-put" | "register";

/**
 * A failure attributable to a specific upload stage. `userMessage` is safe to
 * show a student (vague, no status/URL/path); `httpStatus` + `stage` are for
 * the dev console only.
 */
export class UploadError extends Error {
  readonly name = "UploadError";
  readonly stage: UploadStage;
  readonly httpStatus?: number;
  readonly userMessage: string;

  constructor(stage: UploadStage, userMessage: string, httpStatus?: number) {
    super(`${stage} failed${httpStatus ? ` (${httpStatus})` : ""}`);
    this.stage = stage;
    this.userMessage = userMessage;
    this.httpStatus = httpStatus;
  }
}

export interface UploadedMeta {
  name: string;
  size: number;
  contentType: string;
  objectPath: string;
}

// Dev-only stage diagnostics. Records ONLY stage, status, filename, size, and
// content type — never response bodies, the signed URL, or the object path.
function recordDiag(rec: {
  stage: UploadStage;
  ok: boolean;
  httpStatus?: number;
  filename: string;
  fileSize: number;
  contentType: string;
}) {
  if (import.meta.env.DEV) {
    const verdict = rec.ok ? "ok" : "FAIL";
    // eslint-disable-next-line no-console
    console.log(
      `[upload] stage=${rec.stage} ${verdict} http=${rec.httpStatus ?? "—"} ` +
        `name=${JSON.stringify(rec.filename)} size=${rec.fileSize} type=${rec.contentType}`,
    );
  }
}

function ascii(bytes: Uint8Array, start: number, len: number): string {
  let s = "";
  for (let i = start; i < start + len && i < bytes.length; i++) {
    s += String.fromCharCode(bytes[i]);
  }
  return s;
}

const HEIC_BRANDS = new Set([
  "heic", "heix", "hevc", "heim", "heis", "hevm", "hevs", "mif1", "msf1", "heif",
]);

/**
 * Sniff an image type from the first bytes. Returns a concrete image/* type,
 * "heic" (the sentinel for HEIC/HEIF, which we reject), or null when the header
 * isn't a recognized image — in which case the caller trusts file.type (for
 * PDFs/DOCX/etc. the server re-validates).
 */
async function sniffImageType(
  file: File,
): Promise<"image/png" | "image/jpeg" | "image/webp" | "heic" | null> {
  let bytes: Uint8Array;
  try {
    const buf = await file.slice(0, 32).arrayBuffer();
    bytes = new Uint8Array(buf);
  } catch {
    return null;
  }
  if (bytes.length < 12) return null;

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return "image/webp";
  }
  if (ascii(bytes, 4, 4) === "ftyp" && HEIC_BRANDS.has(ascii(bytes, 8, 4).toLowerCase())) {
    return "heic";
  }
  return null;
}

/**
 * Resolve the honest Content-Type for a file. Sniffs magic bytes first, falls
 * back to the browser's file.type. Throws UploadError("unsupported") for
 * HEIC/HEIF — the browser can't transcode it, and uploading HEIC bytes as JPEG
 * would fail downstream analysis.
 */
export async function resolveUploadContentType(file: File): Promise<string> {
  const sniffed = await sniffImageType(file);
  if (sniffed === "heic") {
    throw new UploadError(
      "reserve",
      "HEIC photos aren't supported here. On your phone, export or screenshot the image as JPEG or PNG and upload that.",
    );
  }
  if (sniffed) return sniffed;
  const declared = (file.type || "").split(";", 1)[0].trim().toLowerCase();
  return declared || "application/octet-stream";
}

export interface BatchValidation {
  accepted: File[];
  rejected: { name: string; reason: string }[];
}

/**
 * Enforce the count, per-file, batch-total, and duplicate rules before any
 * network work. Duplicates are keyed by name+size (same identity the mobile
 * queue uses). Returns the files to upload plus human-readable rejections.
 */
export function validateBatch(files: File[]): BatchValidation {
  const accepted: File[] = [];
  const rejected: { name: string; reason: string }[] = [];
  const seen = new Set<string>();
  let total = 0;

  for (const f of files) {
    if (accepted.length >= MAX_BATCH_FILES) {
      rejected.push({ name: f.name, reason: `Only ${MAX_BATCH_FILES} files at a time.` });
      continue;
    }
    const key = `${f.name}:${f.size}`;
    if (seen.has(key)) {
      // Silent-ish dedupe: report once so the user knows why the count differs.
      rejected.push({ name: f.name, reason: "Duplicate skipped." });
      continue;
    }
    if (f.size > MAX_FILE_BYTES) {
      rejected.push({ name: f.name, reason: "Larger than 10 MB." });
      continue;
    }
    if (total + f.size > MAX_BATCH_BYTES) {
      rejected.push({ name: f.name, reason: "Batch is over the 50 MB total limit." });
      continue;
    }
    seen.add(key);
    total += f.size;
    accepted.push(f);
  }
  return { accepted, rejected };
}

/**
 * Reserve a signed URL and raw-binary PUT the file's bytes to storage. Does NOT
 * register — the caller registers via the useAddEnvironmentFile mutation so a
 * file counts as uploaded only when BOTH stages succeed. Throws UploadError on
 * any failure with a safe userMessage; the real status is captured for diag.
 */
export async function uploadFileToStorage(file: File): Promise<UploadedMeta> {
  const contentType = await resolveUploadContentType(file);

  // -- Stage 1: reserve ----------------------------------------------------
  let reservation: { uploadURL: string; objectPath: string };
  try {
    reservation = await requestUploadUrl({
      name: file.name,
      size: file.size,
      contentType,
    });
  } catch (e) {
    const status = (e as { status?: number })?.status;
    recordDiag({ stage: "reserve", ok: false, httpStatus: status, filename: file.name, fileSize: file.size, contentType });
    throw new UploadError(
      "reserve",
      status === 401 || status === 403
        ? "Your session may have expired. Refresh the page and try again."
        : "Couldn't start the upload. Please try again.",
      status,
    );
  }
  if (!reservation?.uploadURL || !reservation?.objectPath) {
    recordDiag({ stage: "reserve", ok: false, filename: file.name, fileSize: file.size, contentType });
    throw new UploadError("reserve", "Couldn't start the upload. Please try again.");
  }
  recordDiag({ stage: "reserve", ok: true, httpStatus: 200, filename: file.name, fileSize: file.size, contentType });

  // -- Stage 2: raw binary PUT to the signed URL ---------------------------
  // credentials:"omit" — never send app cookies to the storage host. Only the
  // Content-Type header goes out, matching exactly what we reserved.
  let putRes: Response;
  try {
    putRes = await fetch(reservation.uploadURL, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
      credentials: "omit",
    });
  } catch {
    // No HTTP response at all: network / CORS / transport failure.
    recordDiag({ stage: "storage-put", ok: false, filename: file.name, fileSize: file.size, contentType });
    throw new UploadError(
      "storage-put",
      "Couldn't reach the upload service. Check your connection and try again.",
    );
  }
  const putOk = putRes.status >= 200 && putRes.status < 300;
  recordDiag({ stage: "storage-put", ok: putOk, httpStatus: putRes.status, filename: file.name, fileSize: file.size, contentType });
  if (!putOk) {
    throw new UploadError(
      "storage-put",
      putRes.status === 413
        ? "That file is too large."
        : putRes.status === 415
          ? "That file type isn't supported."
          : "The upload service rejected this file. Please try again.",
      putRes.status,
    );
  }

  return { name: file.name, size: file.size, contentType, objectPath: reservation.objectPath };
}

/**
 * Back-compat wrapper: the old name did reserve + PUT and returned meta (the
 * caller registered). Kept so any other importer keeps working.
 * @deprecated use uploadFileToStorage
 */
export const uploadFileAndRegister = uploadFileToStorage;
