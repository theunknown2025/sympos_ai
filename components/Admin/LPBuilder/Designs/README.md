# Landing Page Design Templates

This folder contains pre-designed templates for landing pages that can be selected when creating a new landing page.

## How It Works

### Template Selection
When you click "New Landing Page" in the Landing Page Manager, a template selector modal appears. You can:
1. **Select a template** - Choose from available designs
2. **Use Default Template** - Start with the default configuration
3. **Cancel** - Close the selector

### Editing Templates
**Yes, all templates are fully editable!** Once you select a template:
- All sections can be edited using the built-in editors
- Colors, images, text, and layout can be customized
- Sections can be added, removed, or reordered
- Everything works exactly like editing a regular landing page

### Available Templates

#### Design 1: Modern Minimal ✅
- **Location**: `Design1_ModernMinimal/`
- **Style**: Clean, modern design with subtle colors
- **Best for**: Academic conferences, tech events, professional gatherings
- **Features**: Minimalist aesthetic, glassmorphism effects, smooth animations

#### Design 2: Bold Professional (Coming Soon)
- **Style**: Bold colors, strong typography, impactful design
- **Best for**: Corporate events, marketing conferences

#### Design 3: Elegant Classic (Coming Soon)
- **Style**: Traditional, elegant design with refined aesthetics
- **Best for**: Academic institutions, formal events

## Adding New Templates

To add a new template:

1. **Create a new folder** in `Designs/` (e.g., `Design2_BoldProfessional/`)

2. **Create template files**:
   - `template.ts` - Export the `ConferenceConfig` object
   - `index.ts` - Export template and metadata
   - `README.md` - Documentation for the design
   - `styles.css` (optional) - Custom CSS if needed

3. **Register the template** in `TemplateSelector.tsx`:
   ```typescript
   import { BOLD_PROFESSIONAL_TEMPLATE, BOLD_PROFESSIONAL_METADATA } from './Design2_BoldProfessional';
   
   const TEMPLATES: Template[] = [
     // ... existing templates
     {
       id: 'bold-professional',
       config: BOLD_PROFESSIONAL_TEMPLATE,
       metadata: BOLD_PROFESSIONAL_METADATA
     },
   ];
   ```

## Template Structure

Each template should include:

### `template.ts`
```typescript
import { ConferenceConfig } from '../../../types';

export const MY_TEMPLATE: ConferenceConfig = {
  // Complete ConferenceConfig object
  title: '...',
  // ... all sections
};
```

### `index.ts`
```typescript
export { MY_TEMPLATE } from './template';

export const MY_TEMPLATE_METADATA = {
  name: 'Template Name',
  description: 'Description',
  category: 'Modern',
  previewImage: 'https://...',
  colorScheme: { primary: '#...', ... },
  features: ['Feature 1', 'Feature 2']
};
```

## Customization

Templates are starting points - users can:
- Change all colors and styling
- Modify content and images
- Add or remove sections
- Adjust layouts and spacing
- Customize every aspect through the visual editor

The template just provides a pre-configured starting point with a cohesive design system.
