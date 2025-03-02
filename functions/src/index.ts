import "dotenv/config";

import express, { Request, Response } from "express";
import cors from "cors";
import { validateToken } from "./pb/pocket_auth.js";
import { processContentModeration } from "./moderator.js";

const app = express();
const PORT = process.env.FUNCTIONS_PORT || 8081;

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.post("/functions/moderator", async (req: Request, res: Response) => {
  try {
    const authToken = req.headers["authorization"] as string;
    const isTokenValid = await validateToken(authToken);

    // if (!isTokenValid) {
      // res.status(401).json({ error: "Invalid token" });
      // return;
    // }

    const message = req.body.message;
    const moderation = await processContentModeration(message);

    res.json({ moderation });
  } catch (error: any) {
    console.log("Error processing messages:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

