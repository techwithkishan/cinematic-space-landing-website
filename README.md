# 🪐 Aetheris // Cinematic Deep-Space Landing & 3D Solar System Explorer

Aetheris is an immersive, high-fidelity deep-space landing platform paired with a fully interactive **3D Solar System Explorer** (modeled after *Solar System Scope*). It delivers a premium liquid-glass design theme, responsive layout, dynamic mood background customizer, and a custom-tailored 3D astronomical simulation.

Built entirely on a highly performant, single-file Babel architecture, Aetheris achieves **zero-dependency asset loading** and **100% offline/CORS resilience** by generating full 3D celestial bodies through high-fidelity procedural rendering.

---

## 🚀 Live Demo & Deployment
*   **Local Staging Server:** `http://localhost:8000/` (Served via Python HTTP Server)
*   **Vercel Production Target:** Linked directly to GitHub for seamless Continuous Deployment (CI/CD).

---

## 🌌 Interactive 3D Solar System Explorer
The core showcase of Aetheris is a full-viewport WebGL 3D deep space simulation powered by **Three.js (r128)** and **OrbitControls**.

### 🎨 1. Procedural Planetary Texture Engine
To eliminate network lag and avoid CORS resource-blocking issues, every celestial body is rendered using customized 2D Canvas textures generated dynamically on the fly:
*   **The Sun:** Features turbulent plasma convection granules, golden-red solar flares, and a camera-facing blazing corona overlay.
*   **Mercury:** Heavily cratered concrete-gray basalt terrains, shaded craters with matching cast highlights, and iron-rich plains.
*   **Venus:** Shrouded in dense swirling greenhouse winds and dense yellow-orange sulfuric wave bands.
*   **Earth:** Authentic green/brown continents (Africa, Eurasia, the Americas, and Australia), polar glaciers, deep blue oceans with high specular reflections, and swirling white cloud spirals. An orbiting Moon tracks its coordinate path.
*   **Mars:** Red-orange iron-oxide deserts, carbon-dioxide ice caps, and large basaltic plains (Syrtis Major splotches).
*   **Jupiter:** Complex gaseous ammonia belts drawn with sine-wave turbulence, featuring the Southern **Great Red Spot** storm with storm-eye details.
*   **Saturn:** Elegant beige gas belts adorned with a wide, custom transparent ring system rotating in coordinates.
*   **Uranus:** Pale ice-blue gradient with horizontal hazes and tilted vertical sky-blue rings.
*   **Neptune:** Azure blue atmosphere, supersonic cyclonic wind centers (the **Great Dark Spot**), and high-altitude wispy white methane clouds.

### 🏷️ 2. Always-Visible Billboard Name Labels
Every celestial body features a floating name card:
*   **Glassmorphic Aesthetic:** Frosted round-rect container (`rgba(0,0,0,0.65)`) framed by a translucent border.
*   **Color-Coded Indicators:** A glowing dot matching each planet's signature spectrum.
*   **Autofacing Billboarding:** Created as a `THREE.Sprite` so labels automatically align to face the camera from any angle.
*   **Focus-Aware Dimming:** When a planet is clicked, the camera smoothly zooms in close. To ensure the card doesn't block the high-fidelity planetary surface, the selected planet's label automatically dims to **`0.15` opacity** while the others remain at `0.95`.

---

## ⚡ Adaptive Performance Scaling (Laptop vs. Mobile)
Aetheris features an intelligent, first-load **Device Mode Selector overlay** that blurs the background (`backdrop-blur-3xl bg-black/60`) and customizes the WebGL pipeline to prevent lag:

| 3D Render Spec | 💻 Laptop & PC Viewer | 📱 Mobile & Tablet Viewer (Optimized) |
| :--- | :--- | :--- |
| **Starfield Count** | **4,500 Star Particles** (varied hues) | **1,500 Star Particles** (optimized rendering) |
| **Mesh Geometries** | **High-Poly** (64/32 subdivision segments) | **Low-Poly** (32/16 segments) |
| **Procedural Textures** | **512 x 256** High-Res canvas maps | **256 x 128** Downscaled canvas maps |
| **Canvas Auto-Scaling** | Rendered at full coordinate ratios | Utilizes `ctx.scale(0.5, 0.5)` for zero-leak mapping |
| **Anti-Aliasing** | **Enabled** (`antialias: true`) | **Disabled** (`antialias: false`) |
| **Device Pixel Ratio** | Capped at **`2.0`** (for high-DPI screens) | Capped at **`1.2`** (preserves GPU fill rate) |

*   **⚠️ Smart Hardware Detector:** If a user on desktop selects Mobile Mode, or vice versa, the system floats a beautiful, non-obtrusive custom glassmorphic warning toast at the top center that slides away after **6 seconds** to guide them back to optimal settings.

---

## 🎨 Environments & Background Customizer
The landing page includes a floating theme customizable HUD offering four premium options:
1.  **🌸 Flora Space (Default):** A gorgeous violet and rose themed environment surrounded by swirling nebulae and flower-infused ambient spaces.
2.  **🏎️ Hyper Drive:** A high-octane crimson freeway dashboard loop with dynamic neon traffic streaking.
3.  **✈️ Terra Voyage:** An emerald deep forest and ocean cruise loop invoking modern travel and environmental aesthetics.
4.  **🌌 Neo Horizon:** An electric cyan futuristic city-skyline and trailer sequence capturing deep space horizons.

---

## 🛠️ Technological Stack
Aetheris relies entirely on public, highly-stable content delivery networks (CDNs) for maximum load efficiency:
*   **Core Logic:** [React 18.3](https://react.dev/) & [ReactDOM 18.3](https://react.dev/)
*   **Live Compiler:** [@Babel/Standalone 7.29](https://babeljs.io/) (compiles JSX dynamically in-browser)
*   **3D Graphics Engine:** [Three.js (r128)](https://threejs.org/)
*   **3D Navigation:** [THREE.OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)
*   **Micro-Animations:** [Framer Motion 11.11](https://www.framer.com/motion/) (fallback bindings)
*   **Styling & Layout:** [Tailwind CSS (CDN-linked)](https://tailwindcss.com/)
*   **Typography:** Google Fonts (**Barlow** for specs/HUD, **Instrument Serif** for headers)

---

## 💿 Getting Started Locally

### 1. Clone the Files
Ensure your project contains:
```bash
├── index.html   # Main index entry and scripts
├── App.js       # Pure React application bundle
└── README.md    # Repository documentation
```

### 2. Launch Local Server
Because WebGL requires a secure hosting origin to link textures, launch a local HTTP server:
```powershell
# Using Python (standard on most systems)
python -m http.server 8000

# Using Node.js (if global npm packages are installed)
npx serve .
```

Open [http://localhost:8000/](http://localhost:8000/) in your web browser to enjoy Aetheris!
