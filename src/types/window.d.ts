interface Window {
  fbq: (command: 'init' | 'track' | 'trackCustom', eventName: string, parameters?: object) => void;
  _fbq?: any;
}