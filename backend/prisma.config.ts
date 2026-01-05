import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
    schema: './prisma/schema.prisma',
    datasource: {
        // Fallback URL for prisma generate during Docker build (no actual connection needed)
        url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
    },
})
