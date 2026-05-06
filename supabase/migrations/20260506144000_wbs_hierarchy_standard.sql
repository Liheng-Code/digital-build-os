
-- ============================================================
-- WBS HIERARCHY STANDARDIZATION (ENUM FIX)
-- ============================================================

-- 1. Add new values to the existing Enum type
-- Note: ALTER TYPE ... ADD VALUE cannot be rolled back easily in some environments,
-- but is the standard way to extend Enums in Postgres.
ALTER TYPE public.wbs_node_type ADD VALUE IF NOT EXISTS 'room';
ALTER TYPE public.wbs_node_type ADD VALUE IF NOT EXISTS 'element';

-- 2. Migrate existing data (Legacy mapping)
-- Map 'sub_zone' to 'zone'
UPDATE public.wbs_nodes 
SET node_type = 'zone' 
WHERE node_type = 'sub_zone';

-- 3. Add comment to clarify the hierarchy
COMMENT ON COLUMN public.wbs_nodes.node_type IS 'Hierarchy: Building > Level > Zone > Room > Element. Other types supported for flexibility.';
