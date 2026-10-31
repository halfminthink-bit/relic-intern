import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { PublicLayout } from "@/components/layout/public-layout";
import { MemberLayout } from "@/components/layout/member-layout";
import ExplorePage from "@/pages/explore";
import LabPage from "@/pages/lab";
import ThemePage from "@/pages/theme";
import LoginPage from "@/pages/login";
import NotFoundPage from "@/pages/not-found";
import QuickPostPage from "@/pages/member/quick-post";
import MyThemesPage from "@/pages/member/my-themes";
import MyThemeDetailPage from "@/pages/member/my-theme-detail";
import ConsultsPage from "@/pages/member/consults";
import MyLabPage from "@/pages/member/my-lab";
import NewThemePage from "@/pages/member/new-theme";
import { OnboardingLayout } from "@/pages/onboarding/onboarding-layout";
import WelcomePage from "@/pages/onboarding/welcome";
import CreateLabPage from "@/pages/onboarding/create-lab";
import JoinLabPage from "@/pages/onboarding/join";
import { ScrollToTop } from "@/components/scroll-to-top";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* 外部向け（ログイン不要） */}
          <Route element={<PublicLayout />}>
            <Route index element={<ExplorePage />} />
            <Route path="labs/:slug" element={<LabPage />} />
            <Route path="labs/:slug/themes/:themeId" element={<ThemePage />} />
          </Route>
          <Route path="login" element={<LoginPage />} />

          {/* ログイン済み・研究室に未所属: 研究室を作る（代表者）／参加コードで参加 */}
          <Route element={<OnboardingLayout />}>
            <Route path="welcome" element={<WelcomePage />} />
            <Route path="welcome/create-lab" element={<CreateLabPage />} />
            <Route path="join" element={<JoinLabPage />} />
            <Route path="join/:code" element={<JoinLabPage />} />
          </Route>

          {/* メンバー向け（ログイン後） */}
          <Route path="app" element={<MemberLayout />}>
            <Route index element={<Navigate to="themes" replace />} />
            <Route path="new" element={<QuickPostPage />} />
            <Route path="themes" element={<MyThemesPage />} />
            <Route path="themes/new" element={<NewThemePage />} />
            <Route path="lab" element={<MyLabPage />} />
            <Route path="themes/:themeId" element={<MyThemeDetailPage />} />
            <Route path="consults" element={<ConsultsPage />} />
          </Route>

          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  );
}
