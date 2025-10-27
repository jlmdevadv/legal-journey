import React from 'react';
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
import { ContractField } from '@/types/template';
import { SortableFieldItem } from './SortableFieldItem';

interface SortableFieldListProps {
  fields: ContractField[];
  onReorder: (newFields: ContractField[]) => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export const SortableFieldList = ({ fields, onReorder, onEdit, onRemove }: SortableFieldListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      const newFields = arrayMove(fields, oldIndex, newIndex);
      onReorder(newFields);
    }
  };

  if (fields.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        <p className="mb-2">Crie campos editáveis de duas formas:</p>
        <div className="text-sm space-y-1">
          <p>• Selecione texto no preview (mouse ou Shift+setas)</p>
          <p>• Digite <code className="bg-gray-100 px-1 rounded">{'{{nome_variavel}}'}</code> no template</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={fields.map(f => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {fields.map((field, index) => (
            <SortableFieldItem
              key={field.id}
              field={field}
              index={index}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
