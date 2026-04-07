import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  User,
  HeadphonesIcon,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseApp } from '@/lib/firebase';
import {
  uploadFile,
  ChatMessage,
  ChatAttachment,
  getOrCreateUserManagerThread,
  sendThreadMessage,
  subscribeToThreadMessages,
  ChatThread,
  getChatConfig,
  getAvailableManagers,
} from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';

const ChatWidget: React.FC = () => {
  const { user, isAuthenticated, isManager } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [privateThread, setPrivateThread] = useState<ChatThread | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesLengthRef = useRef(0);
  const isOpenRef = useRef(false);

  useEffect(() => {
    const handler = () => {
      setIsMinimized(false);
      setIsOpen(true);
    };
    window.addEventListener('open-manager-chat', handler);
    return () => window.removeEventListener('open-manager-chat', handler);
  }, []);

  // Resolve manager for private chat (use Firestore config)
  useEffect(() => {
    if (!isAuthenticated || !user || isManager) return;
    
    const findManager = async () => {
      setIsLoading(true);
      try {
        const cfg = await getChatConfig();
        if (cfg.defaultManagerId) {
          setManagerId(cfg.defaultManagerId);
          setThreadError(null);
        } else {
          // Fallback: try to find an available manager in users collection.
          const managers = await getAvailableManagers();
          if (managers.length > 0) {
            setManagerId(managers[0].id);
            setThreadError(null);
          } else {
            setThreadError('Не настроен менеджер для чата');
          }
        }
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось настроить чат с менеджером',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    findManager();
  }, [isAuthenticated, user, isManager]);

  // Initialize or get private thread for user-manager chat
  useEffect(() => {
    if (!isAuthenticated || !user || isManager || !managerId) return;

    const initThread = async () => {
      setIsThreadLoading(true);
      setThreadError(null);
      try {
        const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
        const thread = await getOrCreateUserManagerThread(user.id, managerId, displayName, user.email);
        if (thread) {
          setPrivateThread(thread);
        } else {
          setThreadError('Не удалось создать чат с менеджером');
        }
      } catch (error) {
        console.error('Error initializing thread:', error);
        const errMsg =
          (error && typeof error === 'object' && 'code' in error && (error as any).code)
            ? `${(error as any).code}: ${(error as any).message || ''}`
            : (error as any)?.message || String(error);
        const projectId = (firebaseApp as any)?.options?.projectId || 'unknown-project';
        setThreadError(`Ошибка при создании чата: ${errMsg} (projectId=${projectId}, uid=${user?.id || 'no-user'})`);
      } finally {
        setIsThreadLoading(false);
      }
    };
    initThread();
  }, [isAuthenticated, user, isManager, managerId]);

  // Subscribe to private thread messages
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let unsubscribe: (() => void) | undefined;

    messagesLengthRef.current = 0;

    if (privateThread) {
      unsubscribe = subscribeToThreadMessages(privateThread.id, (newMessages) => {
        setMessages(newMessages);

        const previousLength = messagesLengthRef.current;
        messagesLengthRef.current = newMessages.length;

        if (newMessages.length > previousLength && !isOpenRef.current) {
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.senderId !== user.id) {
            setHasUnread(true);
          }
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, isAuthenticated, privateThread]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current && isOpen && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Clear unread
  useEffect(() => {
    if (isOpen) setHasUnread(false);
  }, [isOpen]);

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
    if (!privateThread) {
      toast({
        title: 'Чат не готов',
        description: 'Подождите, пока создастся диалог с менеджером',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const uploadedAttachments: ChatAttachment[] = [];
      for (const file of attachments) {
        const attachment = await uploadFile(file);
        if (attachment) uploadedAttachments.push(attachment);
      }

      await sendThreadMessage(
        privateThread.id,
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
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Сегодня';
    if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  if (!isAuthenticated || user?.role === 'manager' || user?.role === 'admin') return null;

  let lastDate = '';

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fixed z-50 transition-all duration-300 ease-in-out bottom-0 left-0 right-0 top-0 sm:top-auto sm:bottom-6 sm:right-6 sm:left-auto sm:w-[420px] md:w-[480px] lg:w-[520px]"
        >
          <Card className="h-full sm:h-[600px] md:h-[650px] lg:h-[700px] shadow-2xl border-0 flex flex-col overflow-hidden">
            {/* Header */}
            <CardHeader className="p-4 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground flex flex-row items-center justify-between space-y-0 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <HeadphonesIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      Чат с менеджером
                    </span>
                    <Badge variant="secondary" className="text-xs bg-green-500 text-white border-0">
                      Онлайн
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-primary-foreground hover:bg-primary-foreground/20 lg:hidden"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-primary-foreground hover:bg-primary-foreground/20 lg:h-9 lg:w-9"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5 lg:h-4 lg:w-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full px-4" ref={scrollRef}>
                <div className="space-y-4 py-4">
                  {isThreadLoading && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground mt-2">Создание чата с менеджером...</p>
                    </div>
                  )}
                  
                  {threadError && (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                        <X className="h-6 w-6 text-red-500" />
                      </div>
                      <p className="text-red-600 font-medium mb-1">{threadError}</p>
                    </div>
                  )}
                  
                  {messages.length === 0 && !isThreadLoading && !threadError && (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <MessageCircle className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Добро пожаловать!</h3>
                      <p className="text-muted-foreground text-sm max-w-xs">
                        Напишите нам и мы ответим в ближайшее время. 
                        Менеджер поможет с выбором товаров и оформлением заказа.
                      </p>
                    </div>
                  )}

                  {messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    const isManager = msg.senderRole === 'manager' || msg.senderRole === 'admin';
                    const msgDate = formatDate(msg.timestamp);
                    const showDate = msgDate !== lastDate;
                    lastDate = msgDate;

                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && (
                          <div className="flex items-center justify-center my-4">
                            <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                              {msgDate}
                            </div>
                          </div>
                        )}
                        <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : isManager
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-muted'
                            }`}
                          >
                            <User className="h-4 w-4" />
                          </div>

                          <div className={`max-w-[80%] sm:max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                {isOwn ? 'Вы' : isManager ? 'Менеджер' : msg.senderName}
                              </span>
                              <span className="text-[10px] text-muted-foreground/60">
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>
                            <div
                              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                  : isManager
                                    ? 'bg-blue-500 text-white rounded-tl-sm'
                                    : 'bg-muted rounded-tl-sm'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>

                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {msg.attachments.map((att) => (
                                    <a
                                      key={att.id}
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                                        isOwn
                                          ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30'
                                          : isManager
                                            ? 'bg-white/20 hover:bg-white/30'
                                            : 'bg-background hover:bg-muted-foreground/10'
                                      }`}
                                    >
                                      <Paperclip className="h-3 w-3" />
                                      <span className="truncate">{att.name}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {isLoading && (
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <span
                            className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <div className="p-4 border-t bg-card shrink-0 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <div className="flex items-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Введите сообщение..."
                    className="min-h-[44px] h-auto py-3 text-base"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl"
                  onClick={handleSend}
                  disabled={isLoading || (!inputText.trim() && attachments.length === 0)}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={`${file.name}_${idx}`}
                      className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-xs"
                    >
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center mt-2 hidden sm:block">
                Нажмите Enter для отправки
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <Button
          size="lg"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-full shadow-2xl h-14 w-14 sm:h-16 sm:w-16 z-50 transition-transform hover:scale-110"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
              <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
            </span>
          )}
        </Button>
      )}

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default ChatWidget;
