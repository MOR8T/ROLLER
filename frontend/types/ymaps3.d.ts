/// <reference types="@yandex/ymaps3-types" />

// `@yandex/ymaps3-types` ships no runtime — the JS API is a <script> from
// Yandex's CDN, and the package exists only to describe the `ymaps3` global it
// installs (`declare global { const ymaps3: ... }` in its own `index.d.ts`).
//
// The reference above is what pulls that declaration into the program. It is a
// file of its own rather than an `import type` inside `lib/ymaps.ts` because an
// import of a package whose `main` is empty is a runtime error waiting for
// someone to drop the `type` keyword.
