This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open the local development URL shown by `npm run dev` in your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Payments

Cinexium uses Paddle as its only payment provider.

Set these environment variables for Paddle:

```bash
PADDLE_ENV=sandbox

# Sandbox
PADDLE_SANDBOX_API_KEY=
PADDLE_SANDBOX_WEBHOOK_SECRET=
NEXT_PUBLIC_PADDLE_SANDBOX_CLIENT_TOKEN=
PADDLE_SANDBOX_PRICE_ID_INR_MONTHLY=
PADDLE_SANDBOX_PRICE_ID_INR_YEARLY=
PADDLE_SANDBOX_PRICE_ID_USD_MONTHLY=
PADDLE_SANDBOX_PRICE_ID_USD_YEARLY=

# Live
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
NEXT_PUBLIC_PADDLE_CLIENT_SIDE_TOKEN=
PADDLE_PRICE_ID_INR_MONTHLY=
PADDLE_PRICE_ID_INR_YEARLY=
PADDLE_PRICE_ID_USD_MONTHLY=
PADDLE_PRICE_ID_USD_YEARLY=

# Feature flag
NEXT_PUBLIC_ENABLE_PRO_SUBSCRIPTIONS=false
```

`NEXT_PUBLIC_ENABLE_PRO_SUBSCRIPTIONS=false` keeps the Pro checkout disabled and shows the temporary "Subscriptions Coming Soon" modal instead of launching Paddle.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
