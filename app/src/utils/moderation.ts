import pb from "@/pb";

const FUNCTIONS_URL = import.meta.env?.VITE_FUNCTIONS_URL ?? "";

export const moderateObject = async (userId: string | undefined, target: string, object: object) => {
  const string = JSON.stringify(object);
  const token = pb.authStore?.token ?? "";

  const results = await fetch(FUNCTIONS_URL + "/functions/moderator", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: token,
    },
    body: JSON.stringify({
      message: {
        type: "text",
        text: string,
      },
    }),
  });

  const { moderation } = await results.json();
  const categoryScores = moderation.category_scores as Record<string, number>;
  const formattedCategories = Object.fromEntries(
    Object.entries(categoryScores).map(([category, score]) => [category, parseFloat(score?.toFixed(5))])
  );

  const moderationResults = {
    flagged: moderation.flagged,
    category: formattedCategories,
  };

  console.log(moderationResults);

  if (moderationResults.flagged === true) {
    const userCollectionData = {
      AuthorUser: userId ?? "unknown",
      target: target,
      ...moderationResults,
    };
    // await pb.collection("UserViolations").create(userCollectionData);
    console.error(userCollectionData);
  }

  return moderationResults;
};
