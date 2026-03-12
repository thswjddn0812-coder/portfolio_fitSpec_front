import Link from "next/link";

export default function Home() {
  const quickActions = [
    { path: "/register", title: "회원등록", description: "새 회원 정보를 등록합니다", color: "bg-brand-600" },
    { path: "/measurement", title: "측정/평가", description: "체력/신체 측정 데이터를 기록합니다", color: "bg-surface-900" },
    { path: "/list", title: "회원목록", description: "등록된 회원 정보를 조회/관리합니다", color: "bg-brand-700" },
  ];

  return (
    <div className="space-y-8">
      <section className="card-surface overflow-hidden shadow-soft">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-surface-50" />
          <div className="relative p-8 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-surface-200 px-3 py-1 text-xs font-extrabold tracking-widest text-surface-600">
              SMART FITNESS
              <span className="text-brand-700">FITSPEC</span>
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-surface-900">회원/측정 관리를 한 화면에서</h1>
            <p className="mt-3 text-surface-600 text-base md:text-lg max-w-2xl">
              회원 등록, 측정/평가, 목록 관리를 빠르게 연결해서 운영 효율을 올려보세요.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/measurement" className="btn-primary">
                측정 시작
              </Link>
              <Link href="/register" className="btn-ghost border border-surface-200 bg-white hover:bg-surface-50">
                회원 등록
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.path}
            href={action.path}
            className="group card-surface p-6 hover:shadow-soft transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-extrabold tracking-widest text-white ${action.color}`}>
                  QUICK
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-surface-900 group-hover:text-brand-700 transition-colors">{action.title}</h3>
                <p className="mt-2 text-surface-600 text-sm">{action.description}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-surface-100 border border-surface-200 flex items-center justify-center text-surface-500 group-hover:bg-brand-50 group-hover:text-brand-700 group-hover:border-brand-100 transition-colors">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-surface p-6 lg:col-span-2">
          <h2 className="text-xl font-extrabold text-surface-900">운영 흐름</h2>
          <p className="mt-2 text-surface-600 text-sm">등록 → 측정/평가 → 목록 관리 순서로 업무가 이어집니다.</p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: "1) 회원 등록", desc: "기본 정보/특이사항 입력" },
              { title: "2) 측정/평가", desc: "기록 저장 + 레이더 차트" },
              { title: "3) 목록 관리", desc: "조회/수정/이력 확인" },
            ].map((it) => (
              <div key={it.title} className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                <div className="text-sm font-extrabold text-surface-900">{it.title}</div>
                <div className="mt-1 text-xs text-surface-600">{it.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-xl font-extrabold text-surface-900">바로가기</h2>
          <div className="mt-4 space-y-2">
            <Link href="/measurement" className="flex items-center justify-between rounded-2xl border border-surface-200 px-4 py-3 hover:bg-surface-50 transition-colors">
              <span className="text-sm font-semibold text-surface-800">측정/평가</span>
              <span className="text-surface-400 font-bold">›</span>
            </Link>
            <Link href="/register" className="flex items-center justify-between rounded-2xl border border-surface-200 px-4 py-3 hover:bg-surface-50 transition-colors">
              <span className="text-sm font-semibold text-surface-800">회원등록</span>
              <span className="text-surface-400 font-bold">›</span>
            </Link>
            <Link href="/list" className="flex items-center justify-between rounded-2xl border border-surface-200 px-4 py-3 hover:bg-surface-50 transition-colors">
              <span className="text-sm font-semibold text-surface-800">회원목록</span>
              <span className="text-surface-400 font-bold">›</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
