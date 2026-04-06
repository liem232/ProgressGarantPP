import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Paperclip, X, File, ArrowLeft, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  uploadFile,
  ChatMessage,
  ChatAttachment,
  listUserManagerThreadsForStaff,
  subscribeToThreadMessages,
  sendThreadMessage,
  ChatThread,
} from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';

interface ChatUser {
  id: string;
  name: string;
  role: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

const ManagerChat: React.FC = () => {
  const { user, isManager } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authorization
  useEffect(() => {
    if (!isManager) {
      navigate('/');
    }
  }, [isManager, navigate]);

  // Load threads and build user list
  useEffect(() => {
    if (!isManager || !user?.id) return;

    listUserManagerThreadsForStaff(user.id)
      .then((allThreads) => {
        buildUserList(allThreads);
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
        setChatUsers([]);
      });
  }, [isManager, user?.id]);

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

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedUserId]);

  const buildUserList = (allThreads: ChatThread[]) => {
    const users = allThreads.map((t) => {
      const lastMsgTs = t.lastMessage?.timestamp && typeof t.lastMessage.timestamp === 'object' && 'toDate' in t.lastMessage.timestamp
        ? (t.lastMessage.timestamp as any).toDate()
        : t.lastMessage?.timestamp
          ? new Date(t.lastMessage.timestamp as any)
          : undefined;

      const displayName =
        t.userName ||
        t.userEmail ||
        (t.lastMessage?.senderRole === 'user' ? t.lastMessage.senderName : undefined) ||
        t.userId;

      return {
        id: t.id,
        name: displayName,
        role: 'user-manager',
        lastMessage: t.lastMessage?.text,
        lastMessageTime: lastMsgTs,
        unreadCount: 0,
      } as ChatUser;
    });

    setChatUsers(users.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
    }));
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

  if (!isManager) {
    return null;
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
          {/* Users List */}
          <Card className="lg:col-span-1 h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Диалоги
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-1 p-4">
                  {chatUsers.map((chatUser) => (
                    <div
                      key={chatUser.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUserId === chatUser.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedUserId(chatUser.id)}
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
                  ))}

                  {chatUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Пока нет сообщений
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="lg:col-span-2 h-full flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">
                {selectedUserId
                  ? chatUsers.find((u) => u.id === selectedUserId)?.name || 'Чат'
                  : 'Выберите диалог'}
              </CardTitle>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-20rem)] px-4" ref={scrollRef}>
                <div className="space-y-4 py-4">
                  {filteredMessages.map((msg, index) => {
                    const isOwn = msg.senderId === user?.id;
                    const showDate =
                      index === 0 ||
                      formatDate(msg.timestamp) !==
                        formatDate(filteredMessages[index - 1]?.timestamp);

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {formatDate(msg.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex flex-col ${
                            isOwn ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-xs font-medium mb-1 opacity-80">
                                {msg.senderName}
                                {msg.senderRole === 'manager' && (
                                  <Badge variant="secondary" className="ml-2 text-[10px]">
                                    Менеджер
                                  </Badge>
                                )}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>

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
            <div className="p-4 border-t space-y-2">
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
