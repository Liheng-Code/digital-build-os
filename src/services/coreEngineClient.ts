import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface QueryResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

export interface SingleQueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

export interface QueryBuilder<T> extends PromiseLike<QueryResult<T>> {
  eq(column: string, value: unknown): QueryBuilder<T>;
  in(column: string, values: unknown[]): QueryBuilder<T>;
  is(column: string, value: unknown): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  maybeSingle(): PromiseLike<SingleQueryResult<T>>;
  single(): PromiseLike<SingleQueryResult<T>>;
}

export interface MutationBuilder<T> extends PromiseLike<QueryResult<T>> {
  eq(column: string, value: unknown): MutationBuilder<T>;
  select(columns?: string): MutationBuilder<T>;
  single(): PromiseLike<SingleQueryResult<T>>;
}

export interface DbTable<T> {
  select(columns: string): QueryBuilder<T>;
  insert(payload: Partial<T> | Partial<T>[]): MutationBuilder<T>;
  update(payload: Partial<T>): MutationBuilder<T>;
}

export interface CoreDbClient {
  from<T>(table: string): DbTable<T>;
  rpc<T>(fn: string, args?: Record<string, unknown>): PromiseLike<SingleQueryResult<T>>;
}

export type JsonRecord = Record<string, Json | undefined>;

export const coreDb = supabase as unknown as CoreDbClient;
