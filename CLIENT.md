# CLIENT.md — Client Vision & Gap Analysis Against Current Implementation

> **Document Status:** Complete Client Requirement & Feedback Analysis  
> **Target Application:** ORICAN Next.js 3D Proofing & Print Studio (`orican-next`)  
> **Source Artifact:** Annotated Landing Page Mockup / Wireframe Redlines (`media_1790261372667.jpg`)  
> **Code Integrity Rule:** Strictly observational — zero changes made to existing website code.  
> **Date:** September 2026  

---

## 1. Executive Summary

Based on the handwritten redline annotations provided by the client on the landing page screenshot, the client's objective is to evolve the ORICAN website from a **developer/CAD tool narrative** into a **high-converting, trust-oriented Direct-to-Consumer (D2C) and B2B apparel proofing experience**.

### Primary Shifts Requested by the Client:
1. **From Tech Specs to Visual Intuition:** Less technical developer jargon (e.g. phase codes, hardware CAD jargon) in favor of clear, direct product interaction and visual storytelling.
2. **Immediate 3D Interaction in the Hero:** Streamlining the hero header text and placing rotation controls and interactive hotspots directly on the 3D t-shirt canvas.
3. **E-Commerce Trust & Craftsmanship Signals:** Adding key e-commerce trust badges (*Shipping*, *Packaging*, *Satisfaction/Quality*), followed by a technical anatomy of the garment (*Oversize fit*, *240 GSM heavyweight cotton*, *Reinforced seams*) and a dedicated quality checklist.
4. **Visual "How It Works" Walkthrough:** Replacing abstract text steps with a prominent visual guide: *"Explication : Comment ça fonctionne en image"* featuring an image slider/carousel with step indicators.
5. **Horizontal Garment Carousel:** Replacing the multi-row, wrapping garment catalog grid with a true horizontal **Carousel** with previous/next navigation arrows (`◀` / `▶`) and clearer garment silhouettes.
6. **Human-Centric Lifestyle Proofing:** Changing the macro fabric close-ups in the "Built for scrutiny" section into **lifestyle photography showing real people wearing the custom garments** (*"Exemple of person wear on it"*).
7. **Customer-Centric Methodology:** Retaining the 3-step proofing workflow with client approval (`✔`) and retitling it to **"Print like you imagine"**.
8. **Direct WhatsApp Conversion:** Introducing a direct WhatsApp contact channel with a phone number in the call-to-action area and footer (*"footer avec whatsapp + n°"*).

---

## 2. Deciphered Client Annotations (Reference Table)

The following table catalogs every handwritten note, its language, exact visual placement on the wireframe, and its underlying intent:

| # | Annotation Text | Color & Language | Wireframe Zone | Deciphered Client Intent |
|---|---|---|---|---|
| **01** | `Home`, `Proof` with arrows | Green / English | Top Navigation Bar | Add explicit primary navigation links (`Home`, `Proof`) rather than just meta indicators. |
| **02** | `Home` / `Model` | Pencil-Black / English | Hero Left Column | Replace the multi-phase technical copy ("Customize like a Pro", paragraphs) with a clean model title/selector. |
| **03** | Big **`X`** over Hero Left Column | Red | Hero Left Text & CTAs | Eliminate the complex scroll-triggered phase text blocks and buttons in the left hero column. |
| **04** | Rectangular card + `Contrôle rotation` + Hand pointer | Blue / French & English | Hero 3D Shirt Viewport | Add an on-model interactive callout card and direct 360° rotation controls (slider/drag handle) directly on the garment. |
| **05** | `Shipping`, `[Box/Packaging]`, `Satisfaction/Qualité` icons | Blue / English & French | Below Hero (New Zone) | Add 3 trust badges highlighting Shipping, Custom Packaging/Unboxing, and Satisfaction/Quality Guarantee. |
| **06** | T-Shirt sketch + `oversize` + `240 GSM / seam` | Red & Blue / English | Specs Section (New Zone) | Show a technical line drawing of the blank tee with callouts for oversize cut, fabric weight, and seam stitching. |
| **07** | `Quality` box with underlined title & bullet points | Blue / English | Specs Section (New Zone) | Add a structured technical garment specifications card detailing fabric composition and finish. |
| **08** | `Explication Comment ça fonctionne en image` + `• • •` | Red / French | Explainer Card (New Zone) | Add a framed container with an image carousel / visual step-by-step slider explaining how the service works. |
| **09** | `Number` | Red / English | Stats Bar | Keep and anchor the key statistics under a clear "Number" / Key Metrics heading. |
| **10** | `Carousel` + Circular arrows (`◀` / `▶`) | Red / English | Garment Catalog | Convert the 3-column static grid into an interactive horizontal carousel with arrow buttons. |
| **11** | Strikethrough on 4th card (`Heavyweight Sweatpants`) | Red | Second Catalog Row | Prevent cards from wrapping into a 2nd row; all models must be browseable inside the 1-row carousel. |
| **12** | Garment sketches around 3D box cubes | Red | Garment Cards | Replace generic 3D box icons with clear garment sketches/renders (Tee, Hoodie, Jacket). |
| **13** | Red line through card descriptions | Red | Garment Card Bodies | Simplify/condense card text to keep the cards compact, prioritizing color swatches and the customize button. |
| **14** | Squiggly underline on 3 Tiers subtitle | Red | 3D Asset Ecosystem | Retain the 3 tiers (Production, Community, Pro) while removing redundant subtitle copy. |
| **15** | `Exemple of person wear on it` & `Change Image` | Red / English | Garment Scrutiny Section | Replace static macro fabric/collar images with photos of **real human models wearing the garments**. |
| **16** | `Print like you imagine` + Green Checkmark (`✔`) | Red & Green / English | Methodology Section | Approve the 3-step proofing process while updating the section title to *"Print like you imagine"*. |
| **17** | `(footer avec whatsapp + n°)` | Red / French | Story Banner / Footer | Add a direct WhatsApp contact button and phone number for immediate sales inquiries and custom proof support. |

---

## 3. Comprehensive Zone-by-Zone Gap Analysis

Below is the detailed comparative analysis between what is currently implemented in [`app/page.tsx`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/page.tsx) and what the client is requesting:

### Zone 1: Navigation Header
- **Current Implementation ([`app/page.tsx:390-421`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/page.tsx#L390-L421)):**
  - Displays the ORICAN brand mark on the left.
  - Center has a live status pill: `"Live 3D Press Engine"` with a green pulse dot and secondary text `"Print what you actually designed"`.
  - Right side has a single action button: `"Launch 3D Studio"`.
- **Client Vision:**
  - Keep the ORICAN branding.
  - Introduce standard primary navigation links: **"Home"** and **"Proof"** (linking to landing page anchors and the 3D proofing tool).
  - Clean, accessible site navigation structure.

---

### Zone 2: Hero Section (3D Garment Stage)
- **Current Implementation ([`app/page.tsx:424-553`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/page.tsx#L424-L553)):**
  - 30/70 split grid layout.
  - **Left column:** GSAP ScrollTrigger timeline orchestrating 3 fading narrative phases (`stageStep0`, `stageStep1`, `stageStep2`):
    - *"Customize like a Pro"*, *"Rotate & Inspect in 360°"*, *"Beyond T-Shirts: Hoodies & Pants"*.
    - Contains large body paragraphs, magnetic CTA buttons, and a row of angle preset chips (`0° Front`, `90° ¾ Drape`, etc.).
  - **Right column:** Sticky 270-frame canvas scrub ([`#heroScrubCanvas`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/page.tsx#L539-L550)) driven strictly by page scroll offset.
- **Client Vision:**
  - **Left column is completely eliminated (marked with a big red `X`):** The client does not want long marketing copy or scroll-triggered fading paragraphs competing with the product.
  - Replaced by a minimal, clean product identification header: **`Home` / `Model`**.
  - **Right column becomes interactive:**
    - An interactive callout card/hotspot overlaid on the 3D t-shirt detailing features or direct customization.
    - An interactive rotation controller with a draggable slider and hand cursor indicator (`Contrôle rotation`) allowing immediate 360° rotation directly on the hero without requiring users to scroll down the page.

---

### Zone 3: Trust & Service Value Badges *(NEW SECTION)*
- **Current Implementation:**
  - Does not exist. The page currently jumps straight from the hero into the stats metrics bar.
- **Client Vision:**
  - Add a high-visibility trust banner featuring 3 clean icon badges:
    1. **🚚 Shipping:** Delivery timeline and shipping assurance.
    2. **🎁 Packaging / Box:** Premium packaging, custom folding, or gift-ready boxing.
    3. **🛡️ Satisfaction / Quality:** Quality guarantee and satisfaction policy.
  - Positioned prominently right below the hero to immediately reassure prospective buyers.

---

### Zone 4: Garment Anatomy & Quality Breakdown *(NEW SECTION)*
- **Current Implementation:**
  - Garment specifications are only partially mentioned in card descriptions or within the 3D studio controls panel. There is no garment anatomy breakdown on the landing page.
- **Client Vision:**
  - Add a 2-column technical craftsmanship section:
    - **Left column:** Technical line-art sketches of the garment (front elevation + collar/shoulder seam profile) with callout pointers:
      - **"Oversize"** cut / modern streetwear fit.
      - **"240 GSM"** heavyweight cotton fabric density.
      - **"Seams" / "Stitching"** (double-needle construction, reinforced collar).
    - **Right column:** A dedicated **"Quality"** card with an underlined title and clean bulleted specifications (e.g. 100% combed organic cotton, pre-shrunk fabric, fade-resistant reactive dyes, high-density weave).

---

### Zone 5: Visual Step-by-Step Explanation *(NEW SECTION)*
- **Current Implementation:**
  - Methodology exists only as text cards at the bottom of the page ([`app/page.tsx:1206-1267`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/page.tsx#L1206-L1267)).
- **Client Vision:**
  - A prominent, framed visual explainer card with rounded corners:
    - Headline: **`Explication : Comment ça fonctionne en image`** *(Explanation: How it works in pictures)*.
    - A 3-slide visual carousel or stepped slider with pagination indicators (`• • •`).
    - Focuses on step-by-step visual demonstration (e.g., 1. Choose Blank → 2. Place Artwork / 3D Mesh → 3. Instant Proof & Press Print).

---

### Zone 6: Key Figures / Metrics ("Number")
- **Current Implementation ([`app/page.tsx:556-595`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/page.tsx#L556-L595)):**
  - Section `#statsSection` with 4 metrics:
    - `12K+ PROOFS GENERATED`
    - `4.9 / 5.0 PRESS OPERATOR RATING`
    - `98% FIRST-RUN ACCURACY`
    - `Zero Misprints HARDWARE CLIPPED ZONES`
- **Client Vision:**
  - Retain the 4 key metrics, but introduce the section with a clear title: **`Number`** (or *"Chiffres clés"*), anchored right below the visual explanation module.

---

### Zone 7: Garment Catalog ("Beyond the basic tee")
- **Current Implementation ([`app/page.tsx:598-807`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/page.tsx#L598-L807)):**
  - Category selector tabs (`Tops`, `Bottoms`, `Outerwear`).
  - Standard 3-column CSS grid (`.grid`).
  - Because `categoryModels` has 4 items in some categories (e.g. Tops has 4 items: Heavyweight Tee, Boxy Tee, French Terry Hoodie, Sweatshirt), the 4th item breaks onto an uneven second row.
  - Card previews use a generic SVG cube icon ([`<Box size={54} />`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/page.tsx#L701)).
  - Lengthy paragraph descriptions per garment.
- **Client Vision:**
  - **Transform into a Horizontal Carousel:**
    - The client explicitly wrote **`Carousel`** and drew **previous (`◀`) and next (`▶`) navigation arrow buttons**.
    - The wrapping 4th card is crossed out with a red **`X`**; all cards must stay on a single horizontal scrolling row with pagination indicators (`[ . . . ]`).
  - **Apparel Illustration Previews:**
    - Replace the placeholder 3D box cube with actual garment outline sketches or 3D renders representing the T-shirt, Hoodie, Crewneck, and Pants.
  - **Simplified Card Content:**
    - Minimize text descriptions to keep cards sleek and uniform.
    - Maintain and emphasize the fabric color swatches and the primary CTA button (`Customize in 3D Studio`).

---

### Zone 8: 3D Model Ecosystem ("Decomposed into 3 tiers")
- **Current Implementation ([`app/page.tsx:810-1076`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/page.tsx#L810-L1076)):**
  - Midnight slate section featuring 3 cards:
    1. Base Tier (Production Blanks — Heavyweight Tee, French Terry Hoodie, Fleece Sweatpants).
    2. Community Tier (Creator Silhouettes — Boxy Tee, Vintage Pigment Crewneck, Skate Shorts).
    3. Paid/Pro Tier (Master Studio Meshes — Utility Cargo, Technical Windbreaker, Canvas Coach Jacket).
  - Subtitle: *"Pick from production-standard blanks, community streetwear meshes, or commercial pro CAD master files."*
- **Client Vision:**
  - Keep the 3-tier value structure.
  - Streamline the header by removing redundant subtitle text to maintain high visual impact.

---

### Zone 9: Garment Scrutiny Section ("Built for scrutiny")
- **Current Implementation ([`app/page.tsx:1078-1168`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/page.tsx#L1078-L1168)):**
  - Section `#scrutinySection` displaying 3 macro detail photos:
    1. Embroidered patch close-up.
    2. Folded apparel showing weave.
    3. Collar ribbing close-up.
  - Text description: *"Inspect real fabric drape — weave, stitching, collar, and print ink bonding."*
- **Client Vision (Major Creative Change):**
  - Written in bold red letters: **`Exemple of person wear on it`** / **`Change Image`**.
  - Cross out the text description.
  - Replace the macro fabric still-lifes with **editorial lifestyle photography of real human models wearing the apparel**.
  - Potential customers want to see the fit, silhouette, drape, and styling on actual people to visualize the final product.

---

### Zone 10: Methodology ("From 3D digital proof to physical press")
- **Current Implementation ([`app/page.tsx:1171-1268`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/page.tsx#L1171-L1268)):**
  - Section `#workflowSection` with 3 step cards:
    1. *"Pick Garment & Model Tier"*
    2. *"Upload 3D Mesh or Vector Art"*
    3. *"Calibrate Registration & Bounds"*
- **Client Vision (Validated with Green Checkmark `✔`):**
  - The client specifically approved this section with a prominent **green checkmark**.
  - Title updated from the technical headline to an evocative, aspirational slogan:
    **`Print like you imagine`** (replacing *"From 3D digital proof to physical press"*).

---

### Zone 11: Call-to-Action Banner & Footer
- **Current Implementation ([`app/page.tsx:1271-1436`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/page.tsx#L1271-L1436)):**
  - `#storyBannerSection`: Background image with dark gradient, headline *"One proof. No surprises. What you design is what gets printed."*
  - Buttons: `Launch 3D Studio — Try It Now` and `View All Silhouettes`.
  - Minimalist technical footer with legal text and color palette credits.
- **Client Vision:**
  - Written in red: **`(footer avec whatsapp + n°)`** *(Footer with WhatsApp + phone number)*.
  - Introduce direct, low-friction sales conversion via **WhatsApp**:
    - Add a dedicated WhatsApp CTA button with icon and contact telephone number in the banner and sticky/footer area.
    - Enables visitors, brands, and designers to immediately ask questions, send custom artwork for feasibility checks, or request volume press quotes directly.

---

## 4. Current vs. Desired Information Architecture

```mermaid
graph TD
    subgraph CURRENT_LANDING_PAGE [Current Implementation]
        C1[Header: Brand + Engine Status + Launch Studio]
        C2[Hero: Split 30/70 - Multi-phase text scroll scrub]
        C3[Stats Metrics Bar: 12K+, 4.9, 98%, Zero Misprints]
        C4[Catalog Grid: 3-column static grid, wrapping 4th card]
        C5[3D Ecosystem: 3 Tiers - Base, Community, Pro]
        C6[Garment Scrutiny: Macro fabric, weave & collar photos]
        C7[Methodology: 3-step proofing cards]
        C8[Story Banner: Try It Now CTA]
        C9[Footer: Technical legal & palette notes]
        
        C1 --> C2 --> C3 --> C4 --> C5 --> C6 --> C7 --> C8 --> C9
    end

    subgraph CLIENT_DESIRED_PAGE [Client Annotated Vision]
        D1[Header: Brand + Nav Links 'Home', 'Proof' + Launch Studio]
        D2[Hero: Minimal 'Home / Model' title + 3D Garment with Hotspot & Direct Rotation Controls]
        D3[Trust Badges: Shipping + Custom Packaging + Quality Assurance]
        D4[Garment Anatomy & Specs: Oversize line-art, 240 GSM, Seams + Quality Spec Card]
        D5[Visual Explainer: 'Comment ça fonctionne en image' 3-step Carousel]
        D6[Key Figures: 'Number' Section with 12K+, 4.9, 98%, Zero Misprints]
        D7[Garment Carousel: 1-row horizontal slider with ◀ / ▶ arrows & realistic sketches]
        D8[3D Ecosystem: Streamlined 3-Tier Blanks Showcase]
        D9[Lifestyle Lookbook: 'Real People Wearing It' Model Photography]
        D10[Methodology: 'Print like you imagine' 3-Step Process - Approved]
        D11[Closing CTA & Footer: Primary CTAs + Direct WhatsApp Contact with Number]

        D1 --> D2 --> D3 --> D4 --> D5 --> D6 --> D7 --> D8 --> D9 --> D10 --> D11
    end
```

---

## 5. Architectural & Technical Considerations for Implementation

When the user requests to execute these changes, the following technical guidelines from [`GEMINI.md`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/GEMINI.md) and the codebase must be observed:

1. **Design System & Palette (60-30-10 Rule):**
   - Dominant (60%): Natural Linen (`#F0EEE6`, `--paper`).
   - Structural (30%): Slate Blue (`#6592C5`, `--blue`).
   - Focal Contrast (10%): Midnight Slate (`#242C47`, `--ink` / `--navy`).
   - Pure Vanilla CSS in [`app/globals.css`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/app/globals.css); **do not introduce Tailwind CSS**.
2. **Interactive Hero Rotation:**
   - The current hero utilizes a 270-frame image sequence scrub. To support direct drag/slider rotation in the hero as sketched, the scrub canvas can be wired to a pointer-drag / slider control state in addition to (or in place of) scroll progress.
3. **Carousel Components:**
   - Implement lightweight, touch-enabled horizontal scroll containers with smooth CSS snap (`scroll-snap-type: x mandatory`) and GSAP/Lenis-friendly arrow navigation.
4. **Lifestyle Imagery:**
   - High-quality imagery showing diverse models wearing streetwear tees and hoodies. External image domains must comply with [`next.config.js`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/next.config.js) remote patterns (or be stored locally in [`public/`](file:///c:/Users/badrg/OneDrive/Documents/projects/orican-next/public/)).
5. **Direct WhatsApp Integration:**
   - Universal link format: `https://wa.me/<phoneNumber>?text=Hello%20ORICAN,%20I%20would%20like%20to%20proof%20a%20garment%20design` with international dialing format.

---

## 6. Open Questions & Recommendations for the Client

Before starting development, the following minor points should be clarified:
1. **WhatsApp Contact Information:** What is the official international phone number and default greeting message for the WhatsApp button?
2. **Language Preference:** The client's notes are a mix of French (*"Explication Comment ça fonctionne en Image"*, *"footer avec whatsapp + n°"*, *"Contrôle rotation"*) and English (*"Shipping"*, "Quality", "Oversize", *"Example of person wear on it"*). Should the production copy be in English, French, or bilingual (i18n)?
3. **Hero 3D Interaction:** Should the hero garment remain the 270-frame pre-rendered scrub (now controllable via direct drag/slider), or should it embed the live WebGL Three.js interactive canvas engine directly?
