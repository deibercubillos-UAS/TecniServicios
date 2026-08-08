---
name: Tecni Industrial Core
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5c403d'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#916f6c'
  outline-variant: '#e5bdb9'
  surface-tint: '#be091b'
  primary: '#ac0015'
  on-primary: '#ffffff'
  primary-container: '#d32027'
  on-primary-container: '#ffeae8'
  inverse-primary: '#ffb3ad'
  secondary: '#5f5e60'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfe1'
  on-secondary-container: '#636264'
  tertiary: '#525454'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b6c6c'
  on-tertiary-container: '#eeeeee'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#930010'
  secondary-fixed: '#e4e2e4'
  secondary-fixed-dim: '#c8c6c8'
  on-secondary-fixed: '#1b1b1d'
  on-secondary-fixed-variant: '#474649'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Oswald
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Oswald
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: 0.01em
  headline-lg-mobile:
    fontFamily: Oswald
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Oswald
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1280px
---

## Brand & Style
The design system for this brand is built on a foundation of industrial reliability and technical precision. It targets procurement managers and engineering professionals who value efficiency, durability, and clarity. 

The aesthetic is **Corporate Modern** with a **Tactile** edge, utilizing high-contrast layouts and subtle metallic treatments to evoke the quality of heavy machinery. The UI should feel substantial and engineered, moving away from "lightweight" startup trends toward a more robust, institutional presence. White space is used strategically to separate complex technical data, ensuring the interface remains navigable under high-information density.

## Colors
This design system utilizes a high-impact palette designed for visibility and professional authority.

- **Primary Red (#D32027):** Used for primary actions, critical alerts, and brand identity. It commands attention and signals "action."
- **Dark Charcoal (#1A1A1C):** The foundational color for navigation, footers, and heavy text. It provides a grounded, premium feel.
- **Chrome/Silver Accents:** Represented by tertiary grays, these are used for subtle gradients on headers, borders, and decorative elements to mimic brushed metal surfaces.
- **Light Background (#FAFAFA):** A clean, off-white canvas that ensures product photography and red accents remain the focal point.

## Typography
The typography strategy pairs industrial strength with modern legibility. 

**Oswald** is the headline face; its condensed nature mimics industrial signage and technical manuals, allowing for impactful messaging even in tight spaces. **Hanken Grotesk** is used for all body text and data, chosen for its sharp rendering and professional clarity. 

All labels and UI headers should utilize uppercase styling with slight letter-spacing to reinforce the "engineered" feel of the interface.

## Layout & Spacing
The layout follows a **Fixed Grid** model for desktop to maintain a controlled, professional presentation of product catalogs.

- **Desktop:** 12-column grid with 24px gutters. Content is centered within a 1280px max-width container.
- **Tablet:** 8-column grid with 24px gutters and 32px side margins.
- **Mobile:** 4-column fluid grid with 16px gutters and 16px side margins.

Vertical rhythm is strictly maintained in multiples of 8px. Use generous padding in content sections (64px - 80px) to prevent the technical data from feeling overwhelming.

## Elevation & Depth
This design system uses **Tonal Layers** and **Low-contrast Outlines** rather than heavy shadows to maintain a clean, technical look.

- **Level 0 (Background):** #FAFAFA.
- **Level 1 (Cards/Containers):** Pure white (#FFFFFF) with a 1px border of #E0E0E0.
- **Level 2 (Dropdowns/Overlays):** Pure white with a 12% opacity Dark Charcoal shadow, 16px blur, 4px offset.
- **Metallic Gradient:** Apply a subtle linear gradient (180deg, #F2F2F2 0%, #E6E6E6 100%) to secondary headers and table headers to create a "machined" surface effect.

## Shapes
A **Rounded** shape language is used to soften the industrial aesthetic, making the technical content more approachable.

- **Standard Radius:** 8px (0.5rem) for input fields, buttons, and small components.
- **Large Radius:** 12px (0.75rem) for product cards and main content containers.
- **Interactive Elements:** Use 8px consistently to maintain a unified "tool-like" feel across the UI.

## Components

### Navigation & Footer
- **Navbar:** Dark Charcoal (#1A1A1C) background with white text. Use Primary Red for the active state or hover underline.
- **Footer:** Dark Charcoal with a 4px Primary Red top border to ground the page.

### Buttons
- **Primary:** Solid Primary Red (#D32027) with white text. 8px radius. Heavy weight typography.
- **Secondary:** Outlined Dark Charcoal (#1A1A1C) with a 2px border. Transparent background.
- **Tertiary:** Text-only in Dark Charcoal with a red icon suffix for "View Specs" or "Download PDF."

### Cards
- **Product Cards:** White background, 12px radius, 1px light gray border. Product images must be high-quality on pure white backgrounds. 
- **Stats/Info Cards:** Use the Metallic Gradient background with Dark Charcoal typography for technical specs.

### Inputs & Forms
- **Fields:** White background with a 1px #E0E0E0 border. On focus, the border changes to Primary Red.
- **Checkboxes:** Square with an 4px radius, filling with Primary Red when active.

### Data Tables
- Use the Metallic Gradient for the header row.
- Zebra striping with #FAFAFA for improved readability of long technical specification lists.