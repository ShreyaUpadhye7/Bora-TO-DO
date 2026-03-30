export type TodoCategory = 'personal' | 'work' | 'productivity' | 'self-care';

export const CATEGORIES: { value: TodoCategory; label: string; emoji: string; color: string }[] = [
  { value: 'personal', label: 'Personal', emoji: '💜', color: 'cat-personal' },
  { value: 'work', label: 'Work', emoji: '💼', color: 'cat-work' },
  { value: 'productivity', label: 'Productivity', emoji: '⚡', color: 'cat-productivity' },
  { value: 'self-care', label: 'Self Care', emoji: '🌸', color: 'cat-selfcare' },
];

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  memberName: string;
  memberEmoji: string;
  memberLabel: string;
  category: TodoCategory;
  severity: number;
  dueDate: string | null;
}
