import { useState, useCallback, useMemo } from "react";
import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { ListingFilter, Category } from "@/types/listing";

interface FilterPanelProps {
  filters: ListingFilter;
  onFilterChange: (filters: ListingFilter) => void;
  onClose?: () => void;
  isMobile?: boolean;
  resultCount?: number;
}

const categories: Category[] = [
  "음식점",
  "카페",
  "의류",
  "미용",
  "병원",
  "학원",
  "사무",
  "기타",
];

const sortOptions = [
  { value: "latest", label: "최신 등록순" },
  { value: "rent_low", label: "월세 낮은순" },
  { value: "premium_low", label: "권리금 낮은순" },
];

const AREA_MAX = 200;
const PREMIUM_MAX = 20000;
const DEPOSIT_MAX = 10000;
const RENT_MAX = 500;
const PYEONG_PER_M2 = 0.3025;

function formatPriceLabel(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}억`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}천만`;
  }
  return `${value}만`;
}

function formatPyeong(value: number): string {
  return (value * PYEONG_PER_M2).toFixed(1);
}

export function FilterPanel({
  filters,
  onFilterChange,
  onClose,
  isMobile = false,
  resultCount,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<ListingFilter>(filters);

  const resultMessage = useMemo(
    () => `필터 적용됨 ? 총 ${resultCount ?? 0}건의 결과`,
    [resultCount]
  );

  const updateFilter = useCallback(
    (key: keyof ListingFilter, value: unknown) => {
      const newFilters = { ...localFilters, [key]: value };
      setLocalFilters(newFilters);
      onFilterChange(newFilters);
    },
    [localFilters, onFilterChange]
  );

  const handleNumberInput = useCallback(
    (key: keyof ListingFilter, value: string) => {
      if (value.trim() === "") {
        updateFilter(key, undefined);
        return;
      }

      const numeric = Number(value);
      if (Number.isNaN(numeric)) return;
      updateFilter(key, numeric);
    },
    [updateFilter]
  );

  const handleCategoryToggle = useCallback(
    (category: Category) => {
      const currentCategories = localFilters.categories || [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter((c) => c !== category)
        : [...currentCategories, category];
      updateFilter("categories", newCategories.length > 0 ? newCategories : undefined);
    },
    [localFilters.categories, updateFilter]
  );

  const handleReset = useCallback(() => {
    const resetFilters: ListingFilter = { sort: "latest" };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  }, [onFilterChange]);

  const premiumMin = localFilters.premiumMin ?? 0;
  const premiumMax = localFilters.premiumMax ?? PREMIUM_MAX;
  const depositMin = localFilters.depositMin ?? 0;
  const depositMax = localFilters.depositMax ?? DEPOSIT_MAX;
  const rentMin = localFilters.monthlyRentMin ?? 0;
  const rentMax = localFilters.monthlyRentMax ?? RENT_MAX;
  const areaMin = localFilters.areaMin ?? 0;
  const areaMax = localFilters.areaMax ?? AREA_MAX;

  return (
    <div
      className={cn(
        "bg-card h-full flex flex-col",
        isMobile ? "w-full" : "w-filter border-r border-border"
      )}
    >
      <div className="sr-only" role="status" aria-live="polite">
        {resultMessage}
      </div>

      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">필터</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            초기화
          </Button>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="필터 닫기">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">권리금</Label>
          <div className="px-2">
            <Slider
              defaultValue={[0, PREMIUM_MAX]}
              max={PREMIUM_MAX}
              step={1000}
              value={[premiumMin, premiumMax]}
              onValueChange={([min, max]) => {
                updateFilter("premiumMin", min === 0 ? undefined : min);
                updateFilter("premiumMax", max === PREMIUM_MAX ? undefined : max);
              }}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatPriceLabel(premiumMin)}</span>
              <span>{formatPriceLabel(premiumMax)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={localFilters.premiumMin ?? ""}
                  onChange={(event) => handleNumberInput("premiumMin", event.target.value)}
                  placeholder="최소"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">만원</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={localFilters.premiumMax ?? ""}
                  onChange={(event) => handleNumberInput("premiumMax", event.target.value)}
                  placeholder="최대"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">만원</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">보증금</Label>
          <div className="px-2">
            <Slider
              defaultValue={[0, DEPOSIT_MAX]}
              max={DEPOSIT_MAX}
              step={500}
              value={[depositMin, depositMax]}
              onValueChange={([min, max]) => {
                updateFilter("depositMin", min === 0 ? undefined : min);
                updateFilter("depositMax", max === DEPOSIT_MAX ? undefined : max);
              }}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatPriceLabel(depositMin)}</span>
              <span>{formatPriceLabel(depositMax)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={localFilters.depositMin ?? ""}
                  onChange={(event) => handleNumberInput("depositMin", event.target.value)}
                  placeholder="최소"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">만원</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={localFilters.depositMax ?? ""}
                  onChange={(event) => handleNumberInput("depositMax", event.target.value)}
                  placeholder="최대"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">만원</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">월세</Label>
          <div className="px-2">
            <Slider
              defaultValue={[0, RENT_MAX]}
              max={RENT_MAX}
              step={10}
              value={[rentMin, rentMax]}
              onValueChange={([min, max]) => {
                updateFilter("monthlyRentMin", min === 0 ? undefined : min);
                updateFilter("monthlyRentMax", max === RENT_MAX ? undefined : max);
              }}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{rentMin}만</span>
              <span>{rentMax}만</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={localFilters.monthlyRentMin ?? ""}
                  onChange={(event) => handleNumberInput("monthlyRentMin", event.target.value)}
                  placeholder="최소"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">만원</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={localFilters.monthlyRentMax ?? ""}
                  onChange={(event) => handleNumberInput("monthlyRentMax", event.target.value)}
                  placeholder="최대"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">만원</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">전용면적 (㎡)</Label>
          <div className="px-2">
            <Slider
              defaultValue={[0, AREA_MAX]}
              max={AREA_MAX}
              step={10}
              value={[areaMin, areaMax]}
              onValueChange={([min, max]) => {
                updateFilter("areaMin", min === 0 ? undefined : min);
                updateFilter("areaMax", max === AREA_MAX ? undefined : max);
              }}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{areaMin}㎡</span>
              <span>{areaMax}㎡</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ({formatPyeong(areaMin)}평) ~ ({formatPyeong(areaMax)}평)
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={localFilters.areaMin ?? ""}
                  onChange={(event) => handleNumberInput("areaMin", event.target.value)}
                  placeholder="최소"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">㎡</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={localFilters.areaMax ?? ""}
                  onChange={(event) => handleNumberInput("areaMax", event.target.value)}
                  placeholder="최대"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">㎡</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">업종</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isSelected = localFilters.categories?.includes(category);
              return (
                <Badge
                  key={category}
                  variant={isSelected ? "default" : "secondary"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                  onClick={() => handleCategoryToggle(category)}
                >
                  {category}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">정렬</Label>
          <RadioGroup
            value={localFilters.sort || "latest"}
            onValueChange={(value) => updateFilter("sort", value as ListingFilter["sort"])}
            className="space-y-2"
          >
            {sortOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label
                  htmlFor={option.value}
                  className="text-sm font-normal text-foreground cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {isMobile && (
        <div className="p-4 border-t border-border bg-card">
          <div
            role="status"
            aria-live="polite"
            className="text-sm text-muted-foreground mb-3 text-center"
          >
            {resultMessage}
          </div>
          <Button onClick={onClose} className="w-full">
            결과 보기
          </Button>
        </div>
      )}
    </div>
  );
}
