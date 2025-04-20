import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './src/db/migrations',
    schema: './src/db/schema/index.ts',
    dialect: 'sqlite',
    dbCredentials: {
        url: "file:./db.sqlite",
    },
});