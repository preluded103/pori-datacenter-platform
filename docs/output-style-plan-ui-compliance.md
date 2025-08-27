# Output Style Plan: shadcn/ui Design System Implementation
## Pori Datacenter Platform - Dark Tech Theme Compliance

### Executive Summary
Comprehensive plan to implement shadcn/ui component library with professional dark tech theme for the Pori datacenter platform, replacing manual styling with systematic component-based architecture for enterprise-grade user interface compliance.

### Current State Analysis

**Existing UI Gaps Identified:**
- ❌ No shadcn/ui components system
- ❌ Manual styling with hardcoded classes throughout components
- ❌ Missing `tailwindcss-animate` dependency for smooth animations
- ❌ Inconsistent component patterns across codebase
- ❌ No centralized design system implementation
- ✅ Dark theme foundation already established (#0a0a0b background)
- ✅ Custom Tailwind color palette configured
- ✅ Mapbox dark theme integration working

**Current Color System (Preserve):**
```css
background: '#0a0a0b'        /* Main background */
surface: '#131316'           /* Card/panel surfaces */  
surface-hover: '#1a1a1f'     /* Hover states */
border: '#27272a'            /* Border colors */
border-focus: '#3f3f46'      /* Focus states */
text-primary: '#fafafa'      /* Primary text */
text-secondary: '#a1a1aa'    /* Secondary text */
text-muted: '#71717a'        /* Muted text */
```

---

## Phase 1: shadcn/ui Foundation Setup

### 1.1 Dependencies Installation
```bash
# Core shadcn/ui dependencies
pnpm add tailwindcss-animate class-variance-authority clsx tailwind-merge
pnpm add @radix-ui/react-slot @radix-ui/react-accordion @radix-ui/react-alert-dialog 
pnpm add @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dialog
pnpm add @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover
pnpm add @radix-ui/react-progress @radix-ui/react-select @radix-ui/react-separator
pnpm add @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tabs
pnpm add @radix-ui/react-tooltip @radix-ui/react-toggle @radix-ui/react-navigation-menu

# Development dependencies
pnpm add -D @types/react @types/react-dom
```

### 1.2 Configuration Files Setup

**`components.json` (shadcn/ui config)**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

**Updated `tailwind.config.js`**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './frontend/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Preserve existing dark theme
        background: '#0a0a0b',
        surface: '#131316',
        'surface-hover': '#1a1a1f',
        border: '#27272a',
        'border-focus': '#3f3f46',
        'text-primary': '#fafafa',
        'text-secondary': '#a1a1aa',
        'text-muted': '#71717a',
        // shadcn/ui CSS variables (mapped to dark theme)
        'border': 'hsl(var(--border))',
        'input': 'hsl(var(--input))',
        'ring': 'hsl(var(--ring))',
        'background': 'hsl(var(--background))',
        'foreground': 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 1.3 Dark Theme CSS Variables

**Updated `app/globals.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 10 10 11;      /* #0a0a0b */
    --foreground: 250 250 250;   /* #fafafa */
    --card: 19 19 22;            /* #131316 */
    --card-foreground: 250 250 250;
    --popover: 19 19 22;         /* #131316 */
    --popover-foreground: 250 250 250;
    --primary: 59 130 246;       /* #3b82f6 Blue for primary actions */
    --primary-foreground: 250 250 250;
    --secondary: 39 39 42;       /* #27272a */
    --secondary-foreground: 250 250 250;
    --muted: 39 39 42;           /* #27272a */
    --muted-foreground: 161 161 170; /* #a1a1aa */
    --accent: 26 26 31;          /* #1a1a1f */
    --accent-foreground: 250 250 250;
    --destructive: 220 38 38;    /* Red for errors */
    --destructive-foreground: 250 250 250;
    --border: 39 39 42;          /* #27272a */
    --input: 39 39 42;           /* #27272a */
    --ring: 59 130 246;          /* #3b82f6 Focus ring */
    --radius: 0.5rem;
  }
}

/* Preserve existing custom styles */
body {
  color: rgb(var(--foreground));
  background: rgb(var(--background));
}

/* Existing opacity slider and Mapbox overrides remain unchanged */
```

---

## Phase 2: Core Component Library Setup

### 2.1 Essential Components Installation Priority

**High Priority (Week 1):**
```bash
# Core UI components for datacenter platform
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card  
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add badge
```

**Medium Priority (Week 2):**
```bash
# Advanced UI components
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add textarea
```

**Low Priority (Week 3):**
```bash
# Specialized components
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add popover  
npx shadcn-ui@latest add navigation-menu
npx shadcn-ui@latest add toggle
npx shadcn-ui@latest add data-table
```

### 2.2 Utility Functions Setup

**`lib/utils.ts`**
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Additional utility functions for datacenter platform
export function formatPowerCapacity(mw: number): string {
  return `${mw.toLocaleString()} MW`;
}

export function formatLatLng(coord: number, precision: number = 6): string {
  return coord.toFixed(precision);
}

export function getStatusColor(status: string): string {
  const statusColors = {
    'online': 'text-green-400',
    'offline': 'text-red-400', 
    'maintenance': 'text-yellow-400',
    'analyzing': 'text-blue-400'
  };
  return statusColors[status as keyof typeof statusColors] || 'text-gray-400';
}
```

---

## Phase 3: Component Migration Strategy

### 3.1 Migration Priority Matrix

**Phase 3A: Critical UI Components (Week 1-2)**

1. **GridInfrastructureLayerSelector.tsx**
   - Replace manual buttons with `<Button>` variants
   - Replace custom cards with `<Card>` component
   - Replace custom sliders with `<Slider>` component
   - Replace manual tooltips with `<Tooltip>` component

2. **GridAnalysisProgressIndicator.tsx**
   - Replace custom progress bars with `<Progress>` component
   - Replace manual dialogs with `<Dialog>` component
   - Replace custom badges with `<Badge>` component

3. **Navigation Components**
   - Replace manual tabs with `<Tabs>` component
   - Replace dropdowns with `<DropdownMenu>` component

**Phase 3B: Complex Components (Week 2-3)**

4. **Form Components**
   - Replace manual inputs with `<Input>` and `<Label>` components
   - Replace custom selects with `<Select>` component
   - Add form validation with shadcn/ui patterns

5. **Data Display Components**
   - Replace manual tables with `<Table>` component
   - Replace custom accordions with `<Accordion>` component

### 3.2 Migration Pattern Template

**Before (Manual Styling):**
```tsx
// Current manual approach
<div className="bg-[#131316] border border-[#27272a] rounded-lg p-4">
  <div className="text-[#fafafa] font-medium mb-2">Title</div>
  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
    Action
  </button>
</div>
```

**After (shadcn/ui):**
```tsx
// New component-based approach
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>Action</Button>
  </CardContent>
</Card>
```

### 3.3 Component-Specific Migration Plans

**GridInfrastructureLayerSelector Migration:**
```tsx
// Target component structure
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function GridInfrastructureLayerSelector() {
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Grid Infrastructure Layers
          <Badge variant="secondary">{visibleCount}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {layers.map(layer => (
          <div key={layer.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{layer.name}</Label>
              <Switch 
                checked={layer.visible}
                onCheckedChange={(checked) => onLayerToggle(layer.id, checked)}
              />
            </div>
            {layer.visible && (
              <div className="px-3">
                <Label className="text-sm">Opacity</Label>
                <Slider
                  value={[layer.opacity * 100]}
                  onValueChange={([value]) => onOpacityChange(layer.id, value / 100)}
                  max={100}
                  step={1}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

---

## Phase 4: Dark Theme Implementation

### 4.1 Component Theming Strategy

**Consistent Dark Theme Application:**
- All shadcn/ui components automatically inherit dark theme from CSS variables
- Custom components maintain existing color palette
- Ensure contrast ratios meet WCAG standards for accessibility

**Theme Validation Checklist:**
- [ ] Primary buttons use `--primary` (blue #3b82f6)
- [ ] Card backgrounds use `--card` (#131316)
- [ ] Text uses appropriate `--foreground` variants
- [ ] Borders use `--border` (#27272a)
- [ ] Focus states use `--ring` (blue focus ring)

### 4.2 Custom Component Theming

**Professional Control Panel Aesthetic:**
```tsx
// Custom themed components for datacenter platform
const DatacenterCard = ({ children, ...props }) => (
  <Card className="bg-surface border-border hover:bg-surface-hover transition-colors" {...props}>
    {children}
  </Card>
);

const DatacenterButton = ({ variant = "default", ...props }) => (
  <Button 
    variant={variant}
    className="bg-primary hover:bg-primary/90 text-primary-foreground"
    {...props}
  />
);

const StatusIndicator = ({ status, ...props }) => (
  <Badge 
    variant={status === 'online' ? 'default' : 'destructive'}
    className={cn(
      "text-xs font-medium",
      status === 'online' && "bg-green-600 text-white",
      status === 'offline' && "bg-red-600 text-white"
    )}
    {...props}
  />
);
```

---

## Phase 5: Testing Strategy

### 5.1 Visual Regression Testing

**Component Testing Framework:**
```typescript
// vitest.config.ts additions
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
  }
});

// Component testing strategy
describe('shadcn/ui Component Integration', () => {
  it('should render Button component with dark theme', () => {
    render(<Button>Test Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('should render Card component with proper surface color', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-card');
  });
});
```

### 5.2 Accessibility Testing

**WCAG Compliance Verification:**
```typescript
import { axe } from '@axe-core/react';

describe('Accessibility Testing', () => {
  it('should meet WCAG standards for dark theme', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Grid Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Analyze</Button>
        </CardContent>
      </Card>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 5.3 Performance Testing

**Component Performance Benchmarks:**
```typescript
// Performance testing for component library
describe('Performance Testing', () => {
  it('should render 100 cards without performance degradation', () => {
    const startTime = performance.now();
    
    render(
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <Card key={i}>
            <CardContent>Card {i}</CardContent>
          </Card>
        ))}
      </div>
    );
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100); // 100ms threshold
  });
});
```

---

## Phase 6: File Structure & Organization

### 6.1 Recommended Directory Structure

```
/components/
├── ui/                     # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── grid-intelligence/      # Existing feature components
│   ├── GridInfrastructure.tsx  (migrated)
│   ├── GridAnalysisProgress.tsx  (migrated)  
│   └── ...
├── dd-intelligence/        # Due diligence components
├── geospatial/            # Map-related components
└── common/                # Shared business components
    ├── DatacenterCard.tsx  # Custom themed components
    ├── StatusBadge.tsx
    └── PowerIndicator.tsx

/lib/
├── utils.ts               # shadcn/ui utilities + custom
├── types/                 # Type definitions
└── hooks/                 # Custom hooks

/styles/
└── globals.css            # Updated with shadcn/ui variables
```

### 6.2 Import Pattern Standardization

**Consistent Import Organization:**
```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party imports  
import mapboxgl from 'mapbox-gl';

// 3. shadcn/ui components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 4. Custom components
import { DatacenterCard, StatusIndicator } from "@/components/common";

// 5. Utilities and types
import { cn } from "@/lib/utils";
import { GridAnalysisResult } from "@/lib/types/grid-types";
```

---

## Phase 7: Datacenter Platform Specific Components

### 7.1 Custom Component Library

**Professional Datacenter UI Components:**

1. **PowerCapacityIndicator**
   ```tsx
   interface PowerCapacityIndicatorProps {
     currentMW: number;
     maxMW: number;
     status: 'available' | 'at-capacity' | 'expanding';
   }
   ```

2. **GridConnectionStatus**
   ```tsx
   interface GridConnectionStatusProps {
     voltage: string; // "110kV", "220kV", etc.
     redundancy: 'single' | 'dual' | 'multiple';
     reliability: number; // 0-100 percentage
   }
   ```

3. **SiteAnalysisCard**
   ```tsx
   interface SiteAnalysisCardProps {
     title: string;
     status: 'pending' | 'analyzing' | 'complete' | 'failed';
     progress?: number;
     results?: Record<string, any>;
   }
   ```

4. **InfrastructureLayerPanel**
   ```tsx
   interface InfrastructureLayerPanelProps {
     layers: InfrastructureLayer[];
     onLayerToggle: (id: string, visible: boolean) => void;
     onOpacityChange: (id: string, opacity: number) => void;
   }
   ```

### 7.2 Integration with Existing Features

**Grid Intelligence Integration:**
- Migrate `GridIntelligenceIntegration.tsx` to use shadcn/ui components
- Replace manual progress indicators with `<Progress>` component
- Replace custom layer selectors with `<Switch>` and `<Slider>` components
- Maintain existing functionality while improving visual consistency

**Map Integration:**
- Ensure Mapbox popup styling remains consistent with shadcn/ui theme
- Update map control panels to use Card components
- Integrate layer selectors with Switch components

---

## Implementation Timeline & Milestones

### Week 1: Foundation Setup
- [ ] Install shadcn/ui dependencies
- [ ] Configure CSS variables for dark theme
- [ ] Install core components (Button, Card, Input, etc.)
- [ ] Update globals.css with theme variables
- [ ] Test basic component rendering

### Week 2: Core Component Migration  
- [ ] Migrate GridInfrastructureLayerSelector
- [ ] Migrate GridAnalysisProgressIndicator  
- [ ] Replace manual buttons throughout codebase
- [ ] Replace manual cards with Card components
- [ ] Update form components

### Week 3: Advanced Components & Polish
- [ ] Install advanced components (Dialog, DropdownMenu, etc.)
- [ ] Migrate complex UI components
- [ ] Create custom datacenter-specific components
- [ ] Implement comprehensive testing
- [ ] Performance optimization

### Week 4: Quality Assurance & Documentation
- [ ] Accessibility testing and compliance
- [ ] Visual regression testing
- [ ] Performance benchmarking
- [ ] Component documentation
- [ ] Team review and feedback integration

---

## Quality Assurance & Validation

### Design System Compliance Checklist
- [ ] All components use shadcn/ui base components
- [ ] Consistent dark theme application across platform
- [ ] Professional control-panel aesthetic maintained
- [ ] WCAG 2.1 accessibility compliance
- [ ] Performance benchmarks meet thresholds
- [ ] Component API consistency
- [ ] TypeScript type safety maintained

### Success Metrics
- **Code Maintainability**: Reduce custom styling by 80%
- **Development Speed**: Decrease component development time by 60%
- **Visual Consistency**: 100% compliance with design system
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: <100ms render time for standard components
- **Developer Experience**: Comprehensive TypeScript support

---

## Risk Mitigation & Contingency Plans

### Potential Risks
1. **Breaking Changes**: Existing components may break during migration
   - **Mitigation**: Incremental migration with comprehensive testing
   
2. **Performance Impact**: Component library overhead
   - **Mitigation**: Performance benchmarking and optimization
   
3. **Dark Theme Inconsistencies**: Components may not match existing design
   - **Mitigation**: Careful CSS variable mapping and theme testing

4. **Integration Complexity**: Complex components may be difficult to migrate
   - **Mitigation**: Start with simple components, build expertise gradually

### Success Indicators
- [ ] All manual styling replaced with component library
- [ ] No visual regressions in existing features
- [ ] Improved development velocity for new features
- [ ] Enhanced accessibility and user experience
- [ ] Maintainable, scalable component architecture

This comprehensive plan ensures systematic migration to shadcn/ui while maintaining the professional dark tech aesthetic essential for the Pori datacenter platform's enterprise user base.