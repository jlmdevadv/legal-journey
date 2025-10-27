import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { GripVertical } from 'lucide-react';
import { ContractField } from '@/types/template';

interface SortableFieldItemProps {
  field: ContractField;
  index: number;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export const SortableFieldItem = ({ field, index, onEdit, onRemove }: SortableFieldItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors bg-white"
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-1 text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <div className="font-medium">{field.label}</div>
          <div className="text-sm text-gray-500">
            Placeholder: [{field.id}]
          </div>
          <div className="text-sm text-gray-500">
            Tipo: {field.type}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(index)}
          >
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Remover
          </Button>
        </div>
      </div>
    </div>
  );
};
