import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Pencil, Trash2, Video, FileText, HelpCircle, File } from 'lucide-react';
import type { Lesson, LessonType } from '@/types/database';

const LESSON_TYPE_ICONS: Record<LessonType, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  file: <File className="h-4 w-4" />,
};

const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  video: 'Video',
  text: 'Text',
  quiz: 'Quiz',
  file: 'File',
};

interface SortableLessonProps {
  lesson: Lesson;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableLesson({ lesson, index, onEdit, onDelete }: SortableLessonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lessonType = lesson.content_type as LessonType;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:bg-muted transition-colors"
    >
      <button
        className="cursor-grab hover:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="text-sm text-muted-foreground min-w-[24px]">{index + 1}</span>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center shrink-0">
          {LESSON_TYPE_ICONS[lessonType] || <File className="h-4 w-4" />}
        </div>
        <span className="font-medium truncate">{lesson.title}</span>
        <Badge variant="secondary" className="shrink-0 text-xs">
          {LESSON_TYPE_LABELS[lessonType] || 'Unknown'}
        </Badge>
        {lesson.duration && (
          <span className="text-xs text-muted-foreground shrink-0">
            {lesson.duration} min
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
