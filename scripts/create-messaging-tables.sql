-- Messaging System Tables Setup Script
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. MESSAGE GROUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_groups_user_id ON message_groups(user_id);

-- ============================================
-- 2. MESSAGE GROUP MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES message_groups(id) ON DELETE CASCADE,
  member_type TEXT NOT NULL CHECK (member_type IN ('committee_member', 'registration_participant', 'submission_participant')),
  member_id UUID NOT NULL, -- Can reference committee_members.id, form_submissions.id, etc.
  member_email TEXT NOT NULL,
  member_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, member_type, member_id)
);

CREATE INDEX IF NOT EXISTS idx_message_group_members_group_id ON message_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_message_group_members_member_id ON message_group_members(member_id);
CREATE INDEX IF NOT EXISTS idx_message_group_members_email ON message_group_members(member_email);

-- ============================================
-- 3. MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES message_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'admin' CHECK (sender_type IN ('admin', 'participant')),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- For direct messages (optional)
  recipient_email TEXT, -- For participants who may not have user accounts
  subject TEXT,
  content TEXT NOT NULL,
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- For replies
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_email ON messages(recipient_email);
CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============================================
-- 4. MESSAGE ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in storage bucket
  file_size BIGINT,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);

-- ============================================
-- 5. MESSAGE READ STATUS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT, -- For participants without user accounts
  read_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure at least one of recipient_id or recipient_email is provided
  CONSTRAINT check_recipient CHECK (
    (recipient_id IS NOT NULL) OR (recipient_email IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_recipient_id ON message_read_status(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_recipient_email ON message_read_status(recipient_email);

-- Create unique index for message_id + recipient combination
-- This prevents duplicate read status entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_read_status_unique_recipient_id 
  ON message_read_status(message_id, recipient_id) 
  WHERE recipient_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_message_read_status_unique_recipient_email 
  ON message_read_status(message_id, recipient_email) 
  WHERE recipient_email IS NOT NULL;

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE message_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES - MESSAGE GROUPS
-- ============================================
CREATE POLICY "Users can view own message_groups"
  ON message_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own message_groups"
  ON message_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own message_groups"
  ON message_groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own message_groups"
  ON message_groups FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 8. RLS POLICIES - MESSAGE GROUP MEMBERS
-- ============================================
CREATE POLICY "Users can view members of own groups"
  ON message_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM message_groups
      WHERE message_groups.id = message_group_members.group_id
      AND message_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert members to own groups"
  ON message_group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM message_groups
      WHERE message_groups.id = message_group_members.group_id
      AND message_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete members from own groups"
  ON message_group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM message_groups
      WHERE message_groups.id = message_group_members.group_id
      AND message_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can view their own group memberships"
  ON message_group_members FOR SELECT
  USING (
    member_email = auth.email() OR
    member_email IN (
      SELECT email FROM committee_members WHERE user_id = auth.uid()
      UNION
      SELECT email FROM jury_members WHERE user_id = auth.uid()
      UNION
      SELECT (general_info::jsonb)->>'email' FROM form_submissions WHERE participant_user_id = auth.uid() AND general_info IS NOT NULL
    )
  );

-- ============================================
-- 9. RLS POLICIES - MESSAGES
-- ============================================
-- Admins can view messages they sent or messages in their groups
-- Participants can view messages sent to them (by email or user_id)
CREATE POLICY "Users can view messages they sent"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view messages in their groups"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM message_groups
      WHERE message_groups.id = messages.group_id
      AND message_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can view messages sent to them"
  ON messages FOR SELECT
  USING (
    -- Direct messages
    recipient_id = auth.uid() OR
    recipient_email = auth.email() OR
    recipient_email IN (
      SELECT email FROM committee_members WHERE user_id = auth.uid()
      UNION
      SELECT email FROM jury_members WHERE user_id = auth.uid()
      UNION
      SELECT (general_info::jsonb)->>'email' FROM form_submissions WHERE participant_user_id = auth.uid() AND general_info IS NOT NULL
    ) OR
    -- Group messages: check if user's email (from any source) is in message_group_members for this group
    (group_id IS NOT NULL AND group_id IN (
      SELECT group_id 
      FROM message_group_members 
      WHERE member_email = auth.email()
         OR member_email IN (
           SELECT email FROM committee_members WHERE user_id = auth.uid()
           UNION
           SELECT email FROM jury_members WHERE user_id = auth.uid()
           UNION
           SELECT (general_info::jsonb)->>'email' FROM form_submissions WHERE participant_user_id = auth.uid() AND general_info IS NOT NULL
         )
    ))
  );

CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- ============================================
-- 10. RLS POLICIES - MESSAGE ATTACHMENTS
-- ============================================
CREATE POLICY "Users can view attachments of accessible messages"
  ON message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_attachments.message_id
      AND (
        -- User sent the message
        messages.sender_id = auth.uid() OR
        -- User received the message directly
        messages.recipient_id = auth.uid() OR
        messages.recipient_email = auth.email() OR
        messages.recipient_email IN (
          SELECT email FROM committee_members WHERE user_id = auth.uid()
          UNION
          SELECT email FROM jury_members WHERE user_id = auth.uid()
          UNION
          SELECT (general_info::jsonb)->>'email' FROM form_submissions WHERE participant_user_id = auth.uid() AND general_info IS NOT NULL
        ) OR
        -- User is in a group that received the message
        (messages.group_id IS NOT NULL AND messages.group_id IN (
          SELECT group_id 
          FROM message_group_members 
          WHERE member_email = auth.email()
             OR member_email IN (
               SELECT email FROM committee_members WHERE user_id = auth.uid()
               UNION
               SELECT email FROM jury_members WHERE user_id = auth.uid()
               UNION
               SELECT (general_info::jsonb)->>'email' FROM form_submissions WHERE participant_user_id = auth.uid() AND general_info IS NOT NULL
             )
        )) OR
        -- Admin can see attachments from their groups
        EXISTS (
          SELECT 1 FROM message_groups
          WHERE message_groups.id = messages.group_id
          AND message_groups.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert attachments to own messages"
  ON message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_attachments.message_id
      AND messages.sender_id = auth.uid()
    )
  );

-- ============================================
-- 11. RLS POLICIES - MESSAGE READ STATUS
-- ============================================
CREATE POLICY "Users can view read status of accessible messages"
  ON message_read_status FOR SELECT
  USING (
    recipient_id = auth.uid() OR
    recipient_email IN (
      SELECT email FROM committee_members WHERE user_id = auth.uid()
      UNION
      SELECT email FROM jury_members WHERE user_id = auth.uid()
      UNION
      SELECT (general_info::jsonb)->>'email' FROM form_submissions WHERE participant_user_id = auth.uid() AND general_info IS NOT NULL
    ) OR
    EXISTS (
      SELECT 1 FROM messages
      JOIN message_groups ON message_groups.id = messages.group_id
      WHERE messages.id = message_read_status.message_id
      AND message_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own read status"
  ON message_read_status FOR INSERT
  WITH CHECK (
    recipient_id = auth.uid() OR
    recipient_email IN (
      SELECT email FROM committee_members WHERE user_id = auth.uid()
      UNION
      SELECT email FROM jury_members WHERE user_id = auth.uid()
      UNION
      SELECT (general_info::jsonb)->>'email' FROM form_submissions WHERE participant_user_id = auth.uid() AND general_info IS NOT NULL
    )
  );
