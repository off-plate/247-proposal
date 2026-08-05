# Hero anatomy and motion research

For the 24/7 Car Rental (Tirana) redesign proposal.
Compiled 5 Aug 2026.

## How this was researched

Not from memory and not from listicles. A headless Chromium probe
(`scratchpad/probe.mjs`, Playwright 1.x) visited each site at 1440x900 desktop and
390x844 iPhone, dismissed cookie walls where possible, screenshotted above the fold,
then extracted from the live DOM and CSSOM:

- computed type on every in-fold heading (family, size, weight, tracking, colour, box)
- every in-fold image with its bounding box, `object-fit` and share of the fold
- `<video>` and `<canvas>` elements with autoplay state and source
- booking form containers and every field, with pixel positions
- every CSS rule scanned for 21 modern feature keywords, plus a frequency count of
  every `cubic-bezier()` and every transition/animation duration in the sheets
- `document.getAnimations()` before and after a 1.2 viewport scroll, checking each
  animation's timeline constructor to detect real scroll-driven animation
- global sniffing for GSAP, Lenis, Locomotive, Three, Framer Motion, Swiper, AOS,
  Lottie, Barba, Splitting

Numbers below are measured off those runs unless a URL is cited. Screenshots were
looked at, not just parsed. Sites that blocked the probe are flagged as blocked.

Sites probed successfully: turo.com, sixt.com, rivian.com, polestar.com, virtuo.com,
govirtuo.com, getaround.com, kinto-mobility.eu, finn.com, blacklane.com,
porsche.com/international, lucidmotors.com, zeekrglobal.com, discovercars.com,
rentalcars.com, hertz.com, localrent.com, scgroup.dk, and the client's own
24-7rentalcar.com.

Blocked or dead: carvana.com (Cloudflare "you have been blocked"), onto.co.uk
(domain no longer resolves, the company folded), virtuo.com (no longer the car rental
company, the domain now belongs to a homeownership platform; the rental business is
**govirtuo.com**).

---

# PART 1 - HERO ANATOMY

## 1.1 The measured baseline: what the client has now

24-7rentalcar.com, measured 5 Aug 2026:

| Property | Value |
|---|---|
| Hero height | full viewport, roughly 900px at 1440 wide, and it holds four elements |
| Composition | hard 50/50 vertical split, left half near-black, right half the same stock dashboard photo under a flat red multiply wash |
| Vehicle | **there is no vehicle**. The imagery is a generic stock instrument cluster, twice |
| H1 | "24/7 CAR RENTAL", 50px, weight 500, Racing Sans One, italic, white |
| Sub | "WE MAKE FINDING THE RIGHT CAR SIMPLE", bold italic caps |
| CTA | one red rectangle, "FIND A CAR", 134x40px |
| Booking entry | none in the hero |
| Body font | Roboto |
| Largest image share of fold | 0.01 |

The diagnosis is not "the headline is too big". It is that the hero contains **zero
proprietary information**. No car they actually own, no price, no location, no opening
state, no count. A visitor can read the whole screen and learn nothing they could not
have guessed from the company name. That is what "no wow effect" actually means here,
and it is also true of the current proposal hero: a cut-out Jaguar on a plain field is
still a picture of a car with no facts attached to it.

The measured fix, repeated across every strong site below, is that the fold carries
**image plus evidence**, not image plus adjective.

## 1.2 The five hero archetypes actually in use in 2026

Measured, not theorised. Every site probed falls into one of five.

### A. Cinematic full-bleed, headline low, evidence bar at the base
**lucidmotors.com** is the clearest execution and the most useful reference for this project.

- Hero image covers **1.00 of the fold** (1440x900, `object-fit: cover`), a real
  commissioned photograph with people in it, shot at golden hour, car in three-quarter
  view occupying the middle third.
- H1 "Lucid Gravity" is **72px, weight 400, in a serif** (Lucid Serif VF), tracking
  -0.5px, set **low in the frame at y=645 of 900**, hard left at x=24.
- Below it a one-line 16px description, then a horizontal **fact bar** across the full
  width: four columns divided by hairlines, each column a small-caps label
  (`LEASE LUCID GRAVITY TOURING FROM`) above a large number (`$699/mo`) above a
  qualifier (`for 24 months.`). Two ghost-outline CTAs sit at the right end of the same bar.
- Body background is `#0F0F0F`. Signature easing is **`cubic-bezier(0.16, 1, 0.3, 1)`**,
  duration `0.3s` appears **107 times** in the sheets.
- Scrolling advances a slide: Gravity becomes Air, same layout, new photograph, new numbers.

Why it reads expensive: the type is set low and small relative to the image, and the
bottom strip is doing informational work. Nothing is centred. Nothing is decorated.

**zeekrglobal.com** is the same archetype with no text at all in the fold: a single
1440x900 `cover` photograph, 0 headings, 0 forms. Easings `cubic-bezier(0.645,0.045,0.355,1)`
(36 uses) and `cubic-bezier(0.08,0.82,0.17,1)` (25). `0.3s` used 203 times.

### B. Full-bleed with a transparent booking bar floating in the photograph
**blacklane.com**, the single best structural model for a business that must show a
booking entry in the hero without wrecking the picture.

- Full-bleed photograph of a **car interior**, not an exterior: cream leather seat back
  in the foreground, a real passenger, a chauffeur reflected in the window, dusk city
  behind. It is a picture of the *experience*, not of a product.
- H1 "Your chauffeur awaits." **64px, weight 400, PP Fragment** (a Pangram Pangram
  display cut), tracking +0.25px, pale blue, **centred, sitting at y=578 of 900**, i.e.
  in the lower third.
- Under it a segmented pill toggle: `One way | By the hour`, active segment solid blue.
- Then the booking bar at **x=129, y=732, 1181x108**, background `rgba(0,0,0,0.2)`,
  radius **8px**, `backdrop-filter` in play, four fields separated by thin vertical
  rules, each field a label above a hairline-underlined input. One solid blue
  "View options" button at the right end.
- **There is no white card.** The form is a translucent pane the photograph shows
  through. That single decision is most of the difference between this and Sixt.
- CSS carries `view-timeline`, `scroll-timeline`, `timeline-scope`,
  `view-transition-name`, `anchor-name`, `interpolate-size`, and **15 separate
  `prefers-reduced-motion` blocks**. Dominant duration `0.2s` (18 uses). Next.js.

### C. Inset photographic card with the form breaking its bottom edge
**govirtuo.com** (the real Virtuo). Measured precisely:

- Page background near-white, and the hero photograph is an **inset rounded card**:
  x=40, y=88, **1360x474**, so a 40px gutter on all sides and only 474px tall, not a
  full viewport.
- H1 "Your car, on demand" 60px weight 500, white, left at x=270, y=312. Two lines,
  ragged right.
- The booking card is **x=270, y=484, 900x110, radius 15px**, shadow
  `rgba(0,0,0,0.05) 0 0 50px 5px`. The photo card ends at y=562. So the form **starts
  78px above the photo's bottom edge and finishes 32px below it**. It bridges the two
  surfaces.
- Three fields only: address, start date, return date, plus a 50x50 dark circular
  search button. Nothing else.

**turo.com** runs the same idea with the form kept fully inside: hero image
**1136x312 at x=152, y=133**, rounded, inset; the white form pill is **896x56 at y=305**,
so it floats 112px above the image's bottom edge. Headline "Rental reinvented" 38px
weight **900** Turo Sans, tracking -0.9px, centred white. Accent `rgb(89,60,251)`
appears on exactly one element, the 40x36 search button.

Turo's hero photograph is worth singling out: it is a **macro crop of a car's hood,
headlight and grille**, teal, shot close enough that the car is unidentifiable. Not a
whole car. The premium tell is that they trusted a detail to carry it.

### D. Form-first, car demoted to backdrop
**sixt.com**. The white booking card is **1232x175 at y=155**, sitting above and in
front of a dark BMW X5 photographed head-on. The car is then **guillotined by a hard
orange band** at y=555 that runs the full width and carries
`MEMBER-ONLY RATES WITH SIXT ONE` in a huge condensed grotesque. The actual H1 is
**16px** and lives inside that orange band as a supporting line.

Notable inversion: the biggest type on the page is not the H1, and the car is
deliberately half-eaten by a colour field. It works because the crop is confident.

**hertz.com** and **rentalcars.com** are the degraded version of the same archetype:
form on a flat tint, no vehicle in the fold at all (largest image share 0.00 and 0.01
respectively), Open Sans and system-ui.

### E. Split-frame or side-by-side product shot
**kinto-mobility.eu** splits the fold at x=720 into two crops of the same scene, the
left half scrimmed dark to hold the copy. Image covers 0.66 of the fold. H1 48px
weight 600, single proprietary family (Kinto Type) used for all 185 in-fold text nodes.

**getaround.com** is the templated pole: 72px display headline left, phone mockup in a
hand right, all four form fields stacked inline in the left column, magenta
`#C0007A`-ish accent, app store badges, a 4.6/5 rating line. Competent, entirely
predictable. Its subhead is literally "Unlock cars 24/7 with your phone, and go!",
which is a useful warning: **"24/7" as a phrase is already generic in this category.**
The differentiator has to be demonstrated, not claimed.

**finn.com** is a middle case: full-bleed lifestyle photo (0.71 of fold), H1 48px
Suisse Intl weight 600, and a very small two-select form (Marke, Modell) plus a button.
Under it, a Trustpilot rating with a real number (4.1 of 5, 50,000+ customers).

### F. Autoplaying video
**porsche.com/international** is the only probed site running video in the hero: a
**full-viewport HLS stream** (`hls.m3u8`, adaptive), autoplay, 1600x900 element in a
1440 window. H1 "Taycan. Now with E-Shift." at **94.72px** Porsche Next weight 400.

Two details worth copying even if the video is not: they ship a **visible pause button**
at bottom right (WCAG 2.2.2 compliance for auto-playing content), and a scroll-cue
arrow at bottom centre. Their CSS also carries `view-timeline`, `scroll-timeline`,
`view-transition-name` and 3 `prefers-reduced-motion` blocks.

**scgroup.dk** (Awwwards Honorable Mention, Jun 2025) runs **nine video elements**, an
H1 at **200px** in `freight-display-pro` serif, easing `cubic-bezier(.16,1,.3,1)` used
16 times, and an 85s duration that is a marquee loop. Full-bleed, coverage 1.00.

## 1.3 Where the booking form actually sits, measured

| Site | Form position relative to imagery | Fields in fold (desktop / mobile) | Surface |
|---|---|---|---|
| blacklane.com | floating inside the photo, lower third | 4 / 6 | translucent `rgba(0,0,0,0.2)`, r8, backdrop-filter |
| govirtuo.com | straddling the photo's bottom edge | 3 / 0 | white, r15, 50px soft shadow |
| turo.com | inside the photo, above its bottom edge | 5 / **1** | white pill, r12, no shadow |
| sixt.com | above and in front of the photo | 5 / 5 | white card |
| finn.com | inside the photo, left column | 2 / 2 | near-white small card |
| getaround.com | not on the photo at all, own column | 3 / 1 | page background, outlined fields |
| discovercars.com | **no photo exists**, form is the hero | 5 / 5 | yellow panel on blue |
| hertz, rentalcars | no photo in fold | 4-5 / 4-5 | flat tint |
| lucid, polestar, zeekr, rivian, porsche | **no form** (not transactional) | 0 / 0 | n/a |

The pattern: the more premium the brand, the more the form is made of the image rather
than placed on top of it, and the fewer fields survive the fold. Blacklane and Virtuo
carry 3 to 4. Sixt and the aggregators carry 5 or more and look like software.

## 1.4 Type treatment, measured

| Site | Display face | Size | Weight | Tracking | Notes |
|---|---|---|---|---|---|
| lucidmotors.com | Lucid Serif VF | 72px | 400 | -0.5px | serif, low in frame |
| blacklane.com | PP Fragment | 64px | 400 | +0.25px | positive tracking, rare and deliberate |
| porsche.com | Porsche Next | 94.72px | 400 | normal | proprietary |
| scgroup.dk | freight-display-pro | **200px** | 400 | - | serif, Awwwards HM |
| getaround.com | BrownProMarketing | 72px | 400 | -2.88px | heavy negative tracking |
| govirtuo.com | proprietary ESBuild cut | 60px | 500 | - | |
| kinto-mobility.eu | Kinto Type | 48px | 600 | -1px | one family, 185 nodes |
| finn.com | Suisse Intl | 48px | 600 | normal | |
| turo.com | Turo Sans | 38px | **900** | -0.9px | smallest display size measured |
| localrent.com | Montserrat | 64px | 900 | - | free font, reads cheap |
| discovercars.com | Inter | 34px | 800 | - | 300 of 300 in-fold nodes are Inter |
| **24-7rentalcar.com** | Racing Sans One | 50px | 500 | - | italic novelty face |

Three findings that matter for this build:

1. **Nine of the twelve strongest sites use a proprietary or licensed display face.**
   The two that use free Google fonts (localrent Montserrat 900, discovercars Inter 800)
   are precisely the two that read as commodity. The current client site's Racing Sans
   One is worse than either: a novelty italic racing face is the visual equivalent of
   a chequered-flag graphic.
2. **Weight 400 dominates at large sizes.** Lucid, Blacklane, Porsche and scgroup all
   set their display line at weight 400 or lighter. Weight 800-900 at large size is a
   budget signal in this category, not a premium one. Turo gets away with 900 only
   because they set it at 38px.
3. **Serifs are back at the top end.** Lucid (72px serif), scgroup (200px serif),
   Blacklane (PP Fragment, a hybrid). This is genuinely current, but note the DESIGN.md
   2026 recalibration: "high-contrast serif display plus warm cream plus terracotta" is
   now itself an AI default. A serif is only a differentiator here if it is paired with
   something that is not cream and not terracotta.

## 1.5 What separates expensive from templated, distilled

Measured tells, in rough order of impact:

1. **The fold carries verifiable facts, not adjectives.** Lucid's fact bar
   ($699/mo, 2 years, 280,000+ chargers). Finn's Trustpilot 4.1 with 50,000 customers.
   Turo's live cars with real per-day prices immediately under the hero.
   DiscoverCars' "279,408 reviews". Every weak hero probed carries only claims.
2. **The vehicle is in a place, or it is cropped to a detail.** Full environment
   (Lucid, Rivian, Finn, Zeekr) or macro crop (Turo, Sixt). **No probed premium site
   floats a cut-out car on a flat background.** That treatment appears only on template
   marketplaces and on the client's category peers.
3. **The headline sits low and small.** Lucid at y=645/900, Blacklane at y=578/900.
   Weak heroes centre the headline vertically and blow it up.
4. **One accent, on one element.** Turo's purple exists on a 40x36 button and nowhere
   else in the fold.
5. **Hairlines, not shadows.** Lucid's fact bar is divided by 1px rules. Blacklane's
   fields are underlined, not boxed.
6. **The form is subordinate to the image** either by transparency (Blacklane) or by
   overlapping it (Virtuo, Turo).
7. **Asymmetry.** Ragged-right two-line headlines, off-centre placement, the form
   breaking a container edge. Centred-everything reads as template.

---

# PART 2 - MOTION

## 2.1 What these sites actually run, measured

This is the part where most research goes wrong, because a keyword scan of a
stylesheet lies. Below, the false positives are separated from the real usage.

### The false positive that must be discounted

Blacklane, Lucid, Porsche, localrent, virtuo.com and **the client's own WordPress
site** all appear to use `view-timeline`, `scroll-timeline`, `timeline-scope`,
`view-transition-name`, `anchor-name` and `interpolate-size`. They do not. Dumping the
matching rule text shows the hits are all inside blanket reset declarations that
enumerate every CSS longhand:

```css
/* blacklane.com */
.Carousel_indicatorDots__CHk6F { color-scheme: unset; forced-color-adjust: unset;
  math-depth: unset; position-anchor: unset; text-size-adjust: unset; appearance: unset; ... }
/* 24-7rentalcar.com, from WooCommerce */
.woocommerce-js div.product form.cart .reset_variations { color-scheme: initial; ... }
```

The tell is that the counts for the whole cluster are identical on a given site (1 on
Blacklane, 4 on Lucid). Any research that reports "Blacklane uses scroll-driven
animations" is reading a reset. Discount all of it.

### The real usage

**getaround.com is the only probed site in this category shipping a genuine native CSS
scroll-driven animation in production.** Verified rule text:

```css
body.marketing-page#pages_homepage_index::before { animation-timeline: scroll(); }
```

It drives a tiling zigzag SVG background on a `::before` pseudo-element behind the whole
marketing page. `document.getAnimations()` after scrolling confirms one animation whose
timeline constructor is not `DocumentTimeline`. Getaround also registers custom
properties for real:

```css
@property --c-state-interactive-color { syntax: "<color>"; inherits: false; initial-value: transparent; }
```

Other verified real usage across the set:

| Feature | Sites shipping it | Count |
|---|---|---|
| `animation-timeline: scroll()` | getaround.com | 2 rules, 1 animation running |
| `@property` | finn.com **78 declarations**, getaround.com 1 | design tokens that can be animated |
| `@starting-style` | turo.com 2, rivian.com 1 | entry animation without JS |
| `@container` | rivian.com **25** | container queries in production |
| `text-wrap: balance` | getaround 3, rivian 2, porsche 1 | headline ragging |
| `backdrop-filter` | kinto **71**, blacklane 18, lucid 14, porsche 10 | the most-used modern effect by a distance |
| `prefers-reduced-motion` blocks | blacklane **15**, kinto 9, lucid 4, porsche 3, rivian 3 | |
| `scroll-snap-type` | finn 4, blacklane 3, kinto 3, discovercars 3, zeekr 3 | carousels without JS |
| JS motion libraries detected | **none anywhere** except Swiper on localrent | |

That last row is the headline finding. Across nineteen sites including two Awwwards
entries, the probe found **no GSAP, no Lenis, no Locomotive, no Framer Motion, no AOS,
no Three.js**. Only localrent, the cheapest-looking site in the set, loads Swiper. The
premium end of this category is running on plain CSS transitions plus a small amount of
framework-internal JS. A zero-dependency build is not a handicap here, it is what the
reference set is already doing.

### The measured motion vocabulary

Every site's stylesheets were scanned for `cubic-bezier()` and duration frequency.

| Site | Signature easing (uses) | Dominant durations |
|---|---|---|
| lucidmotors.com | `cubic-bezier(0.16, 1, 0.3, 1)` (3) and its mirror `(0.3, 0, 0.16, 1)` (2) | **0.3s x107**, 0.5s x20, 0.2s x19 |
| scgroup.dk (Awwwards HM) | `cubic-bezier(.16,1,.3,1)` (16) | 2s x23, 85s x16 (marquee), 0.15s x14 |
| zeekrglobal.com | `cubic-bezier(0.645,0.045,0.355,1)` (36) | **0.3s x203**, 0.2s x52 |
| kinto-mobility.eu | `cubic-bezier(0.455,0.03,0.515,0.955)` (10) | **0.3s x198**, 0.5s x79, 0.2s x70 |
| porsche.com | `cubic-bezier(0, 0, 0.2, 1)` (20) | 0.3s x22, 0.2s x17, 0.4s x16 |
| getaround.com | `cubic-bezier(0.4, 0, 0.2, 1)` (16) | 0.15s x29, 0.3s x14 |
| blacklane.com | `cubic-bezier(0, 1.2, 1, 1)` (2) | 0.2s x18 |
| turo.com | `cubic-bezier(0.25,0.46,0.45,1.1)` (8) | 0.15s x11, 200ms x9 |
| polestar.com | `cubic-bezier(0.15, 1, 0.35, 1)` (3) | 200ms x12 |
| discovercars.com | `cubic-bezier(0.86, 0, 0.07, 1)` (2) | 0.2s x49, 0.15s x36 |
| localrent.com | `cubic-bezier(0.175,0.885,0.32,1.275)` (14, an overshoot) | 0.3s x24 |

Three conclusions with numbers behind them:

1. **0.2s to 0.3s is the entire premium vocabulary.** Lucid uses `0.3s` 107 times,
   Zeekr 203 times, Kinto 198 times. Anything above 0.5s in a UI transition is outside
   what any of these ship. The DESIGN.md guidance of "two easing curves, 180ms max" is
   slightly tighter than reality; the measured reality is two curves, 150 to 300ms.
2. **`cubic-bezier(0.16, 1, 0.3, 1)` is the current premium curve** (easeOutExpo-ish,
   fast start, long settle). Lucid uses it and its exact mirror for exits. scgroup.dk
   uses it 16 times. This is the one to adopt, with `cubic-bezier(0.3, 0, 0.16, 1)` as
   the exit pair. Two curves, symmetrical, done.
3. **Overshoot easing is a downmarket tell.** The only sites with a bounce past 1.0 in
   the curve are localrent `(0.175, 0.885, 0.32, 1.275)` and Turo `(...,1.1)`. Blacklane
   has one `(0, 1.2, 1, 1)`, used twice, on a toggle. Do not put spring overshoot on
   page-level motion.

### Video, and the pause button

Only two probed sites autoplay video in the hero: porsche.com (a full-viewport HLS
adaptive stream) and scgroup.dk (nine `<video>` elements). Porsche ships a **visible
pause control at bottom right** of the hero. That is WCAG 2.2.2 Pause, Stop, Hide
compliance for content that moves for more than five seconds, and it is the detail most
video heroes get wrong. If this build ever autoplays anything longer than 5s, it needs
that control.

## 2.2 What this build already has

Important context before recommending anything. `docs/css/app.css` (964 lines) already
ships a more complete native motion system than most of the reference set:

- `--out: cubic-bezier(.16,1,.3,1)` and `--in: cubic-bezier(.7,0,.84,0)`. **That is
  already the exact curve Lucid and scgroup.dk use.** No change needed.
- Three durations only: `--t1: 160ms`, `--t2: 280ms`, `--t3: 620ms`.
- `@view-transition { navigation: auto; }` cross-document MPA transitions, with
  `view-transition-name: stage-car` on the car image so the same car morphs from the
  fleet list to its own page. **No probed competitor does this.**
- `@property --sweep { syntax: '<percentage>' }` registered.
- A staggered `rise` entrance on the H1 spans (70ms, 140ms, 210ms) and the exit rail.
- A full `@supports (animation-timeline: view())` block with six scroll-driven
  behaviours: `drive-in`, `flag-in`, `reveal`, `settle` (photo scale 1.06 to 1), `big-in`,
  and a `wipe` that clip-paths section headings in from their left edge.
- `@media (prefers-reduced-motion: reduce)` killing every animation and transition, plus
  `scroll-behavior: auto`.
- Self-hosted variable fonts: Archivo (weight 100-900, width 62-125%) and Martian Mono.

So the motion recommendation in Part 4 is deliberately not "add a motion system". It is
already there and it is correct. What is missing is motion **in the hero itself**, which
currently only gets the load stagger, and a small number of gaps listed in 4.5.

## 2.3 What native CSS can actually do, with 2026 support numbers

All figures from the W3C WebDX web-features explorer, read 5 Aug 2026. Usage
percentages are Chrome Platform Status page-load shares.

| Feature | Chrome/Edge | Safari | Firefox | Baseline | Chrome page loads | Fallback if unsupported |
|---|---|---|---|---|---|---|
| **Scroll-driven animations** (`animation-timeline`, `scroll()`, `view()`, `animation-range`, `timeline-scope`) | 115, 18 Jul 2023 | **26, 15 Sep 2025** (incl. iOS 26) | **not supported**, positive position | **blocked since Sep 2025 by Firefox** (11 months) | 5.311% | element renders in its final state, no animation at all |
| **Same-document view transitions** (`view-transition-name`, `::view-transition`) | 111, Mar 2023 | 18, 16 Sep 2024 | **144, 14 Oct 2025** | **Newly available 2025-10-14**, widely available projected 2028-04-14 | 0.846% | instant swap |
| **Cross-document view transitions** (`@view-transition { navigation: auto }`) | 126, 11 Jun 2024 | 18.2, 11 Dec 2024 | **not supported** | **blocked since Dec 2024 by Firefox** (20 months) | **11.321%** | ordinary page navigation |
| **`@starting-style`** | 117, Sep 2023 | 17.5, 13 May 2024 | 129, 6 Aug 2024 | **Newly available 2024-08-06** | - | element appears without an entry animation |
| **`@property`** | 85, Aug 2020 | 16.4, 27 Mar 2023 | 128, 9 Jul 2024 | **Newly available 2024-07-09** | - | custom property is an unanimatable string |
| **`transition-behavior: allow-discrete`** | 117, Sep 2023 | 17.4, 5 Mar 2024 | 129, 6 Aug 2024 | **Newly available 2024-08-06** | - | discrete property snaps |
| **`interpolate-size` / `calc-size()`** | 129, 17 Sep 2024 | **not supported** (bug 274177) | **not supported** (bug 1896734) | **Limited availability** | 0.285% | `<details>` opens instantly, which is fine |

Reading for this build:

- **Scroll-driven animation is safe to use and unsafe to depend on.** It is in Chromium
  and, since Safari 26 in Sep 2025, in iOS Safari. Firefox stable still does not ship it,
  which is why it is not Baseline. Everything driven by `view()` must therefore be
  **enhancement only**: the element must be fully visible, positioned and legible with
  the animation removed. The existing `@supports (animation-timeline: view())` gate plus
  `both` fill mode does exactly this, and it must stay.
- **The Albanian tourist audience makes Safari 26 the number that matters**, not
  Firefox. Firefox mobile share is negligible; iOS Safari is not. Safari has shipped it
  for eleven months, so on this audience the effective coverage is high.
- **Cross-document view transitions are the highest-value thing in the box** for a static
  multi-page site: 11.321% of all Chrome page loads already use them, and this build
  already has `@view-transition { navigation: auto; }`. Firefox users simply get a normal
  navigation.
- **`interpolate-size` is Chrome-only.** The animated `<details>` in Tier 2 item 6 will
  work for roughly Chromium users only. That is acceptable because the fallback is the
  browser's own instant disclosure, but do not describe it to the client as a feature.
- `@property`, `@starting-style` and `allow-discrete` are all Baseline newly-available
  and safe in all three engines.

### Cross-checked global support, from caniuse

WebDX gives per-browser versions; caniuse gives weighted global share. Both were read.

| Feature | caniuse global | Samsung Internet |
|---|---|---|
| `prefers-reduced-motion` | **94.73%** | yes |
| `@property` | 92.91% | yes |
| `content-visibility` | 91.97% | yes |
| `transition-behavior: allow-discrete` | 88.88% | yes |
| `@starting-style` | 88.82% | yes |
| View transitions, same-document | 88.47% | 22 |
| **Scroll-driven animations** | **83.66%** | **23** |
| **Cross-document view transitions** | **82.01%** | 28 |
| CSS anchor positioning | 81.67% | 27 |
| `interpolate-size` / `calc-size()` | 69.05% | partial |

Samsung Internet 23 maps to Chromium 115, so the mid-range Android fleet this audience
carries is largely covered for scroll-driven animation. Sources:
[caniuse wf-scroll-driven-animations](https://caniuse.com/wf-scroll-driven-animations),
[caniuse wf-cross-document-view-transitions](https://caniuse.com/wf-cross-document-view-transitions),
[caniuse wf-interpolate-size](https://caniuse.com/wf-interpolate-size),
[api.webstatus.dev](https://api.webstatus.dev/v1/features/scroll-driven-animations).

One correction to a widely repeated claim: several 2026 articles state Firefox 132+
supports scroll-driven animations. **That is false.** MDN browser-compat-data records
`"version_added": "preview"` for `animation-timeline`, meaning Nightly only. The pref is
`layout.css.scroll-driven-animations.enabled`, on by default in Nightly since Firefox
136 and off in Developer Edition, Beta and Release, through Firefox 156.

Safari detail worth knowing: Safari 26.0 shipped the feature, but **26.4 moved it to the
compositor thread** and 26.5 fixed timeline range names, `animation-play-state: paused`,
wrong progress values near the 0% and 100% thresholds, and bfcache restore. So 26.4/26.5
is where it became trustworthy, not 26.0.
([WebKit 26.4](https://webkit.org/blog/17862/webkit-features-for-safari-26-4/),
[WebKit 26.5](https://webkit.org/blog/17938/webkit-features-for-safari-26-5/))

## 2.4 Two defects this research found in the current build

**1. The `@supports` gate is insufficient and will misfire in Firefox Nightly.**
`app.css` line 624 uses:

```css
@supports (animation-timeline: view()) { ... }
```

A bare `animation-timeline` test **passes in Firefox's partial implementation** while
`animation-range` does not work, which produces animations with wrong timing rather than
no animation. Bram Van Damme documents this exact trap
([bram.us, Sep 2024](https://www.bram.us/2024/09/24/feature-detecting-scroll-driven-animations-you-want-to-check-for-animation-range-too/)).
The correct gate, and a one-line fix:

```css
@supports ((animation-timeline: view()) and (animation-range: 0% 100%)) { ... }
```

**2. `view-transition-name: stage-car` is declared on three selectors.**
It appears on `.hero-img` (line 278), `.stage-img` (line 232) and is referenced for
`.deck-car` in the Part 4 proposal. **Duplicate `view-transition-name` values in one
document abort the whole transition silently.** These three never co-occur today
(car page, fleet page, home page), but if the home hero car ever ships alongside the
flagship strip car, or a car page ever shows a related-car image with the same name, the
site's signature gesture dies with no error. Worth an explicit build-time assert.

Two things the build already gets right that are commonly got wrong: `animation-timeline`
is always declared **after** the `animation` shorthand (declaring it before means the
shorthand resets it to `auto`), and every scroll-driven rule carries `both` fill mode,
without which elements snap to their un-animated state before entry and after exit.

## 2.5 Motion patterns that now read as dated or as AI template

Evidence-backed, not taste. The strongest source here is Nielsen Norman Group, who
actually usability-tested the dominant pattern.

| Pattern | Verdict | Evidence |
|---|---|---|
| **Universal fade-up on scroll**, ~20-30px, 0.5s, on every section | **Dead, and the loudest single tell.** NN/g found users read it as a fault, not polish. Participant: "I don't like how everything comes together when I'm scrolling down. I hate that it has to load every single section." | [NN/g, Scroll-Triggered Text Animations Delay Users](https://www.nngroup.com/articles/scroll-animations/) |
| Scroll-triggered animation on **body text** | **A usability defect, not a style choice.** NN/g's rules: avoid entirely on task-focused sites, apply to secondary content only, never replay. A rental booking site is a task-focused site. | same |
| Infinite logo or testimonial marquee | **Dead, plus a WCAG 2.2.2 Level A failure** without a keyboard-accessible pause control | see 2.6 |
| Blur-in headlines, counters ticking up, mouse-following spotlight, magnetic buttons, rotating conic-gradient borders, text scramble, split-letter stagger, 3D tilt cards | **AI-template tells.** These are the Aceternity UI / Magic UI set. No 2025-2026 craft source defends any of them. | consistent with `.claude/design/DESIGN.md` |
| Parallax hero backgrounds | **Dated and the highest vestibular-risk item on the list.** WebKit singles out parallax and zoom as the discomfort-heavy category. | [WebKit SDA guide](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/) |
| Lenis / Locomotive smooth scroll | **Dated by default.** Ships a library to override a native behaviour, costs main-thread work, breaks scroll anchoring. Non-negotiable for a zero-dependency build. | |
| Scroll-jacking, pinned full-screen sections | **Contested, mostly dated.** Defensible only when the pinned section carries a genuine sequential narrative, which most copies do not. | |
| Aurora / mesh animated gradients | **Dated and expensive.** A large animated blur is the exact case the performance tier list warns about. | |
| Motion because the tool made it easy | Named by practitioners: "Motion for motion's sake... The trend I'm tired of is dishonesty." | [Creative Boom, 10 trends creatives are so over in 2026](https://www.creativeboom.com/insight/10-trends-creatives-are-so-over-in-2026/) |

### What has replaced them in genuinely high-craft work

1. **Motion as state feedback, not decoration.** Emil Kowalski's frequency rule: an
   action a user triggers 100+ times a day gets no animation ever; tens of times a day
   gets it drastically reduced; only occasional and first-time moments earn delight.
   Never animate keyboard-initiated actions.
   ([review-animations STANDARDS.md](https://github.com/emilkowalski/skills/blob/main/skills/review-animations/STANDARDS.md))
2. **One signature transition per site.** The cross-document view transition is the 2026
   version: whole-site motion identity in three lines of CSS.
3. **Content arrives instantly, chrome animates.** The exact inversion of fade-up. Text
   is present on paint; borders, underlines, image masks and the header do the moving.
4. **Compositor-only scroll effects that carry information**, such as a progress rule or
   a section indicator, rather than effects that gate content.
5. **Interruptibility.** Transitions over keyframes for anything re-triggerable, because
   keyframes restart from zero and that is what makes cheap sites feel cheap.
6. **Physicality.** `scale(0.97)` on `:active` at 160ms reads more expensive than any
   animated border and costs nothing.

Note on a claim to avoid: GSAP became free after Webflow acquired GreenSock, and it is
tempting to say that caused the flood of identical scroll animations. No citable source
was found for that causal claim. Do not assert it.

## 2.6 Accessibility, and why it is commercial here

**`prefers-reduced-motion` in 2026 means reduce, not delete.** The current consensus is
to keep opacity and colour changes and drop transform-based movement, parallax, scale
and anything traversing a large part of the viewport. Use the opt-in form
(`no-preference`) rather than opt-out, because it also protects users on devices that
never surface the setting. The current build uses a blanket
`*, *::before, *::after { animation: none !important; transition: none !important; }`
under `reduce`, which is defensible and safe, if slightly blunter than current advice.

**SC 2.2.2 Pause, Stop, Hide (Level A).** Any moving content that starts automatically,
lasts more than five seconds and sits alongside other content needs a mechanism to
pause, stop or hide it. For a marquee to comply, the control must exist, be **keyboard
accessible**, be clearly labelled, and actually halt the motion.
**`prefers-reduced-motion` does not satisfy this**; it is good practice, not a
conformance mechanism. This is why the answer for this site is simply to not build a
marquee. It is also why Porsche ships a visible pause button on its hero video.
([W3C Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html))

**SC 2.3.3 Animation from Interactions (Level AAA).** Motion triggered by interaction
must be disableable unless essential. Its definition explicitly excludes changes in
colour, blur or opacity that do not alter perceived size, shape or position, so
opacity-only reveals are out of scope. Parallax and scroll-scrub are in scope.

**The European Accessibility Act has been enforceable since 28 June 2025**, its technical
standard EN 301 549 v3.2.1 references WCAG 2.1 Level AA, it applies to businesses serving
EU consumers **regardless of where the business is based**, and transport and travel
booking is explicitly in scope. The exemption is micro-enterprise only: fewer than 10
employees **and** under EUR 2 million turnover. A 19-car operator in Tirana very likely
qualifies for that exemption, so this is not a compliance emergency, but it is worth one
line in the proposal: the site is built to WCAG 2.1 AA anyway, which is a differentiator
against every regional competitor and costs nothing given the build already passes
contrast gates.
([Level Access](https://www.levelaccess.com/compliance-overview/european-accessibility-act-eaa/),
[Regiondo](https://pro.regiondo.com/blog/european-accessibility-act-eaa-a-complete-guide-for-tour-and-activity-providers/))

## 2.7 Performance, and the budget for this audience

**What is cheap.** Only `transform` and `opacity` are endorsed without qualification by
web.dev. In Chromium, the compositor can also mutate `filter`, `backdrop-filter` and
`clip-path`. `background-color`, `color`, `border-radius`, SVG geometry and **any CSS
custom property** trigger paint. `width`, `height`, `margin`, `top`, `left`, `display`
and grid properties trigger layout and must never be animated on a marketing page.

**Why `filter` and `box-shadow` cost more than they look.** Blur cost is superlinear in
radius and scales with layer area. Framer flags blur values over 10px for this reason.
`box-shadow` is a blur that also repaints, so `filter: drop-shadow` on a promoted layer
is the cheaper form. Relevant here: `.deck-car img`, `.hero-img`, `.flag-img` and
`.stage-img` all carry 34 to 44px `drop-shadow` blurs on large images. Those are static,
so they cost once, but they must not become animated.

**`will-change` is not free.** web.dev advises against using it early, and the real
failure on a mid-range Android with shared GPU memory is not a slow frame but a blank
layer or a hard stutter from blown layer budgets. The current build uses no blanket
`will-change`, which is correct. Scroll-driven `transform` and `opacity` are already
composited in Chrome 115+ and Safari 26.4+ without it.

**INP thresholds are unchanged in 2026**: 200ms or less is good, above 500ms is poor, at
the 75th percentile. A zero-JS site starts near-perfect. The only way to lose it is to
put animation work on the main thread. Chrome's published case study has Tokopedia
measuring **CPU during scroll falling from 50% to 2%** and removing "up to 80% of our
lines of code" by replacing JS scroll listeners with CSS scroll timelines.
([developer.chrome.com/blog/css-ui-ecommerce-sda](https://developer.chrome.com/blog/css-ui-ecommerce-sda))

**The connection to design for.** Albania's national median mobile download was
128.52 Mbps in May 2026, and that number is irrelevant to this audience: inbound tourists
on roaming plans, foreign SIMs throttled past their fair-use cap, coastal and mountain
coverage, hotel wifi. Design to the Lighthouse mobile profile, **1.6 Mbps down, 150ms
RTT, 4x CPU slowdown**, which Lighthouse describes as roughly the bottom quartile of 4G
and top quartile of 3G. The national median then becomes headroom.

**Budget for this site:**
- 0 KB of JavaScript for motion. Every effect is CSS or it does not ship.
- Under 200 KB initial, hero imagery excluded.
- Two easing curves total. Already true: `--out` and `--in`.
- Three distinct motion behaviours: one page transition, one reveal, one press.
- Nothing above the fold may delay the H1 or the booking CTA being readable.
- Duration ceiling for UI transitions: 300ms. Press 100-160ms, dropdowns 150-250ms,
  panels 200-500ms. The build's `--t1: 160ms` and `--t2: 280ms` sit correctly inside this;
  `--t3: 620ms` is above it and should stay reserved for page-level and load-level motion
  only, which is how it is currently used.

## 2.8 The 360 spin and scroll-scrubbed frame sequence: do not build it

This is the obvious "automotive" motion idea, so it is worth killing explicitly.

**Can it be done with zero JS?** A sprite sheet plus `steps()` timing plus
`animation-timeline` genuinely works, and there are working demos. But the measured
numbers say no for photographic car frames:

| Encoding, 65-frame sequence | Weight |
|---|---|
| 65 individual PNGs | **15.2 MB** |
| 65 individual WebPs | 1.7 MB |
| single WebP sprite sheet, 11 x 6 | **1.5 MB** |

([geyer.dev](https://geyer.dev/blog/css-image-sequence-animations/)). Sirv, whose data on
360 spins is the best-documented vendor source, reports a real 72-image spin going from
40.4 MB of originals to **1.1 MB** optimised, roughly 15 KB per frame, and recommends 24,
36 or 72 frames, under 100 ([sirv.com](https://sirv.com/help/articles/images-for-a-360-spin/)).

At 1.6 Mbps that is 6 to 10 seconds before a single frame appears, and on DevTools 3G at
400 Kbps it is 30 to 40 seconds.

**The hard blocker is iOS decode limits.** Mobile Safari caps canvas at 16,777,216 total
pixels, and decoded PNG/WebP at **3 megapixels** on devices under 256 MB RAM and
**5 megapixels** above it. A 36-frame sheet at a modest 800x450 per frame is
**28.8 megapixels** of decoded surface, five to nine times over the ceiling. Even 24
frames at 640x360 is 5.5 megapixels, right at the edge. The technique scales to a 64x64
pixel-art sprite. It does not scale to car photography on the devices this audience
carries. ([William Malone](https://www.williammalone.com/articles/html5-javascript-ios-maximum-image-size/),
[pqina](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/))

**Scroll-scrubbed video is JavaScript-only.** There is no CSS mechanism binding a
`<video>` element's `currentTime` to scroll. `animation-timeline` animates CSS
properties; `currentTime` is a DOM property. A `video-timeline` has been requested at the
CSSWG and nothing has shipped. Same for animated WebP and AVIF.

**And it is the wrong sale anyway.** A 360 spin sells a *specific* car to a buyer. A
rental company sells availability, price, pickup convenience and trust. The motion budget
belongs in the booking path.

**Zero-JS alternatives that still read premium**, in order of value:

1. **Cross-document view transitions between the fleet list and each car page.** Same
   `view-transition-name` on the card image and the detail hero, so the car grows into
   place across a real page navigation. Three lines of CSS, zero JS, zero extra bytes,
   and **the build already has it**. This is the highest-value motion on the site.
2. One well-art-directed still per vehicle, AVIF with a WebP fallback in `<picture>`. A
   1600px AVIF hero is roughly 80 to 150 KB, one to two percent of a spin sequence.
3. A `view()`-driven clip-path or mask wipe on the hero as it enters. Compositor-only,
   degrades to a plain visible image. The build's `wipe` keyframe already does this for
   headings.
4. A 4 to 6 second muted `playsinline` loop of a car on a coastal road, under 1 MB, with
   `poster` set and `preload="none"` if below the fold. Cheaper than a sequence and more
   evocative than a turntable. Needs a pause control if it runs over 5s (SC 2.2.2).
5. `content-visibility: auto` **always paired with `contain-intrinsic-size`** on fleet
   cards below the fold, so the 19-card list costs nothing to scroll on a mid-range
   Android. Without the intrinsic size you manufacture CLS.

---

# PART 4 - RECOMMENDATION

## 4.0 The diagnosis, stated once

The current proposal hero is a 100svh grid holding a 44-184px condensed uppercase H1 in
three staggered lines, a cut-out Jaguar pulled up by a negative margin and right-aligned
at 64vw, a booking card in a 30vw right column, and a three-link exit rail. Nothing in
it is wrong. It is well built and it lints clean.

It has no wow because of three measurable things:

1. **The car is a cut-out on a flat warm-grey field.** Section 1.5 finding 2: not one
   premium site in the reference set does this. It is the signature move of template
   marketplaces, and it also actively contradicts the pitch. "The exact car in the
   photo" is a claim about *reality*, and a cut-out is the one treatment that removes
   all evidence of reality: no place, no light, no ground, no time of day.
2. **The fold is mostly empty paper.** At 100svh with a 184px headline, roughly 55% of
   the first screen is `--paper` #F4F2F0. The reference set fills 0.66 to 1.00 of the
   fold with image. Whitespace is a component, but it has to be protecting something.
3. **The single most valuable fact the company owns is not visible.** "Open at every
   hour" is asserted in a headline and confirmed by a small pulsing dot. It is never
   *shown*. Getaround's subhead is literally "Unlock cars 24/7", so the phrase alone
   differentiates nothing. It has to be demonstrated.

All three concepts below fix all three. They differ in what they bet on.

## 4.1 Concept A - THE NIGHT SHIFT

**The bet:** one real photograph, taken at night, of a real car of theirs, at a real
place in Tirana, is worth more than any layout idea.

### Desktop, 1440x900

- Full-bleed photograph, `object-fit: cover`, covering 1.00 of the fold, bleeding under
  the nav. The shot: one of the 19 cars (the Jaguar XF or the Mercedes C220) parked
  under the canopy at Tirana airport arrivals or outside the city office, **at night**,
  sidelights on, a person with keys in the frame or just out of it, wet tarmac if
  possible. Warm sodium and cool LED against near-black. Real place, real plate, real hour.
- A vertical scrim, `linear-gradient(180deg, rgba(20,18,18,.55) 0%, transparent 38%,
  rgba(20,18,18,.78) 100%)`, so both the nav and the base bar hold contrast without
  flattening the middle.
- **H1 low and left**, baseline at roughly y=620 of 900, x = `var(--pad)`. Copy:
  `Albania at any hour`, kept, but set at `clamp(40px, 6vw, 108px)`, not 184px, in
  Archivo at `font-stretch: 125%` weight 800. One line at desktop, two at tablet.
  Reference: Lucid sets 72px at y=645; Blacklane 64px at y=578.
- Directly under it, one 17px line in `--dim` on the scrim: the arrival line already
  written for the flag strip, trimmed. `Most Tirana flights land after midnight.`
- **The base bar**, the Lucid device, full width, sitting on the bottom edge of the
  photograph, divided by four hairlines `rgba(255,255,255,.28)`:

  | OPEN NOW | 19 CARS | FROM 30 EUR | TWO DESKS |
  |---|---|---|---|
  | live Tirana clock, `03:41` | 12 automatic | per day, all in | airport + city |

  Labels in `.sign` (Archivo 62% width, 13px, .14em tracking, uppercase). Values in
  Martian Mono at `clamp(26px, 3vw, 52px)`, reusing the existing `.flag-stats` treatment.
  The existing pulsing open light sits in cell one, beside the clock.
- **Booking entry**: the Blacklane pattern. A translucent bar, `rgba(20,18,18,.35)` with
  `backdrop-filter: blur(14px) saturate(1.2)`, radius `var(--r)`, sitting **above** the
  fact bar at roughly y=470, inset `var(--pad)` each side. Three fields only, each a
  `.sign` label over a hairline-underlined control: Where (select, 2 options), From
  (date), To (date). Then the existing `Show 19 cars` button in `--verde`. Under the bar,
  the existing "or skip the form" row: WhatsApp and the `tel:` link, side by side.
  Field count drops from 4 to 3 (Blacklane 4, Virtuo 3, Turo 5).
- Exit rail moves out of the hero and becomes the first band below it, on `--paper`.

### Mobile, 390px

Vertical order: nav (phone + WhatsApp icons already there) / photograph at 62svh with
the scrim / H1 at `clamp(32px, 9vw, 44px)` sitting on the photo's lower third / the
one-line arrival note / the fact bar as a **2x2 grid** with hairline dividers, still on
the photo / then, on `--paper` below the fold line, the booking form full width, all
three fields stacked, then the button, then WhatsApp and Call as two equal 48px-tall
buttons side by side. No sticky bar on the home page, since the car pages already carry one.

### Motion

- Load: the existing `rise` stagger, retimed. Photo is present immediately, it does not
  fade in (LCP). H1 at 0ms, note at 70ms, fact-bar cells at 140/180/220/260ms, booking
  bar at 300ms. All `var(--t3) var(--out)`.
- Scroll: `animation-timeline: view()` on the photograph running the existing `settle`
  keyframe in reverse, `scale: 1` to `1.06` over `entry 0% cover 100%`, so the image
  slowly pushes in as it leaves. Compositor-only, gated by the existing `@supports`.
- The clock: the one piece of JS. `setInterval` at 1000ms writing
  `Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Tirane',hour:'2-digit',minute:'2-digit'})`
  into a `<time>` element that is server-rendered with a static value, so it is correct
  and legible with JS off. Six lines, no dependency.
- Nothing else. No parallax on the photo, no letter-splitting, no counters.

### Why it suits this business

The whole pitch is "we are there when nobody else is". A daylight studio cut-out cannot
say that. A photograph taken at 03:00 says it before a word is read, and it doubles as
proof for the second claim, because the car in the picture is a car they own with a
plate you could read.

### The cost, stated honestly

**This concept requires one night photo shoot.** `PROGRESS.md` already asks them to
reshoot three cars; this makes it one evening instead of one afternoon, plus a
tripod-steady phone. If they will not do it, Concept A must not be faked with a stock
night road. Fall back to B.

## 4.2 Concept B - THE HOUR BOARD

**The bet:** if you cannot photograph the hour, make the hour the interface. Zero new
assets required.

### Desktop, 1440x900

- Full-bleed **ink** field, `#141212`, edge to edge, the same surface the flagship band
  and footer board already use, so this is a brand surface and not a new one.
- Top left, H1 at `clamp(38px, 5.5vw, 96px)`, two lines, ragged right:
  `Every hour on / the clock` (or the existing line, kept).
- Under it, the signature element: **the 24-hour board**. A full-width row of 24
  hairline ticks, `1px` verticals at `rgba(244,242,240,.28)`, each with its hour in
  Martian Mono 11px under it, `00` through `23`. Every tick is lit in `--open-board`
  #35B66F, because they are open at all of them. The current Tirana hour gets a taller
  tick, a filled dot and the live time beside it. Beneath the row, one 13px `.sign` line:
  `TWO DESKS. TWENTY-FOUR HOURS. NO EXCEPTIONS.`
  This is the only element on any competitor site in the sample that would be
  unmistakably theirs.
- The car: the existing cut-out, but **on ink**, entering from the right at 56vw,
  bottom-aligned and bleeding off the right edge, with a soft elliptical ground shadow
  rather than the current `drop-shadow`. Cut-outs read as deliberate on a dark field and
  as clip-art on a light one. This is the cheapest way to rescue the asset they have.
- Booking bar: full-width, sitting on the bottom edge of the ink field, on
  `rgba(244,242,240,.06)` with a `1px` top hairline. Three fields plus button, laid out
  as four equal columns divided by hairlines, exactly like the fact bar so the two
  elements rhyme. WhatsApp and Call sit at the right end of the same rule.
- Numbers live in a slim strip below the board: `19 CARS / 12 AUTOMATIC / FROM 30 EUR`.

### Mobile, 390px

Nav / H1 at `clamp(30px, 8.5vw, 40px)` / the 24-hour board, **which is the one thing
that must survive**: at 390px it becomes 24 ticks at roughly 13px pitch, hour labels on
every sixth tick only (`00 06 12 18`), current hour dotted / live clock line / car
cut-out full width bleeding right / then the form stacked on ink / WhatsApp and Call.

### Motion

- Load: ticks reveal left to right with an 18ms stagger via `nth-child` and
  `--i`-based `animation-delay`, total under 450ms. `opacity` and `scaleY` only.
- The current-hour dot uses the existing open-light pulse, 2s, `prefers-reduced-motion`
  honoured.
- Scroll: on scroll out, `animation-timeline: view()` fades the board's tick opacity
  from 1 to .25 over `exit 0% exit 100%`. One rule.
- The clock: same six lines of JS as A, server-rendered fallback.
- The car cut-out gets the existing `drive-in` translate, `-6%` to `0`.

### Why it suits this business

It argues rather than asserts. A visitor comparing them with a competitor whose desk
shuts at 20:00 can see the difference as a shape. It also needs no new photography, uses
the ink surface the site already owns, and turns the weakest asset (a cut-out) into the
right asset by changing the ground under it.

### Risk

A clock strip can tip into gimmick. It survives only if it is drawn as instrument
hairlines, not as an infographic with icons, and only if the numbers beside it are real.

## 4.3 Concept C - THE NINETEEN

**The bet:** the fleet is the product. Put it in the fold, the way Turo does.

### Desktop, 1440x900

- Upper third on `--paper`: H1 small and left at `clamp(30px, 3.4vw, 56px)`, one line,
  plus a single `.mono` line of evidence: `19 cars. 30 to 65 EUR a day. The car in the
  photo is the car you get.`
- Middle: **a full-bleed horizontal band on ink holding all 19 cars**, each a card
  360px wide, real photo, model, year, gearbox, price. The band is a `scroll-snap-type:
  x mandatory` flex row with `overflow-x: auto`, native scroll, no library, no marquee.
  The 20th slot is not a card but an end-plate reading `THAT IS THE WHOLE FLEET. NO
  BAIT LISTINGS.` which is a real competitive statement in this market.
- Lower: the booking bar on `--paper` under the band, four columns, same treatment as A
  and B, with WhatsApp and Call at the right end.

### Mobile, 390px

Nav / H1 / evidence line / the same band, one card visible at a time with the next
peeking 32px, `scroll-snap-align: start`, `scroll-padding-inline: var(--pad)` / a
`19 cars, swipe` hint in `.sign` / then the form stacked.

### Motion

- The band is native scroll with snap. No autoplay, no marquee, so no WCAG 2.2.2
  obligation and no dated infinite-scroll tell.
- Cards use the existing `reveal` on `animation-timeline: view()`.
- Card hover: the existing `translate: 0 -4px` gesture, unchanged.
- Load: H1 and evidence line rise, then the first three cards stagger at 60ms intervals.

### Why it suits this business

Highest conversion honesty. It answers "what have you got and what does it cost" in the
fold, which is what an arriving tourist actually wants, and it makes a virtue of the
small fleet by naming its size instead of hiding it.

### Risk

Lowest wow of the three. A card band is a known pattern; it is Turo's, and it can read
as an e-commerce shelf. It also punishes the three bad car photos immediately.

## 4.4 Ranking

| | Concept | Wow | Truth to the pitch | Asset risk | Build cost |
|---|---|---|---|---|---|
| 1 | **A, The Night Shift** | highest | highest | **needs a night shoot** | medium |
| 2 | B, The Hour Board | high | high | none | medium |
| 3 | C, The Nineteen | moderate | high | exposes 3 weak photos | low |

**Build B, and put A in front of the client as the upgrade path.**

The reasoning: A is the better website, and if the client will spend one evening with a
phone and a tripod it wins outright. But this is a **proposal**, and a proposal cannot
ship depending on an asset the client has not agreed to make. B delivers a hero that is
unmistakably theirs, on assets that already exist today, and it fixes all three
diagnosed faults: the cut-out gets a dark ground that makes it deliberate, the fold
fills with a graphic device instead of empty paper, and the differentiator stops being
a claim and becomes a shape.

B and A also share the same skeleton: ink surface, headline low and left, a hairline
base bar with four cells, a translucent three-field booking bar, WhatsApp and Call on
the same rule. Swapping B's ink field for A's photograph is one background change and
one scrim. So building B first is not a detour, it is A minus the photograph. That is
worth saying to the client in exactly those terms: **"this is the hero today, and here
is what the same hero looks like the day you send us one night photo."**

C is the fallback if the client rejects both dark heroes, and its car band should be
built regardless as the section immediately below the hero, since it is the strongest
argument for a 19-car operator and it costs almost nothing.

## 4.5 Motion to add across the rest of the site, prioritised

The system in 2.2 is already correct, so this is a short list of gaps, ordered by value
per line of CSS. Everything here is native, zero dependency, and dies quietly under
`prefers-reduced-motion` and under the existing `@supports` gate.

**Tier 1, do these**

1. **Give the hero its own scroll exit.** Today the hero has load motion and nothing
   else, so the page starts alive and goes flat. One rule: the hero surface runs
   `animation-timeline: view(); animation-range: exit 0% exit 100%` moving `opacity`
   from 1 to .35 and `scale` from 1 to .98. Roughly 6 lines. This is the single biggest
   perceived-quality gain available.
2. **Reduce the reveal distance from 26px to 14px, and stop revealing everything.**
   The current `reveal` runs on nine selectors including `.foot-col` and `.qa-item`. A
   universal fade-up at 20 to 26px is the most-cited AI-template tell in the field. Keep
   it on `.lane`, `.dest-body > *` and `.sim-card`; drop it from the footer, the FAQ
   items and `.prom`, which should simply be present.
3. **Fleet: bind the sticky stage car to list scroll.** `.stage` is already
   `position: sticky` beside a scrolling list. Add a `scroll-timeline` on the list
   container and drive a 2 to 3 degree `rotate` plus a 4% `translate` on `.stage-img`
   from it. This is the one place a scroll-driven animation earns its keep, because the
   car visibly responds to the list. `timeline-scope` on the `.split` parent.
4. **Car page: make the reserve bar arrive.** The sticky reserve bar should slide up
   from `translate: 0 100%` once the main CTA has scrolled past, via
   `animation-timeline: view()` on the CTA with `animation-range: exit`. Currently it is
   just present. Pair with `env(safe-area-inset-bottom)`.

**Tier 2, worth it**

5. **Roads page: let the route photography settle.** `settle` already exists (1.06 to 1).
   Extend it to the route hero images and give the route numerals a `wipe` on entry,
   reusing the existing clip-path keyframe.
6. **FAQ: animate the disclosure open.** `<details>` with `interpolate-size: allow-keywords`
   plus `transition-behavior: allow-discrete` gives a real height transition on
   `content` with no JS. Gate with `@supports (interpolate-size: allow-keywords)`.
   Fallback is the browser's instant open, which is fine.
7. **Footer departure board: one flip, once.** The board is the best idea in the current
   footer. Let the OPEN NOW row flip its characters in on entry with a 24ms per-cell
   stagger, once, on `view()`. Do not loop it. A looping split-flap is a showreel.
8. **Extend the `stage-car` view transition to the home hero car.** The name already
   exists on `.hero-img` and `.stage-img`. If Concept B ships, put it on the deck car so
   the same vehicle carries from the home hero into the fleet stage and then into its own
   page. Three pages, one continuous object. Nothing in the competitive set does this.

**Tier 3, only if time**

9. Nav pill: it already morphs on pin, which is the site's signature gesture. Leave it.
10. Booking flow: `@starting-style` on the confirmation panel so it arrives rather than
    appears. Turo and Rivian both ship `@starting-style` today.

**Explicitly do not add**

- Any auto-playing marquee or infinite logo strip. It creates a WCAG 2.2.2 obligation, it
  is the most dated pattern in the list, and scgroup.dk's 85s loop is the only one in the
  whole reference set.
- Number counters ticking up on the fact bar. The numbers are small and real; animating
  them makes them look invented.
- Parallax on the hero photograph. Vestibular risk, and none of the premium set does it.
- Letter-splitting or scramble on the H1. Not one probed site splits letters.
- Smooth-scroll libraries. `scroll-behavior: smooth` is already set and is enough.
- A second accent colour. `--verde` red, `--open` green and `--sole` amber are already
  three; the green must stay confined to the open-state semantics.


