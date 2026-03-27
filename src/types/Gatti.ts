export type GattiType = 'black' | 'white' | 'queen' | 'striker';

export const typeColor: Record<GattiType, string> = {
  black: '#1a1a1a',      // distinct black
  white: '#bdbdbd',      // darker white
  queen: '#ff3333',
  striker: '#00897B',   // Striker Teal
};

export const typeSize: Record<GattiType, number> = {
  black: 10,
  white: 10,
  queen: 10,
  striker: 13,
};

