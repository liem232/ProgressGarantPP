import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Paperclip, X, File, ArrowLeft, MessageSquare, Users, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  uploadFile,
  ChatMessage,
  ChatAttachment,
  listUserManagerThreadsForStaff,
  listStaffThreadsForStaff,
  getAvailableManagers,
  subscribeToThreadMessages,
  sendThreadMessage,
  ChatThread,
} from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';
import { getDocById } from '@/services/firestoreService';

interface ChatUser {
  id: string;
  name: string;
  role: 'user' | 'admin';
  category: 'clients' | 'admin';
  counterpartId?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

const ManagerChat: React.FC = () => {
  const { user, isManager, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'clients' | 'admin'>('clients');
  const [admins, setAdmins] = useState<{id: string, name: string, email: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load threads and build user list
  useEffect(() => {
    if (!isManager || !user?.id) return;

    // Client threads
    listUserManagerThreadsForStaff(user.id)
      .then(async (allThreads) => {
        await buildUserList(allThreads, 'clients');
      })
      .catch((error) => {
        console.error('Error loading manager threads:', error);
        const errMsg =
          (error && typeof error === 'object' && 'code' in error && (error as any).code)
            ? `${(error as any).code}: ${(error as any).message || ''}`
            : (error as any)?.message || String(error);
        toast({
          title: 'Ошибка',
          description: `Не удалось загрузить диалоги. ${errMsg}`,
          variant: 'destructive',
        });
        setChatUsers((prev) => prev.filter((u) => u.category !== 'clients'));
      });

    // Staff threads with admin
    listStaffThreadsForStaff(user.id)
      .then(async (staffThreads) => {
        await buildUserList(staffThreads, 'admin');
      })
      .catch((error) => {
        console.error('Error loading staff threads:', error);
      });

    // Resolve staff names (admins/managers) for display in staff threads
    getAvailableManagers()
      .then((staff) => {
        setAdmins(staff);
      })
      .catch(() => {
        setAdmins([]);
      });
  }, [isManager, user?.id]);

  useEffect(() => {
    if (!isManager || !user?.id) return;
    if (admins.length === 0) return;

    listStaffThreadsForStaff(user.id).then(async (staffThreads) => {
      await buildUserList(staffThreads, 'admin');
    });
  }, [isManager, user?.id, admins]);

  // Subscribe to messages for selected thread
  useEffect(() => {
    if (!isManager || !selectedUserId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToThreadMessages(selectedUserId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [isManager, selectedUserId]);

  // Auto-scroll to last message with smooth animation
  useEffect(() => {
    if (lastMessageRef.current && messages.length > 0) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Получить актуальное имя пользователя из БД
  const getUserDisplayName = async (userId: string, fallbackName?: string): Promise<string> => {
    try {
      const userDoc = await getDocById('users', userId) as any;
      if (userDoc) {
        const firstName = userDoc.firstName || '';
        const lastName = userDoc.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || userDoc.username || userDoc.email || fallbackName || 'Клиент';
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return fallbackName || 'Клиент';
  };

  const buildUserList = async (allThreads: ChatThread[], category: 'clients' | 'admin') => {
    const users = await Promise.all(
      allThreads
        .filter((t) => (category === 'clients' ? t.type === 'user-manager' : t.type === 'staff'))
        .map(async (t) => {
          const lastMsgTs = t.lastMessage?.timestamp && typeof t.lastMessage.timestamp === 'object' && 'toDate' in t.lastMessage.timestamp
            ? (t.lastMessage.timestamp as any).toDate()
            : t.lastMessage?.timestamp
              ? new Date(t.lastMessage.timestamp as any)
              : undefined;

          const isStaffThread = t.type === 'staff';
          const counterpartId = isStaffThread
            ? t.participantIds.find((id) => id !== user?.id)
            : undefined;

          let displayName: string;
          if (isStaffThread) {
            displayName = admins.find((a) => a.id === counterpartId)?.name || 'Админ';
          } else {
            // Для клиентов загружаем актуальное имя из БД
            const fallbackName = t.userName || t.userEmail || (t.lastMessage?.senderRole === 'user' ? t.lastMessage.senderName : undefined);
            displayName = t.userId ? await getUserDisplayName(t.userId, fallbackName) : (fallbackName || 'Клиент');
          }

          return {
            id: t.id,
            name: displayName,
            role: isStaffThread ? 'admin' : 'user',
            category,
            counterpartId,
            lastMessage: t.lastMessage?.text,
            lastMessageTime: lastMsgTs,
            unreadCount: 0,
          } as ChatUser;
        })
    );

    setChatUsers((prev) => {
      const other = prev.filter((u) => u.category !== category);
      return [...other, ...users].sort((a, b) => {
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

  if (!isManager || isAdmin) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Доступ ограничен</h2>
              <p className="text-muted-foreground mb-4">
                Эта страница доступна только менеджерам
              </p>
              <Button onClick={() => navigate('/')}>На главную</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Чаты с клиентами</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Users List - hidden on mobile when chat is open */}
          <Card className={`lg:col-span-1 h-full ${showMobileChat ? 'hidden lg:flex' : 'flex'} flex-col`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Диалоги
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
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
                    activeTab === 'admin'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('admin')}
                >
                  <Shield className="h-4 w-4" />
                  Админ
                </button>
              </div>

              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-1 p-4">
                  {activeTab === 'clients' ? (
                    chatUsers.filter((u) => u.category === 'clients').length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Пока нет сообщений
                      </div>
                    ) : (
                      chatUsers
                        .filter((u) => u.category === 'clients')
                        .map((chatUser) => (
                          <div
                            key={chatUser.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
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
                              <p className="text-xs opacity-80 truncate">
                                {chatUser.lastMessage || 'Нет сообщений'}
                              </p>
                            </div>
                          </div>
                        ))
                    )
                  ) : (
                    chatUsers.filter((u) => u.category === 'admin').length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Чат с админом не создан
                      </div>
                    ) : (
                      chatUsers
                        .filter((u) => u.category === 'admin')
                        .map((chatUser) => (
                          <div
                            key={chatUser.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedUserId === chatUser.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => handleSelectUser(chatUser.id)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {(chatUser.name || 'A').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{chatUser.name}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">Админ</Badge>
                                <p className="text-xs opacity-80 truncate">
                                  {chatUser.lastMessage || 'Нет сообщений'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                    )
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat - hidden on mobile when list is open */}
          <Card className={`lg:col-span-2 h-full flex-col ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
            <CardHeader className="pb-3 border-b">
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
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-20rem)] px-4" ref={scrollRef}>
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
                          className={`flex gap-2 ${
                            isOwn ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {/* Avatar */}
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className={isOwn ? 'bg-primary text-primary-foreground' : ''}>
                              {(msg.senderName || 'U').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div
                            className={`flex flex-col ${
                              isOwn ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                              style={{ wordBreak: 'normal' }}
                            >
                              {!isOwn && (
                                <p className="text-xs font-medium mb-1 opacity-80">
                                  {msg.senderName}
                                  {msg.senderRole === 'manager' && (
                                    <Badge variant="secondary" className="ml-2 text-[10px]">
                                      Менеджер
                                    </Badge>
                                  )}
                                  {msg.senderRole === 'admin' && (
                                    <Badge variant="secondary" className="ml-2 text-[10px]">
                                      Админ
                                    </Badge>
                                  )}
                                </p>
                              )}
                              <p className="whitespace-pre-wrap break-words">{msg.text.replace(/\s+/g, ' ')}</p>

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

export default ManagerChat;
