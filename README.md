# Happy Birthday Rose Website

A static birthday greeting website with:

- Philippine Time countdown gate
- Animated gift reveal
- Fireworks and birthday greeting
- YouTube birthday video
- Optional surprise button with jumpscare
- Apology/final message page

## Files

- `index.html` - main birthday page
- `styles.css` - all page styling and responsive layout
- `script.js` - countdown, gift animation, fireworks, video, and surprise logic
- `apology.html` - final joke/apology page after the surprise
- `TANDUAY.svg` - full-page greeting background
- `gradient-yellow-star-background_52683-153241.avif` - reward/gift screen background
- `simple-js-main/scare.jpg` - surprise image
- `simple-js-main/scream2.mp3` - surprise sound

## How To Open

Open `index.html` in a browser.

No build step is needed because this is plain HTML, CSS, and JavaScript.

## Countdown Unlock

The birthday page is locked until:

```js
var COUNTDOWN_TARGET_DATE = "2026-04-30T00:00:00+08:00";
```

The `+08:00` makes the unlock time exactly Philippine Time.

To skip the countdown while testing, open `script.js` and change:

```js
var COUNTDOWN_ENABLED = true;
```

to:

```js
var COUNTDOWN_ENABLED = false;
```

To test with a short countdown, use:

```js
var COUNTDOWN_ENABLED = true;
var COUNTDOWN_TEST_SECONDS = 5;
```

For the real date, set it back to:

```js
var COUNTDOWN_TEST_SECONDS = null;
```

## Surprise Button

After the gift opens, a button appears under the video:

```text
Click for another surprise
```

Clicking it shows `simple-js-main/scare.jpg`, plays `simple-js-main/scream2.mp3` two times, then redirects to `apology.html`.

To change the number of scream plays, edit this line in `script.js`:

```js
if (screamPlayCount < 2) {
```

## Video

The birthday video is created in `script.js` inside `reveal()`:

```js
"https://www.youtube.com/embed/SKmRXPpebCc?autoplay=1&loop=1&playlist=SKmRXPpebCc&controls=0"
```

Replace the YouTube video ID in both `embed/...` and `playlist=...` if you want a different looping video.

## Final Page

The final message is in `apology.html`.

It includes a button that returns to `index.html`:

```html
<a class="back-button" href="index.html">Go back to first page</a>
```
