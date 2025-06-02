import { createRouteHandler } from 'uploadthing/express';
import uploadRouter from '../lib/uploadthing';

export default function uploadRoutes() {
  return createRouteHandler({
    router: uploadRouter,
    config: {
      token: process.env.UPLOADTHING_TOKEN,
    },
  });
}
