import { Link, NavLink, Outlet } from "react-router-dom";
import { PenLine, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function PublicLayout() {
  const { member } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container flex h-14 items-center gap-4">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn("rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground", isActive && "text-foreground font-medium")
              }
            >
              探す
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="sm:hidden">
              <Link to="/" aria-label="探す">
                <Search />
              </Link>
            </Button>
            {member ? (
              <>
                <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                  <Link to="/app/themes">マイテーマ</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/app/new">
                    <PenLine />
                    記録する
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link to="/login">メンバーログイン</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-16 border-t py-8 text-xs text-muted-foreground">
        <div className="container flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>LabTrail — 実験研究の経過を残し、研究室の外とつながる</span>
          <span>掲載中の研究室・テーマ・記録はすべて架空のサンプルです</span>
        </div>
      </footer>
    </div>
  );
}
