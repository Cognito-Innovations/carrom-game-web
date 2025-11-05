declare module '@farcaster/frame-sdk' {
  export const sdk: {
    actions: {
      ready: (options?: Record<string, unknown>) => void;
    };
  };
}


