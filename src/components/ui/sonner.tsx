import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "group border bg-card text-foreground shadow-lg font-sans",
          description: "text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
