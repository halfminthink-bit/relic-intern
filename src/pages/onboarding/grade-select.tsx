import { GRADES, type Grade } from "@/types/db";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";

export function GradeSelect({ value, onChange }: { value: Grade | ""; onChange: (g: Grade) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="grade">あなたの学年</Label>
      <NativeSelect id="grade" required value={value} onChange={(e) => onChange(e.target.value as Grade)}>
        <option value="" disabled>
          選択してください
        </option>
        {GRADES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </NativeSelect>
      <p className="text-xs text-muted-foreground">外部には学年だけが表示され、名前は出ません。</p>
    </div>
  );
}
