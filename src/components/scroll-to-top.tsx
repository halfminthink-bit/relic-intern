import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** ページ遷移時に先頭へスクロール（#アンカー付きのときは各ページに任せる） */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
