"use client";

// 맨몸운동 섹션 타입 정의
interface BodyweightSection {
  title: string;
  prefix: string;
  kgField: string;
  fieldType: "reps";
  category: "bodyweight";
  options: { name: string; label: string }[];
}

// 맨몸운동 섹션 데이터
export const bodyweightSections: BodyweightSection[] = [
  {
    title: "[등] 풀업",
    prefix: "pullup",
    kgField: "pullupReps",
    fieldType: "reps",
    category: "bodyweight",
    options: [
      { name: "pullupArms", label: "팔 위주로 당겨짐" },
      { name: "pullupLatsFeel", label: "광배 자극 인지 어려움" },
      { name: "pullupBounce", label: "반동 사용" },
      { name: "pullupScapula", label: "견갑 조절 어려움" },
    ],
  },
  {
    title: "[코어] 윗몸일으키기",
    prefix: "situp",
    kgField: "situpReps",
    fieldType: "reps",
    category: "bodyweight",
    options: [
      { name: "situpLowerBack", label: "허리 불편감" },
      { name: "situpBounce", label: "반동 사용" },
      { name: "situpCoreTension", label: "코어 긴장 유지 어려움" },
      { name: "situpBodyShake", label: "상체 흔들림" },
    ],
  },
  {
    title: "[하체] 스쿼트",
    prefix: "bodyweightSquat",
    kgField: "bodyweightSquatReps",
    fieldType: "reps",
    category: "bodyweight",
    options: [
      { name: "bodyweightSquatDepth", label: "스쿼트 깊이 제한적 (병렬 이하 어려움)" },
      { name: "bodyweightSquatKneePain", label: "무릎 통증 발생" },
      { name: "bodyweightSquatLowerBack", label: "허리 부담 느낌" },
      { name: "bodyweightSquatBalance", label: "좌우 밸런스 불안정" },
    ],
  },
  {
    title: "[가슴] 푸쉬업",
    prefix: "pushup",
    kgField: "pushupReps",
    fieldType: "reps",
    category: "bodyweight",
    options: [
      { name: "pushupShoulderDiscomfort", label: "어깨 불편감" },
      { name: "pushupRangeLimit", label: "가동 범위 제한" },
      { name: "pushupImbalance", label: "좌우 힘 차이 느낌" },
      { name: "pushupCoreUnstable", label: "코어 불안정 (허리 처짐)" },
    ],
  },
  {
    title: "[전신] 버피",
    prefix: "burpee",
    kgField: "burpeeReps",
    fieldType: "reps",
    category: "bodyweight",
    options: [
      { name: "burpeeBreathing", label: "호흡 조절 어려움" },
      { name: "burpeeFormBreakdown", label: "동작 정확도 저하" },
      { name: "burpeeLowerBack", label: "허리 불편감" },
      { name: "burpeeEndurance", label: "지구력 부족 (빠른 피로)" },
    ],
  },
];

// 맨몸운동 섹션 컴포넌트
export default function BodyweightSection({ section, inputRef, isMissing = false }: { section: BodyweightSection; inputRef?: (el: HTMLInputElement | null) => void; isMissing?: boolean }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-extrabold text-surface-900 mb-3">{section.title}</h3>
      <div className="max-w-xs">
        <div>
          <label className="form-label" htmlFor={section.kgField}>
            횟수 (회)
          </label>
          <input
            ref={inputRef}
            id={section.kgField}
            name={section.kgField}
            type="number"
            min="0"
            className={`form-input ${isMissing ? "border-red-300 ring-2 ring-red-100 bg-red-50 focus:ring-red-100 focus:border-red-300" : ""}`}
            placeholder="횟수"
            onWheel={(e) => e.currentTarget.blur()}
          />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs font-extrabold tracking-widest text-surface-500 mb-2">OPTIONAL</div>
        <div className="flex flex-col gap-2">
          {section.options.map((option) => (
            <label key={option.name} className="inline-flex items-center">
              <input type="checkbox" name={option.name} className="form-checkbox" />
              <span className="ml-2 text-sm text-surface-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
