'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Upload,
  Link as LinkIcon,
  Send,
  Loader2,
  FileText,
  Globe,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { notebooksApi, sourcesApi, chatApi } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  citations?: Array<{ sourceTitle: string; chunkContent: string }>;
}

export default function NotebookWorkspacePage() {
  const params = useParams();
  const notebookId = params.id as string;
  const queryClient = useQueryClient();

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: notebook, isLoading } = useQuery({
    queryKey: ['notebook', notebookId],
    queryFn: () => notebooksApi.get(notebookId),
  });

  // 채팅 히스토리 로드
  const { data: history } = useQuery({
    queryKey: ['chat-history', notebookId],
    queryFn: () => chatApi.getHistory(notebookId),
    enabled: !!notebookId,
  });

  useEffect(() => {
    if (history) setMessages(history);
  }, [history]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addUrlSource = useMutation({
    mutationFn: ({ url }: { url: string }) =>
      sourcesApi.addUrl(notebookId, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebook', notebookId] });
      setUrlInput('');
      setShowUrlInput(false);
    },
  });

  const deleteSource = useMutation({
    mutationFn: (sourceId: string) => sourcesApi.delete(notebookId, sourceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notebook', notebookId] }),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await sourcesApi.uploadFile(notebookId, file);
    queryClient.invalidateQueries({ queryKey: ['notebook', notebookId] });
    e.target.value = '';
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isStreaming) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsStreaming(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: userMessage,
    };
    setMessages((prev) => [...prev, userMsg]);

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ASSISTANT',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3051/api'}/notebooks/${notebookId}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: userMessage }),
        },
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'text') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: m.content + data.content }
                  : m,
              ),
            );
          } else if (data.type === 'done') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, citations: data.citations } : m,
              ),
            );
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'URL':
        return <Globe className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
        return 'bg-green-500/20 text-green-400';
      case 'PROCESSING':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'ERROR':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full gap-0 -m-6">
      {/* 소스 패널 (좌) */}
      <div className="w-[280px] flex flex-col border-r bg-muted/20">
        <div className="flex items-center gap-2 border-b p-4">
          <Link href="/knowledge">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="font-semibold text-sm truncate flex-1">{notebook?.title}</h2>
        </div>

        <div className="p-3 border-b space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            파일 업로드 (PDF/TXT)
          </Button>

          {showUrlInput ? (
            <div className="flex gap-1">
              <Input
                placeholder="URL 입력..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && urlInput && addUrlSource.mutate({ url: urlInput })
                }
                className="text-xs h-8"
                autoFocus
              />
              <Button
                size="sm"
                className="h-8 px-2"
                onClick={() => urlInput && addUrlSource.mutate({ url: urlInput })}
                disabled={addUrlSource.isPending}
              >
                {addUrlSource.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={() => setShowUrlInput(true)}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              URL 추가
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            소스 ({notebook?.sources?.length || 0})
          </p>
          <div className="space-y-2">
            {notebook?.sources?.map((source: any) => (
              <div
                key={source.id}
                className="group flex items-center gap-2 rounded-md border bg-background p-2 text-xs"
              >
                <span className="text-muted-foreground flex-shrink-0">
                  {getSourceIcon(source.type)}
                </span>
                <span className="flex-1 truncate">{source.title}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0',
                    getStatusColor(source.status),
                  )}
                >
                  {source.status === 'READY'
                    ? '완료'
                    : source.status === 'PROCESSING'
                      ? '처리중'
                      : source.status === 'ERROR'
                        ? '오류'
                        : '대기'}
                </span>
                <button
                  onClick={() => deleteSource.mutate(source.id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 채팅 패널 (중) */}
      <div className="flex flex-1 flex-col">
        <div className="border-b p-4">
          <h3 className="font-semibold text-sm">AI 채팅</h3>
          <p className="text-xs text-muted-foreground">
            소스 문서를 기반으로 질문하세요
          </p>
        </div>

        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center text-muted-foreground">
              <p className="text-4xl mb-4">💬</p>
              <p className="font-medium">소스를 추가하고 AI에게 질문하세요</p>
              <p className="text-sm mt-1">PDF, 웹페이지 등을 업로드하면 AI가 분석합니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.role === 'USER' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg p-3 text-sm',
                      msg.role === 'USER'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground">참조 출처</p>
                        {msg.citations.map((c, i) => (
                          <div
                            key={i}
                            className="text-[10px] text-muted-foreground bg-background/50 rounded p-1"
                          >
                            <span className="font-medium">[{c.sourceTitle}]</span>{' '}
                            {c.chunkContent}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={chatEndRef} />
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="소스에 대해 질문하세요..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isStreaming}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isStreaming}
              size="icon"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
