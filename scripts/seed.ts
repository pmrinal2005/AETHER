import "dotenv/config";
import { runSeed } from "../src/lib/seedLogic";

runSeed()
  .then((r) => {
    console.log("Seed complete:", r);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
