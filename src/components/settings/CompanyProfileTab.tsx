
import * as React from "react";
import { useCompany } from "@/hooks/useCompany";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2, Save } from "lucide-react";

export function CompanyProfileTab() {
  const { companyQuery, updateCompany } = useCompany();
  const [formData, setFormData] = React.useState({
    name: "",
    legal_name: "",
    registration_number: "",
    tax_id: "",
    email: "",
    phone: "",
    website: "",
    address: "",
  });

  React.useEffect(() => {
    if (companyQuery.data) {
      setFormData({
        name: companyQuery.data.name || "",
        legal_name: companyQuery.data.legal_name || "",
        registration_number: companyQuery.data.registration_number || "",
        tax_id: companyQuery.data.tax_id || "",
        email: companyQuery.data.email || "",
        phone: companyQuery.data.phone || "",
        website: companyQuery.data.website || "",
        address: companyQuery.data.address || "",
      });
    }
  }, [companyQuery.data]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyQuery.data?.id) return;
    await updateCompany.mutateAsync({
      id: companyQuery.data.id,
      ...formData,
    });
  };

  if (companyQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Identity
        </CardTitle>
        <CardDescription>
          Manage your organization's legal and contact information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name *</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal_name">Legal Entity Name</Label>
              <Input 
                id="legal_name" 
                value={formData.legal_name} 
                onChange={(e) => setFormData(prev => ({ ...prev, legal_name: e.target.value }))}
                placeholder="e.g. Skyline Construction Group Co., Ltd."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_number">Company Registration No.</Label>
              <Input 
                id="registration_number" 
                value={formData.registration_number} 
                onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID / VAT No.</Label>
              <Input 
                id="tax_id" 
                value={formData.tax_id} 
                onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="email">Official Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Official Phone</Label>
              <Input 
                id="phone" 
                value={formData.phone} 
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website" 
                value={formData.website} 
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Registered Office Address</Label>
            <Textarea 
              id="address" 
              value={formData.address} 
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={3} 
            />
          </div>

          <div className="pt-2 border-t">
            <Button type="submit" disabled={updateCompany.isPending}>
              {updateCompany.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Company Profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
