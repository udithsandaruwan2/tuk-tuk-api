import { connectDatabase, disconnectDatabase } from "../src/services/db.js";
import { User } from "../src/models/index.js";
import { seedMongoData } from "./seed-mongo.js";

async function main() {
  await connectDatabase();
  const count = await User.countDocuments({});
  if (count > 0) {
    console.info("Seed skipped: database already has users.");
    return;
  }
  console.info("Database empty. Running seed script...");
  await seedMongoData();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDatabase();
  });
