# Homepage rebuild spec — reference-matched

Michael handed a reference screenshot (a travel/car-rental UI, "Horizone") and said: same
fonts, same approach, same sections, everything. Only exception: keep OUR navigation items,
the nav may take the reference's *look*.

Written before any CSS. Revised once, after the critic round, which is recorded at the end.

---

## Section map

| # | Reference | Ours | Why it changes |
|---|---|---|---|
| 1 | Nav overlaid on a rounded hero photo: logo, links, centre search, EN, Log In, Sign Up pill | Same bar, same overlay. Our links. Right side: the phone number, WhatsApp, Book a car pill | No site search exists. The phone number takes the centre weight the search field was carrying, which is also the thing they most want clicked |
| 2 | Hero photo, headline bottom-left, white booking bar overlapping the bottom edge | Identical. Collect at / Return to / Pick-up / Return, then a gearbox chip row and a dark Search pill | Their booking is an enquiry, so Search submits to book.html |
| 3 | "Top picks vehicle this month", 4×2 cards, category chip, spec icons, star rating, "Start from $70/day" | Same grid, same card anatomy. Rating dropped, replaced by the year. Price reads "40 € / day" | They publish no rating, and they publish a flat daily rate. "Start from" would invent a tier structure that does not exist |
| 4 | "Discover popular car rental in worldwide" + outlined city pills | "Where people drive to" + our 8 destinations and 3 routes as pills | Same device, real content |
| 5 | "Enjoy extra miles with our best deal", two wide photo cards with a giant 40% / 65% | Two wide photo cards, the two ends of the fleet: Golf 5 at **30 €** and Jaguar XF at **65 €**, the giant number is the real price | They run no discount. The giant number keeps its job (one number you cannot miss) and states the range, which nothing else on the page shows as a picture |
| 6 | Grey client logo strip | **Deleted** | Borrowed client logos are forbidden and would be fake. Nothing honest wanted that slot |
| 7 | Mosaic: dark CTA card, stat card "Vehicle Available 3,490", tall photo card | Same three tiles. Stat is **24 hours**, not the fleet count | A display-size 19 advertises being small. 24 is the number that flatters them and it is the company name |
| 8 | Dark rounded footer: logo, mission, 3 link columns, newsletter, social row, legal bar | Same shape. Newsletter replaced by the contact block: the two desks, phone, WhatsApp, email | No mailing list exists. An input that discards what you type is worse than no input |

Structure is copied. Every number in it traces to `data/`, or it is removed.

## Width, and what happens at 2560

The reference is a ~1440px comp with fat margins. Reproduced literally it becomes the
failure he has named more than once: content in the middle, sides empty.

- `--shell: 2200px`, `--pad: clamp(20px, 4vw, 72px)`. At 2560 the content is 2200 wide with
  180px margins, not 1120 with 720.
- The hero photo, the two wide cards, the mosaic and the footer are rounded blocks that run
  the **full shell width**. They are the horizontal weight.
- The car grid stays 4 columns at every desktop width, so cards grow with the shell rather
  than the row growing more columns. Card image beds are 505px source cut-outs, which is
  their native size at a 2200px shell, so nothing upscales.
- Nothing is centred in a narrow column except body paragraphs, which are capped at 62ch
  because line length is a legibility rule, not a layout one.

## Hero image, stated so no later build re-derives it

The hero is `road-riviera.webp` (2400px, Wikimedia CC, credited): the Llogara pass above the
Ionian coast. **Not** a car, and the reason is measurable: every car photograph they own is
between 446 and 735px wide. The largest, `hero-car.webp`, is 735×312. At a 2200px hero it
would be upscaled 3×.

The fleet rule, written down: the flagship is the most expensive car in `data/fleet.json`
(Jaguar XF, 65 €). It carries the top end of section 5. The Golf 5 at 30 € carries the
bottom and never leads anything. **Client question already open:** one afternoon shooting a
car on the Llogara road at full resolution would replace this hero with something of theirs.

## Tokens

Solved numerically. Every ratio computed, none eyeballed.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--ground` | `#FFFFFF` | page | — |
| `--panel` | `#F2F1EF` | card image beds, soft fills | — |
| `--ink` | `#131211` | all text, all primary buttons | 18.71 on ground, 16.58 on panel |
| `--dim` | `#5B5551` | secondary text, labels | 7.33 on ground, 6.50 on panel |
| `--red` | `#C21F24` | the one accent | 5.97 on ground, 5.29 on panel, white on it 5.97 |
| `--night` | `#191715` | footer, dark mosaic tile | white on it 17.88 |
| `--night-dim` | `#B7B1AC` | secondary text on night | 8.43 on night |
| `--red-night` | `#F0555B` | accent on night | 5.24 on night |
| `--wa` | `#1D7D4A` | WhatsApp only | white on it 5.14 |

`--red` is `#C21F24` because that is the dominant red in their own logo file: 5395 pixels of
it, measured. The previous build carried `#A3141B`, and `PROGRESS.md` claimed a third value,
`#C01824`. Neither was sampled. Both are corrected in this edit.

**Red is rationed to:** active nav state, the open-now light, link hover, focus ring. It does
**not** touch price figures. The reference sets price in ink, and red on a price reads as a
markdown they do not offer.

## Type

One family, one file, variable: **Switzer** (Fontshare, 43 KB). Replaces Archivo, which
drops 113 KB and removes the width axis the old uppercase headings leaned on.

**Two weights, 500 and 700.** Nothing between them.

| Role | Weight | Size |
|---|---|---|
| Hero | 700 | clamp(34px, 4.2vw, 62px) |
| Section head | 700 | clamp(25px, 2.3vw, 35px) |
| Card title, price | 700 | 17px / 26px tabular |
| Body, labels | 500 | 16px / 13px |

Sentence case throughout. The rejected builds shouted in condensed uppercase; the reference
does not shout anywhere, and that is most of why it reads designed rather than generated.

Switzer appears in `design-log.md` on a rejected row (247-rentalcar direction 3, Excon +
Switzer). What was rejected there was a saturated ochre ground with slate ink, logged
separately as a rejected palette move. The typeface was never the complaint, and here it is
a single family on white rather than the body half of a pairing.

## Signature element

**The open light**: a static green dot with "Open now", at both desks in the footer and in
the hero booking bar. It stays the signature because the company is named after its opening
hours, and because `design-log.md` already records "the floating booking bar over the hero"
as 247-showroom's signature. The booking bar here is layout, not signature. The dot does not
pulse; that was removed on request and stays removed.

## Radius and elevation

Everything is a rounded rectangle on white and nothing has a drop shadow. `--r` moves from
14px to 16px on cards, 26px on the hero, footer and photo tiles, 999px on pills. Borders are
1px hairlines. The one shadow in the build is on the booking bar, which has to lift off the
photo it overlaps.

## 390px, per component

| Component | Mobile behaviour |
|---|---|
| Nav | Links collapse to the burger sheet. Logo, WhatsApp, burger stay. Phone number hides below 900px, the icon stays |
| Hero | Photo min-height 60svh, headline clamps to 34px, radius drops to 18px |
| Booking bar | Leaves the photo, sits under it as a full-width stacked card: 4 fields in one column, chip row wraps, Search is a full-width pill |
| Car grid | 1 column below 560px, 2 columns 560 to 900, 3 up to 1250, 4 above |
| Destination pills | Wrap normally, no horizontal scroll, 44px minimum tap height |
| Two wide cards | Stack, aspect ratio 4/3, giant number drops to 56px |
| Mosaic | Stacks to one column in reading order: dark CTA, stat, tall photo |
| Footer | Columns stack, contact block first, legal bar wraps to two lines |

## Blast radius, enumerated

Nav, footer and the type system are global: all 27 pages, not one.

- **Car pages (19):** the sticky `.reservebar` is restyled to the new tokens. The reference
  has no such component, so it keeps its own shape and only its colours and radius change.
- **`tools/flow-test.mjs`** asserts on booking DOM that is not being rewritten, but the
  homepage `.deckbar` selectors are gone. Test updated in the same commit.
- **`tools/css-guard.mjs`** lists the old homepage rules as load-bearing. The list is
  rewritten to the new components, deliberately, not to make a failing gate pass.
- **Photography colophon** already lives on `company.html#colophon`, not in the footer. The
  footer keeps its link to it. Wikimedia CC credits are untouched.
- **Social row** keeps both Instagram handles. Which one is canonical is client question 14
  and is not being guessed.
- **Card spec glyphs** are three hand-drawn inline SVGs (shift pattern, seat, door). Not
  Lucide, not any library.
- **`PROGRESS.md`** says 25 pages and `docs/` holds 27. Corrected.

## Anti-default check

Would this plan fit any other brief in the category? The layout, partly: rounded white cards
are common. What stops it being generic:

- The accent is measured out of their logo file and can be re-derived by anyone who opens it.
- Five places where the reference carries invented data (rating, discount %, client logos,
  fleet count, "start from") carry real data or nothing. That is the difference between a
  proposal and a mockup.
- No uppercase condensed anywhere, which is what all four rejected builds did.

Revised after the critic round: the accent hex was wrong and is now sampled; red came off
price; the logo strip is deleted rather than refilled; the stat tile stopped advertising 19;
"Start from" is banned; the weight scale went from five values to two; the shell, the mobile
plan and the blast radius were missing and are now written.
