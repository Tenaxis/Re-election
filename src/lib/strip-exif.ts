// 이미지의 EXIF/GPS 등 메타데이터를 canvas 재인코딩으로 제거.
// canvas로 그려 다시 인코딩하면 원본 메타데이터가 사라진다(픽셀만 보존).
export async function stripImageMetadata(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  // GIF(애니메이션)는 프레임 손실 방지 위해 스킵
  if (file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // 디코딩 실패 시 원본 유지
  }

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, outType, 0.92),
  );
  if (!blob) return file;

  const ext = outType === "image/png" ? "png" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.${ext}`, { type: outType });
}
