import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ImagePlus, Trash2 } from "lucide-react";

export type PhotoItem = {
  id: string;
  file: File;
  previewUrl: string;
  originalName: string;
  sizeMb: string;
};

type UploadProgress = {
  total: number;
  processed: number;
  percent: number;
};

interface PhotoUploadStepProps {
  photos: PhotoItem[];
  maxPhotos: number;
  minPhotos: number;
  maxSizeMb: number;
  isProcessing?: boolean;
  disabled?: boolean;
  uploadProgress?: UploadProgress | null;
  error?: string | null;
  onAddPhotos: (files: FileList | File[]) => void;
  onRemovePhoto: (id: string) => void;
}

export function PhotoUploadStep({
  photos,
  maxPhotos,
  minPhotos,
  maxSizeMb,
  isProcessing = false,
  disabled = false,
  uploadProgress = null,
  error,
  onAddPhotos,
  onRemovePhoto,
}: PhotoUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = disabled || isProcessing;

  const handleFiles = (files: FileList | null) => {
    if (!files || isDisabled) return;
    onAddPhotos(files);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">사진 업로드</h3>
          <p className="text-sm text-muted-foreground">
            최소 {minPhotos}장 이상 · 최대 {maxPhotos}장 · 장당 {maxSizeMb}MB 미만 · 1600px
            리사이즈 · WebP 변환
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {photos.length}/{maxPhotos}
        </div>
      </div>

      <div
        className={cn(
          "border border-dashed border-border rounded-xl p-6 text-sm text-muted-foreground",
          "flex flex-col items-center justify-center gap-3",
          isDisabled && "opacity-60 cursor-not-allowed"
        )}
        onDragOver={(event) => {
          if (isDisabled) return;
          event.preventDefault();
        }}
        onDrop={(event) => {
          if (isDisabled) return;
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
      >
        <ImagePlus className="h-6 w-6" />
        <p>사진을 드래그 앤 드롭하거나 버튼을 눌러 업로드하세요.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
          disabled={isDisabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isDisabled}
        >
          사진 선택
        </Button>
      </div>

      {uploadProgress && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{isProcessing ? "업로드 준비 중..." : "처리 완료"}</span>
            <span>
              {uploadProgress.processed}/{uploadProgress.total}
            </span>
          </div>
          <Progress value={uploadProgress.percent} />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="rounded-xl border border-border overflow-hidden">
            <div className="relative aspect-[4/3] bg-muted">
              <img
                src={photo.previewUrl}
                alt={photo.originalName}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  if (!disabled) onRemovePhoto(photo.id);
                }}
                disabled={disabled}
                className={cn(
                  "absolute top-2 right-2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground",
                  disabled && "cursor-not-allowed opacity-60"
                )}
                aria-label="사진 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 text-xs text-muted-foreground">
              <div className="truncate">{photo.originalName}</div>
              <div>{photo.sizeMb} MB</div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        {photos.length < minPhotos
          ? `사진 ${minPhotos}장 이상 업로드해야 다음 단계로 이동할 수 있습니다.`
          : "필수 사진 조건을 충족했습니다."}
      </div>
    </div>
  );
}
