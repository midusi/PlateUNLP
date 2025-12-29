import "dotenv/config";

import readline from "node:readline/promises";
import { auth } from "~/lib/auth";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const name = await rl.question("Name: ");
const email = await rl.question("Email: ");
const password = await rl.question("Password: ");

rl.close();

if (name.length === 0 || email.length === 0 || password.length === 0) {
  console.log("Missing values");
  process.exit(1);
}

const response = await auth.api.signUpEmail({
  body: { name, email, password },
});
console.log(`Created user ID ${response.user.id}`);
