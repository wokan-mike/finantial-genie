export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  isCustom: boolean;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Comida', color: '#ef4444', icon: '🍽️', isCustom: false },
  { id: '2', name: 'Entretenimiento', color: '#8b5cf6', icon: '🎬', isCustom: false },
  { id: '3', name: 'Familia', color: '#3b82f6', icon: '👨‍👩‍👧‍👦', isCustom: false },
  { id: '4', name: 'Transporte', color: '#10b981', icon: '🚗', isCustom: false },
  { id: '5', name: 'Salud', color: '#f59e0b', icon: '🏥', isCustom: false },
  { id: '6', name: 'Educación', color: '#6366f1', icon: '📚', isCustom: false },
  { id: '7', name: 'Ropa', color: '#ec4899', icon: '👕', isCustom: false },
  { id: '8', name: 'Servicios', color: '#14b8a6', icon: '💡', isCustom: false },
  { id: '9', name: 'Vivienda', color: '#f97316', icon: '🏠', isCustom: false },
  { id: '10', name: 'Otros', color: '#6b7280', icon: '📦', isCustom: false },
];

export const getCategoryById = (id: string): Category | undefined => {
  return DEFAULT_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoriesByIds = (ids: string[]): Category[] => {
  return DEFAULT_CATEGORIES.filter(cat => ids.includes(cat.id));
};

