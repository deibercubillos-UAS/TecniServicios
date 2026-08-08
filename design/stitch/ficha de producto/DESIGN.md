---
name: Technical Precision System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#5e3f3b'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#936e69'
  outline-variant: '#e8bcb7'
  surface-tint: '#c0000b'
  primary: '#bb000a'
  on-primary: '#ffffff'
  primary-container: '#e51919'
  on-primary-container: '#fffbfa'
  inverse-primary: '#ffb4aa'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#4d5c72'
  on-tertiary: '#ffffff'
  tertiary-container: '#65758c'
  on-tertiary-container: '#fcfbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930006'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  technical-code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for a high-end B2B/B2C technical services environment. It prioritizes clarity, performance, and industrial reliability. The aesthetic is rooted in **Modern Minimalism** with an engineering edge—borrowing the functional rigor of developer-centric platforms and the seamless usability of premium e-commerce.

The UI should evoke a sense of "Expertise and Speed." It utilizes expansive whitespace to reduce cognitive load during complex equipment configurations, while maintaining a sharp, high-contrast structural logic that reflects technical precision. The emotional response is one of trust, efficiency, and industrial authority.

## Colors

The palette is functional and high-contrast, designed to guide the user toward action while maintaining a professional "clean-room" atmosphere.

- **Primary (Automotive Red):** Reserved strictly for high-priority Call to Actions (CTAs), critical alerts, and meaningful brand accents. It represents energy and urgency.
- **Structural (Carbon Gray):** Used for primary typography and navigation elements to provide a solid, grounded feeling.
- **Surface (White & Ultra Light Gray):** Pure White is used for the base layer of cards and inputs. The Ultra Light Gray creates subtle depth between the background and content containers.
- **Borders (Subtle Gray):** Used to define structure without adding visual noise.

## Typography

This design system utilizes **Inter** for all primary communication due to its exceptional legibility and neutral, modern tone. For technical data, serial numbers, and specifications, **JetBrains Mono** is introduced to provide a distinct "engineered" feel that differentiates raw data from editorial content.

Hierarchy is established through tight leading and slight negative letter-spacing on larger headings to create a compact, high-end editorial appearance. Use "Label-Caps" for categories and overlines to add a layer of organization to complex forms.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a maximum container width of 1280px for desktop to ensure line lengths remain readable. 

- **Desktop:** 12-column grid with 24px gutters. Use generous vertical padding (80px–120px) between major sections to emphasize the minimalist aesthetic.
- **Tablet:** 8-column grid with 24px gutters.
- **Mobile:** 4-column grid with 16px margins. 

Spacing follows a strict 4px base unit. Consistent use of "Stack" spacing (vertical rhythm) ensures that related technical specifications are grouped tightly, while distinct sections are separated by significant air.

## Elevation & Depth

This design system avoids heavy shadows, opting for **Tonal Layers** and **Low-Contrast Outlines** to communicate hierarchy.

- **Level 0 (Background):** Ultra Light Neutral Gray (#F8FAFC).
- **Level 1 (Cards/Surface):** Pure White (#FFFFFF) with a 1px solid border (#E2E8F0).
- **Level 2 (Interaction):** On hover, elements should not use shadows; instead, the border color should darken to #CBD5E1 or the background should shift slightly.
- **Overlays (Modals/Popovers):** A very soft, highly diffused shadow (0px 10px 30px rgba(15, 23, 42, 0.08)) is permitted only to separate floating elements from the primary canvas.

## Shapes

The shape language is "Soft-Industrial." While 8px (`rounded-lg` in this system) is the standard for cards and major containers, smaller components like buttons and inputs use 6px to appear more precise and technical.

- **Standard Containers:** 8px (0.5rem)
- **Interactive Elements:** 6px (0.375rem)
- **Status Badges:** 4px (0.25rem)

Avoid pill-shaped elements unless they are specific status indicators (e.g., "In Stock"). Squares and rectangles with controlled radii reinforce the engineering narrative.

## Components

### Buttons
- **Primary:** Solid Automotive Red (#E51919) with White text. No gradients. Flat design.
- **Secondary:** White background with a 1px border (#E2E8F0). Carbon Gray text.
- **Ghost:** Transparent background, Carbon Gray text, subtle gray background shift on hover.

### Input Fields
Inputs must feel robust. Use a 1px border (#E2E8F0) and 12px of internal horizontal padding. On focus, the border shifts to Carbon Gray (#0F172A) with a subtle 2px outer ring in the same color at 10% opacity.

### Cards
Cards are the primary organizational unit. They feature a white background, 1px border (#E2E8F0), and 8px border-radius. No shadow by default. Internal padding should be a consistent 24px.

### Chips & Badges
Used for equipment status or categories. Use JetBrains Mono for the text. Backgrounds should be very desaturated versions of the status color (e.g., Light Red for "Critical," Light Green for "Operational") with dark text.

### Data Tables
Tables are critical for B2B equipment listing. Use a "Zebra-stripe" pattern with the Ultra Light Neutral Gray. Headers must be Carbon Gray with `label-caps` typography and a solid 2px bottom border.