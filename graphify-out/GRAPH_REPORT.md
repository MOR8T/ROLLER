# Graph Report - Praviz  (2026-08-03)

## Corpus Check
- 48 files · ~246,625 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 466 nodes · 739 edges · 31 communities (28 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `621ac11b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Site Shell Layout
- Home Page Sections
- Hero and Product Cards
- ROLLER Brief Spec
- TypeScript Config
- Frontend Dependencies
- Lint and Tailwind Tooling
- Roller Product Cutaway
- Unopen Window Cutaway
- Hero Thermal Cutaway
- Thermo Anthracite Product
- Roller Windows News Shot
- Stella Profile Cutaway
- Prettier Config
- ROLLER Brand Logo
- Stella Window News Shot
- Thermo News Product Shot
- Next.js Agent Docs
- Stella Brand Logo
- UNOPEN Brand Logo
- Holodniy Cold Profile
- Ecoline Brand Logo
- ROLLER Dark Logo
- ROLLER Light Logo
- ROLLER Red-Black Logo
- Stella White Logo
- ESLint Config
- Next.js Config
- PostCSS Config
- index.ts
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `cn()` - 42 edges
2. `compilerOptions` - 16 edges
3. `Container()` - 15 edges
4. `ROLLER` - 15 edges
5. `Reveal()` - 13 edges
6. `Section()` - 12 edges
7. `SectionHeading()` - 11 edges
8. `RevealItem()` - 11 edges
9. `ROLLER colour palette` - 10 edges
10. `MediaFrame()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `ROLLER colour palette` --semantically_similar_to--> `ROLLER`  [INFERRED] [semantically similar]
  ROLLER_fullscreen_colour_preview.html → Brif_of_website.md
- `ROLLER root README` --references--> `ROLLER`  [EXTRACTED]
  README.md → Brif_of_website.md
- `HeroControls()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/sections/hero-section.tsx → frontend/lib/utils.ts
- `Header()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/layout/header.tsx → frontend/lib/utils.ts
- `LanguageSwitcher()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/layout/language-switcher.tsx → frontend/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **PVC window product systems in catalog** — brif_of_website_roller_system, brif_of_website_stella, brif_of_website_unopen, brif_of_website_ecoline [EXTRACTED 1.00]
- **Core ROLLER site capabilities from brief** — brif_of_website_product_catalog, brif_of_website_cost_calculator, brif_of_website_admin_panel, brif_of_website_seo [EXTRACTED 1.00]
- **ROLLER brand colour tokens** — roller_fullscreen_colour_preview_graphite, roller_fullscreen_colour_preview_roller_red, roller_fullscreen_colour_preview_warm_off_white, roller_fullscreen_colour_preview_dark_text, roller_fullscreen_colour_preview_soft_red [EXTRACTED 1.00]

## Communities (31 total, 3 thin omitted)

### Community 0 - "Site Shell Layout"
Cohesion: 0.08
Nodes (34): cityOptions, Field(), LeadFormSection(), productTypes, trustPoints, ProjectTile(), Badge(), BadgeProps (+26 more)

### Community 1 - "Home Page Sections"
Cohesion: 0.10
Nodes (38): AboutSection(), HIGHLIGHTS, NOTE: No dedicated company/production photo is available yet., AdvantagesSection(), CategoriesSection(), ContactCard, contactCards, ContactsSection() (+30 more)

### Community 2 - "Hero and Product Cards"
Cohesion: 0.13
Nodes (21): chakraPetch, metadata, montserrat, Footer(), InstagramIcon(), TelegramIcon(), WhatsAppIcon(), emptySubscribe() (+13 more)

### Community 3 - "ROLLER Brief Spec"
Cohesion: 0.07
Nodes (35): Brief questionnaire for ROLLER website, Admin panel, AKFA, ALD-45 cold aluminum series, OOO Alumini Avvalin, Alyumin Produktsiya, Cost calculator, ECOLINE (+27 more)

### Community 4 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 5 - "Frontend Dependencies"
Cohesion: 0.08
Nodes (23): framer-motion, dependencies, framer-motion, lucide-react, next, react, react-dom, swiper (+15 more)

### Community 6 - "Lint and Tailwind Tooling"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, prettier, prettier-plugin-tailwindcss, tailwindcss (+13 more)

### Community 7 - "Roller Product Cutaway"
Cohesion: 0.19
Nodes (14): Roller main product render, Insulating air chambers, Solid black background, Frame corner assembly, Multi-chamber frame profile, Black rubber gaskets, Glass panes, Double-pane insulated glass unit (+6 more)

### Community 8 - "Unopen Window Cutaway"
Cohesion: 0.18
Nodes (14): Solid black product backdrop, Architectural cross-section cutaway, Two insulated glazing cavities, Light wood-grain exterior finish, Multi-chamber internal profile, Unopen window cutaway render, PVC or composite frame material, Red thermal insulation inserts (+6 more)

### Community 9 - "Hero Thermal Cutaway"
Cohesion: 0.20
Nodes (12): Solid black product backdrop, Hero product cutaway render, Isometric cutaway composition, Multi-chamber internal profile, Multi-pane glazing unit, Orange hollow rectangular inserts, PVC or composite frame material, Black seals/gaskets (+4 more)

### Community 10 - "Thermo Anthracite Product"
Cohesion: 0.23
Nodes (12): Anthracite dark grey finish, Solid black studio background, Outer frame, Large clear glass pane, Vertical lever handle (right), Hinges (left side), Thermo anthracite product render, Inner sash (+4 more)

### Community 11 - "Roller Windows News Shot"
Cohesion: 0.22
Nodes (10): Background window unit, Solid black background, Casement or tilt-and-turn style, Wood and black color palette, Foreground window unit, Clear glass pane, Matching wood-tone handle, Side hinges (+2 more)

### Community 12 - "Stella Profile Cutaway"
Cohesion: 0.25
Nodes (11): Solid black background, Window frame, Black rubber sealing gaskets, Stella main product render, Multi-chambered profile core, Window sash, Stella, Orange thermal insulation inserts (+3 more)

### Community 13 - "Prettier Config"
Cohesion: 0.22
Nodes (8): plugins, printWidth, semi, singleQuote, tabWidth, tailwindStylesheet, trailingComma, prettier-plugin-tailwindcss

### Community 14 - "ROLLER Brand Logo"
Cohesion: 0.33
Nodes (9): ROLLER, Red (icon square, RO letters), White (house glyph, LLER, tagline), House profile icon in red square, ROLLER red-white logo, Aluminum and PVC profile systems, Split wordmark RO red / LLER white, ALUMINUM AND PVC PROFILES SYSTEMS (+1 more)

### Community 15 - "Stella Window News Shot"
Cohesion: 0.22
Nodes (8): Casement window unit, Reflective glass pane, Lever-style handle, Downward locked handle pose, Studio product shot, Left-side hinges, Stella window product, Dark wood-grain frame

### Community 16 - "Thermo News Product Shot"
Cohesion: 0.25
Nodes (8): Anthracite dark grey finish, Anthracite multi-tiered frame, Single clear glass pane, Lever handle (right side), Hinges (left side), Modern architectural style, Thermal insulation (thermo), Window / patio door unit

### Community 17 - "Next.js Agent Docs"
Cohesion: 0.36
Nodes (8): frontend AGENTS.md, Next.js breaking-changes agent rule, frontend CLAUDE.md, frontend README, create-next-app, Geist font, Next.js, Vercel

### Community 18 - "Stella Brand Logo"
Cohesion: 0.36
Nodes (8): Dark grey (LLA / tagline), Deep red (STE letters), Circular door/window emblem, Stella red logo, Door and window profiles, STELLA, PREMIUM DOOR AND WINDOW PROFILES, Registered trademark ®

### Community 19 - "UNOPEN Brand Logo"
Cohesion: 0.46
Nodes (8): UNOPEN, Dark grey accent, Bright orange accent, UNOPEN logo, Window-frame logo mark, PVC window and door systems, PVC WINDOW AND DOOR SYSTEMS, UNOPEN wordmark

### Community 20 - "Holodniy Cold Profile"
Cohesion: 0.36
Nodes (8): Cold (uninsulated) aluminum profile line, White rectangular frame, Single large glass pane, Dark lever handle, Left-hinged swing configuration, Three white hinges, Aluminum frame material, Holodniy white glazed leaf

### Community 21 - "Ecoline Brand Logo"
Cohesion: 0.38
Nodes (6): ecoline, Ecoline logo color palette, Green cross-in-square mark, Multicolor leaf mark, PVC door and window systems, pvc door and window systems

### Community 22 - "ROLLER Dark Logo"
Cohesion: 0.38
Nodes (6): ROLLER, Dark logo color palette, House icon mark, Aluminium and PVC profile systems, Registered trademark symbol, ALUMINIUM AND PVC PROFILE SYSTEMS

### Community 23 - "ROLLER Light Logo"
Cohesion: 0.38
Nodes (7): ROLLER, House icon in red square, ROLLER light-theme logo, Aluminum and PVC profile systems, Split wordmark ROL red / LER white, ALUMINUM AND PVC PROFILES SYSTEMS, Registered trademark symbol

### Community 24 - "ROLLER Red-Black Logo"
Cohesion: 0.38
Nodes (7): ROLLER, House icon in red square, ROLLER red-black logo, Aluminium and PVC profile systems, Split wordmark ROL red / LER charcoal, ALUMINIUM AND PVC PROFILE SYSTEMS, Registered trademark symbol

### Community 25 - "Stella White Logo"
Cohesion: 0.38
Nodes (6): STELLA, Stella logo color palette, Premium door and window profiles, Registered trademark symbol, PREMIUM DOOR AND WINDOW PROFILES, Window/door icon mark

### Community 29 - "index.ts"
Cohesion: 0.07
Nodes (28): fallbackSlides, HeroControls(), HeroSection(), ProductCard(), ProductCardProps, advantages, heroSlides, newsTeasers (+20 more)

### Community 32 - "CLAUDE.md"
Cohesion: 0.14
Nodes (12): Architecture, Component Organization, Current State, Data Layer, Design System, Development Commands, graphify, Graphify Knowledge Graph (+4 more)

## Knowledge Gaps
- **199 isolated node(s):** `semi`, `singleQuote`, `trailingComma`, `printWidth`, `tabWidth` (+194 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Site Shell Layout` to `Home Page Sections`, `Hero and Product Cards`, `index.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Lint and Tailwind Tooling` to `Frontend Dependencies`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `Container()` connect `Home Page Sections` to `Site Shell Layout`, `Hero and Product Cards`, `index.ts`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `semi`, `singleQuote`, `trailingComma` to the rest of the system?**
  _199 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Site Shell Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.07781649245063879 - nodes in this community are weakly interconnected._
- **Should `Home Page Sections` be split into smaller, more focused modules?**
  _Cohesion score 0.10303030303030303 - nodes in this community are weakly interconnected._
- **Should `Hero and Product Cards` be split into smaller, more focused modules?**
  _Cohesion score 0.12561576354679804 - nodes in this community are weakly interconnected._