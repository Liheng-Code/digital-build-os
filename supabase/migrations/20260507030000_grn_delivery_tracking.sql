-- Migration: 20260507030000_grn_delivery_tracking.sql
-- Enhance GRN table for delivery tracking

-- 1. Add new columns to GRNs table
ALTER TABLE public.grns 
  ADD COLUMN IF NOT EXISTS delivery_note_number text,
  ADD COLUMN IF NOT EXISTS vehicle_number text,
  ADD COLUMN IF NOT EXISTS driver_name text,
  ADD COLUMN IF NOT EXISTS driver_phone text,
  ADD COLUMN IF NOT EXISTS actual_delivery_date date,
  ADD COLUMN IF NOT EXISTS inspection_required boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS inspection_passed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS inspection_notes text,
  ADD COLUMN IF NOT EXISTS received_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'partially_received', 'completed', 'rejected')),
  ADD COLUMN IF NOT EXISTS po_match_status text DEFAULT 'pending' CHECK (po_match_status IN ('pending', 'matched', 'mismatch_quantity', 'mismatch_price', 'no_po'));

-- 2. Create index for delivery status
CREATE INDEX IF NOT EXISTS idx_grns_delivery_status ON public.grns(delivery_status);
CREATE INDEX IF NOT EXISTS idx_grns_actual_delivery ON public.grns(actual_delivery_date);

-- 3. Update GRN items table with matching fields
ALTER TABLE public.grn_items 
  ADD COLUMN IF NOT EXISTS po_quantity numeric(12,2),
  ADD COLUMN IF NOT EXISTS quantity_match_status text DEFAULT 'pending' CHECK (quantity_match_status IN ('pending', 'matched', 'mismatch', 'no_po_item')),
  ADD COLUMN IF NOT EXISTS quality_status text DEFAULT 'pending' CHECK (quality_status IN ('pending', 'passed', 'failed')),
  ADD COLUMN IF NOT EXISTS rejected_reason text;

-- 4. Create function to update PO delivery status based on GRN
CREATE OR REPLACE FUNCTION public.update_po_delivery_status()
RETURNS TRIGGER AS $$
DECLARE
  po_record record;
  total_po_qty numeric(12,2);
  total_received_qty numeric(12,2);
BEGIN
  -- Get PO from GRN
  SELECT * INTO po_record FROM public.purchase_orders WHERE id = NEW.po_id;
  
  IF FOUND THEN
    -- Calculate total PO item quantities
    SELECT COALESCE(SUM(quantity), 0) INTO total_po_qty 
    FROM public.po_items WHERE po_id = NEW.po_id;
    
    -- Calculate total received quantities from all GRNs for this PO
    SELECT COALESCE(SUM(gi.received_qty), 0) INTO total_received_qty
    FROM public.grn_items gi
    JOIN public.grns g ON g.id = gi.grn_id
    WHERE g.po_id = NEW.po_id;
    
    -- Update PO status based on quantities
    IF total_received_qty >= total_po_qty THEN
      UPDATE public.purchase_orders SET status = 'completed' WHERE id = NEW.po_id;
    ELSIF total_received_qty > 0 THEN
      UPDATE public.purchase_orders SET status = 'partially_received' WHERE id = NEW.po_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger on GRN items insert/update
CREATE OR REPLACE TRIGGER update_po_delivery_status_trigger
  AFTER INSERT OR UPDATE ON public.grn_items
  FOR EACH ROW EXECUTE FUNCTION public.update_po_delivery_status();

-- 6. Add comments
COMMENT ON COLUMN public.grns.delivery_note_number IS 'Delivery note or challan number from supplier';
COMMENT ON COLUMN public.grns.vehicle_number IS 'Vehicle number for delivery tracking';
COMMENT ON COLUMN public.grns.driver_name IS 'Driver name for coordination';
COMMENT ON COLUMN public.grns.actual_delivery_date IS 'Actual delivery date (may differ from expected)';
COMMENT ON COLUMN public.grns.inspection_required IS 'Whether items need quality inspection';
COMMENT ON COLUMN public.grns.delivery_status IS 'Status of delivery: pending, partially_received, completed, rejected';
COMMENT ON COLUMN public.grn_items.quality_status IS 'Quality check status for each item';
