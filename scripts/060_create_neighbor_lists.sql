-- Migration: Create neighbor lists schema
-- Description: Adds tables for user-created neighbor lists and list members, plus feature toggle for tenants.

-- 1. Add feature toggle to tenants table (if not exists)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS neighbor_lists_enabled BOOLEAN DEFAULT true;
COMMENT ON COLUMN tenants.neighbor_lists_enabled IS 'Controls whether the Neighbor Lists feature is enabled for this tenant';

-- 2. Create neighbor_lists table
CREATE TABLE IF NOT EXISTS neighbor_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) NOT NULL DEFAULT '📝',
    description TEXT,
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_neighbor_lists_owner ON neighbor_lists(owner_id);
CREATE INDEX idx_neighbor_lists_tenant ON neighbor_lists(tenant_id);

-- 3. Create neighbor_list_members table
CREATE TABLE IF NOT EXISTS neighbor_list_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES neighbor_lists(id) ON DELETE CASCADE,
    neighbor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT now(),
    added_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(list_id, neighbor_id)
);

-- Add indexes
CREATE INDEX idx_neighbor_list_members_list ON neighbor_list_members(list_id);
CREATE INDEX idx_neighbor_list_members_neighbor ON neighbor_list_members(neighbor_id);

-- 4. Enable RLS
ALTER TABLE neighbor_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighbor_list_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for neighbor_lists

-- Users can view their own lists
CREATE POLICY "Users can view their own lists" ON neighbor_lists
    FOR SELECT
    USING (owner_id = auth.uid());

-- Users can insert their own lists
CREATE POLICY "Users can create their own lists" ON neighbor_lists
    FOR INSERT
    WITH CHECK (owner_id = auth.uid() AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users can update their own lists
CREATE POLICY "Users can update their own lists" ON neighbor_lists
    FOR UPDATE
    USING (owner_id = auth.uid());

-- Users can delete their own lists
CREATE POLICY "Users can delete their own lists" ON neighbor_lists
    FOR DELETE
    USING (owner_id = auth.uid());

-- Family members can view shared lists
-- Logic: allow access if the list is shared AND the list owner is in the same family unit as the current user
CREATE POLICY "Family members can view shared lists" ON neighbor_lists
    FOR SELECT
    USING (
        is_shared = true AND
        EXISTS (
            SELECT 1 FROM users u_owner
            JOIN users u_me ON u_owner.family_unit_id = u_me.family_unit_id
            WHERE u_owner.id = neighbor_lists.owner_id
            AND u_me.id = auth.uid()
            AND u_owner.family_unit_id IS NOT NULL
        )
    );

-- Family members can update shared lists
CREATE POLICY "Family members can update shared lists" ON neighbor_lists
    FOR UPDATE
    USING (
        is_shared = true AND
        EXISTS (
            SELECT 1 FROM users u_owner
            JOIN users u_me ON u_owner.family_unit_id = u_me.family_unit_id
            WHERE u_owner.id = neighbor_lists.owner_id
            AND u_me.id = auth.uid()
            AND u_owner.family_unit_id IS NOT NULL
        )
    );

-- 6. RLS Policies for neighbor_list_members

-- Access depends on the parent list permissions
-- To simplify, we'll check if the user has access to the parent list
-- Note: complex exists queries can be slow, but this is necessary for the shared list logic

CREATE POLICY "Users can view members of accessible lists" ON neighbor_list_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM neighbor_lists nl
            WHERE nl.id = neighbor_list_members.list_id
            AND (
                nl.owner_id = auth.uid() OR
                (
                    nl.is_shared = true AND
                    EXISTS (
                        SELECT 1 FROM users u_owner
                        JOIN users u_me ON u_owner.family_unit_id = u_me.family_unit_id
                        WHERE u_owner.id = nl.owner_id
                        AND u_me.id = auth.uid()
                        AND u_owner.family_unit_id IS NOT NULL
                    )
                )
            )
        )
    );

CREATE POLICY "Users can manage members of accessible lists" ON neighbor_list_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM neighbor_lists nl
            WHERE nl.id = neighbor_list_members.list_id
            AND (
                nl.owner_id = auth.uid() OR
                (
                    nl.is_shared = true AND
                    EXISTS (
                        SELECT 1 FROM users u_owner
                        JOIN users u_me ON u_owner.family_unit_id = u_me.family_unit_id
                        WHERE u_owner.id = nl.owner_id
                        AND u_me.id = auth.uid()
                        AND u_owner.family_unit_id IS NOT NULL
                    )
                )
            )
        )
    );

-- 7. Add updated_at trigger
CREATE TRIGGER handle_updated_at_neighbor_lists
    BEFORE UPDATE ON neighbor_lists
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
