import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";

export default function NotFoundPage({ message = "お探しのページは見つかりませんでした。" }: { message?: string }) {
  return (
    <div className="container py-16">
      <EmptyState icon={<FileQuestion />} title="ページが見つかりません">
        <p>{message}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/">探すページへ戻る</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
