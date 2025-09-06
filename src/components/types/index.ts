export interface Match {
  id: string;
  league: string;
  tour: number;
  home_team: string;
  away_team: string;
  starts_at: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  home_score?: number;
}

export interface User {
  id: string;
  email: string;
  display_name?: string;
  is_admin?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';
