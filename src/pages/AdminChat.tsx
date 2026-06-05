import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, File, MessageSquare, Paperclip, Send, Users, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getDocById } from '@/services/firestoreService';
import {
  ChatAttachment,
  ChatMessage,
  ChatThread,
  getAvailableClients,
  getAvailableManagers,
  getOrCreateStaffThread,
  getOrCreateUserManagerThread,
  listStaffThreadsForAdmin,
  listUserManagerThreadsForStaff,
  resolveSupportAgentId,
  sendThreadMessage,
  subscribeToThreadMessages,
  uploadFile,
} from '@/services/chatService';

interface ChatUser {
  id: string;
  name: string;
  role: 'user' | 'manager';
  category: 'clients' | 'managers';
  counterpartId?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

interface DirectoryUser {
  id: string;
  name: string;
  email: string;
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
  const [managers, setManagers] = useState<DirectoryUser[]>([]);
  const [clients, setClients] = useState<DirectoryUser[]>([]);
  const [profileImages, setProfileImages] = useState<Record<string, string>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUserProfileImage = async (userId: string): Promise<string | null> => {
    try {
      const userDoc = await getDocById('users', userId) as any;
      return userDoc?.profileImage || null;
    } catch (error) {
      console.error('Error fetching user profile image:', error);
      return null;
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

  const buildUserList = (
    allThreads: ChatThread[],
    category: 'clients' | 'managers',
    managerDirectory: DirectoryUser[]
  ) => {
    const users = allThreads.map((thread) => {
      const lastMsgTs =
        thread.lastMessage?.timestamp &&
        typeof thread.lastMessage.timestamp === 'object' &&
        'toDate' in thread.lastMessage.timestamp
          ? (thread.lastMessage.timestamp as any).toDate()
          : thread.lastMessage?.timestamp
            ? new Date(thread.lastMessage.timestamp as any)
            : undefined;

      const isStaffThread = thread.type === 'staff';
      const isSelfStaffThread =
        isStaffThread &&
        thread.participantIds.length > 0 &&
        thread.participantIds.every((id) => id === user?.id);
      const staffCounterpartId = isStaffThread
        ? thread.participantIds.find((id) => id !== user?.id)
        : undefined;

      const displayName = isSelfStaffThread
        ? 'Личный чат'
        : isStaffThread
          ? managerDirectory.find((manager) => manager.id === staffCounterpartId)?.name || 'Менеджер'
        : thread.userName || thread.userEmail || thread.userId || 'Клиент';

      return {
        id: thread.id,
        name: displayName,
        role: isStaffThread ? 'manager' : 'user',
        category,
        counterpartId: isSelfStaffThread ? undefined : isStaffThread ? staffCounterpartId : thread.userId,
        lastMessage: thread.lastMessage?.text,
        lastMessageTime: lastMsgTs,
        unreadCount: 0,
      } as ChatUser;
    });

    setChatUsers((prev) => {
      const otherTypeUsers = prev.filter((entry) => entry.category !== category);
      return [...otherTypeUsers, ...users].sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      });
    });
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin || !user?.id) return;

    listUserManagerThreadsForStaff().then((threads) => {
      buildUserList(threads, 'clients', managers);
    });

    listStaffThreadsForAdmin(user.id).then((threads) => {
      buildUserList(threads, 'managers', managers);
    });

    getAvailableManagers().then((availableManagers) => {
      setManagers(availableManagers);
    });

    getAvailableClients().then((availableClients) => {
      setClients(availableClients);
    });
  }, [isAdmin, user?.id]);

  useEffect(() => {
    if (!isAdmin || !user?.id || managers.length === 0) return;

    listStaffThreadsForAdmin(user.id).then((threads) => {
      buildUserList(threads, 'managers', managers);
    });
  }, [isAdmin, user?.id, managers]);

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

  useEffect(() => {
    if (lastMessageRef.current && messages.length > 0) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedUserId]);

  useEffect(() => {
    const uniqueSenderIds = [...new Set(messages.map((message) => message.senderId))];

    uniqueSenderIds.forEach(async (senderId) => {
      if (!profileImages[senderId]) {
        const imageUrl = await getUserProfileImage(senderId);
        if (imageUrl) {
          setProfileImages((prev) => ({
            ...prev,
            [senderId]: imageUrl,
          }));
        }
      }
    });
  }, [messages, profileImages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxFileSize = 900 * 1024;
    const validFiles: File[] = [];
    const rejectedFiles: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.size <= maxFileSize) {
        validFiles.push(file);
      } else {
        rejectedFiles.push(`${file.name} (${(file.size / 1024).toFixed(0)}KB)`);
      }
    });

    if (rejectedFiles.length > 0) {
      toast({
        title: 'Файлы слишком большие',
        description: `Максимальный размер: 900KB. Отклонены: ${rejectedFiles.join(', ')}`,
        variant: 'destructive',
      });
    }

    if (validFiles.length > 0) {
      setAttachments((prev) => [...prev, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSend = async () => {
    if (!user || (!inputText.trim() && attachments.length === 0) || !selectedUserId) {
      if (!selectedUserId) {
        toast({
          title: 'Выберите диалог',
          description: 'Сначала выберите чат слева',
          variant: 'destructive',
        });
      }
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleSelectUser = (threadId: string) => {
    setSelectedUserId(threadId);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedUserId(null);
  };

  const refreshClientThreads = async () => {
    const threads = await listUserManagerThreadsForStaff();
    buildUserList(threads, 'clients', managers);
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

  const handleOpenPersonalChat = async () => {
    if (!user?.id) return;

    try {
      const thread = await getOrCreateStaffThread(user.id, user.id);
      if (thread) {
        const threads = await listStaffThreadsForAdmin(user.id);
        buildUserList(threads, 'managers', managers);
        handleSelectUser(thread.id);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось открыть личный чат администратора',
        variant: 'destructive',
      });
    }
  };

  const handleStartClientChat = async (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);
    if (!client) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось определить клиента для нового чата',
        variant: 'destructive',
      });
      return;
    }

    try {
      const supportAgentId = await resolveSupportAgentId();
      if (!supportAgentId) {
        toast({
          title: 'Нет ответственного сотрудника',
          description: 'Сначала настройте менеджера по умолчанию или добавьте менеджера в систему',
          variant: 'destructive',
        });
        return;
      }

      const thread = await getOrCreateUserManagerThread(
        client.id,
        supportAgentId,
        client.name,
        client.email
      );

      if (thread) {
        await refreshClientThreads();
        handleSelectUser(thread.id);
      }
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message || '')
          : String(error || '');

      toast({
        title: 'Ошибка',
        description: errorMessage
          ? `Не удалось создать чат с клиентом: ${errorMessage}`
          : 'Не удалось создать чат с клиентом',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  const selectedChatName =
    chatUsers.find((chatUser) => chatUser.id === selectedUserId)?.name || 'Чат';
  const personalChat = chatUsers.find(
    (chatUser) => chatUser.category === 'managers' && !chatUser.counterpartId
  );

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="container mx-auto h-[calc(100vh-6rem)] max-w-7xl px-4">
        <div className="mb-4 flex items-center gap-4 sm:mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold sm:text-2xl">Чаты администратора</h1>
          <Badge variant="secondary">Admin Panel</Badge>
        </div>

        <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          <Card
            className={`h-full flex-col overflow-hidden lg:col-span-1 ${
              showMobileChat ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <CardHeader className="shrink-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Диалоги
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
              <div className="flex border-b">
                <button
                  className={`flex-1 py-2 text-sm font-medium ${
                    activeTab === 'clients'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('clients')}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    Клиенты
                  </span>
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium ${
                    activeTab === 'managers'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('managers')}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Менеджеры
                  </span>
                </button>
              </div>

              <ScrollArea className="h-[calc(100vh-18rem)] px-4">
                <div className="space-y-1">
                  {activeTab === 'clients' ? (
                    <>
                      {chatUsers.filter((entry) => entry.category === 'clients').length === 0 && (
                        <div className="py-8 text-center text-muted-foreground">
                          Пока нет активных диалогов с клиентами
                        </div>
                      )}

                      {chatUsers
                        .filter((entry) => entry.category === 'clients')
                        .map((chatUser) => (
                          <div
                            key={chatUser.id}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors ${
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
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="truncate font-medium">{chatUser.name}</p>
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
                                <p className="truncate text-xs opacity-80">
                                  {chatUser.lastMessage || 'Нет сообщений'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                      {clients.length > 0 && (
                        <>
                          <div className="pb-2 pt-4">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                              Начать чат с клиентом
                            </p>
                          </div>

                          {clients
                            .filter(
                              (client) =>
                                !chatUsers.some(
                                  (chatUser) =>
                                    chatUser.category === 'clients' &&
                                    chatUser.counterpartId === client.id
                                )
                            )
                            .map((client) => (
                              <div
                                key={client.id}
                                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-muted-foreground/20 p-3 transition-colors hover:bg-muted"
                                onClick={() => handleStartClientChat(client.id)}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {(client.name || 'U').slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium">{client.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {client.email}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-[10px]">
                                  Новый чат
                                </Badge>
                              </div>
                            ))}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border border-muted-foreground/20 p-3 transition-colors ${
                          personalChat && selectedUserId === personalChat.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                        onClick={handleOpenPersonalChat}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>Я</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">Личный чат</p>
                          <p className="truncate text-xs text-muted-foreground">
                            Заметки и сообщения самому себе
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          Личное
                        </Badge>
                      </div>

                      {chatUsers
                        .filter((entry) => entry.category === 'managers')
                        .filter((entry) => entry.counterpartId)
                        .map((chatUser) => (
                          <div
                            key={chatUser.id}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors ${
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
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="truncate font-medium">{chatUser.name}</p>
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
                                <p className="truncate text-xs opacity-80">
                                  {chatUser.lastMessage || 'Нет сообщений'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                      {managers.length > 0 && (
                        <>
                          <div className="pb-2 pt-4">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                              Начать чат с менеджером
                            </p>
                          </div>
                          {managers
                            .filter(
                              (manager) =>
                                !chatUsers.some(
                                  (chatUser) =>
                                    chatUser.category === 'managers' &&
                                    chatUser.counterpartId === manager.id
                                )
                            )
                            .map((manager) => (
                              <div
                                key={manager.id}
                                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-muted-foreground/20 p-3 transition-colors hover:bg-muted"
                                onClick={() => handleStartManagerChat(manager.id)}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {(manager.name || 'M').slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium">{manager.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">
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

                      {chatUsers.filter((entry) => entry.category === 'managers').length === 0 &&
                        managers.length === 0 && (
                          <div className="py-8 text-center text-muted-foreground">
                            Нет доступных менеджеров
                          </div>
                        )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card
            className={`h-full max-h-[calc(100vh-8rem)] flex-col overflow-hidden lg:col-span-2 ${
              !showMobileChat ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <CardHeader className="shrink-0 border-b pb-3">
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
                  {selectedUserId ? selectedChatName : 'Выберите диалог'}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
              <ScrollArea className="flex-1 px-4" ref={scrollRef}>
                <div className="space-y-4 py-4">
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === user?.id;
                    const isLastMessage = index === messages.length - 1;
                    const showDate =
                      index === 0 ||
                      formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp);

                    return (
                      <div key={message.id} ref={isLastMessage ? lastMessageRef : null}>
                        {showDate && (
                          <div className="my-4 flex justify-center">
                            <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                        )}

                        <div className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage
                              src={profileImages[message.senderId]}
                              alt={message.senderName || 'User'}
                            />
                            <AvatarFallback
                              className={isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                            >
                              {(message.senderName || 'U').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className={`flex max-w-[70%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`rounded-lg px-4 py-2 shadow-sm ${
                                isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              }`}
                            >
                              {!isOwn && (
                                <div className="mb-1 text-xs font-medium opacity-90">
                                  {message.senderName}
                                  <Badge variant="secondary" className="ml-2 text-[10px]">
                                    {message.senderRole === 'manager'
                                      ? 'Менеджер'
                                      : message.senderRole === 'admin'
                                        ? 'Админ'
                                        : 'Клиент'}
                                  </Badge>
                                </div>
                              )}

                              <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">
                                {message.text.replace(/\s+/g, ' ')}
                              </p>

                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                  {message.attachments.map((attachment) => {
                                    const isExcel = attachment.name.match(/\.(xlsx|xls|xlsm|csv)$/i);
                                    const isPdf = attachment.name.match(/\.(pdf)$/i);
                                    const isImage = attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                    const isDoc = attachment.name.match(/\.(doc|docx|txt|rtf)$/i);

                                    return (
                                      <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={attachment.name}
                                        className={`flex items-center gap-2 rounded-lg p-2 text-xs transition-colors ${
                                          isOwn
                                            ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30'
                                            : 'bg-background hover:bg-muted-foreground/10'
                                        }`}
                                      >
                                        {isExcel ? (
                                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-green-600">
                                            <span className="text-[7px] font-bold text-white">XLS</span>
                                          </div>
                                        ) : isPdf ? (
                                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-red-600">
                                            <span className="text-[7px] font-bold text-white">PDF</span>
                                          </div>
                                        ) : isImage ? (
                                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-500">
                                            <File className="h-3 w-3 text-white" />
                                          </div>
                                        ) : isDoc ? (
                                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-700">
                                            <span className="text-[7px] font-bold text-white">DOC</span>
                                          </div>
                                        ) : (
                                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-500">
                                            <File className="h-3 w-3 text-white" />
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <span className="block max-w-[150px] truncate" title={attachment.name}>
                                            {attachment.name}
                                          </span>
                                          <span className="text-[9px] opacity-70">
                                            {(attachment.size / 1024).toFixed(0)} KB
                                          </span>
                                        </div>
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <span className="mt-1 px-1 text-xs text-muted-foreground">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {messages.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      Выберите диалог или начните общение
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            <div className="space-y-2 border-t p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => {
                    const isExcel = file.name.match(/\.(xlsx|xls|xlsm|csv)$/i);
                    const isPdf = file.name.match(/\.(pdf)$/i);
                    const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    const isDoc = file.name.match(/\.(doc|docx|txt|rtf)$/i);

                    return (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-1.5 rounded bg-muted px-2 py-1.5 text-xs"
                      >
                        {isExcel ? (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-600">
                            <span className="text-[6px] font-bold text-white">XLS</span>
                          </div>
                        ) : isPdf ? (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-600">
                            <span className="text-[6px] font-bold text-white">PDF</span>
                          </div>
                        ) : isImage ? (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-500">
                            <File className="h-3 w-3 text-white" />
                          </div>
                        ) : isDoc ? (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-700">
                            <span className="text-[6px] font-bold text-white">DOC</span>
                          </div>
                        ) : (
                          <File className="h-3.5 w-3.5 text-muted-foreground" />
                        )}

                        <span className="max-w-[100px] truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-4 w-4 p-0"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept=".xlsx,.xls,.xlsm,.csv,.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
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
                  onChange={(event) => setInputText(event.target.value)}
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
