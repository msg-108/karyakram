import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface FileDropzoneProps {
  label: string;
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  helperText?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  label,
  accept = 'image/*,.pdf',
  file,
  onChange,
  error,
  helperText,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 5;

  const validateAndSelectFile = (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller file.`);
      return;
    }
    onChange(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-1.5">
      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
        {label}
      </label>

      {file ? (
        <div className="flex items-center justify-between p-3.5 bg-karyakram-gold-50 border border-karyakram-gold-600 rounded-xl transition-all shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-karyakram-gold-200 text-karyakram-gold-900 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-karyakram-gold-900 truncate">{file.name}</p>
              <p className="text-xs text-karyakram-gold-800">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1.5 text-karyakram-gold-800 hover:text-karyakram-red-600 hover:bg-karyakram-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-karyakram-red-50/40 border-karyakram-red-200 hover:border-karyakram-red-600 cursor-pointer transition-colors text-center shadow-2xs',
            isDragOver && 'border-karyakram-red-600 bg-karyakram-red-50',
            error && 'border-karyakram-red-600 bg-karyakram-red-50/60'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                validateAndSelectFile(e.target.files[0]);
              }
            }}
          />
          <UploadCloud className="w-8 h-8 text-karyakram-red-600 mb-2" />
          <p className="text-sm font-semibold text-slate-800">
            Click to upload <span className="font-normal text-slate-500">or drag and drop</span>
          </p>
          {helperText && <p className="text-xs text-slate-500 mt-1">{helperText}</p>}
        </div>
      )}

      {error && <p className="text-xs text-karyakram-red-600 font-semibold">{error}</p>}
    </div>
  );
};
