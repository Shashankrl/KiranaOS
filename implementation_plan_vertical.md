# Interactive Architecture Visualization Website — "Vertical"

Build a stunning, interactive single-page website that visualizes the full system architecture from the provided diagram. The site will present each architectural layer as an interactive, animated section with hover effects, click-to-expand details, and smooth transitions.

## Architecture Components Identified

Based on the SVG and image analysis, the system has **7 layers**:

| # | Layer | Components |
|---|-------|------------|
| 1 | **Infrastructure** | Kubernetes Cluster → Service Pods, CDN |
| 2 | **Mobile Client** | Android App → Sync Manager, Inventory UI, Orders UI, Sales/Billing UI, Dashboard UI, Offline Storage → Room/SQLite |
| 3 | **API Layer** | Load Balancer → API Gateway (JWT Auth, Rate Limiter, Router) |
| 4 | **Backend Services** | GST/Shipping Service, Order Service, Sales Service, Payment Service, Procurement Service, Inventory Service, Processing Service, Notification Service |
| 5 | **Data Layer** | PostgreSQL (Stores, Users, Items, Payments, Inventory, Sales, Reports, Orders), Redis Cache, S3/GCS Storage |
| 6 | **Event Layer** | Kafka/Pub-Sub → Dead Events → DLQ |
| 7 | **External Services** | Dineout APIs, WhatsApp Business API, UPI Payment Gateway, Google Vision OCR |

### Connection Labels (data flows between layers)
- Mobile Client → API Layer: `API requests`
- API Layer → Backend Services: routes through Router
- Backend Services → Data Layer: various table-specific connections (invoice-images, full-read, item-cache, item-sync, OrderCreated, SaleCreated, PaymentRoutes, StockUpdated, LowStockAlerts, OCRProcessed, place-orders, send-emails, process-images, LowStockAlerts, OCRProcessed, invoice-gen)
- Backend Services → Event Layer: domain events
- Backend Services → External Services: external API calls
- Infrastructure → Mobile Client: `static-assets`
- Mobile Client internal: `offline-storage`
- Event Layer: Dead Events → DLQ

## Proposed Changes

### [NEW] `index.html`
- Semantic HTML5 structure
- SEO meta tags (title: "Vertical — System Architecture", description, etc.)
- Google Fonts: Inter + JetBrains Mono (for code/tech labels)
- Single `<h1>` heading
- Sections for each architecture layer
- Interactive diagram area rendered with HTML/CSS/JS (no canvas/SVG library needed)

### [NEW] `index.css`
- Dark theme matching the original diagram's aesthetic (#171717 background)
- Design system with CSS custom properties:
  - Layer-specific accent colors (blue for Mobile/API, green for Backend, blue for Data, olive for Events, purple for External)
  - Glassmorphism cards for each component
  - Smooth gradient connections between layers
  - Micro-animations (pulse on nodes, flow animations on connections)
- Responsive layout (desktop-first, with tablet/mobile breakpoints)
- Hover effects: glow, scale, info reveal
- Click interactions: expand component details

### [NEW] `app.js`
- Architecture data model (all layers, components, connections)
- Dynamic rendering of the architecture diagram
- Interactive features:
  - Click a layer to expand/collapse detail view
  - Hover a component to highlight its connections
  - Animated data flow lines between components
  - Tooltip system for component descriptions
- Smooth scroll navigation between layers
- Intersection Observer for scroll-triggered animations

## Design Approach

1. **Layout**: Vertical flow layout mirroring the original diagram (Infrastructure at top → External Services at bottom)
2. **Each layer** is a styled card/section with:
   - Colored border matching the original (blue, green, olive, purple)
   - Layer title badge (matching the original tag style)
   - Grid of component cards inside
3. **Connections**: CSS-animated dashed/solid lines between layers using pseudo-elements or SVG overlays
4. **Component cards**: Each service/component gets a card with an icon (using Feather icons as in the original), name, and expandable description
5. **Color palette** (from the original diagram):
   - Background: `#171717`
   - Card bg: `#252a31`
   - Card border shadow: `#3f3f3f`
   - Mobile/API layer: `#407edd` (blue)
   - Backend Services: green tint
   - Event Layer: olive/dark yellow
   - External Services: `#c03acb` (purple/magenta)
   - Infrastructure: blue-gray

## Open Questions

> [!IMPORTANT]
> 1. **Scope**: Should this be purely a visualization/documentation website, or do you want functional elements (e.g., API health dashboard, live metrics)?
> 2. **Component details**: Should clicking a component show detailed descriptions of what each service does, or just the visual layout from the diagram?
> 3. **Navigation**: Do you want a sidebar/top nav to jump between layers, or just a single scrollable page?

## Verification Plan

### Automated Tests
- Open the website in the browser using the browser tool
- Verify all 7 layers render correctly
- Verify interactive hover/click effects work
- Verify responsive layout at different viewport sizes

### Manual Verification
- Visual comparison with the original architecture diagram
- Check all component names and connections match
