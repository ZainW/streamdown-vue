/**
 * Sample markdown that showcases all the features of streamdown-vue.
 * Streamed token-by-token to simulate an AI model response.
 */
export const SAMPLE_MARKDOWN = `# Building a REST API with Node.js

Let me walk you through building a **production-ready** REST API using Node.js and Express. This covers routing, middleware, error handling, and database integration.

## Project Setup

First, initialize your project and install dependencies:

\`\`\`bash
mkdir my-api && cd my-api
npm init -y
npm install express cors helmet morgan
npm install -D typescript @types/express @types/node
\`\`\`

## Core Server

Here's the main server file with middleware stack:

\`\`\`typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);

// Error handler
app.use((err: Error, _req: any, res: any, _next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(\\\`Server running on port \\\${PORT}\\\`);
});
\`\`\`

## Database Schema

Here's a comparison of our data models:

| Model | Fields | Relations | Indexes |
|-------|--------|-----------|---------|
| User | id, name, email, created_at | has many Posts | email (unique) |
| Post | id, title, body, user_id | belongs to User | user_id, created_at |
| Comment | id, body, post_id, user_id | belongs to Post, User | post_id |
| Tag | id, name, slug | many-to-many Posts | slug (unique) |

## Request Validation

Always validate incoming data. Here's a middleware pattern using ~~manual checks~~ a schema-based approach:

\`\`\`typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
});

function validate<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues,
      });
    }
    req.body = result.data;
    next();
  };
}
\`\`\`

## Key Takeaways

1. **Security first** — Always use \`helmet\` and \`cors\` middleware
2. **Validate inputs** — Never trust client data, use schema validation
3. **Error handling** — Centralized error handler prevents information leaks
4. **Structured logging** — Use \`morgan\` or \`pino\` for request logging

> **Pro tip**: Use \`express-rate-limit\` to prevent abuse on public endpoints. A good default is 100 requests per 15 minutes per IP.

For the full source code, check out the [Express best practices guide](https://expressjs.com/en/advanced/best-practice-security.html).

---

*That's the foundation — you can extend this with authentication, file uploads, WebSocket support, and more.*
`

/**
 * Split markdown into tokens that simulate streaming.
 * Groups characters into small chunks that feel natural,
 * breaking on word boundaries and newlines.
 */
export function tokenize(text: string): string[] {
  const tokens: string[] = []
  let i = 0

  while (i < text.length) {
    // Newlines get their own token
    if (text[i] === '\n') {
      tokens.push('\n')
      i++
      continue
    }

    // Backtick sequences (```) stay together
    if (text[i] === '`') {
      let j = i
      while (j < text.length && text[j] === '`') j++
      tokens.push(text.slice(i, j))
      i = j
      continue
    }

    // Grab a word-ish chunk (2-6 chars)
    const chunkSize = 2 + Math.floor(Math.random() * 5)
    let end = Math.min(i + chunkSize, text.length)

    // Try to break on a word boundary
    if (end < text.length && text[end] !== ' ' && text[end] !== '\n') {
      const nextSpace = text.indexOf(' ', i)
      const nextNewline = text.indexOf('\n', i)
      let boundary = -1
      if (nextSpace !== -1 && nextNewline !== -1) boundary = Math.min(nextSpace, nextNewline)
      else if (nextSpace !== -1) boundary = nextSpace
      else if (nextNewline !== -1) boundary = nextNewline

      if (boundary !== -1 && boundary <= i + 10) {
        end = boundary + 1
      }
    }

    tokens.push(text.slice(i, end))
    i = end
  }

  return tokens
}
