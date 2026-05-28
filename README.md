# Ceptly (app)

Next.js app for Ceptly — workspace settings, check-ins, billing, and team chat.

- **Production:** [https://app.ceptly.ai](https://app.ceptly.ai) (AWS Amplify)
- **Marketing site:** [https://ceptly.ai](https://ceptly.ai) (`ceptly-public` repo)
- **API:** `ceptly-backend` (set `NEXT_PUBLIC_API_URL` to your API host)

## Local development

```bash
cp .env.example .env.local
# Edit .env.local — API URL, Statsig key, etc.

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Amplify)

Build settings are in [`amplify.yml`](./amplify.yml). Requires **WEB_COMPUTE** platform for SSR/middleware.

Set in Amplify Console → Environment variables:

| Variable                         | Example                                |
| -------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_API_URL`            | `https://api.ceptly.ai` (your backend) |
| `NEXT_PUBLIC_STATSIG_CLIENT_KEY` | Statsig client key                     |
| `NEXT_PUBLIC_BILLING_ENFORCED`   | `true`                                 |

Ensure backend `FRONTEND_URL` is `https://app.ceptly.ai` for CORS and invite links.
