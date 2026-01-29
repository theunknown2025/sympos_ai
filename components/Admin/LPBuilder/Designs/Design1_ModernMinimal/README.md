# Design 1: Modern Minimal

## Overview
A clean, modern design template perfect for academic conferences, tech events, and professional gatherings. This design emphasizes clarity, readability, and a professional aesthetic.

## Design Characteristics

### Color Palette
- **Primary**: Indigo (#6366f1) - Used for buttons, accents, and highlights
- **Secondary**: Slate grays - Used for text and backgrounds
- **Background**: White and light grays - Creates spacious, airy feel
- **Overlay**: Subtle dark overlays (50% opacity) on hero images

### Typography
- Clean, modern sans-serif fonts
- Generous line spacing for readability
- Clear hierarchy with size variations
- Plenty of white space

### Visual Elements
- **Hero Section**: Centered layout with soft gradient overlay
- **Cards**: Minimal borders, subtle shadows
- **Buttons**: Rounded corners, soft shadows, hover effects
- **Images**: Clean, professional photography
- **Icons**: Simple, consistent iconography

### Layout Features
- Centered content with max-width constraints
- Responsive grid layouts
- Generous padding and margins
- Smooth transitions and hover effects

## Sections Included

1. **Hero Section** - Full-width hero with countdown timer
2. **About** - Two-column layout with image
3. **Speakers** - Grid layout with speaker cards
4. **Call for Papers** - Timeline-style submission process
5. **Scientific Committee** - Committee member cards
6. **Team** - Team member profiles
7. **Agenda** - Day-by-day program schedule
8. **Pricing** - Three-tier pricing cards
9. **Partners** - Sponsor logos in grid layout
10. **FAQ** - Accordion-style questions
11. **Gallery** - Image gallery
12. **Contact** - Contact form with map

## Customization Tips

### Colors
To change the primary color, update the indigo color values throughout the template:
- Buttons: `bg-indigo-600`, `hover:bg-indigo-700`
- Accents: `text-indigo-600`
- Shadows: `shadow-indigo-200`

### Spacing
Adjust padding and margins for tighter or more spacious layouts:
- Section padding: `py-12 sm:py-16 md:py-24`
- Card padding: `p-6`
- Container max-width: `max-w-6xl` or `max-w-7xl`

### Images
Replace placeholder images with your own:
- Hero background: Update `hero.backgroundImage`
- About section: Update `about.imageUrl`
- Speaker images: Update `speakers[].imageUrl`

## Usage

```typescript
import { MODERN_MINIMAL_TEMPLATE } from './Design1_ModernMinimal/template';

// Use in PageBuilder component
const [config, setConfig] = useState<ConferenceConfig>(MODERN_MINIMAL_TEMPLATE);
```

## Best For
- Academic conferences
- Technology events
- Professional workshops
- Corporate gatherings
- Modern, clean aesthetic preferences
