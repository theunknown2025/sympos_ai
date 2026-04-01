import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  X, 
  Loader2,
  AlertCircle,
  FileText,
  Download,
  Image as ImageIcon,
  File,
  User,
  Search,
  Plus,
  Users,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { supabase, STORAGE_BUCKETS } from '../../../supabase';
import {
  getParticipantMessages,
  sendMessage,
  uploadMessageAttachment,
  markMessageAsRead,
  getParticipantConversations,
  canParticipantStartChat,
  getParticipantContacts,
  type Conversation,
  type Contact,
} from '../../../services/messagingService';
import type {
  Message,
  MessageAttachment,
} from '../../../types';

const Messaging: React.FC = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [canStartChat, setCanStartChat] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  
  // Reply state
  const [replyContent, setReplyContent] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (currentUser) {
      loadConversations();
      checkCanStartChat();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      if (selectedConversation) {
        loadMessages();
      } else if (conversations.length === 0) {
        // Fallback: if no conversations, load all messages (original behavior)
        loadAllMessages();
      }
    }
  }, [selectedConversation, currentUser]);

  // Mark messages as read when they're loaded and visible
  useEffect(() => {
    if (messages.length > 0 && currentUser) {
      const timeoutId = setTimeout(() => {
        const unreadMessages = messages.filter(m => !m.isRead && !markedAsReadRef.current.has(m.id));
        unreadMessages.forEach((message, index) => {
          markedAsReadRef.current.add(message.id);
          setTimeout(() => {
            markMessageAsRead(
              message.id,
              currentUser.id,
              currentUser.email
            ).catch(() => {
              // Silently ignore errors
            });
          }, index * 150);
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, currentUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!currentUser?.email) return;
    
    try {
      setLoading(true);
      setError('');
      const convs = await getParticipantConversations(
        currentUser.email,
        currentUser.id
      );
      setConversations(convs);
      
      // Auto-select first conversation if none selected
      if (!selectedConversation && convs.length > 0) {
        setSelectedConversation(convs[0]);
      }
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const checkCanStartChat = async () => {
    if (!currentUser?.email) return;
    
    try {
      const canStart = await canParticipantStartChat(
        currentUser.email,
        currentUser.id
      );
      setCanStartChat(canStart);
      
      if (canStart) {
        loadContacts();
      }
    } catch (err: any) {
      console.error('Error checking if can start chat:', err);
    }
  };

  const loadContacts = async () => {
    if (!currentUser?.email) return;
    
    try {
      const contactList = await getParticipantContacts(
        currentUser.email,
        currentUser.id
      );
      setContacts(contactList);
    } catch (err: any) {
      console.error('Error loading contacts:', err);
    }
  };

  const loadAllMessages = async () => {
    if (!currentUser?.email) return;
    
    try {
      setError('');
      const messagesData = await getParticipantMessages(
        currentUser.email,
        currentUser.id
      );
      
      // Sort messages by creation time (oldest first for chat view)
      const sortedMessages = messagesData.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      setMessages(sortedMessages);
      markedAsReadRef.current.clear();
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
    }
  };

  const loadMessages = async () => {
    if (!currentUser?.email || !selectedConversation) return;
    
    try {
      setError('');
      
      // Use the working getParticipantMessages function to get all messages
      const allMessages = await getParticipantMessages(
        currentUser.email,
        currentUser.id
      );
      
      // Filter messages based on selected conversation
      let filteredMessages: Message[] = [];
      
      if (selectedConversation.type === 'group' && selectedConversation.groupId) {
        // Filter group messages
        filteredMessages = allMessages.filter(msg => msg.groupId === selectedConversation.groupId);
      } else if (selectedConversation.type === 'direct') {
        // Filter direct messages - messages between current user and selected contact
        filteredMessages = allMessages.filter(msg => {
          // Must be a direct message (no group)
          if (msg.groupId) return false;
          
          // Check if message is between current user and selected contact
          if (selectedConversation.recipientId) {
            return (msg.senderId === selectedConversation.recipientId && msg.recipientId === currentUser.id) ||
                   (msg.senderId === currentUser.id && msg.recipientId === selectedConversation.recipientId);
          } else if (selectedConversation.recipientEmail) {
            return (msg.senderId === selectedConversation.recipientId && msg.recipientEmail === currentUser.email) ||
                   (msg.senderId === currentUser.id && msg.recipientEmail === selectedConversation.recipientEmail);
          }
          return false;
        });
      }
      
      // Sort by creation time (oldest first for chat view)
      filteredMessages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      // Update sender names for direct messages
      if (selectedConversation.type === 'direct') {
        filteredMessages = filteredMessages.map(msg => ({
          ...msg,
          senderName: msg.senderId === currentUser.id ? 'You' : (selectedConversation.name || 'Organizer'),
        }));
      }
      
      setMessages(filteredMessages);
      markedAsReadRef.current.clear();
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
    }
  };

  const handleSendReply = async () => {
    if (!currentUser?.id || !replyContent.trim() || !selectedConversation) return;
    
    try {
      setSendingReply(true);
      setError('');
      
      // Send reply
      const reply = await sendMessage(
        currentUser.id,
        'participant',
        replyContent,
        undefined,
        selectedConversation.groupId,
        selectedConversation.recipientId,
        selectedConversation.recipientEmail,
        undefined
      );
      
      // Upload attachments
      if (replyFiles.length > 0) {
        for (const file of replyFiles) {
          await uploadMessageAttachment(reply.id, file);
        }
      }
      
      setReplyContent('');
      setReplyFiles([]);
      if (selectedConversation) {
        await loadMessages();
      } else {
        await loadAllMessages();
      }
      await loadConversations(); // Refresh conversation list
    } catch (err: any) {
      console.error('Error sending reply:', err);
      setError(err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleStartNewChat = async (contact: Contact) => {
    if (!currentUser?.id) return;
    
    try {
      // Send initial message
      const message = await sendMessage(
        currentUser.id,
        'participant',
        `Hello, I'd like to start a conversation.`,
        undefined,
        undefined,
        undefined,
        contact.email,
        undefined
      );
      
      // Reload conversations and select the new one
      await loadConversations();
      
      // Find the new conversation
      const newConv = conversations.find(c => 
        c.type === 'direct' && c.email === contact.email
      ) || {
        id: contact.id,
        type: 'direct' as const,
        name: contact.name,
        email: contact.email,
        unreadCount: 0,
        recipientEmail: contact.email,
      };
      
      setSelectedConversation(newConv);
      setShowNewChatModal(false);
    } catch (err: any) {
      console.error('Error starting new chat:', err);
      setError(err.message || 'Failed to start chat');
    }
  };

  const getAttachmentUrl = (attachment: MessageAttachment): string => {
    let filePath = attachment.filePath;
    if (filePath.startsWith('message-attachments/')) {
      filePath = filePath.replace('message-attachments/', '');
    }
    if (filePath.startsWith(STORAGE_BUCKETS.MESSAGE_ATTACHMENTS + '/')) {
      filePath = filePath.replace(STORAGE_BUCKETS.MESSAGE_ATTACHMENTS + '/', '');
    }
    
    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.MESSAGE_ATTACHMENTS)
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File size={16} />;
    if (fileType.startsWith('image/')) return <ImageIcon size={16} />;
    return <FileText size={16} />;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
             ' ' + messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(contactSearchQuery.toLowerCase())
  );

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="h-full flex bg-slate-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
            {canStartChat && (
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="New Chat"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {conv.type === 'group' ? (
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Users size={20} className="text-indigo-600" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                          <UserCircle size={20} className="text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-slate-900 truncate">
                          {conv.name}
                        </h3>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-xs text-slate-500 truncate">
                          {conv.lastMessage}
                        </p>
                      )}
                      {conv.lastMessageTime && (
                        <p className="text-xs text-slate-400 mt-1">
                          {formatTime(conv.lastMessageTime)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                {selectedConversation.type === 'group' ? (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Users size={20} className="text-indigo-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <UserCircle size={20} className="text-slate-600" />
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">{selectedConversation.name}</h1>
                  {selectedConversation.type === 'group' ? (
                    <p className="text-sm text-slate-500">Group chat</p>
                  ) : (
                    <p className="text-sm text-slate-500">{selectedConversation.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Chat Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-4xl mx-auto space-y-6">
                {Object.entries(messageGroups).map(([date, dateMessages]) => (
                  <div key={date}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-6">
                      <div className="bg-slate-200 px-4 py-1 rounded-full">
                        <span className="text-xs font-medium text-slate-600">
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Messages for this date */}
                    <div className="space-y-3">
                      {dateMessages.map((message, index) => {
                        const isAdmin = message.senderType === 'admin' || message.senderId !== currentUser?.id;
                        const showAvatar = index === 0 || 
                          dateMessages[index - 1].senderId !== message.senderId ||
                          new Date(message.createdAt).getTime() - new Date(dateMessages[index - 1].createdAt).getTime() > 300000;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isAdmin ? 'justify-start' : 'justify-end'}`}
                          >
                            {/* Avatar */}
                            {isAdmin && (
                              <div className={`flex-shrink-0 ${showAvatar ? '' : 'opacity-0'}`}>
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                  <User size={16} className="text-white" />
                                </div>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div className={`flex flex-col ${isAdmin ? 'items-start max-w-[70%]' : 'items-end max-w-[70%]'}`}>
                              {showAvatar && isAdmin && (
                                <span className="text-xs text-slate-500 mb-1 px-2">
                                  {message.senderName || 'Organizer'}
                                </span>
                              )}
                              
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  isAdmin
                                    ? 'bg-white border border-slate-200 shadow-sm'
                                    : 'bg-indigo-600 text-white'
                                }`}
                              >
                                <p className={`text-sm whitespace-pre-wrap ${isAdmin ? 'text-slate-900' : 'text-white'}`}>
                                  {message.content}
                                </p>

                                {/* Attachments */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {message.attachments.map(att => {
                                      if (!att || !att.id) return null;
                                      
                                      return (
                                        <a
                                          key={att.id}
                                          href={getAttachmentUrl(att)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                                            isAdmin
                                              ? 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                                              : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                                          }`}
                                        >
                                          {getFileIcon(att.fileType)}
                                          <span className="text-xs font-medium truncate flex-1">
                                            {att.fileName || 'Attachment'}
                                          </span>
                                          <Download size={14} />
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Timestamp */}
                                <div className={`flex items-center gap-1 mt-1 ${
                                  isAdmin ? 'text-slate-400' : 'text-indigo-200'
                                }`}>
                                  <span className="text-xs">
                                    {formatTime(message.createdAt)}
                                  </span>
                                  {!isAdmin && message.isRead && (
                                    <span className="text-xs">✓✓</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Avatar - only for participant messages */}
                            {!isAdmin && (
                              <div className={`flex-shrink-0 ${showAvatar ? '' : 'opacity-0'}`}>
                                <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
                                  <User size={16} className="text-slate-600" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 p-4">
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* File previews */}
              {replyFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {replyFiles.map((file, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm flex items-center gap-2"
                    >
                      {getFileIcon(file.type)}
                      <span className="text-slate-700 text-xs max-w-[150px] truncate">{file.name}</span>
                      <button
                        onClick={() => setReplyFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Paperclip size={20} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setReplyFiles(prev => [...prev, ...files]);
                  }}
                  className="hidden"
                />
                
                <div className="flex-1 relative">
                  <textarea
                    placeholder="Type a message..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    rows={1}
                    className="w-full px-4 py-2 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none max-h-32 overflow-y-auto"
                    style={{ minHeight: '44px' }}
                  />
                </div>
                
                <button
                  onClick={handleSendReply}
                  disabled={(!replyContent.trim() && replyFiles.length === 0) || sendingReply}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sendingReply ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto text-slate-400 mb-4" size={48} />
              <p className="text-slate-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Start New Chat</h3>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Search Contacts */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Contacts List */}
              <div className="max-h-96 overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-4">
                    {contactSearchQuery ? 'No contacts found' : 'No contacts available'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleStartNewChat(contact)}
                        className="w-full p-3 text-left hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          {contact.type === 'committee' ? (
                            <UserCircle size={20} className="text-indigo-600" />
                          ) : (
                            <User size={20} className="text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{contact.name}</p>
                          <p className="text-xs text-slate-500 truncate">{contact.email}</p>
                        </div>
                        <span className="text-xs text-slate-400 capitalize">{contact.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messaging;
