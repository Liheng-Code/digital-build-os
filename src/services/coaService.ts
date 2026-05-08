import { supabase } from "@/integrations/supabase/client";
import type { ChartOfAccount, AccountType } from "@/lib/financialMeta";

export const fetchChartOfAccounts = async (): Promise<ChartOfAccount[]> => {
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("*")
    .order("account_code");
  if (error) throw error;
  return (data ?? []) as unknown as ChartOfAccount[];
};

export const fetchActiveAccounts = async (): Promise<ChartOfAccount[]> => {
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("*")
    .eq("is_active", true)
    .order("account_code");
  if (error) throw error;
  return (data ?? []) as unknown as ChartOfAccount[];
};

export const createAccount = async (acct: {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_id?: string;
  description?: string;
}): Promise<ChartOfAccount> => {
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .insert(acct)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ChartOfAccount;
};

export const updateAccount = async (id: string, updates: Partial<ChartOfAccount>): Promise<ChartOfAccount> => {
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ChartOfAccount;
};

export const toggleAccountActive = async (id: string, isActive: boolean): Promise<void> => {
  const { error } = await supabase
    .from("chart_of_accounts")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
};
