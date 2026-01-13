import ReactGA from "react-ga4";

export const initAnalytics = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn("GA Measurement ID not found");
    return;
  }

  ReactGA.initialize(measurementId);

  ReactGA.send({
    hitType: "pageview",
    page: window.location.pathname,
  });
};
