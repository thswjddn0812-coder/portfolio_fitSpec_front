"use client";

// 웨이트 트레이닝 섹션 타입 정의
interface WeightTrainingSection {
  title: string;
  prefix: string;
  kgField: string;
  fieldType: "kg";
  category: "weight";
  options: { name: string; label: string }[];
}

// 웨이트 트레이닝 섹션 데이터
export const weightTrainingSections: WeightTrainingSection[] = [
  {
    title: "[하체] 바벨 스쿼트",
    prefix: "squat",
    kgField: "squatKg",
    category: "weight",
    fieldType: "kg",
    options: [
      { name: "squatDepth", label: "스쿼트 깊이 제한적 (병렬 이하 어려움)" },
      { name: "squatKneePain", label: "무릎 통증 발생" },
      { name: "squatLowerBack", label: "허리 부담 느낌" },
      { name: "squatBalance", label: "좌우 밸런스 불안정" },
    ],
  },
  {
    title: "[가슴] 벤치프레스",
    prefix: "bench",
    kgField: "benchKg",
    category: "weight",
    fieldType: "kg",
    options: [
      { name: "benchShoulderDiscomfort", label: "어깨 불편감" },
      { name: "benchRangeLimit", label: "가동 범위 제한" },
      { name: "benchImbalance", label: "좌우 힘 차이 느낌" },
      { name: "benchScapula", label: "견갑 고정 어려움" },
    ],
  },
  {
    title: "[어깨] 숄더프레스",
    prefix: "shoulder",
    kgField: "shoulderKg",
    category: "weight",
    fieldType: "kg",
    options: [
      { name: "shoulderOverextend", label: "허리 과신전 발생" },
      { name: "shoulderPain", label: "어깨 통증" },
      { name: "shoulderRange", label: "가동 범위 제한" },
      { name: "shoulderCore", label: "코어 불안정" },
    ],
  },
  {
    title: "[등] 바벨로우",
    prefix: "barbellRow",
    kgField: "barbellRowKg",
    category: "weight",
    fieldType: "kg",
    options: [
      { name: "barbellRowArms", label: "팔 위주로 당겨짐 (등 개입 부족)" },
      { name: "barbellRowLatsFeel", label: "광배 자극 인지 어려움" },
      { name: "barbellRowLowerBack", label: "허리 부담 느낌" },
      { name: "barbellRowImbalance", label: "좌우 힘 차이 느낌" },
    ],
  },
  {
    title: "[전신] 데드리프트",
    prefix: "deadlift",
    kgField: "deadliftKg",
    category: "weight",
    fieldType: "kg",
    options: [
      { name: "deadliftLowerBack", label: "허리 부담 느낌" },
      { name: "deadliftFormBreakdown", label: "동작 정확도 저하 (둥근 등)" },
      { name: "deadliftGrip", label: "그립 유지 어려움" },
      { name: "deadliftBalance", label: "균형 불안정" },
    ],
  },
];

// 웨이트 트레이닝 섹션 컴포넌트
export default function WeightTrainingSection({ section, inputRef, isMissing = false }: { section: WeightTrainingSection; inputRef?: (el: HTMLInputElement | null) => void; isMissing?: boolean }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-extrabold text-surface-900 mb-3">{section.title}</h3>
      <div className="max-w-xs">
        <div>
          <label className="form-label" htmlFor={section.kgField}>
            무게 (kg)
          </label>
          <input
            ref={inputRef}
            id={section.kgField}
            name={section.kgField}
            type="number"
            min="0"
            className={`form-input ${isMissing ? "border-red-300 ring-2 ring-red-100 bg-red-50 focus:ring-red-100 focus:border-red-300" : ""}`}
            placeholder="무게"
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
