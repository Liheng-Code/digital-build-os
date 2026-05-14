import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchEmployees, type Employee } from "@/services/employeeService";
import { DEPARTMENT_LABELS, DEPARTMENT_TONE, type Department } from "@/lib/departmentMeta";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, ChevronDown, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddMemberDialog } from "./AddMemberDialog";

export function OrgChart() {
  const [expandedDepts, setExpandedDepts] = React.useState<Set<string>>(new Set());
  const [selectedDept, setSelectedDept] = React.useState<Department | null>(null);
  const [selectedManagerId, setSelectedManagerId] = React.useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });

  const toggleDept = (dept: string) => {
    const next = new Set(expandedDepts);
    if (next.has(dept)) next.delete(dept);
    else next.add(dept);
    setExpandedDepts(next);
  };

  const handleAddMember = (dept: Department | null, managerId: string | null) => {
    setSelectedDept(dept);
    setSelectedManagerId(managerId);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading organization chart...</div>;
  }

  // Group employees by department
  const depts = Object.keys(DEPARTMENT_LABELS) as Department[];
  const employeesByDept = depts.reduce((acc, dept) => {
    acc[dept] = employees.filter(e => e.department === dept);
    return acc;
  }, {} as Record<Department, Employee[]>);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Organizational Hierarchy</h2>
          <p className="text-sm text-muted-foreground">Visualize teams and reporting lines</p>
        </div>
        <Button onClick={() => handleAddMember(null, null)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </div>

      <div className="grid gap-6">
        {depts.map((dept) => {
          const deptEmployees = employeesByDept[dept];
          const isExpanded = expandedDepts.has(dept);
          const tone = DEPARTMENT_TONE[dept];

          return (
            <div key={dept} className="space-y-4">
              <div 
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                  tone.bg,
                  "border-opacity-20"
                )}
                onClick={() => toggleDept(dept)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full bg-white bg-opacity-50")}>
                    <Users className={cn("h-5 w-5", tone.fg)} />
                  </div>
                  <div>
                    <h3 className={cn("font-bold text-lg", tone.fg)}>
                      {DEPARTMENT_LABELS[dept]} Team
                    </h3>
                    <p className="text-xs opacity-80">{deptEmployees.length} members</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-white/20" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMember(dept, null);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
              </div>

              {isExpanded && (
                <div className="pl-8 border-l-2 border-dashed border-muted ml-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  {deptEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">No members in this department yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deptEmployees.map((employee) => (
                        <MemberCard 
                          key={employee.id} 
                          employee={employee} 
                          onAddReport={() => handleAddMember(dept, employee.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddMemberDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        defaultDept={selectedDept}
        defaultManagerId={selectedManagerId}
      />
    </div>
  );
}

function MemberCard({ employee, onAddReport }: { employee: Employee; onAddReport: () => void }) {
  return (
    <Card className="p-4 relative hover:shadow-lg transition-all group overflow-hidden border-l-4 border-l-primary">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
            <AvatarImage src={`https://avatar.vercel.sh/${employee.id}`} />
            <AvatarFallback>{employee.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-sm leading-none mb-1">{employee.full_name}</h4>
            <p className="text-xs text-muted-foreground mb-1">{employee.job_title || "Team Member"}</p>
            <div className="flex items-center gap-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {employee.employee_id || "No ID"}
              </span>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onAddReport}
          title="Add Direct Report"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Visual reporting line indicator if needed */}
      <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground border-t pt-2 border-muted/50">
        <User className="h-3 w-3" />
        {employee.reports_to ? "Has Manager" : "Reports to Head"}
      </div>
    </Card>
  );
}
