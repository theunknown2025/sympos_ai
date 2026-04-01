import { supabase, TABLES, STORAGE_BUCKETS } from '../supabase';
import type {
  MessageGroup,
  MessageGroupMember,
  Message,
  MessageAttachment,
  ParticipantOption,
  MessageGroupMemberType,
} from '../types';

// ============================================
// MESSAGE GROUPS
// ============================================

export const createMessageGroup = async (
  userId: string,
  name: string,
  description?: string
): Promise<MessageGroup> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MESSAGE_GROUPS)
      .insert({
        user_id: userId,
        name,
        description: description || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error('Error creating message group:', error);
    throw error;
  }
};

export const getUserMessageGroups = async (userId: string): Promise<MessageGroup[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MESSAGE_GROUPS)
      .select('*, message_group_members(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((group: any) => ({
      id: group.id,
      userId: group.user_id,
      name: group.name,
      description: group.description || undefined,
      createdAt: new Date(group.created_at),
      updatedAt: new Date(group.updated_at),
      memberCount: group.message_group_members?.[0]?.count || 0,
    }));
  } catch (error) {
    console.error('Error getting message groups:', error);
    throw error;
  }
};

export const getMessageGroup = async (groupId: string): Promise<MessageGroup | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MESSAGE_GROUPS)
      .select('*, message_group_members(count)')
      .eq('id', groupId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      memberCount: data.message_group_members?.[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error getting message group:', error);
    throw error;
  }
};

export const updateMessageGroup = async (
  groupId: string,
  name: string,
  description?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLES.MESSAGE_GROUPS)
      .update({
        name,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating message group:', error);
    throw error;
  }
};

export const deleteMessageGroup = async (groupId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLES.MESSAGE_GROUPS)
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting message group:', error);
    throw error;
  }
};

// ============================================
// MESSAGE GROUP MEMBERS
// ============================================

export const addGroupMember = async (
  groupId: string,
  memberType: MessageGroupMemberType,
  memberId: string,
  memberEmail: string,
  memberName?: string
): Promise<MessageGroupMember> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MESSAGE_GROUP_MEMBERS)
      .insert({
        group_id: groupId,
        member_type: memberType,
        member_id: memberId,
        member_email: memberEmail,
        member_name: memberName || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      groupId: data.group_id,
      memberType: data.member_type as MessageGroupMemberType,
      memberId: data.member_id,
      memberEmail: data.member_email,
      memberName: data.member_name || undefined,
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error('Error adding group member:', error);
    throw error;
  }
};

export const getGroupMembers = async (groupId: string): Promise<MessageGroupMember[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MESSAGE_GROUP_MEMBERS)
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((member: any) => ({
      id: member.id,
      groupId: member.group_id,
      memberType: member.member_type as MessageGroupMemberType,
      memberId: member.member_id,
      memberEmail: member.member_email,
      memberName: member.member_name || undefined,
      createdAt: new Date(member.created_at),
    }));
  } catch (error) {
    console.error('Error getting group members:', error);
    throw error;
  }
};

export const removeGroupMember = async (memberId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLES.MESSAGE_GROUP_MEMBERS)
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing group member:', error);
    throw error;
  }
};

// ============================================
// PARTICIPANT OPTIONS (for search/selection)
// ============================================

export const getCommitteeMemberOptions = async (userId: string): Promise<ParticipantOption[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.COMMITTEE_MEMBERS)
      .select('id, email, first_name, last_name')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || []).map((member: any) => ({
      id: member.id,
      email: member.email,
      name: `${member.first_name} ${member.last_name}`,
      type: 'committee_member' as MessageGroupMemberType,
      sourceId: member.id,
    }));
  } catch (error) {
    console.error('Error getting committee member options:', error);
    throw error;
  }
};

export const getRegistrationParticipantOptions = async (userId: string): Promise<ParticipantOption[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.FORM_SUBMISSIONS)
      .select('id, general_info, submitted_by')
      .eq('user_id', userId)
      .eq('role', 'Participant');

    if (error) throw error;

    const options: ParticipantOption[] = [];
    const seenEmails = new Set<string>();

    (data || []).forEach((submission: any) => {
      const generalInfo = typeof submission.general_info === 'string'
        ? JSON.parse(submission.general_info)
        : (submission.general_info || {});
      
      const email = generalInfo.email || submission.submitted_by;
      const name = generalInfo.name || submission.submitted_by || email;

      if (email && !seenEmails.has(email)) {
        seenEmails.add(email);
        options.push({
          id: submission.id,
          email,
          name,
          type: 'registration_participant' as MessageGroupMemberType,
          sourceId: submission.id,
        });
      }
    });

    return options;
  } catch (error) {
    console.error('Error getting registration participant options:', error);
    throw error;
  }
};

export const getSubmissionParticipantOptions = async (userId: string): Promise<ParticipantOption[]> => {
  try {
    // Get submissions from submission forms (not registration forms)
    // This requires checking if the form is a submission form
    // For now, we'll get all form submissions and filter by checking if they have submission-specific fields
    const { data, error } = await supabase
      .from(TABLES.FORM_SUBMISSIONS)
      .select('id, general_info, submitted_by, form_id')
      .eq('user_id', userId);

    if (error) throw error;

    const options: ParticipantOption[] = [];
    const seenEmails = new Set<string>();

    (data || []).forEach((submission: any) => {
      const generalInfo = typeof submission.general_info === 'string'
        ? JSON.parse(submission.general_info)
        : (submission.general_info || {});
      
      const email = generalInfo.email || submission.submitted_by;
      const name = generalInfo.name || submission.submitted_by || email;

      if (email && !seenEmails.has(email)) {
        seenEmails.add(email);
        options.push({
          id: submission.id,
          email,
          name,
          type: 'submission_participant' as MessageGroupMemberType,
          sourceId: submission.id,
        });
      }
    });

    return options;
  } catch (error) {
    console.error('Error getting submission participant options:', error);
    throw error;
  }
};

// ============================================
// MESSAGES
// ============================================

export const sendMessage = async (
  senderId: string,
  senderType: 'admin' | 'participant',
  content: string,
  subject?: string,
  groupId?: string,
  recipientId?: string,
  recipientEmail?: string,
  parentMessageId?: string
): Promise<Message> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MESSAGES)
      .insert({
        group_id: groupId || null,
        sender_id: senderId,
        sender_type: senderType,
        recipient_id: recipientId || null,
        recipient_email: recipientEmail || null,
        subject: subject || null,
        content,
        parent_message_id: parentMessageId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      groupId: data.group_id || undefined,
      senderId: data.sender_id,
      senderType: data.sender_type as 'admin' | 'participant',
      recipientId: data.recipient_id || undefined,
      recipientEmail: data.recipient_email || undefined,
      subject: data.subject || undefined,
      content: data.content,
      parentMessageId: data.parent_message_id || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getGroupMessages = async (groupId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MESSAGES)
      .select(`
        *,
        message_attachments(*)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((msg: any) => ({
      id: msg.id,
      groupId: msg.group_id || undefined,
      senderId: msg.sender_id,
      senderType: msg.sender_type as 'admin' | 'participant',
      recipientId: msg.recipient_id || undefined,
      recipientEmail: msg.recipient_email || undefined,
      subject: msg.subject || undefined,
      content: msg.content,
      parentMessageId: msg.parent_message_id || undefined,
      createdAt: new Date(msg.created_at),
      updatedAt: new Date(msg.updated_at),
      attachments: (msg.message_attachments || []).map((att: any) => ({
        id: att.id,
        messageId: att.message_id,
        fileName: att.file_name,
        filePath: att.file_path,
        fileSize: att.file_size || undefined,
        fileType: att.file_type || undefined,
        createdAt: new Date(att.created_at),
      })),
    }));
  } catch (error) {
    console.error('Error getting group messages:', error);
    throw error;
  }
};

export const getParticipantMessages = async (userEmail: string, userId?: string): Promise<Message[]> => {
  try {
    // First, get groups where the user is a member
    const { data: groupMemberships, error: groupError } = await supabase
      .from(TABLES.MESSAGE_GROUP_MEMBERS)
      .select('group_id')
      .eq('member_email', userEmail);

    if (groupError) throw groupError;

    const groupIds = (groupMemberships || []).map((gm: any) => gm.group_id);

    // Get messages: direct messages OR messages from groups the user belongs to
    // We need to get both direct messages and group messages separately, then combine
    const directMessagesQuery = supabase
      .from(TABLES.MESSAGES)
      .select(`
        *,
        message_attachments(*),
        message_read_status!left(id, read_at)
      `)
      .or(`recipient_email.eq.${userEmail},recipient_id.eq.${userId || ''}`);

    let allData: any[] = [];
    
    // Get direct messages
    const { data: directData, error: directError } = await directMessagesQuery;
    if (directError) throw directError;
    if (directData) allData = [...directData];

    // Get group messages if user is in any groups
    if (groupIds.length > 0) {
      const { data: groupData, error: groupError } = await supabase
        .from(TABLES.MESSAGES)
        .select(`
          *,
          message_attachments(*),
          message_read_status!left(id, read_at)
        `)
        .in('group_id', groupIds);
      
      if (groupError) {
        console.error('Error fetching group messages:', groupError);
        throw groupError;
      }
      
      if (groupData) {
        // Log for debugging
        console.log('Group messages loaded:', groupData.length);
        groupData.forEach((msg: any) => {
          if (msg.message_attachments && msg.message_attachments.length > 0) {
            console.log(`Message ${msg.id} has ${msg.message_attachments.length} attachments:`, msg.message_attachments);
          }
        });
        
        // Merge and deduplicate by message ID
        const existingIds = new Set(allData.map(m => m.id));
        allData = [...allData, ...groupData.filter(m => !existingIds.has(m.id))];
      }
    }

    // Sort by created_at descending
    allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const data = allData;

    return (data || []).map((msg: any) => {
      const readStatus = Array.isArray(msg.message_read_status) 
        ? msg.message_read_status.find((rs: any) => 
            rs.recipient_id === userId || rs.recipient_email === userEmail
          )
        : msg.message_read_status;

      // Get sender name from auth.users or use default
      let senderName = 'Organizer';
      if (msg.sender_type === 'admin') {
        senderName = 'Organizer';
      } else {
        senderName = 'You';
      }

      return {
        id: msg.id,
        groupId: msg.group_id || undefined,
        senderId: msg.sender_id,
        senderType: msg.sender_type as 'admin' | 'participant',
        senderName,
        senderEmail: undefined,
        recipientId: msg.recipient_id || undefined,
        recipientEmail: msg.recipient_email || undefined,
        subject: msg.subject || undefined,
        content: msg.content,
        parentMessageId: msg.parent_message_id || undefined,
        createdAt: new Date(msg.created_at),
        updatedAt: new Date(msg.updated_at),
        isRead: !!readStatus,
        readAt: readStatus?.read_at ? new Date(readStatus.read_at) : undefined,
        attachments: (() => {
          // Handle different response formats from Supabase
          let attachments = msg.message_attachments;
          
          // If it's null or undefined, return empty array
          if (!attachments) {
            return [];
          }
          
          // If it's already an array, use it
          if (Array.isArray(attachments)) {
            return attachments
              .filter((att: any) => att && att.id) // Filter out null/undefined
              .map((att: any) => ({
                id: att.id,
                messageId: att.message_id,
                fileName: att.file_name,
                filePath: att.file_path,
                fileSize: att.file_size || undefined,
                fileType: att.file_type || undefined,
                createdAt: new Date(att.created_at),
              }));
          }
          
          // If it's a single object, wrap it in an array
          if (attachments.id) {
            return [{
              id: attachments.id,
              messageId: attachments.message_id,
              fileName: attachments.file_name,
              filePath: attachments.file_path,
              fileSize: attachments.file_size || undefined,
              fileType: attachments.file_type || undefined,
              createdAt: new Date(attachments.created_at),
            }];
          }
          
          return [];
        })(),
      };
    });
  } catch (error) {
    console.error('Error getting participant messages:', error);
    throw error;
  }
};

export const getMessage = async (messageId: string): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MESSAGES)
      .select(`
        *,
        message_attachments(*)
      `)
      .eq('id', messageId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      groupId: data.group_id || undefined,
      senderId: data.sender_id,
      senderType: data.sender_type as 'admin' | 'participant',
      recipientId: data.recipient_id || undefined,
      recipientEmail: data.recipient_email || undefined,
      subject: data.subject || undefined,
      content: data.content,
      parentMessageId: data.parent_message_id || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      attachments: (data.message_attachments || []).map((att: any) => ({
        id: att.id,
        messageId: att.message_id,
        fileName: att.file_name,
        filePath: att.file_path,
        fileSize: att.file_size || undefined,
        fileType: att.file_type || undefined,
        createdAt: new Date(att.created_at),
      })),
    };
  } catch (error) {
    console.error('Error getting message:', error);
    throw error;
  }
};

// ============================================
// MESSAGE ATTACHMENTS
// ============================================

export const uploadMessageAttachment = async (
  messageId: string,
  file: File
): Promise<MessageAttachment> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${messageId}/${Date.now()}.${fileExt}`;
    const filePath = `${STORAGE_BUCKETS.MESSAGE_ATTACHMENTS}/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.MESSAGE_ATTACHMENTS)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.MESSAGE_ATTACHMENTS)
      .getPublicUrl(fileName);

    // Save attachment record
    const { data, error } = await supabase
      .from(TABLES.MESSAGE_ATTACHMENTS)
      .insert({
        message_id: messageId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      messageId: data.message_id,
      fileName: data.file_name,
      filePath: data.file_path,
      fileSize: data.file_size || undefined,
      fileType: data.file_type || undefined,
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error('Error uploading message attachment:', error);
    throw error;
  }
};

export const downloadMessageAttachment = async (attachment: MessageAttachment): Promise<string> => {
  try {
    const fileName = attachment.filePath.split('/').pop() || attachment.fileName;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.MESSAGE_ATTACHMENTS)
      .download(fileName);

    if (error) throw error;

    const url = URL.createObjectURL(data);
    return url;
  } catch (error) {
    console.error('Error downloading message attachment:', error);
    throw error;
  }
};

// ============================================
// MESSAGE READ STATUS
// ============================================

export const markMessageAsRead = async (
  messageId: string,
  recipientId?: string,
  recipientEmail?: string
): Promise<void> => {
  try {
    if (!recipientId && !recipientEmail) {
      return; // Silently return if no recipient info
    }

    // Prioritize recipientId if both are provided (to avoid conflicts)
    const useRecipientId = !!recipientId;
    const useRecipientEmail = !recipientId && !!recipientEmail;

    if (!useRecipientId && !useRecipientEmail) {
      return;
    }

    // Check if read status already exists - query based on what we're using
    let query = supabase
      .from(TABLES.MESSAGE_READ_STATUS)
      .select('id')
      .eq('message_id', messageId);
    
    if (useRecipientId) {
      query = query.eq('recipient_id', recipientId).not('recipient_id', 'is', null);
    } else if (useRecipientEmail) {
      query = query.eq('recipient_email', recipientEmail).not('recipient_email', 'is', null);
    }

    const { data: existing, error: selectError } = await query.maybeSingle();

    // If record exists, update it
    if (existing && existing.id) {
      const { error: updateError } = await supabase
        .from(TABLES.MESSAGE_READ_STATUS)
        .update({ read_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (updateError && updateError.code !== '23505') {
        console.warn('Error updating read status:', updateError);
      }
      return; // Successfully updated, exit
    }

    // If record doesn't exist, insert it
    const insertData: any = {
      message_id: messageId,
      read_at: new Date().toISOString(),
    };

    if (useRecipientId) {
      insertData.recipient_id = recipientId;
      insertData.recipient_email = null; // Explicitly set to null
    } else {
      insertData.recipient_id = null; // Explicitly set to null
      insertData.recipient_email = recipientEmail;
    }

    const { error: insertError } = await supabase
      .from(TABLES.MESSAGE_READ_STATUS)
      .insert(insertData);

    // Ignore duplicate key errors (23505) - this can happen in race conditions
    if (insertError) {
      if (insertError.code === '23505') {
        // Duplicate key - try to update instead
        let updateQuery = supabase
          .from(TABLES.MESSAGE_READ_STATUS)
          .update({ read_at: new Date().toISOString() })
          .eq('message_id', messageId);
        
        if (useRecipientId) {
          updateQuery = updateQuery.eq('recipient_id', recipientId);
        } else {
          updateQuery = updateQuery.eq('recipient_email', recipientEmail);
        }

        const { error: updateError } = await updateQuery;
        if (updateError && updateError.code !== '23505') {
          console.warn('Error updating read status after duplicate:', updateError);
        }
      } else {
        console.warn('Error inserting read status:', insertError);
      }
    }
  } catch (error: any) {
    // Silently handle errors to not break message loading
    if (error?.code !== '23505') {
      console.error('Error marking message as read:', error);
    }
  }
};

export const getUnreadMessageCount = async (userEmail: string, userId?: string): Promise<number> => {
  try {
    // Get all messages for the user
    const { data: messages, error: messagesError } = await supabase
      .from(TABLES.MESSAGES)
      .select('id')
      .or(`recipient_email.eq.${userEmail},recipient_id.eq.${userId || ''}`);

    if (messagesError) throw messagesError;
    if (!messages || messages.length === 0) return 0;

    // Get read message IDs
    const messageIds = messages.map(m => m.id);
    const { data: readMessages, error: readError } = await supabase
      .from(TABLES.MESSAGE_READ_STATUS)
      .select('message_id')
      .in('message_id', messageIds)
      .or(`recipient_id.eq.${userId || ''},recipient_email.eq.${userEmail}`);

    if (readError) throw readError;

    const readMessageIds = new Set((readMessages || []).map((r: any) => r.message_id));
    const unreadCount = messages.filter(m => !readMessageIds.has(m.id)).length;

    return unreadCount;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
};

// ============================================
// PARTICIPANT CONVERSATIONS & CONTACTS
// ============================================

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  email?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  groupId?: string;
  recipientId?: string;
  recipientEmail?: string;
}

/**
 * Get all conversations for a participant (direct messages and groups)
 */
export const getParticipantConversations = async (
  userEmail: string,
  userId?: string
): Promise<Conversation[]> => {
  try {
    const conversations: Conversation[] = [];

    // Get groups where user is a member
    const { data: groupMemberships, error: groupError } = await supabase
      .from(TABLES.MESSAGE_GROUP_MEMBERS)
      .select('group_id')
      .eq('member_email', userEmail);

    if (groupError) throw groupError;

    const groupIds = (groupMemberships || []).map((gm: any) => gm.group_id);

    // Get group details
    if (groupIds.length > 0) {
      const { data: groupsData, error: groupsError } = await supabase
        .from(TABLES.MESSAGE_GROUPS)
        .select('id, name, description, created_at')
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      // Get last message for each group
      for (const group of groupsData || []) {
        const { data: lastMessageData } = await supabase
          .from(TABLES.MESSAGES)
          .select('id, content, created_at, sender_id, sender_type')
          .eq('group_id', (group as any).id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Count unread messages (simplified - get all messages and check read status)
        const { data: groupMessages } = await supabase
          .from(TABLES.MESSAGES)
          .select('id')
          .eq('group_id', (group as any).id);

        let unreadCount = 0;
        if (groupMessages && groupMessages.length > 0) {
          const messageIds = groupMessages.map(m => m.id);
          const { data: readStatuses } = await supabase
            .from(TABLES.MESSAGE_READ_STATUS)
            .select('message_id')
            .in('message_id', messageIds)
            .or(`recipient_email.eq.${userEmail},recipient_id.eq.${userId || ''}`);

          const readMessageIds = new Set((readStatuses || []).map((r: any) => r.message_id));
          unreadCount = groupMessages.filter(m => !readMessageIds.has(m.id)).length;
        }

        conversations.push({
          id: (group as any).id,
          type: 'group',
          name: (group as any).name,
          groupId: (group as any).id,
          lastMessage: lastMessageData?.content,
          lastMessageTime: lastMessageData ? new Date(lastMessageData.created_at) : undefined,
          unreadCount,
        });
      }
    }

    // Get direct messages (group by sender)
    const { data: directMessages, error: directError } = await supabase
      .from(TABLES.MESSAGES)
      .select('id, sender_id, sender_type, content, created_at, recipient_id, recipient_email')
      .or(`recipient_email.eq.${userEmail},recipient_id.eq.${userId || ''}`)
      .is('group_id', null)
      .order('created_at', { ascending: false });

    if (directError) throw directError;

    // Group direct messages by sender
    const directConversationsMap = new Map<string, Conversation>();
    for (const msg of directMessages || []) {
      const senderId = msg.sender_id;
      if (!directConversationsMap.has(senderId)) {
        // Get sender info from messages table metadata or use default
        const senderName = msg.sender_type === 'admin' ? 'Organizer' : 'Participant';
        
        // Count unread
        const { data: senderMessages } = await supabase
          .from(TABLES.MESSAGES)
          .select('id')
          .eq('sender_id', senderId)
          .or(`recipient_email.eq.${userEmail},recipient_id.eq.${userId || ''}`)
          .is('group_id', null);

        let unreadCount = 0;
        if (senderMessages && senderMessages.length > 0) {
          const messageIds = senderMessages.map(m => m.id);
          const { data: readStatuses } = await supabase
            .from(TABLES.MESSAGE_READ_STATUS)
            .select('message_id')
            .in('message_id', messageIds)
            .or(`recipient_email.eq.${userEmail},recipient_id.eq.${userId || ''}`);

          const readMessageIds = new Set((readStatuses || []).map((r: any) => r.message_id));
          unreadCount = senderMessages.filter(m => !readMessageIds.has(m.id)).length;
        }

        directConversationsMap.set(senderId, {
          id: senderId,
          type: 'direct',
          name: senderName,
          email: msg.recipient_email || undefined,
          recipientId: senderId,
          recipientEmail: msg.recipient_email || undefined,
          lastMessage: msg.content,
          lastMessageTime: new Date(msg.created_at),
          unreadCount,
        });
      } else {
        const conv = directConversationsMap.get(senderId)!;
        const msgTime = new Date(msg.created_at);
        if (!conv.lastMessageTime || msgTime > conv.lastMessageTime) {
          conv.lastMessage = msg.content;
          conv.lastMessageTime = msgTime;
        }
      }
    }

    conversations.push(...Array.from(directConversationsMap.values()));

    // Sort by last message time
    conversations.sort((a, b) => {
      const timeA = a.lastMessageTime?.getTime() || 0;
      const timeB = b.lastMessageTime?.getTime() || 0;
      return timeB - timeA;
    });

    return conversations;
  } catch (error) {
    console.error('Error getting participant conversations:', error);
    throw error;
  }
};

/**
 * Check if participant can start new chats (registration accepted or submission approved)
 */
export const canParticipantStartChat = async (
  userEmail: string,
  userId?: string
): Promise<boolean> => {
  try {
    // Check if user has accepted registration
    const { data: acceptedRegistrations } = await supabase
      .from(TABLES.FORM_SUBMISSIONS)
      .select('id')
      .or(`participant_user_id.eq.${userId || ''},general_info->>email.eq.${userEmail}`)
      .eq('decision_status', 'accepted')
      .limit(1);

    if (acceptedRegistrations && acceptedRegistrations.length > 0) {
      return true;
    }

    // Check if user has approved submission
    const { data: approvedSubmissions } = await supabase
      .from(TABLES.FORM_SUBMISSIONS)
      .select('id')
      .or(`participant_user_id.eq.${userId || ''},general_info->>email.eq.${userEmail}`)
      .eq('approval_status', 'accepted')
      .limit(1);

    return (approvedSubmissions && approvedSubmissions.length > 0) || false;
  } catch (error) {
    console.error('Error checking if participant can start chat:', error);
    return false;
  }
};

/**
 * Get available contacts for participant to start new chats
 */
export interface Contact {
  id: string;
  name: string;
  email: string;
  type: 'committee' | 'participant' | 'group';
  avatar?: string;
}

export const getParticipantContacts = async (
  userEmail: string,
  userId?: string
): Promise<Contact[]> => {
  try {
    const contacts: Contact[] = [];

    // Get committee members from events where participant is registered/accepted
    const { data: submissions } = await supabase
      .from(TABLES.FORM_SUBMISSIONS)
      .select('event_id')
      .or(`participant_user_id.eq.${userId || ''},general_info->>email.eq.${userEmail}`)
      .or('decision_status.eq.accepted,approval_status.eq.accepted');

    const eventIds = [...new Set((submissions || []).map((s: any) => s.event_id))];

    if (eventIds.length > 0) {
      // Get committee members for these events
      const { data: committeeMembers } = await supabase
        .from(TABLES.COMMITTEE_MEMBERS)
        .select('id, email, first_name, last_name')
        .in('event_id', eventIds);

      for (const member of committeeMembers || []) {
        contacts.push({
          id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          email: member.email,
          type: 'committee',
        });
      }

      // Get other participants from same events (accepted/approved)
      const { data: otherParticipants } = await supabase
        .from(TABLES.FORM_SUBMISSIONS)
        .select('id, general_info, participant_user_id')
        .in('event_id', eventIds)
        .or('decision_status.eq.accepted,approval_status.eq.accepted')
        .neq('participant_user_id', userId || '')
        .neq('general_info->>email', userEmail);

      for (const participant of otherParticipants || []) {
        const generalInfo = participant.general_info as any;
        const email = generalInfo?.email;
        const name = generalInfo?.name || email;

        if (email && email !== userEmail) {
          contacts.push({
            id: participant.id,
            name: name,
            email: email,
            type: 'participant',
          });
        }
      }
    }

    // Remove duplicates by email
    const uniqueContacts = Array.from(
      new Map(contacts.map(c => [c.email, c])).values()
    );

    return uniqueContacts;
  } catch (error) {
    console.error('Error getting participant contacts:', error);
    throw error;
  }
};
