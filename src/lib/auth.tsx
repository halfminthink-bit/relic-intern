/**
 * 認証（モック）。
 * Supabase 接続時は signInWithMagicLink を supabase.auth.signInWithOtp({ email }) に、
 * セッション監視を supabase.auth.onAuthStateChange に置き換える。
 *
 * 「ログインしている（session あり）」と「研究室に所属している（member あり）」は別。
 * 研究室に未所属のユーザーは /welcome で「研究室を作る」か「参加コードで参加する」を選ぶ。
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lab, Member } from "@/types/db";
import { getMember } from "@/lib/api";
import { DEMO_MEMBER_ID } from "@/data/mock";
import { STORAGE_KEYS } from "@/lib/storage";

const SESSION_KEY = STORAGE_KEYS.session;

export interface Session {
  /** Supabase では auth.users.id。members.id と同じ値 */
  userId: string;
  email: string;
}

type CurrentMember = Member & { lab: Lab };

interface AuthContextValue {
  session: Session | null;
  /** 研究室に所属していれば入る */
  member: CurrentMember | null;
  loading: boolean;
  /** マジックリンクを送信する（モックでは何もしない） */
  signInWithMagicLink: (email: string) => Promise<void>;
  /** デモ: 既存の研究室の代表者（M2）としてログイン */
  signInAsDemo: () => Promise<void>;
  /** デモ: まだ研究室に所属していない新規ユーザーとしてログイン */
  signInAsNewUser: () => Promise<void>;
  signOut: () => void;
  /** 研究室の作成・参加のあとに所属情報を読み直す */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s: Session | null) => {
    setMember(s ? await getMember(s.userId) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(session);
  }, [load, session]);

  const start = async (s: Session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setLoading(true);
    await load(s);
    setSession(s);
  };

  const value: AuthContextValue = {
    session,
    member,
    loading,
    signInWithMagicLink: async () => {
      await new Promise((r) => setTimeout(r, 500));
    },
    signInAsDemo: () => start({ userId: DEMO_MEMBER_ID, email: "demo@example.ac.jp" }),
    signInAsNewUser: () => start({ userId: `user-${crypto.randomUUID().slice(0, 8)}`, email: "new@example.ac.jp" }),
    signOut: () => {
      localStorage.removeItem(SESSION_KEY);
      setSession(null);
      setMember(null);
    },
    refresh: () => load(session),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth は AuthProvider の内側で使ってください");
  return ctx;
}
