# TODO: Strengthen Discipline Workspaces (ARC/STR/MEP)

This document outlines the detailed tasks required to enhance the Architecture, Structural, and MEP modules with specific data registers and workflows as defined in the DCOS Architecture Design.

## 1. Architecture Design Module (Module 5)
**Status:** RDS, Material Boards, Drawing Register, and Design Review implemented.

- [x] **Drawing Register:**
    - [x] Add `architecture_drawings` table to Supabase.
    - [x] Implement "Drawing Register" tab in `Architecture.tsx`.
- [x] **Design Review Comments:**
    - [x] Create `design_review_comments` table (shared across disciplines).
    - [x] Add "Review Comments" side panel or tab for all architectural items.
- [ ] **Finishing Schedule Roll-up:**
    - [ ] Create a report/view that aggregates all `architecture_room_data` into a project-wide Finishing Schedule.
- [ ] **Material Approval Workflow:**
    - [ ] Enhance `architecture_material_boards` with "Submitted Date", "Approved Date", and "Approver ID".
    - [ ] Link to formal Approval Engine.

## 2. Structural Design Module (Module 6)
**Status:** Calculation Notes, Model Register, BBS, Design Criteria, Load Summary, and Rebar Review implemented.

- [x] **Design Criteria & Load Summary:**
    - [x] Create `structural_design_criteria` table.
    - [x] Create `structural_load_summaries` table.
    - [x] Add "Design Basis" tab in `Structural.tsx`.
- [x] **Rebar Shop Drawing Review:**
    - [x] Create `structural_rebar_reviews` table to track submittals.
    - [x] Implement "Rebar Review" workflow.
- [ ] **Advanced Model Register:**
    - [ ] Add fields for "Last Run Date", "Analysis Results Summary", and "Responsible Engineer".
- [ ] **Design Change Control:**
    - [ ] Create `structural_design_changes` table to track impact of changes on structural elements.

## 3. MEP Design Module (Module 7)
**Status:** Equipment Schedule, Sleeve Coordination, Load Schedules, Schematics, and Material Submittals implemented.

- [x] **Load Schedules:**
    - [x] Create `mep_load_schedules` table for Electrical and Mechanical loads.
    - [x] Implement "Load Schedules" tab in `MEP.tsx`.
- [x] **System Schematics:**
    - [x] Create `mep_system_schematics` table for SLDs, Riser Diagrams, and P&IDs.
    - [x] Implement "Schematics" tab in `MEP.tsx`.
- [x] **MEP Material Submittals:**
    - [x] Create `mep_material_submittals` table.
    - [x] Add submittal tracking to `MEP.tsx`.
- [ ] **Testing & Commissioning (T&C) Preparation:**
    - [ ] Create `mep_test_records` table.
    - [ ] Add "T&C" tab to start capturing site testing data.

## 4. Cross-Module Coordination & Core Engines
- [x] **File Storage Integration:** Enabled actual file uploads to Supabase Storage for Drawings, Calculation Notes, and Schematics.
- [ ] **Notification Engine Integration:** Trigger alerts for design reviews.
- [ ] **Approval Engine Integration:** Link critical registers to multi-step approval workflow.
