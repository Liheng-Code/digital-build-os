import { supabase } from "@/integrations/supabase/client";
import { QueryFunctionContext } from "@tanstack/react-query";

export interface ProjectBudget {
  id: string;
  project_id: string;
  budget_code: string;
  budget_name: string;
  total_budget: number;
  committed_amount: number;
  spent_amount: number;
  currency?: string;
  fiscal_year?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  budget_line_items?: BudgetLineItem[];
}

export interface BudgetLineItem {
  id: string;
  budget_id: string;
  wbs_node_id?: string;
  cost_code?: string;
  description: string;
  planned_amount: number;
  committed_amount: number;
  actual_amount: number;
  variance: number;
  created_at: string;
}

export interface BudgetCheckResult {
  is_available: boolean;
  available_amount: number;
  budget_total: number;
  committed_total: number;
  spent_total: number;
}

// Fetch all budgets for a project
export const fetchBudgets = async (projectId: string): Promise<ProjectBudget[]> => {
  const { data, error } = await supabase
    .from("project_budgets")
    .select(`
      *,
      budget_line_items(count)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Fetch single budget with details
export const fetchBudgetById = async (budgetId: string): Promise<ProjectBudget> => {
  const { data, error } = await supabase
    .from("project_budgets")
    .select(`
      *,
      budget_line_items(*)
    `)
    .eq("id", budgetId)
    .single();

  if (error) throw error;
  return data;
};

// Create new budget
export const createBudget = async (budget: {
  project_id: string;
  budget_code: string;
  budget_name: string;
  total_budget: number;
  currency?: string;
  fiscal_year?: number;
}): Promise<ProjectBudget> => {
  const { data, error } = await supabase
    .from("project_budgets")
    .insert({
      project_id: budget.project_id,
      budget_code: budget.budget_code,
      budget_name: budget.budget_name,
      total_budget: budget.total_budget,
      currency: budget.currency || 'USD',
      fiscal_year: budget.fiscal_year,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update budget
export const updateBudget = async (id: string, updates: Partial<ProjectBudget>): Promise<ProjectBudget> => {
  const { data, error } = await supabase
    .from("project_budgets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Check budget availability
export const checkBudgetAvailable = async (
  budgetCode: string,
  projectId: string,
  requestedAmount: number
): Promise<BudgetCheckResult> => {
  const { data, error } = await supabase
    .rpc('check_budget_available', {
      p_budget_code: budgetCode,
      p_project_id: projectId,
      p_requested_amount: requestedAmount
    });

  if (error) throw error;
  return data?.[0] || {
    is_available: false,
    available_amount: 0,
    budget_total: 0,
    committed_total: 0,
    spent_total: 0
  };
};

// Create budget line item
export const createBudgetLineItem = async (item: {
  budget_id: string;
  wbs_node_id?: string;
  cost_code?: string;
  description: string;
  planned_amount: number;
}): Promise<BudgetLineItem> => {
  const { data, error } = await supabase
    .from("budget_line_items")
    .insert({
      budget_id: item.budget_id,
      wbs_node_id: item.wbs_node_id || null,
      cost_code: item.cost_code,
      description: item.description,
      planned_amount: item.planned_amount,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Fetch budget codes for dropdown
export const fetchBudgetCodes = async (projectId: string) => {
  const { data, error } = await supabase
    .from("project_budgets")
    .select("id, budget_code, budget_name, total_budget, committed_amount, spent_amount")
    .eq("project_id", projectId)
    .order("budget_code");

  if (error) throw error;
  return data || [];
};
