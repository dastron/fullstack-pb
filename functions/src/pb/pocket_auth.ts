import PocketBase from "pocketbase";

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
    } else {
      // Breakpoint
    }
  } catch (e: any) {
    // console.error("Error validating token:", e?.message);
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
