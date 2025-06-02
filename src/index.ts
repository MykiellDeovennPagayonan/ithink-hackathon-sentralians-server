import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./uploadthing";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
    config: {
      token: process.env.UPLOADTHING_TOKEN,
    },
  })
);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
