import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { SortableLesson } from './SortableLesson';
import type { CourseModule, Lesson } from '@/types/database';

interface ModuleWithLessons extends CourseModule {
  lessons: Lesson[];
}

interface SortableModuleProps {
  module: ModuleWithLessons;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onReorderLessons: (lessons: Lesson[]) => void;
}

export function SortableModule({
  module,
  index,
  onEdit,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderLessons,
}: SortableModuleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = module.lessons.findIndex((l) => l.id === active.id);
      const newIndex = module.lessons.findIndex((l) => l.id === over.id);
      const newLessons = arrayMove(module.lessons, oldIndex, newIndex);
      onReorderLessons(newLessons);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Accordion type="single" collapsible className="border rounded-lg overflow-hidden bg-card">
        <AccordionItem value={module.id} className="border-0">
          <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
            <div className="flex items-center gap-3 flex-1 text-left">
              <button
                className="cursor-grab hover:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-muted-foreground">
                Module {index + 1}
              </span>
              <span className="font-semibold">{module.title}</span>
              <Badge variant="outline" className="ml-auto mr-4">
                {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {module.description && (
              <p className="text-sm text-muted-foreground mb-4 pl-6">
                {module.description}
              </p>
            )}

            <div className="flex gap-2 mb-4 pl-6">
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="h-3 w-3 mr-1" />
                Edit Module
              </Button>
              <Button size="sm" variant="outline" onClick={onAddLesson}>
                <Plus className="h-3 w-3 mr-1" />
                Add Lesson
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {module.lessons.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleLessonDragEnd}
              >
                <SortableContext
                  items={module.lessons.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 pl-6">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <SortableLesson
                        key={lesson.id}
                        lesson={lesson}
                        index={lessonIndex}
                        onEdit={() => onEditLesson(lesson)}
                        onDelete={() => onDeleteLesson(lesson.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="pl-6 py-4 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                No lessons yet. Click "Add Lesson" to create one.
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
