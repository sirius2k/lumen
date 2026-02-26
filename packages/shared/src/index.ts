// Auth DTOs
export interface RegisterDto {
  email: string;
  name: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

// User
export interface UserDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Notebook
export interface NotebookDto {
  id: string;
  title: string;
  description?: string;
  userId: string;
  sourceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotebookDto {
  title: string;
  description?: string;
}

// Source
export type SourceType = 'PDF' | 'TXT' | 'URL' | 'YOUTUBE';

export interface SourceDto {
  id: string;
  notebookId: string;
  type: SourceType;
  title: string;
  url?: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR';
  createdAt: string;
}

// Chat
export interface MessageDto {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  citations?: CitationDto[];
  createdAt: string;
}

export interface CitationDto {
  sourceId: string;
  sourceTitle: string;
  chunkContent: string;
}

export interface CreateMessageDto {
  content: string;
}

// Note
export interface NoteDto {
  id: string;
  title: string;
  content: string;
  notebookId?: string;
  isAiGenerated: boolean;
  tags: TagDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteDto {
  title: string;
  content?: string;
  notebookId?: string;
  tagIds?: string[];
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  tagIds?: string[];
}

// Task
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface ProjectDto {
  id: string;
  name: string;
  color?: string;
  taskCount: number;
  createdAt: string;
}

export interface CreateProjectDto {
  name: string;
  color?: string;
}

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  projectId?: string;
  project?: ProjectDto;
  tags: TagDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueDate?: string;
  projectId?: string;
  tagIds?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
  projectId?: string;
  tagIds?: string[];
}

// Calendar
export interface EventDto {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color?: string;
  createdAt: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  color?: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  color?: string;
}

// Bookmark
export interface BookmarkDto {
  id: string;
  url: string;
  title: string;
  description?: string;
  aiSummary?: string;
  favicon?: string;
  isRead: boolean;
  tags: TagDto[];
  createdAt: string;
}

export interface CreateBookmarkDto {
  url: string;
  tagIds?: string[];
}

export interface UpdateBookmarkDto {
  title?: string;
  description?: string;
  isRead?: boolean;
  tagIds?: string[];
}

// Tag
export interface TagDto {
  id: string;
  name: string;
  color?: string;
}

export interface CreateTagDto {
  name: string;
  color?: string;
}

// Search
export interface SearchResultDto {
  type: 'note' | 'source' | 'bookmark' | 'task';
  id: string;
  title: string;
  excerpt: string;
  relevance: number;
}

// AI
export interface BriefingDto {
  greeting: string;
  todayTasks: TaskDto[];
  recentNotes: NoteDto[];
  briefingText: string;
  generatedAt: string;
}
