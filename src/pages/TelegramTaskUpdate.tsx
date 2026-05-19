import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_STATUS_LABELS, ALLOWED_TRANSITIONS, type TaskStatus } from "@/lib/taskMeta";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe: {
          user?: {
            username?: string;
          };
        };
        close: () => void;
        ready: () => void;
        expand: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (fn: () => void) => void;
          offClick: (fn: () => void) => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
        };
      };
    };
  }
}

export default function TelegramTaskUpdate() {
  const { taskId } = useParams<{ taskId: string }>();
  const [progress, setProgress] = React.useState<number>(0);
  const [status, setStatus] = React.useState<TaskStatus | "">("");
  const [note, setNote] = React.useState("");
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const taskQuery = useQuery({
    queryKey: ["telegram-task", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, code, progress_pct, status")
        .eq("id", taskId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  React.useEffect(() => {
    if (taskQuery.data) {
      setProgress(taskQuery.data.progress_pct || 0);
      setStatus((taskQuery.data.status as TaskStatus) || "");
    }
  }, [taskQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username;
      
      // If running outside Telegram for testing, we might not have a username
      // In production, the Edge Function will validate this strictly.
      if (!username && process.env.NODE_ENV === 'production') {
        throw new Error("Could not identify Telegram user.");
      }

      const { data, error } = await supabase.functions.invoke("telegram-task-update", {
        body: {
          task_id: taskId,
          progress_pct: progress,
          note: note,
          telegram_username: username || "test_user", // Fallback for dev
        },
      });

      if (error) throw error;
      if (!data.ok) throw new Error(data.error || "Failed to update task");
      return data;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success("Task updated!");
      setTimeout(() => {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.close();
        }
      }, 2000);
    },
    onError: (err: any) => {
      toast.error(err.message || "Update failed");
    },
  });

  if (taskQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading task details...</p>
      </div>
    );
  }

  if (taskQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Error</h2>
        <p className="text-sm text-muted-foreground">Could not load task. It may have been deleted or the link is invalid.</p>
        <Button onClick={() => window.Telegram?.WebApp?.close()}>Close</Button>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4 bg-background">
        <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mb-2">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
        <h2 className="text-2xl font-bold">Success!</h2>
        <p className="text-muted-foreground">Your update has been synced back to DCOS.</p>
        <p className="text-xs text-muted-foreground pt-4">Closing in 2 seconds...</p>
      </div>
    );
  }

  const task = taskQuery.data;

  return (
    <div className="min-h-screen bg-background p-6 pb-24 space-y-8 max-w-md mx-auto">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-tight">
             {task?.code}
           </span>
        </div>
        <h1 className="text-xl font-bold leading-tight">{task?.title}</h1>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Progress Percentage</Label>
          <span className="text-2xl font-black text-primary font-mono">{progress}%</span>
        </div>
        <Slider 
          value={[progress]} 
          onValueChange={(vals) => setProgress(vals[0])}
          max={100}
          step={5}
          className="py-4"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
          <span>Started</span>
          <span>Halfway</span>
          <span>Completed</span>
        </div>
      </section>

      <section className="space-y-3">
        <Label className="text-sm font-semibold">Update Notes</Label>
        <Textarea 
          placeholder="What's the status? Any blockers?" 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[120px] bg-muted/30 border-dashed focus:bg-background transition-colors"
        />
      </section>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10">
        <Button 
          className="w-full h-12 text-base font-bold shadow-lg"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Sync Update to Web"
          )}
        </Button>
      </footer>
    </div>
  );
}
