import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { handleApiRequest } from './server/apiHandler.js'

function alistonBackendPlugin() {
  return {
    name: 'aliston-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          await handleApiRequest(req, res);
        } else {
          next();
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), alistonBackendPlugin()],
})
