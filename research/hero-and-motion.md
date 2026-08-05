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
