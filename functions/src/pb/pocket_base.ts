import PocketBase, { RecordService } from "pocketbase";
import { authorizePocketBase } from "./pocket_auth.js";

type logImageGPT = {
  messages: object;
  response?: object;
  error?: object;
};

export const writeJSONLog = async (data: logImageGPT) => {
  // create a new one-off install from an existing one
  const apiURL = process.env.API_URL || "http://localhost:8080";
  const logWriter = new PocketBase(apiURL);
  try {
    await logWriter.collection("Logs").create({
      messages: data?.messages ?? null,
      response: data?.response ?? null,
      error: data?.error ?? null,
    });
  } catch (e: any) {
    console.error("Error writing log:", e?.message);
  }
};

interface TypedPocketBase extends PocketBase {
  collection(idOrName: string): RecordService; // default fallback for any other collection
}

export const loadPocketBase = async () => {
  const fetchDB = await authorizePocketBase("todo");
  return fetchDB.pocketBase as TypedPocketBase;
};

export const loadAdminPocketBase = async () => {
  const apiURL = process.env.API_URL || "http://localhost:8080";
  const pb = new PocketBase(apiURL);

  if (!process.env.PB_SUPERUSER_EMAIL || !process.env.PB_SUPERUSER_PASSWORD) {
    throw new Error("PB_SUPERUSER_EMAIL and PB_SUPERUSER_PASSWORD must be set");
  }

  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.PB_SUPERUSER_EMAIL,
      process.env.PB_SUPERUSER_PASSWORD,
    );

  return pb as TypedPocketBase;
};
