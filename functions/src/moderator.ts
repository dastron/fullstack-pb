import type { ModerationMultiModalInput } from "openai/resources/moderations.mjs";

import { getAIClient } from "./ai.js";

type DeepChatMessages = {
  role: "user" | "assistant" | "system";
  content: string;
};

export const processContentModeration = async (message: DeepChatMessages) => {
  const moderationMessage = message as unknown as ModerationMultiModalInput;
  const client = getAIClient();
  const moderation = await client.moderations.create({
    model: "omni-moderation-latest",
    input: [moderationMessage],
  });

  console.log(moderation);
  return moderation.results[0];
};
