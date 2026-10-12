"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Drag & drop (or click/keyboard) image picker backed by a real file input, so it
 * submits with the surrounding form. Validates type and size before upload.
 */
export function ImageDropzone({
  name,
  label,
  currentUrl,
  error,
  onErrorChange,
}: {
  name: string;
  label: string;
  currentUrl?: string | null;
  error?: string;
  onErrorChange?: (error: string | undefined) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; name: string; size: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const shownError = localError ?? error;

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const setError = (e: string | undefined) => {
    setLocalError(e);
    onErrorChange?.(e);
  };

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      setError("Formato no soportado. Usa JPG, PNG, WebP o GIF.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`La imagen pesa ${formatSize(file.size)}; el máximo es 5 MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError(undefined);
    setPreview({ url: URL.createObjectURL(file), name: file.name, size: file.size });
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
    setError(undefined);
  };

  const shownUrl = preview?.url ?? currentUrl ?? null;

  return (
    <div>
      <p id={`${id}-label`} className="text-sm font-medium text-[#12233d]">
        {label}
      </p>
      <div
        role="button"
        tabIndex={0}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-help${shownError ? ` ${id}-error` : ""}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (!file || !inputRef.current) return;
          const dt = new DataTransfer();
          dt.items.add(file);
          inputRef.current.files = dt.files;
          accept(file);
        }}
        className={`mt-2 flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-4 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] sm:flex-row sm:text-left ${
          dragging
            ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_8%,white)]"
            : shownError
              ? "border-rose-300 bg-rose-50/40"
              : "border-[#d5e3ec] bg-[#fafcfd] hover:border-[var(--brand)]/60"
        }`}
      >
        <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#e8f0f5] bg-white">
          {shownUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownUrl} alt="Vista previa de la imagen" className="size-full object-contain" />
          ) : (
            <ImagePlus aria-hidden className="size-8 text-[var(--brand)] opacity-70" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--brand-deep)] sm:justify-start">
            <UploadCloud aria-hidden className="size-4 text-[var(--brand)]" />
            {dragging ? "Suelta la imagen aquí" : shownUrl ? "Cambiar imagen" : "Arrastra una imagen o haz clic"}
          </span>
          <span id={`${id}-help`} className="mt-1 block text-xs text-[#5a6578]">
            {preview ? `${preview.name} · ${formatSize(preview.size)}` : "JPG, PNG, WebP o GIF · máx. 5 MB · ideal cuadrada"}
          </span>
        </span>
        {preview ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
          >
            <Trash2 aria-hidden className="size-3.5" /> Quitar
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={ACCEPT.join(",")}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {shownError ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-rose-700">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}
