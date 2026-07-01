// ─── Frontend type definitions (mirrors backend API shapes) ─────────────────

export interface CoffeeBean {
  id: number;
  name: string;
  roaster: string;
  origin: string | null;
  roastLevel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrewSession {
  id: number;
  coffeeBeanId: number | null;
  grindSize: string | null;
  waterTemp: number | null;
  brewTime: string | null;
  method: string;
  grinder: string | null;
  clicks: string | null;
  coffeeDose: number | null;
  waterDose: number | null;
  notes: string | null;
  rating: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TastingNote {
  id: number;
  brewSessionId: number;
  aroma: string | null;
  flavor: string | null;
  body: string | null;
  acidity: string | null;
  rating: number | null;
  freeText: string | null;
  createdAt: string;
}

export interface BrewSessionDetail extends BrewSession {
  coffeeBean?: CoffeeBean | null;
  tastingNotes: TastingNote[];
}

export interface CreateBrewData {
  method: string;
  grindSize: string;
  waterTemp: number;
  brewTime: string;
  grinder?: string | null;
  clicks?: string | null;
  coffeeDose: number;
  waterDose: number;
  coffeeBeanId: number | null;
  notes: string | null;
  rating: string | null;
}

export interface CreateBeanData {
  name: string;
  roaster: string;
  origin?: string | null;
  roastLevel?: string | null;
}

export interface CoffeeBeanWithStats extends CoffeeBean {
  avgRating: number | null;
  brewCount: number;
  methodBreakdown: Record<string, number>;
}

export interface BrewSessionWithNotes extends BrewSession {
  tastingNotesSummary: string | null;
}

export interface CreateNoteData {
  aroma?: string | null;
  flavor?: string | null;
  body?: string | null;
  acidity?: string | null;
  rating?: number | null;
  freeText?: string | null;
}
