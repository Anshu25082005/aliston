import { handleApiRequest } from '../server/apiHandler.js';

export default async function handler(req, res) {
  await handleApiRequest(req, res);
}
