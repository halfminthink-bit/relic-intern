/**
 * モック用の画像プレースホルダ（SVG の data URI）。
 * 外部の画像サービスに依存せず、オフラインでも表示できるようにしている。
 */
export function placeholderImage(label: string, hue = 176, variant: "micro" | "spectrum" | "photo" = "photo") {
  const bg = `hsl(${hue} 22% 90%)`;
  const fg = `hsl(${hue} 35% 30%)`;
  let motif = "";
  if (variant === "spectrum") {
    motif = `<polyline fill="none" stroke="${fg}" stroke-width="3" points="40,250 120,248 170,240 200,120 215,245 300,238 340,200 360,90 380,236 470,240 520,180 540,245 600,250"/>
      <line x1="40" y1="260" x2="600" y2="260" stroke="${fg}" stroke-opacity=".5"/>`;
  } else if (variant === "micro") {
    motif = Array.from({ length: 14 }, (_, i) => {
      const x = 40 + ((i * 97) % 560);
      const y = 60 + ((i * 53) % 200);
      return `<path d="M${x} ${y} q 40 ${i % 2 ? 30 : -30} 90 ${i % 3 ? 10 : -20}" stroke="${fg}" stroke-opacity=".55" stroke-width="3" fill="none"/>`;
    }).join("");
  } else {
    motif = `<rect x="230" y="70" width="180" height="180" rx="14" fill="${fg}" fill-opacity=".12" stroke="${fg}" stroke-opacity=".4"/>
      <circle cx="320" cy="160" r="46" fill="${fg}" fill-opacity=".25"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <rect width="640" height="360" fill="${bg}"/>${motif}
    <text x="24" y="336" font-family="sans-serif" font-size="30" font-weight="bold" fill="${fg}">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
