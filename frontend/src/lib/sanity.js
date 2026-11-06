import { createClient } from "@sanity/client";

export const client = createClient({
  projectId: "bowlxkv0", // Find this in your sanity.cli.js file
  dataset: "production",
  useCdn: true, // `false` if you want to ensure fresh data every request
  apiVersion: "2024-04-24", // Today's date
});
