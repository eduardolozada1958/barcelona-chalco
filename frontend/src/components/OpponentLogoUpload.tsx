import { useEffect, useRef } from 'react';
import { formInputClass, formLabelClass } from '@/components/DashboardModal';

const LOGO_MIMES = ['image/png', 'image/jpeg', 'image/webp'];

interface OpponentLogoUploadProps {
  currentUrl?: string | null;
  previewUrl: string | null;
  onFileSelect: (file: File | null, preview: string | null) => void;
  disabled?: boolean;
}

export function OpponentLogoUpload({
  currentUrl,
  previewUrl,
  onFileSelect,
  disabled = false,
}: OpponentLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayUrl = previewUrl ?? currentUrl ?? null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!LOGO_MIMES.includes(f.type)) {
      onFileSelect(null, null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    onFileSelect(f, URL.createObjectURL(f));
  };

  const clear = () => {
    onFileSelect(null, null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className={formLabelClass}>Logo del rival (opcional)</label>
      <div className="flex items-center gap-4 mt-1">
        <div className="w-16 h-16 rounded-full bg-surface-container border border-outline-variant/40 flex items-center justify-center overflow-hidden shrink-0">
          {displayUrl ? (
            <img src={displayUrl} alt="Vista previa escudo rival" className="w-12 h-12 object-contain" />
          ) : (
            <span className="text-[10px] text-on-surface-variant text-center px-1">Sin logo</span>
          )}
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={disabled}
            className={formInputClass}
            onChange={handleChange}
          />
          {displayUrl ? (
            <button
              type="button"
              disabled={disabled}
              onClick={clear}
              className="text-xs text-on-surface-variant hover:text-primary text-left"
            >
              Quitar selección
            </button>
          ) : null}
          <p className="text-[10px] text-on-surface-variant">PNG, JPEG o WebP. Se muestra en la tarjeta del partido.</p>
        </div>
      </div>
    </div>
  );
}
