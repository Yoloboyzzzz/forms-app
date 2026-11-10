const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8081',
    // Every screen waits for a Supabase round trip, which is slower than the 4 s default on a cold start.
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {},
  },
});
