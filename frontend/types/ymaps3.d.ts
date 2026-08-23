// `@yandex/ymaps3-types`'s `declare global { const ymaps3: ... }` only takes
// effect once the module itself is part of the compilation graph — it's a
// scoped package, not an auto-included `@types/*` one. This import is the
// only thing this file does; see the comment in `lib/ymaps.ts` for why the
// global exists at all.
import "@yandex/ymaps3-types";
