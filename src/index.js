import dotenv from "dotenv";
import { app } from "./app.js";
import { connectDb } from "./config/db.js";

dotenv.config();

const port = Number(process.env.PORT || 8000);

const bootstrap = async () => {
  await connectDb();
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to bootstrap app", error);
  process.exit(1);
});
