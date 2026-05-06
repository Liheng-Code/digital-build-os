
-- ============================================================
-- WBS HIERARCHY STANDARDIZATION
-- ============================================================

-- 1. Update the check constraint for wbs_node_type
ALTER TABLE public.wbs_nodes DROP CONSTRAINT IF EXISTS wbs_nodes_node_type_check;

ALTER TABLE public.wbs_nodes ADD CONSTRAINT wbs_nodes_node_type_check 
CHECK (node_type IN (
  'building',
  'level',
  'zone',
  'room',
  'element',
  'package',
  'system',
  'area',
  'other'
));

-- 2. Migrate existing data (Legacy mapping)
-- Map 'sub_zone' to 'zone'
UPDATE public.wbs_nodes 
SET node_type = 'zone' 
WHERE node_type = 'sub_zone';

-- 3. Add comment to clarify the hierarchy
COMMENT ON COLUMN public.wbs_nodes.node_type IS 'Hierarchy: Building > Level > Zone > Room > Element. Other types supported for flexibility.';
