import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function CopyButton({ text, label = "コピー", ...props }: { text: string; label?: string } & ButtonProps) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          /* クリップボードが使えない環境では何もしない */
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      {...props}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? "コピーしました" : label}
    </Button>
  );
}
