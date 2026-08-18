# HUI · Gesture Bagua

[中文](README.md) · [English](README.en.md) · [Live demo](https://huzoukai.github.io/hui-gesture-bagua/)

A generative Bagua experience controlled through a single hand, mouse or keyboard.

**Created by 科技回锅肉**

> The source is available for personal learning, research and non-commercial entertainment only. Commercial use requires prior written authorization.

## Experience

This project turns the hand into an interface. No controller is required; the experience responds to a short sequence of natural movements.

| Gesture | Visual response |
| --- | --- |
| ☝ Point | Awaken the center at the fingertip; distance controls brightness |
| ✊ Close fist | Unfold the complete field from the center |
| 🖐 Open palm | Separate the flat field into three-dimensional layers |
| 🖐 Turn palm | Guide the orientation and tilt of the field |
| ↔ Swipe sideways | Toggle the golden vortex |
| ✊ Close fist again | Fold the three-dimensional field back into a plane |

The project contains no divination, hexagram casting, question input, AI reading, payment or prediction features.

## Manual mode

All primary motion can be experienced without granting camera access.

| Input | Action |
| --- | --- |
| Click | Advance through center, flat field, three dimensions and back |
| Move pointer | Guide the three-dimensional field |
| Mouse wheel | Scale |
| **V** | Toggle vortex |
| **R** | Reset |
| **M** | Mute |
| **Esc** | Stop the camera and switch to manual mode |

## Why it exists

Bagua is treated here not as passive decoration, but as a dynamic structure for expressing change, relationship and position. Pointing, closing the hand, opening the palm and swiping become a sequence of emergence, unfolding, spatial formation, redirection and return.

“HUI / 回” describes both the nested visual structure and a feedback movement: an action leaves the body, the field responds, and attention returns to the participant.

This is a contemporary digital interpretation by 科技回锅肉. It is not an exact reconstruction of a historical luopan, feng-shui instrument or traditional ritual, and it does not claim to be the only interpretation of any cultural tradition. See [Cultural context and sources](docs/SOURCES.md).

## Camera and privacy

- The camera starts only after an explicit user action.
- Video frames and hand landmarks are processed in the browser.
- The project does not upload, record or save camera frames.
- It does not create a biometric identity.
- It includes no advertising, analytics or behavioral tracking.
- The camera can be stopped at any time, and manual mode requires no camera.

See [Privacy and camera processing](docs/PRIVACY.md).

## Run locally

Node.js 20 or later is required.

~~~bash
npm install
npm run dev
~~~

Build and test:

~~~bash
npm test
npm run build
~~~

Camera access normally requires HTTPS or localhost.

## Technology

- [Three.js](https://threejs.org/) — WebGL rendering
- [MediaPipe Hands](https://github.com/google-ai-edge/mediapipe) — on-device hand landmarks
- [GSAP](https://gsap.com/) — state transitions and motion
- [Vite](https://vite.dev/) — development and static build

The Taiji form, text rings, particles, glow and shockwaves are generated in real time by code. No external commercial visual assets are used.

## License

Original software by 科技回锅肉 is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE).

Original documentation and project media are licensed under [CC BY-NC 4.0](CONTENT_LICENSE.md). Third-party components remain under their respective licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Commercial products, brand campaigns, ticketed installations, client work, paid products, advertising and sponsored content require separate written permission. See [Commercial use](docs/COMMERCIAL_USE.md).

## Author

**科技回锅肉**

- Concept and production: 科技回锅肉
- Interaction design: 科技回锅肉
- Visual system: 科技回锅肉
- Development: 科技回锅肉
- Cultural research: 科技回锅肉

Copyright © 2026 科技回锅肉
