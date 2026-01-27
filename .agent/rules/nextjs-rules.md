---
trigger: always_on
---

1. **Next.js 16 Convention**: ALWAYS use `proxy.ts` instead of `middleware.ts`. Next.js 16 has deprecated the `middleware` file convention in favor of `proxy`. DO NOT rename `proxy.ts` to `middleware.ts`.
