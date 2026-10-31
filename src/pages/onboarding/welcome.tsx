import { Link } from "react-router-dom";
import { ChevronRight, FlaskConical, KeyRound } from "lucide-react";

export default function WelcomePage() {
  return (
    <div>
      <h1 className="text-xl font-bold">ようこそ LabTrail へ</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        記録は研究室ごとに残します。研究室の代表者は研究室を作成し、メンバーは代表者から受け取った参加コードで参加してください。
      </p>
      <div className="mt-6 space-y-3">
        <Choice
          to="/join"
          icon={<KeyRound className="h-5 w-5" />}
          title="参加コードで研究室に参加する"
          description="代表者から受け取ったコード（例：ABCD-2345）を入力します"
        />
        <Choice
          to="/welcome/create-lab"
          icon={<FlaskConical className="h-5 w-5" />}
          title="研究室を作る（代表者）"
          description="研究室を登録すると、メンバーを招く参加コードが発行されます"
        />
      </div>
    </div>
  );
}

function Choice({ to, icon, title, description }: { to: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
