import PocketBase, { RecordService } from "pocketbase";

export type logImageGPT = {
  messages: object;
  response?: object;
  error?: object;
};

const API_URL = process.env.API_URL || "http://localhost:8080";

interface TypedPocketBase extends PocketBase {
  collection(idOrName: string): RecordService; // default fallback for any other collection
}

export const authorizePocketBase = async (token: string) => {
  let isValid = false;
  // create a new one-off install from an existing one
  const apiURL = process.env.API_URL || "http://localhost:8080";
  const tempPB = new PocketBase(apiURL);
  try {
    tempPB.authStore.save(token, null);
    // extra check to prevent unnecessary call in case the token is already expired or missing
    if (tempPB.authStore.isValid) {
      await tempPB.collection("Users").authRefresh();
      isValid = true;
    }
  } catch (error: any) {
    console.error("Error validating token:", error?.message);
  }

  return { auth: isValid, pocketBase: tempPB };
};

export const validateToken = async (token: string) => {
  const { auth } = await authorizePocketBase(token);
  if (!auth) {
    console.log("Invalid token");
  } else {
    console.log("Valid token");
  }
  return auth;
};

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

export const getPocketBase = () => {
  return new PocketBase(API_URL) as TypedPocketBase;
};
