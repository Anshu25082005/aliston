import http from 'http';
import { handleApiRequest } from './apiHandler.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    handleApiRequest(req, res);
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'ALISTON Server: Only /api endpoints are served.' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 ALISTON Server running on http://localhost:${PORT}`);
  console.log(`💚 Health Check endpoint: http://localhost:${PORT}/api/health`);
});
