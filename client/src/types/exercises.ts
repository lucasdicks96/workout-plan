export interface Exercise {
  id: number;
  userId: string | null;
  title: string;
  description: string;
  category?: Category[];
}

export interface ExerciseSets extends Exercise {
  set: number;
  repetitions: number;
  weight: number;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  children?: Category[];
}
