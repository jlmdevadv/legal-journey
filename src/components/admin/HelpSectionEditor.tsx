import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface HelpSectionEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}

const HelpSectionEditor = ({ label, value, onChange, placeholder, multiline = false }: HelpSectionEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const hasContent = value && value.trim().length > 0;

  const handleStartEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleRemove = () => {
    onChange('');
    setIsEditing(false);
  };

  const handleAdd = () => {
    setEditValue('');
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>{label}</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              Salvar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Cancelar
            </Button>
          </div>
        </div>
        {multiline ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            rows={3}
            autoFocus
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
        )}
      </div>
    );
  }

  if (hasContent) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>{label}</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
              className="flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Editar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Remover
            </Button>
          </div>
        </div>
        <Card className="p-3 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {value.length > 100 ? `${value.substring(0, 100)}...` : value}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Adicionar
        </Button>
      </div>
    </div>
  );
};

export default HelpSectionEditor;