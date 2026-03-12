"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { loginApi } from "@/lib/api";
import Link from "next/link";

const SAVED_EMAIL_KEY = "saved-email";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saveEmail, setSaveEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 페이지 로드 시 저장된 이메일 불러오기
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setSaveEmail(true);
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // 유효성 검사
    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
        console.log("로그인 시도:", { email });
      }

      // 백엔드 API 호출
      const response = await loginApi({ email, password });

      if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
        console.log("로그인 응답:", response);
      }

      // 이메일 저장 처리
      if (saveEmail) {
        localStorage.setItem(SAVED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }

      // 응답에서 사용자 정보 추출 (TransformInterceptor로 래핑되어 data 안에 있음)
      const responseData: any = "data" in response && response.data ? response.data : response;
      const ownerName = responseData.gym?.ownerName || responseData.user?.ownerName || responseData.user?.name || email.split("@")[0];
      const token = responseData.accessToken || responseData.token;
      const refreshToken = responseData.refreshToken;
      const gymId = responseData.gym?.id;

      if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
        console.log("로그인 응답 상세:", {
          response,
          responseData,
          gym: responseData.gym,
          gymId: gymId,
          ownerName,
          email,
        });
      }

      // gymId가 없으면 에러
      if (!gymId) {
        if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
          console.error("gymId가 응답에 없습니다:", response);
        }
        setError("로그인 정보를 가져올 수 없습니다. 다시 시도해주세요.");
        setIsSubmitting(false);
        return;
      }

      // 액세스 토큰 / 리프레시 토큰을 세션스토리지에 저장 (브라우저 종료 시 자동 삭제)
      if (typeof window !== "undefined") {
        try {
          if (token) {
            sessionStorage.setItem("accessToken", token);
          }
          if (refreshToken) {
            sessionStorage.setItem("refreshToken", refreshToken);
          }
        } catch (storageError) {
          if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
            console.warn("토큰 세션스토리지 저장 실패:", storageError);
          }
        }
      }

      // 인증 상태 업데이트
      login(ownerName, email, token, gymId);

      setIsSubmitting(false);
      router.push("/");
    } catch (error: any) {
      if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
        console.error("로그인 에러:", error);
        console.error("에러 상세:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url,
        });
      }

      // 에러 메시지 처리
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 401) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (error.response?.status === 404) {
        setError("사용자를 찾을 수 없습니다.");
      } else if (error.message === "Network Error" || error.code === "ERR_NETWORK") {
        setError("네트워크 오류가 발생했습니다. API 서버를 확인해주세요.");
      } else {
        setError(`로그인 중 오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`);
      }
    } finally {
      // 무조건 실행되어 로딩 상태 해제
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-0px)] flex items-center justify-center bg-surface-50 px-4 py-10">
      <Link
        href="/"
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white/90 backdrop-blur px-3 py-2 text-sm font-semibold text-surface-700 hover:bg-surface-50 transition-colors shadow-sm"
        aria-label="메인으로 돌아가기"
      >
        <span className="text-surface-500 font-bold">←</span>
        뒤로가기
      </Link>
      <div className="max-w-md w-full">
        <div className="card-surface shadow-soft p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-white font-extrabold text-xl tracking-tight">F</span>
            </div>
            <h1 className="text-2xl font-extrabold text-surface-900 mb-2 tracking-tight">로그인</h1>
            <p className="text-surface-600 text-sm">FitSpec 계정으로 로그인하세요.</p>
          </div>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-surface-700 font-semibold mb-2 text-sm" htmlFor="email">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-surface-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 bg-white placeholder:text-surface-400"
                placeholder="이메일을 입력하세요"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-surface-700 font-semibold mb-2 text-sm" htmlFor="password">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-surface-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 bg-white placeholder:text-surface-400"
                placeholder="비밀번호를 입력하세요"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <div className="mb-2 flex justify-between items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveEmail}
                    onChange={(e) => setSaveEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-100"
                  />
                  <span className="ml-2 text-sm text-surface-700">이메일 저장</span>
                </label>
                <div className="text-end">
                  <span className="text-brand-700 text-sm font-semibold hover:underline cursor-pointer">이메일ㆍ비밀번호 찾기</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "로그인 중..." : "로그인"}
              </button>
              <div className="w-full border-t border-surface-200 my-5"></div>
              <Link
                href="/signup"
                className="block w-full text-center rounded-xl border border-surface-200 bg-white px-4 py-3 font-semibold text-surface-800 hover:bg-surface-50 transition-colors"
              >
                회원가입
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-surface-500">
          계속 진행하면 FitSpec의 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
        </div>
      </div>
    </div>
  );
}
