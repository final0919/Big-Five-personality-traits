export type Dimension = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';

export interface Scoring {
  dimension: Dimension;
  subDimension?: string;
  reverse: boolean;
}

export interface Question {
  id: number;
  text: string;
  scorings: Scoring[];
}

export interface UserInfo {
  name: string;
  gender: string;
  age: string;
}

export interface QuizResult {
  scores: Record<Dimension, number>;
  subScores?: Record<string, number>;
  userInfo: UserInfo;
  type: '15' | '118';
}
