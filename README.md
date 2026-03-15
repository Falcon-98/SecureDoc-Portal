This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

This project is deployed to **GitHub Pages** using GitHub Actions (`.github/workflows/nextjs.yml`).

The workflow automatically builds and deploys the static export on every push to `main`.

### Setup

1. Go to your repository **Settings → Pages**
2. Under **Build and deployment**, select **GitHub Actions** as the source
3. Push to `main` to trigger the deployment

The app will be available at `https://<username>.github.io/SecureDoc-Portal/`.

### Local Production Build

To test the static export locally:

```bash
NEXT_PUBLIC_BASE_PATH=/SecureDoc-Portal npm run build
npx serve out
```
