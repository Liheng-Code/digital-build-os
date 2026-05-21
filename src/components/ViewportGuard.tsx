import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Monitor } from "lucide-react";

/**
 * Show a friendly message when the viewport is below 768px.
 * This is a desktop-first construction platform — not a field-worker mobile app.
 */
export function ViewportGuard({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [width, setWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (isMobile && width < 768) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-primary-deep p-8 text-center">
        <div className="rounded-2xl bg-card p-8 shadow-elevated max-w-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
            <Monitor className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            Please use a computer or tablet
          </h1>
          <p className="text-sm text-muted-foreground">
            BuildTrack is a desktop-first construction management platform.
            For the best experience, please open this on a tablet (768px+) or computer.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
