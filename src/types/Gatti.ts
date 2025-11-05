export type GattiType = 'black' | 'white' | 'queen' | 'striker';

export const typeColor: Record<GattiType, string> = {
  black: '#3366ff',
  white: 'purple',
  queen: 'red',
  striker: 'green',
};

export const typeSize: Record<GattiType, number> = {
  black: 10,
  white: 10,
  queen: 10,
  striker: 13,
};

