import { useState } from 'react';
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
import { SortableModule } from './SortableModule';
import type { CourseModule, Lesson } from '@/types/database';

interface ModuleWithLessons extends CourseModule {
  lessons: Lesson[];
}

interface DraggableModuleListProps {
  modules: ModuleWithLessons[];
  onReorder: (modules: ModuleWithLessons[]) => void;
  onEditModule: (module: CourseModule) => void;
  onDeleteModule: (moduleId: string) => void;
  onAddLesson: (moduleId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onReorderLessons: (moduleId: string, lessons: Lesson[]) => void;
}

export function DraggableModuleList({
  modules,
  onReorder,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderLessons,
}: DraggableModuleListProps) {
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);
      const newModules = arrayMove(modules, oldIndex, newIndex);
      onReorder(newModules);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={modules.map((m) => m.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {modules.map((module, index) => (
            <SortableModule
              key={module.id}
              module={module}
              index={index}
              onEdit={() => onEditModule(module)}
              onDelete={() => onDeleteModule(module.id)}
              onAddLesson={() => onAddLesson(module.id)}
              onEditLesson={onEditLesson}
              onDeleteLesson={onDeleteLesson}
              onReorderLessons={(lessons) => onReorderLessons(module.id, lessons)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
