const marks = new Map();
const renderCounts = new Map();

export const perfLogger = {
  startRoute(pathname) {
    const time = performance.now();
    marks.set(`route:${pathname}`, time);
    console.log(`⏱️ [Perf] Route transition started -> ${pathname}`);
  },

  endRoute(pathname) {
    const start = marks.get(`route:${pathname}`);
    if (start) {
      const duration = (performance.now() - start).toFixed(2);
      console.log(`⚡ [Perf] Navigation to ${pathname} completed in ${duration}ms`);
      marks.delete(`route:${pathname}`);
      return Number(duration);
    }
    return 0;
  },

  logMount(componentName) {
    const time = performance.now();
    console.log(`🧩 [Perf] Component mounted: <${componentName} /> at +${time.toFixed(1)}ms`);
  },

  logRender(componentName, reason = "State/Prop Update") {
    const current = (renderCounts.get(componentName) || 0) + 1;
    renderCounts.set(componentName, current);
    if (import.meta.env.DEV) {
      console.log(`🔄 [Perf] <${componentName} /> render #${current} (${reason})`);
    }
  },

  startApi(endpoint) {
    const time = performance.now();
    marks.set(`api:${endpoint}`, time);
  },

  endApi(endpoint, count = null) {
    const start = marks.get(`api:${endpoint}`);
    if (start) {
      const duration = (performance.now() - start).toFixed(2);
      console.log(`🌐 [Perf] API ${endpoint} finished in ${duration}ms${count !== null ? ` (${count} items)` : ''}`);
      marks.delete(`api:${endpoint}`);
      return Number(duration);
    }
    return 0;
  },

  getRenderCounts() {
    return Object.fromEntries(renderCounts.entries());
  },

  reset() {
    marks.clear();
    renderCounts.clear();
  }
};

export default perfLogger;
