'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { notesApi } from '@/lib/api/client';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function NotesPage() {
  const queryClient = useQueryClient();
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const { data: notes = [] } = useQuery<any[]>({
    queryKey: ['notes'],
    queryFn: () => notesApi.list(),
  });

  const createNote = useMutation({
    mutationFn: notesApi.create,
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setSelectedNote(note);
      setEditTitle(note.title);
      setEditContent(note.content || '');
      setIsEditing(true);
    },
  });

  const updateNote = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => notesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsEditing(false);
    },
  });

  const deleteNote = useMutation({
    mutationFn: notesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (selectedNote) setSelectedNote(null);
    },
  });

  const handleNewNote = () => {
    createNote.mutate({ title: '새 노트', content: '' });
  };

  const handleSelectNote = (note: any) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || '');
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!selectedNote) return;
    updateNote.mutate({
      id: selectedNote.id,
      data: { title: editTitle, content: editContent },
    });
  };

  return (
    <div className="flex h-full -m-6 gap-0">
      {/* 노트 목록 (좌) */}
      <div className="w-[280px] flex flex-col border-r">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            노트
          </h2>
          <Button size="sm" onClick={handleNewNote} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            새 노트
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-sm">
              <p>노트가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notes.map((note: any) => (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`w-full text-left rounded-md p-3 hover:bg-muted transition-colors ${
                    selectedNote?.id === note.id ? 'bg-muted' : ''
                  }`}
                >
                  <p className="font-medium text-sm truncate">{note.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {note.content?.slice(0, 60) || '내용 없음'}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {format(new Date(note.updatedAt), 'MM/dd HH:mm', { locale: ko })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 노트 편집기 (우) */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <div className="flex items-center justify-between border-b p-4">
              <input
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  setIsEditing(true);
                }}
                className="text-xl font-bold bg-transparent border-none outline-none flex-1"
                placeholder="노트 제목..."
              />
              <div className="flex gap-2">
                {isEditing && (
                  <Button size="sm" onClick={handleSave} className="gap-1">
                    <Save className="h-3.5 w-3.5" />
                    저장
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNote.mutate(selectedNote.id)}
                  className="hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                setIsEditing(true);
              }}
              className="flex-1 resize-none p-6 bg-transparent border-none outline-none text-sm leading-relaxed"
              placeholder="마크다운으로 작성하세요..."
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">노트를 선택하거나 새로 만드세요</p>
            <Button onClick={handleNewNote} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              새 노트
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
