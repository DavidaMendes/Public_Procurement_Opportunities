export type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  completed: boolean;
};

export type StoredChecklist = Record<string, boolean>;
