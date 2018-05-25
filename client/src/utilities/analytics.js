/* eslint-disable no-undef, no-use-before-define, no-underscore-dangle */

let hasInited;

export const init = (state) => {
  if (hasInited || !state.env.piwikSiteId) return;

  hasInited = true;

  const u = ((document.location.protocol === 'https:') ?
  'https://akvo.piwikpro.com/' :
  'http://analytics.akvo.org/');

  const d = document;
  const g = d.createElement('script');
  const s = d.getElementsByTagName('script')[0];
  g.type = 'text/javascript';
  g.async = true;
  g.defer = true;
  g.src = `${u}piwik.js`;
  s.parentNode.insertBefore(g, s);

  window._paq = window._paq || [];
  window._paq.push(['setTrackerUrl', `${u}piwik.php`]);
  window._paq.push(['setSiteId', state.env.piwikSiteId]);
  window._paq.push(['enableLinkTracking']);
};

export const trackEvent = (eventType, ...values) => {
  if (typeof window._paq !== 'undefined') window._paq.push(['trackEvent', eventType, ...values]);
};

export const trackPageView = (pageTitle) => {
  if (typeof window._paq !== 'undefined') {
    const { origin, pathname } = window.location;
    window._paq.push(['setCustomUrl', `${origin}${pathname}`]);
    window._paq.push(['trackPageView', pageTitle]);
  }
};

export default { trackEvent, trackPageView };

