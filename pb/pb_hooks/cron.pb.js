/// <reference path="../pb_data/types.d.ts" />

// Schedule the cron job with all code inline
cronAdd("processTasks", "0 * * * *", async () => {
  console.log("Running scheduled job: processTasks");
  try {
    // Run all jobs sequentially
    console.log("Starting to process tasks");
    console.log("Completed processing tasks");
  } catch (error) {
    console.error("Error in processTasks job:", error);
  }
});
