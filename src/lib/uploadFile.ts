import { requestUploadUrl } from "@workspace/api-client-react";

export async function uploadFileAndRegister(file: File): Promise<{
  name: string;
  size: number;
  contentType: string;
  objectPath: string;
}> {
  const contentType = file.type || "application/octet-stream";
  const { uploadURL, objectPath } = await requestUploadUrl({
    name: file.name,
    size: file.size,
    contentType,
  });
  const putRes = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`Upload failed: ${putRes.status} ${putRes.statusText}`);
  }
  return { name: file.name, size: file.size, contentType, objectPath };
}
