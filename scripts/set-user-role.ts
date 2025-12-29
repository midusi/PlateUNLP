import "dotenv/config";
import { eq } from "drizzle-orm";

import readline from "node:readline/promises";
import { db } from "~/db";
import * as s from "~/db/schema";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const email = await rl.question("User email: ");
const role = await rl.question("Role: ");

rl.close();

if (email.length === 0 || role.length === 0) {
  console.log("Missing values");
  process.exit(1);
}
if (!(role === "admin" || role === "user")) {
  console.log(`Wrong role: "${role}"`);
  process.exit(1);
}

await db.update(s.user).set({ role }).where(eq(s.user.email, email));
console.log("Updated!");
