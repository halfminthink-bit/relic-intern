/**
 * 認証（モック）。
 * Supabase 接続時は signInWithMagicLink を supabase.auth.signInWithOtp({ email }) に、
 * セッション監視を supabase.auth.onAuthStateChange に置き換える。
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lab, Member } from "@/types/db";
import { getMember } from "@/lib/api";
import { DEMO_MEMBER_ID } from "@/data/mock";

const SESSION_KEY = "labtrail:mock-session";

type CurrentMember = Member & { lab: Lab };

interface AuthContextValue {
  member: CurrentMember | null;
  loading: boolean;
  /** マジックリンクを送信する（モックでは何もしない） */
  signInWithMagicLink: (email: string) => Promise<void>;
  /** デモ用: メールを経由せずにログインする */
  signInAsDemo: () => Promise<void>;
  signOut: () => void;
  /** 研究室の公開設定変更などのあとに再取得する */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const id = localStorage.getItem(SESSION_KEY);
    setMember(id ? await getMember(id) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const value: AuthContextValue = {
    member,
    loading,
    signInWithMagicLink: async () => {
      await new Promise((r) => setTimeout(r, 500));
    },
    signInAsDemo: async () => {
      localStorage.setItem(SESSION_KEY, DEMO_MEMBER_ID);
      await loadSession();
    },
    signOut: () => {
      localStorage.removeItem(SESSION_KEY);
      setMember(null);
    },
    refresh: loadSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth は AuthProvider の内側で使ってください");
  return ctx;
}
