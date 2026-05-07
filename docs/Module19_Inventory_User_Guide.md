# Module 19: Inventory / Stock - User Guide

## Overview
The Inventory/Stock module manages all material, tools, equipment stock, receipts, issues, transfers, and adjustments. It is fully integrated with the Procurement module (PO→Receipt) and Construction module (Issue→WBS consumption).

## Key Features

### 1. Dashboard Tab
- **KPIs**: Total Items, Pending Receipts, Pending Issues, Pending Transfers
- **Stock Flow Diagram**: Visual representation of the flow from PO approval to WBS consumption
- **Stock Balances Table**: Current inventory levels for all items

### 2. Items Tab
- View all inventory items with filtering by category and search
- Create new items with:
  - Item code, name, description
  - Category (Raw Material, Finished Good, Tool, Equipment, Consumable, Spare Part)
  - Unit of measure, reorder level, max stock level
  - Storage location

### 3. Receipts Tab
- Track stock receipts from suppliers (linked to PO/GRN)
- Status flow: Pending Inspection → Inspected → Accepted/Rejected
- Actions: Mark as Inspected, Accept Receipt

### 4. Issues Tab
- Manage stock issues to site/WBS nodes
- Status flow: Pending Approval → Approved → Issued/Returned
- Can be linked to Material Requests
- Actions: Approve, Mark as Issued

### 5. Transfers Tab
- Transfer stock between locations/WBS nodes
- Status flow: Pending Approval → Approved → In Transit → Completed
- Actions: Approve transfer

### 6. Adjustments Tab
- Adjust stock levels (add or subtract)
- Record reasons for adjustments
- Linked to WBS nodes

### 7. Requests Tab (Material Requests)
- Site teams can request materials from store
- Status flow: Draft → Pending Approval → Approved → Fulfilled/Cancelled
- Actions: Approve request

## Cross-Module Integration

### Procurement Module Integration
- Stock Receipts can be linked to Purchase Orders (PO)
- Stock Receipts can be linked to Goods Received Notes (GRN)
- Flow: PO Approved → Material Delivered → GRN Created → Stock Receipt → Inspection → Stock Increase

### Construction Module Integration
- Stock Issues link to WBS nodes (consumption tracking)
- Material Requests originate from site/WBS nodes
- Flow: Site Requests Issue → Store Issues → Stock Decreases → Consumption Links to WBS

### WBS Integration
- All transactions (receipts, issues, transfers, adjustments) link to `wbs_node_id`
- Enables tracking material consumption per WBS node
- Supports project cost control and reporting

## User Roles & Permissions

| Role | Can Create | Can Approve |
|------|-------------|--------------|
| Admin | ✅ All | ✅ All |
| Project Manager | ✅ All | ✅ All |
| Engineer | ✅ Items, Requests | ❌ |
| Supervisor | ✅ Items, Requests, Receipts, Issues | ✅ Receipts, Issues, Transfers, Requests |
| Storekeeper | ❌ (not in current role list) | ❌ |

## Stock Flow (As per DCOS Architecture R0 Section 19.3)

1. **PO Approved** (Procurement Module)
2. **Material Delivered** (Procurement Module - GRN)
3. **Store Receives** (Inventory - Stock Receipt)
4. **Inspection** (Inventory - Receipt Inspection)
5. **Stock Increases** (Inventory - Receipt Accepted)
6. **Site Requests Issue** (Inventory - Material Request)
7. **Store Issues** (Inventory - Stock Issue)
8. **Stock Decreases** (Inventory - Issue Issued)
9. **Consumption Links to WBS** (Construction Module)

## Database Tables Created

1. `inventory_items` - Master item data
2. `stock_receipts` - Stock receipt headers
3. `stock_receipt_items` - Receipt line items
4. `material_requests` - Material request headers
5. `material_request_items` - Request line items
6. `stock_issues` - Stock issue headers
7. `stock_issue_items` - Issue line items
8. `stock_transfers` - Stock transfer headers
9. `stock_transfer_items` - Transfer line items
10. `stock_adjustments` - Stock adjustment headers
11. `stock_adjustment_items` - Adjustment line items
12. `stock_balances` - Materialized view for current balances

## Navigation

The Inventory module appears in two navigation groups:
- **Work Group**: For central warehouse management and procurement integration
- **Site Execution Group**: For site material requests and consumption tracking

## Next Steps

To complete the module:
1. Run the migration SQL in Supabase
2. Regenerate Supabase types: `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`
3. Implement full dialog forms for Receipts, Issues, Transfers, Adjustments, and Requests
4. Add detailed item pages with transaction history
5. Create Inventory reports (stock aging, consumption reports, etc.)
