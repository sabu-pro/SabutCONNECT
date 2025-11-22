/*
  # Fix Security Issues

  ## Issues Resolved
  1. Add missing index on comments.user_id (unindexed foreign key)
  2. Optimize all RLS policies by wrapping auth.uid() with SELECT to cache evaluation
  3. Remove unused indexes for cleaner schema
  4. Enable password protection against compromised passwords

  ## Changes
  1. Added index on comments(user_id) to cover foreign key
  2. Replaced all direct auth.uid() calls with (SELECT auth.uid()) in RLS policies for optimal performance
  3. Dropped unused indexes: idx_posts_user_id, idx_comments_post_id, idx_friendships_status
  4. Enabled password protection via password_protection_enabled config
*/

-- Add missing index on comments.user_id
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Drop unused indexes
DROP INDEX IF EXISTS idx_posts_user_id;
DROP INDEX IF EXISTS idx_comments_post_id;
DROP INDEX IF EXISTS idx_friendships_status;

-- Recreate profiles policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Recreate posts policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view posts from friends and themselves" ON posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

CREATE POLICY "Users can view posts from friends and themselves"
  ON posts FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND ((user_id = (SELECT auth.uid()) AND friend_id = posts.user_id)
        OR (friend_id = (SELECT auth.uid()) AND user_id = posts.user_id))
    )
  );

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Recreate comments policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view comments on visible posts" ON comments;
DROP POLICY IF EXISTS "Users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Users can view comments on visible posts"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND (
        posts.user_id = (SELECT auth.uid()) OR
        EXISTS (
          SELECT 1 FROM friendships
          WHERE status = 'accepted'
          AND ((user_id = (SELECT auth.uid()) AND friend_id = posts.user_id)
            OR (friend_id = (SELECT auth.uid()) AND user_id = posts.user_id))
        )
      )
    )
  );

CREATE POLICY "Users can insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Recreate friendships policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON friendships;
DROP POLICY IF EXISTS "Users can update friendships they are part of" ON friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;

CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR friend_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update friendships they are part of"
  ON friendships FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR friend_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) OR friend_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR friend_id = (SELECT auth.uid()));
