import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PhotoUploadStep, type PhotoItem } from "@/components/register/PhotoUploadStep";

const MAX_PHOTOS = 12;
const MIN_PHOTOS = 5;
const MAX_PHOTO_SIZE_MB = 5;
const RESIZE_MAX_WIDTH = 1600;

const steps = [
  { id: 1, title: "주소" },
  { id: 2, title: "기본 정보" },
  { id: 3, title: "금액 정보" },
  { id: 4, title: "업종·입지" },
  { id: 5, title: "사진" },
  { id: 6, title: "권리금·특이사항" },
  { id: 7, title: "공개 범위/가시성" },
  { id: 8, title: "제출" },
];

type FormState = {
  address: string;
  title: string;
  buildingName: string;
  floor: string;
  areaM2: string;
  premium: string;
  deposit: string;
  monthlyRent: string;
  category: string;
  locationNote: string;
  rightsNote: string;
  visibility: "public" | "internal";
};

type SubmissionStatus = "draft" | "pending_review";

type UploadProgress = {
  total: number;
  processed: number;
  percent: number;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러올 수 없습니다."));
    };
    img.src = url;
  });

const resizeImage = async (file: File) => {
  const image = await loadImage(file);
  const scale = image.width > RESIZE_MAX_WIDTH ? RESIZE_MAX_WIDTH / image.width : 1;
  const targetWidth = Math.round(image.width * scale);
  const targetHeight = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9)
  );

  if (!blob) {
    return file;
  }

  const filename = file.name.replace(/\.[^/.]+$/, "");
  return new File([blob], `${filename}.webp`, { type: "image/webp" });
};

export function RegisterWizard() {
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>("draft");
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [formData, setFormData] = useState<FormState>({
    address: "",
    title: "",
    buildingName: "",
    floor: "",
    areaM2: "",
    premium: "",
    deposit: "",
    monthlyRent: "",
    category: "",
    locationNote: "",
    rightsNote: "",
    visibility: "public",
  });

  const photosRef = useRef<PhotoItem[]>([]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, []);

  const currentStep = useMemo(() => steps.find((item) => item.id === step), [step]);
  const isLocked = submissionStatus === "pending_review";

  const handleChange = useCallback(
    (key: keyof FormState, value: string) => {
      if (isLocked) return;
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    [isLocked]
  );

  const handleAddPhotos = useCallback(
    async (files: FileList | File[]) => {
      if (isLocked) return;
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setPhotoError(null);

      const remaining = MAX_PHOTOS - photos.length;
      if (remaining <= 0) {
        setPhotoError(`사진은 최대 ${MAX_PHOTOS}장까지 업로드 가능합니다.`);
        return;
      }

      const pending = fileArray.slice(0, remaining);
      const errors: string[] = [];
      setIsProcessing(true);
      setUploadProgress({ total: pending.length, processed: 0, percent: 0 });

      const processed: PhotoItem[] = [];
      let processedCount = 0;

      for (const file of pending) {
        const fileSizeMb = file.size / (1024 * 1024);
        if (fileSizeMb >= MAX_PHOTO_SIZE_MB) {
          errors.push(`${file.name} 파일이 ${MAX_PHOTO_SIZE_MB}MB 이상입니다.`);
          processedCount += 1;
          setUploadProgress({
            total: pending.length,
            processed: processedCount,
            percent: Math.round((processedCount / pending.length) * 100),
          });
          continue;
        }

        try {
          const resizedFile = await resizeImage(file);
          const previewUrl = URL.createObjectURL(resizedFile);
          processed.push({
            id: createId(),
            file: resizedFile,
            previewUrl,
            originalName: file.name,
            sizeMb: (resizedFile.size / (1024 * 1024)).toFixed(2),
          });
        } catch (error) {
          errors.push(`${file.name} 처리에 실패했습니다.`);
        }

        processedCount += 1;
        setUploadProgress({
          total: pending.length,
          processed: processedCount,
          percent: Math.round((processedCount / pending.length) * 100),
        });
      }

      setPhotos((prev) => [...prev, ...processed]);
      setIsProcessing(false);

      if (fileArray.length > remaining) {
        errors.push(`사진은 최대 ${MAX_PHOTOS}장까지 업로드 가능합니다.`);
      }

      if (errors.length > 0) {
        setPhotoError(errors.join(" "));
      }
    },
    [photos.length, isLocked]
  );

  const handleRemovePhoto = useCallback(
    (id: string) => {
      if (isLocked) return;
      setPhotos((prev) => {
        const target = prev.find((item) => item.id === id);
        if (target) {
          URL.revokeObjectURL(target.previewUrl);
        }
        return prev.filter((item) => item.id !== id);
      });
    },
    [isLocked]
  );

  const handleNext = () => {
    if (isLocked) return;
    if (step === 5 && photos.length < MIN_PHOTOS) {
      setPhotoError(`사진은 최소 ${MIN_PHOTOS}장 이상 등록해야 합니다.`);
      return;
    }
    setPhotoError(null);
    setStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrev = () => {
    if (isLocked) return;
    setPhotoError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSaveDraft = () => {
    if (isLocked) return;
    setSubmissionStatus("draft");
    setDraftSavedAt(new Date());
    console.log("Draft saved", { formData, photos });
  };

  const handleSubmit = () => {
    if (isLocked) return;
    if (photos.length < MIN_PHOTOS) {
      setPhotoError(`사진은 최소 ${MIN_PHOTOS}장 이상 등록해야 합니다.`);
      return;
    }
    setSubmissionStatus("pending_review");
    setSubmittedAt(new Date());
    setStep(8);
    console.log("Submitted", { formData, photos });
  };

  const canProceed = !isLocked && (step !== 5 || photos.length >= MIN_PHOTOS);

  const formatTimestamp = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            진행 {step}/{steps.length}
          </p>
          <h2 className="text-h2 text-foreground">{currentStep?.title}</h2>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={isLocked ? "outline" : "secondary"}>
            {submissionStatus === "pending_review" ? "검수 대기 (Pending Review)" : "임시 저장 (Draft)"}
          </Badge>
          {submissionStatus === "draft" && draftSavedAt && (
            <p className="text-xs text-muted-foreground">
              마지막 저장 · {formatTimestamp(draftSavedAt)}
            </p>
          )}
          {submissionStatus === "pending_review" && submittedAt && (
            <p className="text-xs text-muted-foreground">
              제출 완료 · {formatTimestamp(submittedAt)}
            </p>
          )}
        </div>
      </div>

      {submissionStatus === "pending_review" ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          제출이 완료되어 현재 검수 대기 중입니다. 검수 완료 전까지는 편집이 잠금됩니다.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Draft 상태에서는 언제든 수정 후 재제출할 수 있습니다. 임시 저장 버튼으로 진행 상황을
          기록하세요.
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-address">주소 *</Label>
                <Input
                  id="register-address"
                  placeholder="도로명 또는 지번 주소를 입력하세요"
                  value={formData.address}
                  onChange={(event) => handleChange("address", event.target.value)}
                  disabled={isLocked}
                />
              </div>
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                지도 선택 영역 (MVP에서는 주소 검색만 제공)
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-title">매물명 *</Label>
                <Input
                  id="register-title"
                  placeholder="예: 범어동 카페 매물"
                  value={formData.title}
                  onChange={(event) => handleChange("title", event.target.value)}
                  disabled={isLocked}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-building">건물명</Label>
                  <Input
                    id="register-building"
                    placeholder="건물명"
                    value={formData.buildingName}
                    onChange={(event) => handleChange("buildingName", event.target.value)}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-floor">층수</Label>
                  <Input
                    id="register-floor"
                    placeholder="예: 2층"
                    value={formData.floor}
                    onChange={(event) => handleChange("floor", event.target.value)}
                    disabled={isLocked}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-area">전용면적 (㎡)</Label>
                <Input
                  id="register-area"
                  placeholder="예: 132"
                  value={formData.areaM2}
                  onChange={(event) => handleChange("areaM2", event.target.value)}
                  disabled={isLocked}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-premium">권리금 (만원)</Label>
                  <Input
                    id="register-premium"
                    placeholder="0"
                    value={formData.premium}
                    onChange={(event) => handleChange("premium", event.target.value)}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-deposit">보증금 (만원)</Label>
                  <Input
                    id="register-deposit"
                    placeholder="0"
                    value={formData.deposit}
                    onChange={(event) => handleChange("deposit", event.target.value)}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-rent">월세 (만원)</Label>
                  <Input
                    id="register-rent"
                    placeholder="0"
                    value={formData.monthlyRent}
                    onChange={(event) => handleChange("monthlyRent", event.target.value)}
                    disabled={isLocked}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-category">업종 *</Label>
                <Input
                  id="register-category"
                  placeholder="예: 카페/베이커리"
                  value={formData.category}
                  onChange={(event) => handleChange("category", event.target.value)}
                  disabled={isLocked}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-location">입지 및 상권 설명</Label>
                <Textarea
                  id="register-location"
                  placeholder="상권 특성이나 접근성을 입력하세요"
                  value={formData.locationNote}
                  onChange={(event) => handleChange("locationNote", event.target.value)}
                  rows={4}
                  disabled={isLocked}
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <PhotoUploadStep
              photos={photos}
              isProcessing={isProcessing}
              maxPhotos={MAX_PHOTOS}
              minPhotos={MIN_PHOTOS}
              maxSizeMb={MAX_PHOTO_SIZE_MB}
              error={photoError}
              disabled={isLocked}
              uploadProgress={uploadProgress}
              onAddPhotos={handleAddPhotos}
              onRemovePhoto={handleRemovePhoto}
            />
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-rights">권리금 및 특이사항</Label>
                <Textarea
                  id="register-rights"
                  placeholder="권리금 포함 내역, 특약 사항 등을 입력하세요"
                  value={formData.rightsNote}
                  onChange={(event) => handleChange("rightsNote", event.target.value)}
                  rows={5}
                  disabled={isLocked}
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>공개 범위</Label>
                <RadioGroup
                  value={formData.visibility}
                  onValueChange={(value) =>
                    handleChange("visibility", value as FormState["visibility"])
                  }
                  className="space-y-2"
                  disabled={isLocked}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="public" id="visibility-public" />
                    <Label htmlFor="visibility-public">공개 (모든 회원)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="internal" id="visibility-internal" />
                    <Label htmlFor="visibility-internal">비공개 (내부 직원 전용)</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">권한별 정보 노출 요약</p>
                <ul className="space-y-1">
                  <li>게스트: 권리금 마스킹, 보증금·월세 범위 노출, 연락처 비공개</li>
                  <li>회원: 권리금 마스킹, 보증금 범위, 월세 상세 노출</li>
                  <li>파트너: 금액 전체 노출, 연락처 마스킹</li>
                  <li>직원/마스터: 전체 정보 노출</li>
                </ul>
                <p className="text-xs text-muted-foreground">
                  내부 전용 설정 시 게스트/회원에게는 목록이 노출되지 않습니다.
                </p>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                입력한 정보를 확인하고 제출해 주세요.
              </p>
              <div className="grid gap-2 text-sm">
                <div>주소: {formData.address || "-"}</div>
                <div>매물명: {formData.title || "-"}</div>
                <div>업종: {formData.category || "-"}</div>
                <div>
                  금액: 권리금 {formData.premium || "-"} / 보증금 {formData.deposit || "-"} / 월세 {formData.monthlyRent || "-"}
                </div>
                <div>사진 업로드: {photos.length}장</div>
                <div>공개 범위: {formData.visibility === "public" ? "공개" : "내부 전용"}</div>
                <div>상태: {submissionStatus === "pending_review" ? "검수 대기" : "임시 저장"}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={handlePrev} disabled={step === 1 || isLocked}>
          이전
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={handleSaveDraft} disabled={isLocked}>
            임시 저장
          </Button>
          {step === steps.length ? (
            submissionStatus === "pending_review" ? (
              <Button disabled variant="secondary">
                검수 대기 중
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={photos.length < MIN_PHOTOS || isLocked}>
                제출
              </Button>
            )
          ) : (
            <Button onClick={handleNext} disabled={!canProceed}>
              다음
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
