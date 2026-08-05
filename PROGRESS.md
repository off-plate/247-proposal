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

1. Deposit: amount, and is it cash or a card hold?
2. Minimum age and minimum licence years?
3. What exactly does the basic insurance cover, and what is the excess?
4. Cross-border into Kosovo, Montenegro, Greece: allowed, and at what cost?
5. Is there a real weekly or monthly discount, and what is it?
6. Delivery outside Tirana: offered, and priced how?
7. Mileage: genuinely unlimited?
8. Cancellation terms?
9. Should the duplicate unpriced Hyundai Accent listing be deleted or priced?
10. Do they want a real booking system, or is WhatsApp genuinely their preferred channel?

## Not done yet

- Albanian and Italian translations. Their market is inbound tourism plus locals; English
  only is a real gap for a proposal aimed at Albania.
- The Golf 6 Cabrio has no clean cut-out (Vision found no subject), so it is kept off the
  cut-out strips and shown as a flat photo on its own page.
- Critic panel round has not been run on this build.
