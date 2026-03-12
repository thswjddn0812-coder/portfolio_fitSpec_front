"use client";

// 유연성 운동 섹션 타입 정의
interface FlexibilitySection {
  title: string;
  prefix: string;
  kgField: string;
  fieldType: "flexibility";
  category: "flexibility";
}

// 유연성 운동 섹션 데이터
export const flexibilitySections: FlexibilitySection[] = [
  {
    title: "흉추 가동성 테스트",
    prefix: "thoracic",
    kgField: "thoracicMobility",
    fieldType: "flexibility",
    category: "flexibility",
  },
  {
    title: "어깨 유연성 테스트 (굽힘/폄/외전/내전/외회전/내회전)",
    prefix: "shoulderFlexibility",
    kgField: "shoulderFlexibility",
    fieldType: "flexibility",
    category: "flexibility",
  },
  {
    title: "햄스트링",
    prefix: "hamstring",
    kgField: "hamstring",
    fieldType: "flexibility",
    category: "flexibility",
  },
  {
    title: "고관절 테스트 (굴곡/신전/스쿼트각도)",
    prefix: "hip",
    kgField: "hipMobility",
    fieldType: "flexibility",
    category: "flexibility",
  },
  {
    title: "발목 가동성",
    prefix: "ankle",
    kgField: "ankleMobility",
    fieldType: "flexibility",
    category: "flexibility",
  },
];

// 유연성 섹션 컴포넌트
export default function FlexibilitySection({ section, inputRef, isMissing = false }: { section: FlexibilitySection; inputRef?: (el: HTMLInputElement | null) => void; isMissing?: boolean }) {
  return (
    <div>
      <h3 className="text-base font-extrabold text-surface-900 mb-3">{section.title}</h3>
      <div className={`mt-3 rounded-2xl border p-4 ${isMissing ? "bg-red-50 border-red-200 ring-2 ring-red-100" : "bg-white border-surface-200"}`}>
        <div className="flex gap-4 flex-wrap">
          <label className="inline-flex items-center">
            <input ref={inputRef} type="radio" name={section.kgField} value="excellent" className="form-radio" />
            <span className="ml-2 text-sm text-surface-700 font-semibold">매우좋음</span>
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name={section.kgField} value="good" className="form-radio" />
            <span className="ml-2 text-sm text-surface-700 font-semibold">좋음</span>
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name={section.kgField} value="normal" className="form-radio" />
            <span className="ml-2 text-sm text-surface-700 font-semibold">보통</span>
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name={section.kgField} value="bad" className="form-radio" />
            <span className="ml-2 text-sm text-surface-700 font-semibold">나쁨</span>
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name={section.kgField} value="very_bad" className="form-radio" />
            <span className="ml-2 text-sm text-surface-700 font-semibold">매우나쁨</span>
          </label>
        </div>
      </div>
    </div>
  );
}
