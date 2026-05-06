
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, 
  Briefcase, 
  FileText, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  ClipboardCheck, 
  TrendingUp,
  Handshake,
  BarChart3,
  Loader2,
  ChevronRight,
  MoreVertical,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Subcontractors() {
  const { activeProject } = useProjects();
  const [loading, setLoading] = React.useState(true);
  const [subcontractors, setSubcontractors] = React.useState<any[]>([]);
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [claims, setClaims] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState("register");

  const [isSubconOpen, setIsSubconOpen] = React.useState(false);
  const [isContractOpen, setIsContractOpen] = React.useState(false);

  const loadData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const [subsRes, contractsRes, claimsRes] = await Promise.all([
        supabase
          .from("subcontractors")
          .select("*")
          .order("company_name", { ascending: true }),
        supabase
          .from("subcontract_contracts")
          .select("*, subcontractors(company_name, specialization)")
          .eq("project_id", activeProject.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("subcontract_claims")
          .select("*, subcontract_contracts(contract_number, subcontractors(company_name))")
          .order("created_at", { ascending: false })
      ]);

      setSubcontractors(subsRes.data || []);
      setContracts(contractsRes.data || []);
      setClaims(claimsRes.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [activeProject]);

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view Subcontractors.</div>;
  }

  const totalCommitted = contracts.reduce((acc, c) => acc + (c.total_value || 0), 0);
  const totalPaid = claims.filter(c => c.status === 'paid').reduce((acc, c) => acc + (c.certified_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Subcontractor Management</h1>
          <p className="text-muted-foreground">Manage project partners, contracts, and progress claims.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSubconOpen} onOpenChange={setIsSubconOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Add Subcontractor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <SubcontractorForm 
                onSuccess={() => {
                  setIsSubconOpen(false);
                  loadData();
                }} 
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isContractOpen} onOpenChange={setIsContractOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary">
                <Plus className="h-4 w-4" /> New Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ContractForm 
                projectId={activeProject.id} 
                subcontractors={subcontractors}
                onSuccess={() => {
                  setIsContractOpen(false);
                  loadData();
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Partners</p>
                <div className="text-2xl font-bold">{subcontractors.length}</div>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Committed</p>
                <div className="text-2xl font-bold">${totalCommitted.toLocaleString()}</div>
              </div>
              <Handshake className="h-8 w-8 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Paid to Date</p>
                <div className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString()}</div>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Pending Claims</p>
                <div className="text-2xl font-bold text-amber-600">
                  {claims.filter(c => c.status === 'submitted').length}
                </div>
              </div>
              <ClipboardCheck className="h-8 w-8 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="register">Partner Register</TabsTrigger>
          <TabsTrigger value="contracts">Contracts Register</TabsTrigger>
          <TabsTrigger value="claims">Progress Claims</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Subcontractor Register</CardTitle>
                <CardDescription>Qualified specialist partners for your project.</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search partners..." className="pl-8 h-9 w-[240px]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {subcontractors.map(sub => (
                  <Card key={sub.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < (sub.rating || 4) ? "text-amber-500 fill-amber-500" : "text-muted"}`} />
                          ))}
                        </div>
                      </div>
                      <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{sub.company_name}</h4>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        {sub.specialization}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="text-[10px] text-muted-foreground">
                          {sub.email || "No email"}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Active Subcontracts</CardTitle>
              <CardDescription>Contracts linked to your project WBS.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-4 font-medium">Contract #</th>
                      <th className="p-4 font-medium">Subcontractor</th>
                      <th className="p-4 font-medium">Subject</th>
                      <th className="p-4 font-medium">Total Value</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {contracts.map(c => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-primary">{c.contract_number}</td>
                        <td className="p-4">
                          <div className="font-semibold">{c.subcontractors?.company_name}</div>
                          <div className="text-[10px] text-muted-foreground">{c.subcontractors?.specialization}</div>
                        </td>
                        <td className="p-4 font-medium">{c.subject}</td>
                        <td className="p-4 font-bold">${(c.total_value || 0).toLocaleString()}</td>
                        <td className="p-4">
                          <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                            {c.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" className="h-8 gap-1">
                            Manage <ChevronRight className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function SubcontractorForm({ onSuccess }: any) {
  const [submitting, setSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    company_name: "",
    specialization: "",
    contact_person: "",
    email: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("subcontractors").insert(formData);
      if (error) throw error;
      toast.success("Subcontractor registered successfully");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Add Subcontractor</DialogTitle>
        <CardDescription>Register a new project partner.</CardDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label>Company Name</Label>
        <Input required value={formData.company_name} onChange={e => setFormData(p => ({...p, company_name: e.target.value}))} />
      </div>

      <div className="space-y-2">
        <Label>Specialization</Label>
        <Select value={formData.specialization} onValueChange={v => setFormData(p => ({...p, specialization: v}))}>
          <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Structural">Structural (Civil)</SelectItem>
            <SelectItem value="Architectural">Architectural / Finishes</SelectItem>
            <SelectItem value="Electrical">Electrical (MEP)</SelectItem>
            <SelectItem value="Plumbing">Plumbing / HVAC</SelectItem>
            <SelectItem value="Landscaping">Landscaping</SelectItem>
            <SelectItem value="Other">Other Specialist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Contact Person</Label>
          <Input value={formData.contact_person} onChange={e => setFormData(p => ({...p, contact_person: e.target.value}))} />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Register Partner"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ContractForm({ projectId, subcontractors, onSuccess }: any) {
  const [submitting, setSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    subcontractor_id: "",
    subject: "",
    total_value: "",
    retention_percentage: "5.0",
    start_date: "",
    end_date: "",
    status: "draft",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { count } = await supabase
        .from("subcontract_contracts")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);
      
      const scNum = `SC-2026-${(count || 0 + 1).toString().padStart(3, '0')}`;

      const { error } = await supabase.from("subcontract_contracts").insert({
        project_id: projectId,
        contract_number: scNum,
        ...formData,
        total_value: parseFloat(formData.total_value),
        retention_percentage: parseFloat(formData.retention_percentage),
      });

      if (error) throw error;
      toast.success(`Contract ${scNum} created successfully`);
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>New Subcontract Contract</DialogTitle>
        <CardDescription>Issue a formal work order to a partner.</CardDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Subcontractor</Label>
          <Select value={formData.subcontractor_id} onValueChange={v => setFormData(p => ({...p, subcontractor_id: v}))}>
            <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
            <SelectContent>
              {subcontractors.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.company_name} ({s.specialization})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-2">
          <Label>Contract Subject</Label>
          <Input required placeholder="e.g. Structural Steel Installation Phase 1" value={formData.subject} onChange={e => setFormData(p => ({...p, subject: e.target.value}))} />
        </div>

        <div className="space-y-2">
          <Label>Total Value ($)</Label>
          <Input required type="number" placeholder="0.00" value={formData.total_value} onChange={e => setFormData(p => ({...p, total_value: e.target.value}))} />
        </div>

        <div className="space-y-2">
          <Label>Retention (%)</Label>
          <Input type="number" value={formData.retention_percentage} onChange={e => setFormData(p => ({...p, retention_percentage: e.target.value}))} />
        </div>

        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={formData.start_date} onChange={e => setFormData(p => ({...p, start_date: e.target.value}))} />
        </div>

        <div className="space-y-2">
          <Label>Estimated End Date</Label>
          <Input type="date" value={formData.end_date} onChange={e => setFormData(p => ({...p, end_date: e.target.value}))} />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting} className="w-full h-11 bg-primary">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Generate Contract"}
        </Button>
      </DialogFooter>
    </form>
  );
}
