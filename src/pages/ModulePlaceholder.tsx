import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft } from "lucide-react";
import { MODULES } from "@/lib/modules";

export default function ModulePlaceholder() {
  const { pathname } = useLocation();
  const mod = MODULES.find(m => m.to === pathname) ?? MODULES.find(m => pathname.startsWith(m.to + "/")) ?? null;

  useEffect(() => {
    document.title = `${mod?.title ?? "Module"} — DCOS`;
  }, [mod]);

  const Icon = mod?.icon ?? Construction;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card className="p-12 text-center space-y-6 shadow-card relative overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl gradient-primary grid place-items-center shadow-glow">
            <Icon className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-primary mb-2">Module preview</p>
            <h1 className="text-3xl font-bold tracking-tight">{mod?.title ?? "Module"}</h1>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              This module ships in an upcoming iteration. Tell us "build the {mod?.title.toLowerCase()} module"
              when you're ready and we'll deliver it end-to-end.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link to="/"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
