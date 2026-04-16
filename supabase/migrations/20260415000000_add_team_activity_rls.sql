-- Phase 15: Team Activity Feed
-- Allows account owners to read audit_logs of their active team members.
-- This policy is ADDITIVE -- it does NOT replace the existing
-- "Users can read their own audit logs" policy.

CREATE POLICY "Owners can read team audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT user_id
      FROM account_members
      WHERE account_owner_id = auth.uid()
        AND status = 'active'
        AND user_id IS NOT NULL
    )
  );

-- Performance index for the subquery used in the RLS policy above
CREATE INDEX IF NOT EXISTS idx_account_members_owner_active_users
  ON account_members(account_owner_id, status)
  WHERE user_id IS NOT NULL;
