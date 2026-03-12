"use client";

import { useState, FormEvent, useEffect } from "react";
import { useMemberStore } from "@/store/memberStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { createMemberApi, MemberRequest } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { getEffectiveAuth, isDevMode } = useAuthStore();
  const addMember = useMemberStore((state) => state.addMember);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [injuries, setInjuries] = useState<string[]>([]);
  const [showMoreInjuries, setShowMoreInjuries] = useState(false);

  // 실제 인증 상태 가져오기 (개발 모드 우회 포함)
  const { isLoggedIn } = getEffectiveAuth();
  const devMode = isDevMode();

  // 로그인 체크 (개발 모드에서는 우회)
  useEffect(() => {
    if (!isLoggedIn && !devMode) {
      router.push("/login");
    }
  }, [isLoggedIn, devMode, router]);

  // 로그인하지 않은 경우 아무것도 렌더링하지 않음 (개발 모드 제외)
  if (!isLoggedIn && !devMode) {
    return null;
  }

  const handleInjuryChange = (injury: string) => {
    setInjuries((prev) => {
      if (prev.includes(injury)) {
        return prev.filter((item) => item !== injury);
      } else {
        return [...prev, injury];
      }
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const gender = formData.get("gender") as "male" | "female";
    const ageStr = formData.get("age") as string;
    const heightStr = formData.get("height") as string;
    const weightStr = formData.get("weight") as string;

    // 유효성 검사
    if (!name || !gender || !ageStr || !heightStr || !weightStr) {
      setError("모든 필수 필드를 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    // 숫자 변환 및 유효성 검사
    const age = parseInt(ageStr, 10);
    const height = parseFloat(heightStr);
    const weight = parseFloat(weightStr);

    // NaN 체크
    if (isNaN(age) || isNaN(height) || isNaN(weight)) {
      setError("나이, 키, 몸무게는 올바른 숫자여야 합니다.");
      setIsSubmitting(false);
      return;
    }

    if (age <= 0 || age > 150) {
      setError("나이는 1 이상 150 이하여야 합니다.");
      setIsSubmitting(false);
      return;
    }

    if (height <= 0 || weight <= 0) {
      setError("키와 몸무게는 0보다 큰 값을 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 로그인 상태 확인
      const { isLoggedIn: authIsLoggedIn } = getEffectiveAuth();
      if (!authIsLoggedIn && !devMode) {
        setError("로그인 상태를 확인할 수 없습니다. 다시 로그인해주세요.");
        setIsSubmitting(false);
        return;
      }

      // 부상 부위를 notes로 변환 (선택사항)
      const notes = injuries.length > 0 ? injuries.join(", ") : undefined;

      // gender 변환: "male" -> "M", "female" -> "F"
      const genderCode: "M" | "F" = gender === "male" ? "M" : "F";

      // 백엔드 API 호출하여 DB에 저장 (age는 숫자로 전송)
      // gymId는 JWT 토큰에서 서버가 자동으로 추출하므로 포함하지 않음
      const requestData: MemberRequest = {
        name: name.trim(),
        gender: genderCode,
        age: age, // 숫자로 전송
        height: Number(height.toFixed(1)), // 소수점 1자리로 제한
        weight: Number(weight.toFixed(1)), // 소수점 1자리로 제한
        notes: notes || undefined, // 빈 문자열이면 undefined
      };

      if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
        console.log("=== 회원 등록 시작 ===");
        console.log("입력 데이터:", {
          name,
          age,
          gender: genderCode,
          height,
          weight,
          notes,
        });
        console.log("gymId는 JWT 토큰에서 서버가 자동으로 추출합니다.");
      }

      const response = await createMemberApi(requestData);

      if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
        console.log("=== 회원 등록 성공 ===");
        console.log("응답:", response);
      }

      // 로컬 스토어에도 추가 (기존 기능 유지)
      addMember({
        name,
        gender,
        age,
        height,
        weight,
      });

      // 성공 메시지 표시
      setShowSuccess(true);

      // 폼 초기화 (안전하게 처리)
      try {
        if (e.currentTarget) {
          e.currentTarget.reset();
        }
      } catch (resetError) {
        if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
          console.warn("폼 리셋 중 오류:", resetError);
        }
      }
      setInjuries([]);
      setShowMoreInjuries(false);

      // 확인 다이얼로그 표시
      const shouldNavigate = window.confirm("회원측정페이지로 이동하시겠습니까?");
      if (shouldNavigate) {
        router.push("/measurement");
      } else {
        // 3초 후 성공 메시지 숨기기
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
        console.error("=== 회원 등록 에러 ===");
        console.error("Error:", error);
        console.error("Error Response Data:", error.response?.data);
        console.error("Error Response Status:", error.response?.status);
      }

      // 백엔드에서 반환한 상세 에러 메시지 추출
      let errorMessage = "회원 등록 중 오류가 발생했습니다.";

      if (error.response?.data) {
        const errorData = error.response.data;

        // 배열 형태의 에러 메시지 처리
        if (Array.isArray(errorData.message)) {
          errorMessage = errorData.message.join(", ");
        }
        // 문자열 형태의 에러 메시지
        else if (typeof errorData.message === "string") {
          errorMessage = errorData.message;
        }
        // 객체 형태의 에러 메시지 (validation errors)
        else if (typeof errorData.message === "object") {
          const messages = Object.values(errorData.message).flat();
          errorMessage = messages.join(", ");
        }
        // 기타 에러 메시지
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error.response?.status === 400) {
        errorMessage = "입력한 정보를 확인해주세요. (400 Bad Request)";
      } else if (error.message === "Network Error" || error.code === "ERR_NETWORK") {
        errorMessage = "네트워크 오류가 발생했습니다. API 서버를 확인해주세요.";
      } else if (error.message) {
        errorMessage = `오류: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      // 무조건 실행되어 로딩 상태 해제
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="badge">MEMBER</div>
        <h1 className="section-title mt-3">회원 등록</h1>
        <p className="section-subtitle">새로운 회원의 기본 정보를 등록합니다.</p>
      </div>

      {showSuccess && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <span className="font-bold">완료</span>
          <span className="font-semibold">회원 정보가 성공적으로 등록되었습니다.</span>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <span className="font-bold">오류</span>
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <div className="card-surface shadow-soft p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">기본 정보</h2>
            <p className="text-sm text-surface-600 mt-1">필수 항목을 입력하고 등록을 완료하세요.</p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="form-label" htmlFor="name">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="form-input"
                placeholder="이름을 입력하세요"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="gender">
                성별 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center cursor-pointer">
                  <input type="radio" name="gender" value="male" required className="form-radio" />
                  <span className="ml-2 text-sm text-surface-800 font-semibold">남</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="radio" name="gender" value="female" required className="form-radio" />
                  <span className="ml-2 text-sm text-surface-800 font-semibold">여</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="form-label" htmlFor="age">
                  나이 <span className="text-red-500">*</span>
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="1"
                  required
                  className="form-input"
                  placeholder="나이"
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="height">
                  키(cm) <span className="text-red-500">*</span>
                </label>
                <input
                  id="height"
                  name="height"
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  className="form-input"
                  placeholder="키"
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="weight">
                  몸무게(kg) <span className="text-red-500">*</span>
                </label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  className="form-input"
                  placeholder="몸무게"
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
            </div>

            <div>
              <div className="flex items-end justify-between gap-4 flex-wrap mb-2">
                <div>
                  <div className="text-sm font-extrabold text-surface-900">특이사항 (부상)</div>
                  <div className="text-xs text-surface-600 mt-1">선택 항목이며, 체크한 항목이 특이사항으로 저장됩니다.</div>
                </div>
              </div>

              <div className="space-y-3">
                {/* 주요 부상 부위 */}
                <div className="flex flex-wrap gap-3">
                  {["무릎", "발목", "어깨", "허리", "손목", "목"].map((injury) => (
                    <label key={injury} className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={injuries.includes(injury)} onChange={() => handleInjuryChange(injury)} className="form-checkbox" />
                      <span className="ml-2 text-sm text-surface-800 font-semibold">{injury}</span>
                    </label>
                  ))}
                </div>

                {/* 더보기 버튼 */}
                <div className="transition-all duration-300 ease-in-out">
                  <button
                    type="button"
                    className="text-brand-700 text-sm font-semibold focus:outline-none hover:underline transition-all duration-300"
                    onClick={() => setShowMoreInjuries((prev) => !prev)}
                  >
                    {showMoreInjuries ? "숨기기 ▲" : "+ 더보기 ▼"}
                  </button>
                </div>

                {/* 추가 부상 부위 */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showMoreInjuries ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="flex flex-wrap gap-3 pt-3 border-t border-surface-200">
                    {[
                      "고관절",
                      "발가락",
                      "햄스트링",
                      "대퇴사두근",
                      "종아리",
                      "아킬레스건",
                      "골반",
                      "좌골신경통",
                      "회전근개",
                      "팔꿈치",
                      "이두",
                      "삼두",
                      "가슴",
                      "등",
                      "광배",
                      "승모",
                      "복부",
                      "옆구리",
                    ].map((injury) => (
                      <label key={injury} className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={injuries.includes(injury)} onChange={() => handleInjuryChange(injury)} className="form-checkbox" />
                        <span className="ml-2 text-sm text-surface-800 font-semibold">{injury}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isSubmitting} className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? "등록 중..." : "등록하기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
