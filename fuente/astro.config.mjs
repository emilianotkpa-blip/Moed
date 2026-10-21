import { defineConfig } from 'astro/config';

// Sitio estatico: el resultado (dist/) se publica igual que el sitio
// actual, con su editor visual y el despliegue a EasyPanel.
export default defineConfig({
  site: 'https://moed.mx',
  output: 'static',
  server: { port: 5205, host: true },
  devToolbar: { enabled: false },
});
