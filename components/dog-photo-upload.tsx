'use client';

import { useRef, useState } from 'react';
import { Camera, PawPrint, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface DogPhotoUploadProps {
  currentUrl: string | null;
  onUpload: (url: string) => void;
  onError: (msg: string) => void;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export function DogPhotoUpload({ currentUrl, onUpload, onError }: DogPhotoUploadProps) {
  const { fetchWithAuth } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      onError('Only JPG, PNG, or WebP images allowed.');
      return;
    }
    if (file.size > MAX_BYTES) {
      onError('Photo must be under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetchWithAuth('/api/profile/photo', { method: 'POST', body: form });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Upload failed');
      onUpload(data.url!);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Upload dog photo"
        className={cn(
          'group relative size-[108px] cursor-pointer rounded-full transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-doggy/60',
        )}
      >
        {preview ? (
          <Image src={preview} alt="Dog photo" fill className="rounded-full object-cover" sizes="108px" />
        ) : (
          <div className="flex size-full items-center justify-center rounded-full border-2 border-dashed border-doggy/30 bg-doggy/[0.08]" style={{ boxShadow: '0 0 28px rgba(178,164,255,0.10)' }}>
            <PawPrint className="size-10 text-doggy/40" strokeWidth={1.5} />
          </div>
        )}

        <div className={cn(
          'absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity duration-200',
          uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}>
          {uploading ? (
            <Loader2 className="size-7 animate-spin text-white" strokeWidth={1.5} />
          ) : (
            <Camera className="size-7 text-white" strokeWidth={1.5} />
          )}
        </div>

        {!uploading && (
          <div className="absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full border-2 border-[#0f0d09] bg-doggy shadow-lg shadow-doggy/30">
            <Camera className="size-3.5 text-white" strokeWidth={2} />
          </div>
        )}
      </button>

      <p className="font-pawprint text-[11px] text-paw/30">
        Click to upload · JPG/PNG · 5 MB max
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
