# Hard rules

Not preferences. Each one has a gate that fails the build, and the gate is named.

---

## Radius

**Four values. Nothing else, nothing bigger.** A corner is a hint that two edges
meet, not a shape of its own.

| Token | Value | Used for |
|---|---|---|
| `--r-lg` | **8px** | page-size blocks: hero, footer card, big photo panels |
| `--r` | **6px** | cards and panels |
| `--r-sm` | **4px** | inputs, thumbnails, small tokens |
| `--r-pill` | **4px** | buttons and chips. They are not pills |

Forbidden outright:

- Any literal radius in the stylesheet. Every declaration goes through a token.
- `border-radius: 999px` and anything else that makes a pill.
- `border-radius: 50%`. No circular buttons, no circular avatars, no dots.
- Any computed radius above **8px**, whatever its source.

`--r-pill` survives as a name because 29 rules reference it, but it is 4px. A button
is a rectangle with its corners taken off, not a lozenge.

### The one exception: the navigation

`--r-nav: 999px`, and it applies to four things only: the pinned header bar and the
three controls inside it (`.reserve-cta`, `.nav-wa`, `.nav-call`). The header's whole
behaviour is a full-width bar morphing into a pill on scroll, and a pill with 4px
corners is neither shape. Nothing outside `.pillnav` may reference `--r-nav`.

The gate knows this exception by name rather than ignoring large radii in general,
and it also asserts the exception still holds: it scrolls the homepage and fails if
the pinned header is not actually a pill.

**Gate:** `node tools/radius-test.mjs <base-url>`. Four checks, all must pass: no
literal px, % or em radius in `docs/css/app.css`; each of the four tokens at or under
the 8px ceiling; nothing outside the header rendering rounder than 8px on any of the
nine page types; and the pinned header still a real pill.

---

## Copy

**The "X, not Y" contrast is banned outright.** Every form of it: "not a category",
"not the errand", "A person instead", "It is not X, it is Y", "not just X but Y".
It reads as trying to be clever and it was a tic across this whole site.

Also banned: em dashes, eyebrows above a heading, subtitles that restate the heading,
sentences that announce what is coming instead of saying it, and the marketing
formula words (seamless, cutting-edge, world-class, best-in-class, streamline,
supercharge, empower).

**Voice.** 24/7 Car Rental's own, from their live site: warm, plain, welcoming,
first person plural, speaking to "you", functional and unpretentious. Not clipped,
not literary, not aphoristic. Their headings are the reference: "We make finding the
right car simple", "Find a car", "Discover the fleet", "Let's get in touch",
"Contact details", "Our hours".

**Nothing may claim what they do not publish:** no rating, no discount, no deposit
amount, no cancellation policy, no insurance or mileage terms, and no response time.

**Gate:** `node tools/copy-test.mjs`. It reads the built pages, strips the markup and
fails on any banned construction. `about/index.html` is exempt by name because it
reproduces the client's own wording verbatim, including "premier" and "top-notch",
which are theirs and not ours.

---

## The other gates

Run all of them before anything is called done. None is optional.

```bash
node tools/radius-test.mjs http://localhost:8472/docs   # the radius rule above
node tools/copy-test.mjs                                # the copy rules above
node tools/mobile-test.mjs http://localhost:8472/docs http://localhost:8472/247-proposal
                                                        # 360 and 390: no sideways scroll, 38px targets, 12.5px text
node tools/layout-test.mjs http://localhost:8472/docs   # one left edge, hero parity, card parity, no OS selects, no hover drift
node tools/links-test.mjs                               # no visitor-facing .html, every internal link resolves
node tools/audit.mjs      http://localhost:8472/docs    # contrast and overflow, every width
node tools/flow-test.mjs  http://localhost:8472/docs    # the booking walk, exact values
node tools/fleet-test.mjs http://localhost:8472/docs    # column counts, card completeness, filters
node tools/faq-test.mjs   http://localhost:8472/docs    # question count, schema parity, keyboard
node tools/nav-test.mjs   http://localhost:8472/docs    # the header morph
node tools/motion-test.mjs http://localhost:8472/docs   # motion is additive, reduced-motion safe
node tools/css-guard.mjs                                # load-bearing rules still exist
python3 ../Jarvis/.claude/design/slop-lint.py docs      # the anti-slop canon
```

A gate that reports a false positive gets fixed, never waived. Every refinement in
these tools came from one, and each caught a real bug later.

---

## Testing the 404 locally

The 404 carries site-absolute paths, because it is served from whatever path a
visitor mistyped. At `http://localhost:8472/docs/404.html` its stylesheet 404s and
the page renders unstyled, which looks like a bug and is not one. Test it at
`http://localhost:8472/247-proposal/404.html`. A gitignored symlink in the project
root makes that path work locally.
