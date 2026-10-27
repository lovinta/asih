// Client-side image resize: photos and screenshots are scaled down to at
// most 1600px on the long side and encoded as JPEG before upload, so the
// POST /api/agent payloads stay small. Browser-only; never imported server-side.
export const MAX_IMAGE_DIM = 1600;

export function resizeImageFile(file: File, maxDim = MAX_IMAGE_DIM): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas is not available."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Could not resize the photo."));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the photo."));
    };
    img.src = url;
  });
}
