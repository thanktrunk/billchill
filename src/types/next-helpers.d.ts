// Fallback declarations for Next.js route-aware global helpers.
// The authoritative versions are generated into .next/dev/types/routes.d.ts
// at dev/build time and override these via next-env.d.ts reference.
// These exist so `tsc --noEmit` passes without a running dev server.

declare type PageProps = {
  params: Promise<Record<string, string>>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

declare type LayoutProps = {
  children: React.ReactNode
  params: Promise<Record<string, string>>
}
