import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, X, File, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  sendMessage,
  getMessages,
  subscribeToMessages,
  uploadFile,
  ChatMessage,
  ChatAttachment,
} from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';

interface ChatProps {
  orderId?: string;
  roomName?: string;
  className?: string;
}

const Chat: React.FC<ChatProps> = ({ orderId, roomName = 'Общий чат', className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages and subscribe to updates
  useEffect(() => {
    if (!user) return;

    // Initial load
    getMessages(orderId).then(setMessages);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToMessages((newMessages) => {
      setMessages(newMessages);
    }, orderId);

    return () => unsubscribe();
  }, [user, orderId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!user || (!inputText.trim() && attachments.length === 0)) return;

    setIsLoading(true);
    try {
      // Upload attachments
      const uploadedAttachments: ChatAttachment[] = [];
      for (const file of attachments) {
        const attachment = await uploadFile(file, orderId);
        if (attachment) {
          uploadedAttachments.push(attachment);
        }
      }

      // Send message
      await sendMessage(
        inputText.trim(),
        user.id,
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        user.role,
        uploadedAttachments,
        orderId
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

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(msg);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  return (
    <Card className={`h-[500px] flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{orderId ? `Чат по заказу №${orderId.slice(-6)}` : roomName}</span>
          {orderId && <Badge variant="outline">Заказ</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-3 pt-0">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex justify-center my-4">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {date}
                  </span>
                </div>
                {dateMessages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col mb-3 ${isOwn ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-medium mb-1 opacity-80">
                            {msg.senderName}
                            {msg.senderRole === 'admin' && (
                              <Badge variant="secondary" className="ml-1 text-[10px]">
                                Админ
                              </Badge>
                            )}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>

                        {/* Attachments */}
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
                                <span className="truncate max-w-[150px]">{att.name}</span>
                                <Download className="h-3 w-3 ml-auto" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 px-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Нет сообщений. Начните общение!
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 py-2 border-t">
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

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t">
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
      </CardContent>
    </Card>
  );
};

export default Chat;
