import ReactGA from "react-ga4";

let analyticsInitialized = false;

export const initAnalytics = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn("GA Measurement ID not found");
    return;
  }

  ReactGA.initialize(measurementId);
  analyticsInitialized = true;

  ReactGA.send({
    hitType: "pageview",
    page: window.location.pathname,
  });
};

export const trackSiteVisit = () => {
  if (!analyticsInitialized) return;

  ReactGA.event("visit_site", {
    category: "engagement",
    label: "site_visit",
  });
};

export const trackStartGame = (method: "menu_button" | "google_login") => {
  if (!analyticsInitialized) return;

  ReactGA.event("start_game", {
    category: "game",
    method,
  });
};

export const trackMetaEvent = (eventName: string, params?: object) => {
  if (typeof window.fbq !== 'function') return;

  window.fbq('trackCustom', eventName, params);
};