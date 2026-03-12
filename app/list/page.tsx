"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import { useMemberStore, Member } from "@/store/memberStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { getMembersApi, updateMemberApi, deleteMemberApi, getMemberMeasurementsApi, MeasurementSessionsByDate, MeasurementSession, MeasurementResult } from "@/lib/api";
import EvaluationModal from "@/components/EvaluationModal";

export default function ListPage() {
  const router = useRouter();
  const { getEffectiveAuth, isDevMode } = useAuthStore();
  const { members, removeMember, updateMember, setMembers } = useMemberStore();

  // [1] mounted 패턴 강제 적용
  const [mounted, setMounted] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [gymId, setGymId] = useState<number | null>(null);

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [injuries, setInjuries] = useState<string[]>([]);
  const [showInjuryToggle, setShowInjuryToggle] = useState(false);
  const [showMoreInjuries, setShowMoreInjuries] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<Member | null>(null);
  const [sessionsByDate, setSessionsByDate] = useState<MeasurementSessionsByDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<MeasurementSession | null>(null);
  const [selectedResults, setSelectedResults] = useState<MeasurementResult[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // [5] null-safe 처리: 검색어에 따라 회원 필터링 (모든 Hook은 early return 전에 선언)
  const filteredMembers = useMemo(() => {
    if (!members || !Array.isArray(members)) {
      return [];
    }
    if (!searchQuery) {
      return members;
    }
    return members.filter((member) => {
      if (!member || !member.name) return false;
      return member.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [members, searchQuery]);

  // [2] mounted 패턴 강제 적용
  useEffect(() => {
    console.log("=== ListPage 마운트 시작 ===");
    setMounted(true);

    // mounted 후에만 인증 상태 확인
    if (typeof window !== "undefined") {
      try {
        const token = sessionStorage.getItem("accessToken");
        console.log("mounted:", true);
        console.log("accessToken:", token ? token.substring(0, 20) + "..." : "없음");

        setAccessToken(token);

        const auth = getEffectiveAuth();
        const currentDevMode = isDevMode();

        console.log("isLoggedIn:", auth.isLoggedIn);
        console.log("devMode:", currentDevMode);
        console.log("gymId:", auth.gymId);

        setIsLoggedIn(auth.isLoggedIn);
        setDevMode(currentDevMode);
        setGymId(auth.gymId);
      } catch (error) {
        console.error("인증 상태 확인 실패:", error);
        setIsLoggedIn(false);
        setDevMode(false);
        setGymId(null);
      }
    }
  }, []);

  // 로그인 체크 (개발 모드에서는 우회)
  useEffect(() => {
    if (!mounted) return;

    try {
      if (!isLoggedIn && !devMode) {
        console.log("로그인되지 않음 → 로그인 페이지로 이동");
        router.push("/login");
      }
    } catch (error) {
      console.error("로그인 체크 실패:", error);
      router.push("/login");
    }
  }, [mounted, isLoggedIn, devMode, router]);

  // [4] 회원 목록 조회 함수 - API 호출 전 필수 값 체크 강화
  const fetchMembers = async () => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === "undefined" || !mounted) {
      console.warn("fetchMembers: 클라이언트 사이드가 아니거나 mounted되지 않음");
      return;
    }

    // [4] 필수 값 체크 - early return
    if (!accessToken && !devMode) {
      console.warn("accessToken 없음 → API 호출 중단");
      console.log("accessToken:", accessToken);
      console.log("devMode:", devMode);
      setMembers([]);
      return;
    }

    if (!gymId && !devMode) {
      console.warn("gymId 없음 → API 호출 중단");
      console.log("gymId:", gymId);
      console.log("devMode:", devMode);
      setMembers([]);
      return;
    }

    if (!isLoggedIn && !devMode) {
      console.warn("로그인되지 않음 → API 호출 중단");
      console.log("isLoggedIn:", isLoggedIn);
      console.log("devMode:", devMode);
      return;
    }

    console.log("=== 회원 목록 조회 시작 ===");
    console.log("mounted:", mounted);
    console.log("accessToken:", accessToken ? accessToken.substring(0, 20) + "..." : "없음");
    console.log("gymId:", gymId);
    console.log("isLoggedIn:", isLoggedIn);
    console.log("devMode:", devMode);

    setIsLoading(true);

    try {
      // gymId는 JWT 토큰에서 서버가 자동으로 추출하므로 파라미터로 전달하지 않음
      console.log("GET /members API 호출 시작");
      const response = await getMembersApi();
      console.log("회원 목록 조회 응답:", response);

      // 응답 구조에 따라 배열 추출
      let membersArray: any[] = [];

      // response.data가 배열인 경우 (NestJS 표준 응답 형식)
      if (response.data && Array.isArray(response.data)) {
        membersArray = response.data;
      }
      // response.members가 배열인 경우
      else if (response.members && Array.isArray(response.members)) {
        membersArray = response.members;
      }
      // response 자체가 배열인 경우
      else if (Array.isArray(response)) {
        membersArray = response;
      }

      // 백엔드 응답을 프론트엔드 Member 형식으로 변환
      if (Array.isArray(membersArray)) {
        const convertedMembers: Member[] = membersArray
          .filter((member: any) => member != null) // null/undefined 필터링
          .map((member: any) => {
            // [5] null-safe 처리
            const height = member?.height != null ? (typeof member.height === "string" ? parseFloat(member.height) : member.height) || 0 : 0;
            const weight = member?.weight != null ? (typeof member.weight === "string" ? parseFloat(member.weight) : member.weight) || 0 : 0;

            // createdAt 처리 (mounted 후에만 Date 객체 사용)
            let createdAt: string;
            if (member?.createdAt) {
              if (typeof member.createdAt === "string") {
                createdAt = member.createdAt;
              } else {
                try {
                  createdAt = new Date(member.createdAt).toISOString();
                } catch {
                  createdAt = new Date().toISOString();
                }
              }
            } else {
              createdAt = new Date().toISOString();
            }

            return {
              id: member?.id?.toString() || `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: member?.name || "",
              gender: member?.gender === "M" ? "male" : "female",
              age: member?.age != null ? (typeof member.age === "number" ? member.age : parseInt(String(member.age) || "0", 10)) : 0,
              height: height,
              weight: weight,
              notes: member?.notes || undefined,
              createdAt: createdAt,
            };
          });
        console.log("변환된 회원 수:", convertedMembers.length);
        setMembers(convertedMembers);
      } else {
        console.warn("회원 목록이 배열이 아닙니다:", response);
        setMembers([]);
      }
    } catch (error: any) {
      console.error("회원 목록 조회 실패:", error);
      console.error("에러 상세:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      // 에러 발생 시 빈 배열로 설정
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // [3] 회원 목록 조회 (mounted + accessToken + gymId 준비되기 전엔 절대 API 호출 금지)
  useEffect(() => {
    if (!mounted) {
      console.log("회원 목록 조회: mounted되지 않음");
      return;
    }

    // [4] 필수 값 체크
    if (!accessToken && !devMode) {
      console.log("회원 목록 조회: accessToken 없음");
      return;
    }

    if (!gymId && !devMode) {
      console.log("회원 목록 조회: gymId 없음");
      return;
    }

    if (!isLoggedIn && !devMode) {
      console.log("회원 목록 조회: 로그인되지 않음");
      return;
    }

    console.log("회원 목록 조회 조건 충족 → API 호출");
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, accessToken, gymId, isLoggedIn, devMode]);

  // 로그인하지 않은 경우 아무것도 렌더링하지 않음 (개발 모드 제외)
  // mounted 체크 후에만 실행
  if (mounted && !isLoggedIn && !devMode) {
    return null;
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} 회원의 정보를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 백엔드에서 숫자 ID 추출 (id가 "member_xxx" 형식일 수도 있으므로)
      const numericId = id.includes("member_") ? null : parseInt(id, 10);

      if (numericId && !isNaN(numericId)) {
        await deleteMemberApi(numericId);
        if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
          console.log("회원 삭제 성공");
        }
      } else {
        // 로컬 스토어에서만 삭제 (백엔드에 없는 데이터)
        removeMember(id);
      }

      // 목록 다시 불러오기
      await fetchMembers();
    } catch (error: any) {
      if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
        console.error("회원 삭제 실패:", error);
      }
      alert(`회원 삭제 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember({ ...member });
    // 기존 특이사항을 배열로 변환
    if (member.notes) {
      setInjuries(member.notes.split(", "));
      // 특이사항이 있으면 바로 체크박스 표시
      setShowInjuryToggle(true);
    } else {
      setInjuries([]);
      // 특이사항이 없으면 "+ 추가하기" 버튼 표시
      setShowInjuryToggle(false);
    }
  };

  const handleCloseModal = () => {
    setEditingMember(null);
    setInjuries([]);
    setShowInjuryToggle(false);
    setShowMoreInjuries(false);
  };

  const handleInjuryChange = (injury: string) => {
    setInjuries((prev) => {
      if (prev.includes(injury)) {
        return prev.filter((item) => item !== injury);
      } else {
        return [...prev, injury];
      }
    });
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const gender = formData.get("gender") as "male" | "female";
      const ageStr = formData.get("age") as string;
      const heightStr = formData.get("height") as string;
      const weightStr = formData.get("weight") as string;

      // 유효성 검사
      if (!name || !gender || !ageStr || !heightStr || !weightStr) {
        alert("모든 필드를 입력해주세요.");
        setIsSubmitting(false);
        return;
      }

      const age = parseInt(ageStr, 10);
      const height = parseFloat(heightStr);
      const weight = parseFloat(weightStr);

      if (isNaN(age) || isNaN(height) || isNaN(weight)) {
        alert("나이, 키, 몸무게는 올바른 숫자여야 합니다.");
        setIsSubmitting(false);
        return;
      }

      if (age <= 0 || age > 150) {
        alert("나이는 1 이상 150 이하여야 합니다.");
        setIsSubmitting(false);
        return;
      }

      if (height <= 0 || weight <= 0) {
        alert("나이, 키, 몸무게는 0보다 큰 값을 입력해주세요.");
        setIsSubmitting(false);
        return;
      }

      // 부상 부위를 notes로 변환 (모든 체크를 해제했을 때도 null로 명시적으로 전송)
      const notes = injuries.length > 0 ? injuries.join(", ") : null;

      // gender 변환: "male" -> "M", "female" -> "F"
      const genderCode: "M" | "F" = gender === "male" ? "M" : "F";

      // 백엔드에서 숫자 ID 추출
      const numericId = editingMember.id.includes("member_") ? null : parseInt(editingMember.id, 10);

      if (numericId && !isNaN(numericId)) {
        // 백엔드 API 호출
        const updateData = {
          name: name.trim(),
          gender: genderCode,
          age: age,
          height: Number(height.toFixed(1)),
          weight: Number(weight.toFixed(1)),
          notes: notes, // null 또는 문자열 (항상 명시적으로 전송)
        };

        await updateMemberApi(numericId, updateData);
        if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
          console.log("회원 수정 성공");
        }
      } else {
        // 로컬 스토어에서만 업데이트 (백엔드에 없는 데이터)
        updateMember(editingMember.id, {
          name,
          gender,
          age,
          height,
          weight,
          notes: notes || undefined, // null을 undefined로 변환 (로컬 스토어는 undefined 사용)
        });
      }

      // 목록 다시 불러오기
      await fetchMembers();

      // 모달 닫기
      setEditingMember(null);
      setInjuries([]);
      setShowInjuryToggle(false);
      setShowMoreInjuries(false);
    } catch (error: any) {
      if (process.env.NEXT_PUBLIC_APP_ENV === "development" || process.env.NODE_ENV === "development") {
        console.error("회원 수정 실패:", error);
      }
      alert(`회원 수정 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(members, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `members_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewHistory = async (member: Member) => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === "undefined") return;

    setSelectedMemberForHistory(member);
    setShowHistoryModal(true);
    setIsLoadingHistory(true);
    setHistoryError(null);
    setSessionsByDate([]);
    setSelectedDate("");
    setSelectedSession(null);
    setSelectedResults([]);

    try {
      // accessToken 체크
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        console.warn("accessToken 없음 → API 호출 중단");
        setHistoryError("로그인이 필요합니다. 다시 로그인해주세요.");
        setIsLoadingHistory(false);
        return;
      }

      // memberId를 숫자로 변환
      const numericId = member.id.includes("member_") ? null : parseInt(member.id, 10);

      if (!numericId || isNaN(numericId)) {
        setHistoryError("회원 ID가 유효하지 않습니다.");
        setIsLoadingHistory(false);
        return;
      }

      console.log("=== 측정 이력 조회 시작 ===");
      console.log("memberId:", numericId);
      console.log("accessToken:", accessToken ? accessToken.substring(0, 20) + "..." : "없음");

      const response = await getMemberMeasurementsApi(numericId);

      // 응답 데이터 구조 확인
      console.log("응답 데이터:", response);
      console.log("response.data:", response.data);
      console.log("response.data?.sessionsByDate:", response.data?.sessionsByDate);

      // 백엔드 응답 구조에 맞게 처리
      let sessions: MeasurementSessionsByDate[] = [];

      // 응답이 data.sessionsByDate 형태인 경우
      if (response.data?.sessionsByDate) {
        sessions = response.data.sessionsByDate;
      }
      // 응답이 직접 sessionsByDate인 경우
      else if ((response as any).sessionsByDate) {
        sessions = (response as any).sessionsByDate;
      }

      console.log("최종 sessions:", sessions);
      setSessionsByDate(sessions);
    } catch (error: any) {
      console.error("측정 이력 조회 실패:", error);

      let errorMessage = "측정 이력 조회 중 오류가 발생했습니다.";

      if (error.code === "ECONNABORTED") {
        errorMessage = "요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.";
      } else if (error.message?.includes("accessToken")) {
        errorMessage = "로그인이 필요합니다. 다시 로그인해주세요.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setHistoryError(errorMessage);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedMemberForHistory(null);
    setSessionsByDate([]);
    setSelectedDate("");
    setSelectedSession(null);
    setSelectedResults([]);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSession(null);
    setSelectedResults([]);
  };

  const handleSelectSession = (session: MeasurementSession) => {
    setSelectedSession(session);
    setSelectedResults(session.results || []);
  };

  const handleCloseEvaluation = () => {
    setSelectedResults([]);
    setSelectedSession(null);
  };

  // 선택한 날짜의 세션 목록 가져오기
  const getSessionsForDate = (date: string): MeasurementSession[] => {
    const dateGroup = sessionsByDate.find((d) => d.date === date);
    return dateGroup?.sessions || [];
  };

  // 측정 시간 포맷팅 (mounted 후에만 실행)
  const formatMeasurementTime = (isoDate: string): string => {
    if (!mounted || typeof window === "undefined") return "";
    try {
      const date = new Date(isoDate);
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // 날짜 포맷팅 (mounted 후에만 실행)
  const formatDate = (dateStr: string): string => {
    if (!mounted || typeof window === "undefined") return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="badge">MEMBERS</div>
        <h1 className="section-title mt-3">회원 목록</h1>
        <p className="section-subtitle">등록된 모든 회원 정보를 조회하고 관리합니다.</p>
      </div>

      {isLoading ? (
        <div className="card-surface shadow-soft p-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-extrabold text-surface-900 mb-2">회원 정보를 불러오는 중...</h2>
            <p className="text-sm text-surface-600">잠시만 기다려주세요.</p>
          </div>
        </div>
      ) : !members || !Array.isArray(members) || members.length === 0 ? (
        <div className="card-surface shadow-soft p-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-extrabold text-surface-900 mb-2">등록된 회원이 없습니다</h2>
            <p className="text-sm text-surface-600">회원 등록 페이지에서 새로운 회원을 등록해주세요.</p>
          </div>
        </div>
      ) : (
        <div className="card-surface shadow-soft p-6">
          <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1 min-w-[300px]">
              <h2 className="text-lg font-extrabold text-surface-900 whitespace-nowrap">
                총 {filteredMembers?.length || 0}명의 회원
                {searchQuery && ` (검색 결과: ${filteredMembers?.length || 0}명)`}
              </h2>
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="회원 이름으로 검색..."
                    className="w-full border border-surface-200 rounded-xl px-4 py-2.5 pl-10 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 text-sm bg-white placeholder:text-surface-400"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400">⌕</span>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-surface-400 hover:text-surface-600">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleExport} className="btn-secondary text-sm whitespace-nowrap">
              데이터 내보내기 (JSON)
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table-basic">
              <thead>
                <tr>
                  <th className="table-th">이름</th>
                  <th className="table-th">성별</th>
                  <th className="table-th">나이</th>
                  <th className="table-th">키(cm)</th>
                  <th className="table-th">몸무게(kg)</th>
                  <th className="table-th">특이사항</th>
                  <th className="table-th">등록일</th>
                  <th className="table-th">관리</th>
                </tr>
              </thead>
              <tbody>
                {!filteredMembers || filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-surface-600">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    // [5] null-safe 처리
                    if (!member) return null;
                    return (
                      <tr key={member.id} className="hover:bg-surface-50">
                        <td className="table-td font-semibold text-surface-900">{member?.name || "-"}</td>
                        <td className="table-td text-surface-700">{member?.gender === "male" ? "남" : "여"}</td>
                        <td className="table-td text-surface-700">{member?.age || 0}세</td>
                        <td className="table-td text-surface-700">{member?.height || 0}cm</td>
                        <td className="table-td text-surface-700">{member?.weight || 0}kg</td>
                        <td className="table-td text-surface-700 max-w-[200px]">
                          <div className="truncate" title={member?.notes || "-"}>
                            {member?.notes || "-"}
                          </div>
                        </td>
                        <td className="table-td text-surface-500">
                          {mounted && typeof window !== "undefined" && member?.createdAt
                            ? (() => {
                                try {
                                  return new Date(member.createdAt).toLocaleDateString("ko-KR");
                                } catch {
                                  return member.createdAt;
                                }
                              })()
                            : member?.createdAt || "-"}
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-3">
                            <button onClick={() => member && handleViewHistory(member)} className="text-brand-700 hover:text-brand-800 font-semibold text-sm" disabled={!member}>
                              측정이력
                            </button>
                            <button onClick={() => member && handleEdit(member)} className="text-surface-700 hover:text-surface-900 font-semibold text-sm" disabled={!member}>
                              수정
                            </button>
                            <button onClick={() => member && handleDelete(member.id, member.name || "")} className="text-red-600 hover:text-red-800 font-semibold text-sm" disabled={!member}>
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-surface-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-surface-900">회원정보 수정</h2>
              <button onClick={handleCloseModal} className="text-surface-400 hover:text-surface-600 text-2xl">
                ×
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="form-label" htmlFor="edit-name">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-name"
                  name="name"
                  type="text"
                  required
                  defaultValue={editingMember.name}
                  className="form-input"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="edit-gender">
                  성별 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-5">
                  <label className="inline-flex items-center">
                    <input type="radio" name="gender" value="male" required defaultChecked={editingMember.gender === "male"} className="form-radio" />
                    <span className="ml-2 text-sm font-semibold text-surface-800">남</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" name="gender" value="female" required defaultChecked={editingMember.gender === "female"} className="form-radio" />
                    <span className="ml-2 text-sm font-semibold text-surface-800">여</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="edit-age">
                  나이 <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-age"
                  name="age"
                  type="number"
                  min="1"
                  required
                  defaultValue={editingMember.age}
                  className="form-input"
                  placeholder="나이를 입력하세요"
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="edit-height">
                  키(cm) <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-height"
                  name="height"
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  defaultValue={editingMember.height}
                  className="form-input"
                  placeholder="키를 입력하세요"
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="edit-weight">
                  몸무게(kg) <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-weight"
                  name="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  defaultValue={editingMember.weight}
                  className="form-input"
                  placeholder="몸무게를 입력하세요"
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">특이사항 (부상)</label>

                {!showInjuryToggle ? (
                  <button
                    type="button"
                    onClick={() => setShowInjuryToggle(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    + 추가하기
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* 주요 부상 부위 */}
                    <div className="flex flex-wrap gap-3">
                      {["무릎", "발목", "어깨", "허리", "손목", "목"].map((injury) => (
                        <label key={injury} className="inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={injuries.includes(injury)} onChange={() => handleInjuryChange(injury)} className="form-checkbox text-blue-600 rounded" />
                          <span className="ml-2 text-gray-700 text-sm">{injury}</span>
                        </label>
                      ))}
                    </div>

                    {/* 더보기 버튼 */}
                    <button
                      type="button"
                      className="text-blue-600 text-sm font-medium focus:outline-none hover:underline transition-all duration-300"
                      onClick={() => setShowMoreInjuries((prev) => !prev)}
                    >
                      {showMoreInjuries ? "숨기기 ▲" : "+ 더보기 ▼"}
                    </button>

                    {/* 추가 부상 부위 */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showMoreInjuries ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
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
                            <input type="checkbox" checked={injuries.includes(injury)} onChange={() => handleInjuryChange(injury)} className="form-checkbox text-blue-600 rounded" />
                            <span className="ml-2 text-gray-700 text-sm">{injury}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 btn-secondary">
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 측정 이력 모달 */}
      {showHistoryModal && selectedMemberForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">{selectedMemberForHistory.name}님의 측정 이력</h2>
              <button onClick={handleCloseHistoryModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {isLoadingHistory ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl mb-3 block animate-spin">⏳</span>
                  <p>측정 이력을 불러오는 중...</p>
                  <p className="text-sm mt-2">잠시만 기다려주세요...</p>
                </div>
              ) : historyError ? (
                <div className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <span className="text-4xl mb-3 block">❌</span>
                    <p className="text-red-800 font-medium">{historyError}</p>
                  </div>
                  <button
                    onClick={() => selectedMemberForHistory && handleViewHistory(selectedMemberForHistory)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    다시 시도
                  </button>
                </div>
              ) : sessionsByDate.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl mb-3 block">📊</span>
                  <p>측정 이력이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 날짜 선택 */}
                  {!selectedDate ? (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-3">측정 날짜 선택</h3>
                      <div className="space-y-2">
                        {sessionsByDate.map((dateGroup) => (
                          <button
                            key={dateGroup.date}
                            onClick={() => handleSelectDate(dateGroup.date)}
                            className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-4 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-800">{formatDate(dateGroup.date)}</div>
                                <div className="text-sm text-gray-600 mt-1">{dateGroup.sessions.length}개의 측정 세션</div>
                              </div>
                              <div className="text-blue-500 font-medium">선택 →</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 뒤로가기 버튼 */}
                      <button
                        onClick={() => {
                          setSelectedDate("");
                          setSelectedSession(null);
                          setSelectedResults([]);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium mb-4 flex items-center gap-2"
                      >
                        <span>←</span>
                        <span>날짜 목록으로 돌아가기</span>
                      </button>

                      {/* 측정 시간 선택 */}
                      {!selectedSession ? (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-3">{formatDate(selectedDate)} - 측정 시간 선택</h3>
                          <div className="space-y-2">
                            {getSessionsForDate(selectedDate).map((session) => (
                              <button
                                key={session.measuredAt}
                                onClick={() => handleSelectSession(session)}
                                className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-4 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold text-gray-800">{formatMeasurementTime(session.measuredAt)}</div>
                                    <div className="text-sm text-gray-600 mt-1">{session.results?.length || 0}개의 측정 항목</div>
                                  </div>
                                  <div className="text-blue-500 font-medium">결과 보기 →</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 과거 측정 결과 EvaluationModal */}
      {selectedResults.length > 0 && selectedMemberForHistory && (
        <EvaluationModal
          results={selectedResults}
          selectedExerciseTypes={[]} // 백엔드에서 운동 타입 정보가 없으므로 빈 배열
          member={{
            name: selectedMemberForHistory.name,
            age: selectedMemberForHistory.age,
            gender: selectedMemberForHistory.gender,
            height: selectedMemberForHistory.height,
            weight: selectedMemberForHistory.weight,
            notes: selectedMemberForHistory.notes,
          }}
          measurementData={null} // 과거 측정은 읽기 전용이므로 measurementData 없음
          onClose={handleCloseEvaluation}
        />
      )}
    </div>
  );
}
