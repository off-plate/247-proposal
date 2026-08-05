# 24/7 Car Rental — redesign proposal

Live: https://off-plate.github.io/247-proposal/
Repo: off-plate/247-proposal (Pages from /docs)
Their site: https://24-7rentalcar.com/ (WordPress + Elementor + WooCommerce)

Same architecture and process as the AUTOSOLE demo, re-themed to their brand and
loaded with their real content.

---

## Status 2026-08-05

25 pages. Audit CLEAN, flow test CLEAN, slop-lint 0 errors / 6 accepted warnings.

```bash
python3 -m http.server 8472        # from project root; pages at /docs/*.html
node build.mjs
node tools/audit.mjs http://localhost:8472/docs
node tools/flow-test.mjs
python3 ../Jarvis/.claude/design/slop-lint.py docs
```

## Where every fact came from

- **19 cars, prices, specs**: scraped from their WooCommerce REST API plus each product
  page on 5 Aug 2026. Prices read from the MAIN product container only, because each page
  also renders related products at different prices. That exact trap produced fabricated
  prices in an earlier attempt. Verified range: 30 € (Golf 5) to 65 € (Jaguar XF).
- **Their 20th product** (`hyundai-accent-2`) has NO price set on their site. It is a
  duplicate Accent listing. Excluded rather than invented. Worth telling them about.
- **Brand red #C01824**: sampled from the pixels of their own logo file.
- **Contact, hours, locations, Instagram**: from their contact page.
- **Car photography**: theirs, from their product pages, cut out with macOS Vision.
- **Road photography**: Wikimedia Commons, CC licensed, credited in the colophon.
- **No rating anywhere.** They declare none in schema and Google was not reachable to
  verify one. An unverified rating is not going on a client proposal.

## Light only

The theme system is removed, not hidden: no toggle, no `data-theme`, no
`prefers-color-scheme` block, no theme JavaScript, `color-scheme: light only`.
`tools/audit.mjs` is pinned to light so a future run cannot silently pass a dead theme.

The ink surfaces stay: the flagship band and the footer departure board are dark by
design, not by theme. That is why `img/logo-dark.webp` still exists and is still correct.
It is the reversed mark for those dark bands, used on all 25 pages. Do not delete it.

## What is deliberately different from AUTOSOLE

- Booking is an **enquiry**, not a payment funnel: Where, When, Car, You, Send. It ends by
  opening WhatsApp to their real number with the request pre-written. No card, no deposit,
  no invented fees. That matches how they actually operate today.
- **No seasonal pricing model and no weekly formula.** They publish a flat daily rate, so
  the site multiplies days by that rate and says longer rentals are usually quoted lower.
- The signature element is the **open light**: a pulsing dot that says OPEN NOW, used at
  both desks, in the booking widget and on the footer board. Their name is their
  differentiator, so the interface states it continuously.

## Client questions (never invented, ask before launch)

1. **Three car photos need reshooting.** The Audi A4 listing shows a close-up of the
   steering wheel, not the car. The Golf 6 Cabrio shows the interior. The Passat CC 2014
   is a dark night shot with the headlights on. Every other car has a usable exterior
   photo. One afternoon with a phone, all 19 cars, same angle and same background, would
   lift the whole site more than any code change.
2. Deposit: amount, and is it cash or a card hold?
3. Minimum age and minimum licence years?
4. What exactly does the basic insurance cover, and what is the excess?
5. Cross-border into Kosovo, Montenegro, Greece: allowed, and at what cost?
6. Is there a real weekly or monthly discount, and what is it?
7. Delivery outside Tirana: offered, and priced how?
8. Mileage: genuinely unlimited?
9. Cancellation terms?
10. Should the duplicate unpriced Hyundai Accent listing be deleted or priced?
11. Do they want a real booking system, or is WhatsApp genuinely their preferred channel?

## Not done yet

- Albanian and Italian translations. Their market is inbound tourism plus locals; English
  only is a real gap for a proposal aimed at Albania.
- The Golf 6 Cabrio has no clean cut-out because its source photo is an interior shot, so
  it is kept off the cut-out strips and shown flat on its own page. Fixed by a reshoot.
- Critic panel round has not been run on this build.
