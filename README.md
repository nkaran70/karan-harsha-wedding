# Karan & Harsha · Wedding invitation

A mobile-first, regal Indian wedding invitation for **24–25 February 2027**. Plain HTML, CSS and JavaScript with no build step. The whole folder is 364 KB.

## Preview

```sh
python3 -m http.server 8001
```

Then open http://localhost:8001. To deploy, serve this folder as a static site.

### Personalised links

Add `?to=` to address each guest. The name appears on a satin sash across the curtains:

```
https://your-site/?to=The%20Sharma%20Family
```

## The experience

1. **The curtains.**
   - **Look:** maroon velvet hanging in pleats from a gilt rod on rings, with a small scattered gold buti and a single gold edging down each leading edge. A pearl-ringed monogram (K & H) sits across the seam.
   - **Build:** each pleat is a separate strip (built in `app.js`), shaded as a rounded fold. The strips sway very slightly.
   - **Opening:** on tap, the monogram badge presses in, springs up off the fabric in a warm glow, and floats upward as it fades. The drape then gathers into tight folds at each side, with the hem trailing behind the rod, and the gathered folds slide off the screen. Closing plays this in reverse, and the badge fades back in as the curtains meet.
2. **Behind the curtains: the opening page.**
   - **Look:** a single regal look, gold leaf on ivory cotton paper with small maroon accents, inside a fine double gilt rule.
   - **Telugu touches:** a mango-leaf thoranam with rosettes and small bells drops in and settles. Strings of gold beads, pearls, jasmine buds and gilt flowers, each ending in a bell, fall on either side and keep swaying. A kalash (purna kumbham) crest sits above the names, which fade in over a gilt lotus divider. A muggulu (kolam) chain unrolls along the foot of the page.
   - **Marwari touch:** the golden Ananda Nilayam vimana of Tirumala, a gold etching made from a photograph of the shrine (`assets/vimana-gold.png`), is revealed from the base upward.
   - **Petals:** maroon and blush rose petals, jasmine and gold leaf fall.
3. **Scrolling.** Each section reveals as it arrives:
   - Two traditions (శుభ వివాహం / शुभ विवाह), inside a flowering arch hung with mogra strings.
   - The celebrations: a timeline with an embroidered haldi thali, sitar, baraat chhatri and kalash. A pearl travels down the thread as you scroll.
   - The venue (Dhawan Celebrations, Gorewada, Nagpur), inside a gold zari jharokha frame that stitches itself on, with three buttons: Save the dates (Apple/Outlook or Google), Get directions (Google Maps) and We’ll be there (an RSVP asking for a name and Family or Couple; see `rsvp-setup.md`).
   - A countdown in pearl medallions above a kundan-and-pearl necklace.
   - Blessings, inside a zari frame.
   - The closing, with a "close the curtains & open again" button.

All of the artwork is drawn in code (`art.js`). The opening page uses gilt fills and fine gold line drawing, with a soft pressed shadow. The sections below it still use the earlier embroidered style: french-knot marigolds, bullion-knot roses, satin-stitch leaves, strung pearls and kundan stones, lit by a shared SVG filter. The only image is the cotton-paper texture.

Reduced-motion settings are respected. Without JavaScript the curtains are skipped and everything stays readable.

## Content

Names, ceremony times, traditions, dress code and the gift wording come from the original invitation. Venue and day-after details say "to follow".

## Files

- `index.html`: content and structure
- `styles.css`: linen, silk, layout and motion
- `art.js`: the embroidery generator
- `app.js`: curtains, reveals, timeline pearl, countdown, petals

The fonts are Cormorant Garamond, Pinyon Script, and Tiro Telugu / Tiro Devanagari (subset to the two greetings). All are under the SIL Open Font License.

The earlier envelope-and-gatefold version is kept in `../karan-harsha-invitation-v6-envelope-draft/`.

## Still to check

The visuals were checked in headless Chromium at 390×844 and 1440×900. It has not yet been tested on a real iPhone (Safari) or Android device. Check scroll smoothness and how smoothly the curtains gather there.
