const GA_ID = import.meta.env.VITE_GA_ID

export function initAnalytics() {
  if (!GA_ID) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function () { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID)

  // Web Vitals → GA4 (dynamic import keeps it off the critical path)
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    const report = ({ name, value, id }) =>
      window.gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        event_label: id,
        non_interaction: true,
      })
    onCLS(report); onINP(report); onFCP(report); onLCP(report); onTTFB(report)
  })
}

export function trackEvent(name, params = {}) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params)
}
