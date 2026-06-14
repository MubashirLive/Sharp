import { useState, useRef } from "react";
import { Upload, X, Image, FileText, File, Eye, EyeOff } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface UploadFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export function UploadField({
  label,
  value,
  onChange,
  accept = "image/*,.pdf",
  className,
}: UploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create object URL for preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(url);
  };

  const handleClear = () => {
    setPreview(null);
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const isImage = preview?.startsWith("blob:") || preview?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = preview?.match(/\.pdf$/i);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}

      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose File
        </Button>

        {value && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {showPreview && preview && (
        <div className="mt-2 p-4 border rounded-lg bg-muted/30">
          {isImage ? (
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 rounded object-contain"
            />
          ) : isPdf ? (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-5 w-5 text-red-500" />
              <span>PDF Document</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <File className="h-5 w-5" />
              <span>File</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}