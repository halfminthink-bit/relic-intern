import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { Compass, FolderGit2, Inbox, LogOut, PenLine } from "lucide-react";
import { Logo } from "@/components/logo";
import { LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/app/themes", label: "マイテーマ", icon: FolderGit2 },
  { to: "/app/new", label: "記録する", icon: PenLine, primary: true },
  { to: "/app/consults", label: "相談", icon: Inbox },
  { to: "/", label: "探す", icon: Compass },
];

/** メンバー向け画面の枠。スマホでは下部タブ、PCでは上部ナビ */
export function MemberLayout() {
  const { member, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState />;
  if (!member) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container flex h-14 items-center gap-4">
          <Logo to="/app/themes" />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.filter((n) => !n.primary).map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
                    isActive && n.to !== "/" && "bg-secondary font-medium text-foreground",
                  )
                }
              >
                <n.icon className="h-4 w-4" aria-hidden />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right text-xs leading-tight sm:block">
              <div className="font-medium">{member.lab.name}</div>
              <div className="text-muted-foreground">{member.grade}</div>
            </div>
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link to="/app/new">
                <PenLine />
                記録する
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="ログアウト" title="ログアウト">
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* スマホ用の下部タブ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur pb-safe md:hidden" aria-label="メインメニュー">
        <ul className="grid grid-cols-4">
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground",
                    isActive && n.to !== "/" && "text-primary font-medium",
                  )
                }
              >
                {n.primary ? (
                  <span className="-mt-5 mb-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-background">
                    <n.icon className="h-5 w-5" aria-hidden />
                  </span>
                ) : (
                  <n.icon className="h-5 w-5" aria-hidden />
                )}
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
