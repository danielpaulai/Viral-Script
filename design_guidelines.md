# Video Script Writer Pro - Design Guidelines

## Design Approach
**System:** Modern utility-first design system optimized for productivity tools
**Rationale:** This is a professional writing and analysis tool requiring clarity, efficiency, and information density. Focus on reducing cognitive load while maintaining visual hierarchy.

## Layout System

### Container Structure
- Maximum width: `max-w-7xl` for main content
- Sidebar: Fixed `w-64` navigation on left
- Main content: `flex-1` with `px-8 py-6`
- Spacing scale: Use units of **2, 3, 4, 6, 8, 12** for consistency

### Grid Patterns
- Form layouts: Single column with `max-w-2xl` for inputs
- Script display: Full-width with `max-w-4xl` for readability
- Multi-column stats: 2-3 column grid on desktop, stack on mobile

## Typography

### Font System
- **Primary:** Inter or DM Sans (Google Fonts CDN)
- **Monospace:** JetBrains Mono for script output

### Hierarchy
- Page titles: `text-2xl font-bold` 
- Section headers: `text-xl font-semibold`
- Card titles: `text-lg font-medium`
- Body text: `text-base`
- Helper text: `text-sm text-gray-600`
- Script output: `text-base leading-relaxed font-mono`

## Component Library

### Navigation Sidebar
- Full height, light background
- Logo area at top (`h-16`)
- Navigation items with icons (Heroicons)
- Active state: Subtle background highlight
- Compact spacing: `py-2 px-3` per item

### Primary Form Area
**Dropdowns:**
- Full-width inputs with clear labels
- Height: `h-12` for comfortable touch targets
- Border: Subtle border, focus state with accent
- Stack vertically with `space-y-4`

**Text Inputs:**
- Textarea for topic/ideas: `min-h-24`
- Border style matching dropdowns
- Placeholder text in muted color

**Action Buttons:**
- Primary: Prominent, full-width or grouped right
- Secondary: Outlined style, less visual weight
- Height: `h-11` minimum
- Spacing: `gap-3` between button groups

### Script Output Display

**Container:**
- Clean white background
- Border or subtle shadow for card elevation
- Padding: `p-8`
- Script text: Line breaks preserved, generous line-height

**Stats Panel:**
- Compact sidebar or top banner
- Key metrics displayed as label-value pairs
- Icons from Heroicons for visual scanning
- Use status colors for pass/fail indicators

**Issue Highlights:**
- Inline colored badges for issue types
- Non-intrusive, scannable
- Click to expand suggestion

### Editor Mode

**Split Layout:**
- Left: Script editor (60-70% width)
- Right: Stats panel (30-40% width)
- Suggestion panel: Bottom sheet or modal overlay

**Text Editor:**
- Monospace font for editing
- Line numbers optional but helpful
- Syntax highlighting for delivery notes `[pause]` etc.

## Visual Rhythm

### Spacing Patterns
- Card padding: `p-6` standard, `p-8` for major sections
- Section gaps: `space-y-8` for major sections, `space-y-4` for related groups
- Form field gaps: `space-y-3`
- Inline elements: `gap-2` to `gap-4`

### Component Sizing
- Input heights: `h-10` to `h-12`
- Button heights: `h-10` to `h-11`
- Card minimum height: Let content determine, no forced viewport heights
- Icon sizes: `w-5 h-5` for inline, `w-6 h-6` for standalone

## Special Features

### Readability Score Display
- Large, prominent grade level number
- Progress bar visual
- Color-coded: Green (good), Yellow (acceptable), Red (fix needed)
- Position at top of stats panel

### Mode Selection (🔥📚💭💰)
- Visual cards with emoji icons
- Hover state shows brief description
- Selected state: Bold border or background highlight
- Grid layout: 2x2 on desktop, stack on mobile

### Production Notes Section
- Collapsible or separate tab
- Italic text style for filming directions
- Bullet points for B-roll moments
- Distinct visual separation from script

## Interaction Patterns

### Progressive Disclosure
- Show essential options first
- "Show Analysis" button reveals detailed stats
- "Edit Script" transitions to editor mode
- Keep primary actions always visible

### Feedback States
- Loading: Subtle spinner, disable inputs
- Success: Brief green checkmark notification
- Error: Inline validation messages, red accent
- Auto-save: Small "Saved" indicator

## Icons
**Library:** Heroicons (CDN)
- Use outline style primarily
- Solid style for active/selected states
- Consistent size: `w-5 h-5` for most contexts

## Key Screens

**1. Generation Screen:**
Main form with all dropdowns stacked, prominent "Generate Script" button at bottom

**2. Output Screen:**
Script display center, stats sidebar right, action buttons (Copy, Edit, Regenerate) below script

**3. Editor Screen:**
Split view with live editing left, stats/suggestions right, floating action bar at bottom