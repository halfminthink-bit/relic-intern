import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const NEXT_KEY = "labtrail:onboarding-next";

/** 研究室の作成・参加の直後に移動したい画面を予約する */
export function setNextPath(path: string) {
  sessionStorage.setItem(NEXT_KEY, path);
}

function takeNextPath() {
  const next = sessionStorage.getItem(NEXT_KEY);
  sessionStorage.removeItem(NEXT_KEY);
  return next;
}

/** ログイン済み・研究室に未所属のユーザー向けの枠（研究室の作成／参加） */
export function OnboardingLayout() {
  const { session, member, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  // 研究室の作成・参加が終わったら、各画面が指定した次の画面へ（指定がなければマイテーマ）
  if (member) return <Navigate to={takeNextPath() ?? "/app/themes"} replace />;

  return (
    <div className="flex min-h-dvh flex-col bg-ruled">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="container flex h-14 items-center">
          <Logo to="/welcome" />
          <Button variant="ghost" size="icon" className="ml-auto" onClick={signOut} aria-label="ログアウト" title="ログアウト">
            <LogOut />
          </Button>
        </div>
      </header>
      <main className="container max-w-lg flex-1 py-8 sm:py-12">
        <Outlet />
      </main>
    </div>
  );
}
