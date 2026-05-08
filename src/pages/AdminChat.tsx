import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Paperclip, X, File, ArrowLeft, MessageSquare, Users, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDocById } from '@/services/firestoreService';
import {
  uploadFile,
  ChatMessage,
  ChatAttachment,
  listUserManagerThreadsForStaff,
  subscribeToThreadMessages,
  sendThreadMessage,
  ChatThread,
  getAvailableManagers,
  getOrCreateStaffThread,
  listStaffThreadsForAdmin,
} from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';

interface ChatUser {
  id: string;
  name: string;
  role: 'user' | 'manager' | 'admin';
  category: 'clients' | 'managers';
  counterpartId?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

const AdminChat: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'clients' | 'managers'>('clients');
  const [managers, setManagers] = useState<{id: string, name: string, email: string}[]>([]);
  const [profileImages, setProfileImages] = useState<{[key: string]: string}>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Получить изображение профиля пользователя
  const getUserProfileImage = async (userId: string): Promise<string | null> => {
    try {
      const userDoc = await getDocById('users', userId) as any;
      return userDoc?.profileImage || null;
    } catch (error) {
      console.error('Error fetching user profile image:', error);
      return null;
    }
  };

  // Check authorization
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Load threads and build user list
  useEffect(() => {
    if (!isAdmin) return;

    // Load client threads
    listUserManagerThreadsForStaff().then((allThreads) => {
      buildUserList(allThreads, 'clients');
    });

    // Load staff threads and available managers
    if (user?.id) {
      listStaffThreadsForAdmin(user.id).then((staffThreads) => {
        buildUserList(staffThreads, 'managers');
      });
      getAvailableManagers().then((availableManagers) => {
        setManagers(availableManagers);
      });
    }
  }, [isAdmin, user?.id]);

  useEffect(() => {
    if (!isAdmin || !user?.id) return;
    if (managers.length === 0) return;

    // Rebuild staff list to replace UID placeholders with manager names.
    listStaffThreadsForAdmin(user.id).then((staffThreads) => {
      buildUserList(staffThreads, 'managers');
    });
  }, [isAdmin, user?.id, managers]);

  // Subscribe to messages for selected thread
  useEffect(() => {
    if (!isAdmin || !selectedUserId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToThreadMessages(selectedUserId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [isAdmin, selectedUserId]);

  // Auto-scroll to last message with smooth animation
  useEffect(() => {
    if (lastMessageRef.current && messages.length > 0) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedUserId]);

  // Load profile images for message senders
  useEffect(() => {
    const uniqueSenderIds = [...new Set(messages.map(msg => msg.senderId))];
    
    uniqueSenderIds.forEach(async (senderId) => {
      if (!profileImages[senderId]) {
        const imageUrl = await getUserProfileImage(senderId);
        if (imageUrl) {
          setProfileImages(prev => ({
            ...prev,
            [senderId]: imageUrl
          }));
        }
      }
    });
  }, [messages]);

  const buildUserList = (allThreads: ChatThread[], category: 'clients' | 'managers') => {
    const users = allThreads.map((t) => {
      const lastMsgTs = t.lastMessage?.timestamp && typeof t.lastMessage.timestamp === 'object' && 'toDate' in t.lastMessage.timestamp
        ? (t.lastMessage.timestamp as any).toDate()
        : t.lastMessage?.timestamp
          ? new Date(t.lastMessage.timestamp as any)
          : undefined;

      const isStaffThread = t.type === 'staff';
      const counterpartId = isStaffThread
        ? t.participantIds.find((id) => id !== user?.id)
        : undefined;

      const displayName = isStaffThread
        ? (managers.find((m) => m.id === counterpartId)?.name || 'Менеджер')
        : (t.userName || t.userEmail || t.userId);

      return {
        id: t.id,
        name: displayName,
        role: isStaffThread ? 'manager' : 'user',
        category,
        counterpartId,
        lastMessage: t.lastMessage?.text,
        lastMessageTime: lastMsgTs,
        unreadCount: 0,
      } as ChatUser;
    });

    setChatUsers((prev) => {
      const otherTypeUsers = prev.filter((u) => u.category !== category);
      return [...otherTypeUsers, ...users].sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      });
    });
  };

  const filteredMessages = messages;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!user || (!inputText.trim() && attachments.length === 0)) return;
    if (!selectedUserId) {
      toast({
        title: 'Выберите диалог',
        description: 'Сначала выберите чат с клиентом слева',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const uploadedAttachments: ChatAttachment[] = [];
      for (const file of attachments) {
        const attachment = await uploadFile(file);
        if (attachment) {
          uploadedAttachments.push(attachment);
        }
      }

      await sendThreadMessage(
        selectedUserId,
        inputText.trim(),
        user.id,
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        user.role,
        uploadedAttachments
      );

      setInputText('');
      setAttachments([]);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedUserId(null);
  };

  const handleStartManagerChat = async (managerId: string) => {
    if (!user?.id) return;
    try {
      const thread = await getOrCreateStaffThread(user.id, managerId);
      if (thread) {
        handleSelectUser(thread.id);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать чат с менеджером',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="container mx-auto px-4 h-[calc(100vh-6rem)] max-w-7xl">
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Чаты администратора</h1>
          <Badge variant="secondary">Admin Panel</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-full">
          {/* Users List - hidden on mobile when chat is open */}
          <Card className={`lg:col-span-1 h-full ${showMobileChat ? 'hidden lg:flex' : 'flex'} flex-col overflow-hidden`}>
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Диалоги
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
              {/* Tabs */}
              <div className="flex border-b">
                <button
                  className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                    activeTab === 'clients'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('clients')}
                >
                  <Users className="h-4 w-4" />
                  Клиенты
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                    activeTab === 'managers'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('managers')}
                >
                  <Briefcase className="h-4 w-4" />
                  Менеджеры
                </button>
              </div>

              <ScrollArea className="h-[calc(100vh-18rem)] px-4">
                <div className="space-y-1">
                  {activeTab === 'clients' ? (
                    // Client chats
                    chatUsers.filter((u) => u.category === 'clients').length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Пока нет сообщений от клиентов
                      </div>
                    ) : (
                      chatUsers
                        .filter((u) => u.category === 'clients')
                        .map((chatUser) => (
                          <div
                            key={chatUser.id}
                            className={`flex items-center gap-3 w-full p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedUserId === chatUser.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => handleSelectUser(chatUser.id)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {(chatUser.name || 'U').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{chatUser.name}</p>
                                {chatUser.unreadCount > 0 && (
                                  <Badge variant="destructive" className="ml-2">
                                    {chatUser.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">
                                  Клиент
                                </Badge>
                                <p className="text-xs opacity-80 truncate">
                                  {chatUser.lastMessage || 'Нет сообщений'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                    )
                  ) : (
                    // Manager chats and available managers
                    <>
                      {/* Existing manager chats */}
                      {chatUsers
                        .filter((u) => u.category === 'managers')
                        .map((chatUser) => (
                          <div
                            key={chatUser.id}
                            className={`flex items-center gap-3 w-full p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedUserId === chatUser.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => handleSelectUser(chatUser.id)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {(chatUser.name || 'M').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{chatUser.name}</p>
                                {chatUser.unreadCount > 0 && (
                                  <Badge variant="destructive" className="ml-2">
                                    {chatUser.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">
                                  Менеджер
                                </Badge>
                                <p className="text-xs opacity-80 truncate">
                                  {chatUser.lastMessage || 'Нет сообщений'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                      {/* Available managers to start chat */}
                      {managers.length > 0 && (
                        <>
                          <div className="pt-4 pb-2">
                            <p className="text-xs text-muted-foreground uppercase font-medium">
                              Начать чат с менеджером
                            </p>
                          </div>
                          {managers
                            .filter(
                              (m) =>
                                !chatUsers.some(
                                  (cu) =>
                                    cu.category === 'managers' && cu.counterpartId === m.id
                                )
                            )
                            .map((manager) => (
                              <div
                                key={manager.id}
                                className="flex items-center gap-3 w-full p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted border-muted-foreground/30"
                                onClick={() => handleStartManagerChat(manager.id)}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {(manager.name || 'M').slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{manager.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {manager.email}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-[10px]">
                                  Новый чат
                                </Badge>
                              </div>
                            ))}
                        </>
                      )}

                      {chatUsers.filter((u) => u.category === 'managers').length === 0 &&
                        managers.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            Нет доступных менеджеров
                          </div>
                        )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat - hidden on mobile when list is open */}
          <Card className={`lg:col-span-2 h-full max-h-[calc(100vh-8rem)] flex-col ${!showMobileChat ? 'hidden lg:flex' : 'flex'} overflow-hidden`}>
            <CardHeader className="pb-3 border-b flex-shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg">
                  {selectedUserId
                    ? chatUsers.find((u) => u.id === selectedUserId)?.name || 'Чат'
                    : 'Выберите диалог'}
                </CardTitle>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 h-full px-4" ref={scrollRef}>
                <div className="space-y-4 py-4">
                  {filteredMessages.map((msg, index) => {
                    const isOwn = msg.senderId === user?.id;
                    const isLastMessage = index === filteredMessages.length - 1;
                    const showDate =
                      index === 0 ||
                      formatDate(msg.timestamp) !==
                        formatDate(filteredMessages[index - 1]?.timestamp);

                    return (
                      <div key={msg.id} ref={isLastMessage ? lastMessageRef : null}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {formatDate(msg.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex gap-3 items-start ${
                            isOwn ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {/* Avatar */}
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarImage 
                              src={profileImages[msg.senderId]} 
                              alt={msg.senderName || 'User'} 
                            />
                            <AvatarFallback className={isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                              {(msg.senderName || 'U').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div
                            className={`flex flex-col max-w-[70%] ${
                              isOwn ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`rounded-lg px-4 py-2 shadow-sm ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {!isOwn && (
                                <p className="text-xs font-medium mb-1 opacity-90">
                                  {msg.senderName}
                                  <Badge variant="secondary" className="ml-2 text-[10px]">
                                    {msg.senderRole === 'manager' ? 'Менеджер' : msg.senderRole}
                                  </Badge>
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {msg.text.replace(/\s+/g, ' ')}
                              </p>

                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {msg.attachments.map((att) => (
                                    <a
                                      key={att.id}
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 text-xs p-1.5 rounded ${
                                        isOwn
                                          ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30'
                                          : 'bg-background hover:bg-muted-foreground/10'
                                      }`}
                                    >
                                      <File className="h-3 w-3" />
                                      <span className="truncate max-w-[150px]">
                                        {att.name}
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>

                            <span className="text-xs text-muted-foreground mt-1 px-1">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredMessages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Выберите диалог или начните общение
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t space-y-2 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs"
                    >
                      <File className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Введите сообщение..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  className="shrink-0"
                  onClick={handleSend}
                  disabled={isLoading || (!inputText.trim() && attachments.length === 0)}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
