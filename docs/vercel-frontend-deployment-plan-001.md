# Vercel Frontend Deployment Plan - Professional Datacenter Due Diligence Platform
Date: 2025-01-25

## Analysis

### Current State Assessment
- **Existing Tool**: TypeScript/Leaflet boundary tool in `/boundary-tool/`
- **Architecture**: Basic client-side application with static file serving
- **Limitations**: Single-site focus, no multi-project management, basic mapping features
- **Standards Compliance**: Context.md shows comprehensive international compliance requirements (ISO, EN, AIA, RIBA standards)

### Target Platform Requirements
**Professional Users:** Datacenter developers, institutional investors requiring EN 50600, TIA-942-C, and RICS compliant deliverables
**Scale:** Multi-project management with client dashboards and role-based access
**Compliance:** Professional report generation with international drawing standards

### Technology Stack Analysis
**Confirmed API Keys:**
- Supabase: `https://bnvtiwglkfjdqocrrsob.supabase.co`
- Mapbox: `pk.eyJ1IjoicHJlbHVkZWQiLCJhIjoiY2treXZsYmZhMDdsajJ2dWkwdjZib21hNyJ9.iYbWJ_lSePJw8c9AXaPL8A`
- PostGIS enabled for geospatial queries
- Dark tech UI system specified in CLAUDE.md

## Recommendations

### 1. Architecture Pattern: Next.js 14 Enterprise with Edge-First Strategy

**Core Framework:**
```
Next.js 14.3+ with App Router
├── TypeScript 5.6+ (strict mode)
├── Tailwind CSS v4 (dark tech theme)
├── shadcn/ui components
└── Framer Motion (micro-interactions)
```

**Enterprise Features:**
- Partial Prerendering for "dynamic at the speed of static"
- Edge Functions for geospatial computations
- Incremental Static Regeneration for cached project data
- Server Components for optimal performance

### 2. State Management Strategy: Zustand + React Query Hybrid

**Rationale:** Based on 2025 enterprise patterns, avoid Redux complexity while maintaining scalability

```typescript
// Project State (Zustand)
interface ProjectStore {
  currentProject: Project | null;
  projects: Project[];
  userRole: UserRole;
  selectedSite: Site | null;
}

// Server State (React Query/TanStack Query)
// - Project data fetching
// - Real-time constraint updates
// - Geospatial data caching
// - User management
```

**Benefits:**
- Zustand: Simple, TypeScript-first state management
- React Query: Server state synchronization, caching, background updates
- Separation of concerns: Local UI state vs remote data state

### 3. Component Architecture: Feature-Based with Atomic Design

**Folder Structure:**
```
src/
├── app/                     # App Router pages
│   ├── (auth)/             # Authentication routes
│   ├── dashboard/          # Multi-project dashboard
│   ├── project/[id]/       # Dynamic project routes
│   └── layout.tsx          # Root layout
├── components/             # Atomic design system
│   ├── atoms/              # Basic UI elements
│   ├── molecules/          # Composed components
│   ├── organisms/          # Complex UI sections
│   └── templates/          # Page templates
├── features/               # Feature-based modules
│   ├── auth/              # Authentication logic
│   ├── projects/          # Project management
│   ├── mapping/           # Geospatial components
│   ├── reports/           # PDF generation
│   └── constraints/       # Constraint analysis
├── lib/                   # Utility libraries
│   ├── supabase/          # Database client
│   ├── mapbox/            # Mapping utilities
│   └── validation/        # Zod schemas
└── types/                 # TypeScript definitions
```

### 4. Advanced Mapbox Integration Pattern

**WFS/WMS Layer Integration:**
```typescript
// WMS Raster Layers (Finnish planning data)
map.addSource('pori-wfs', {
  type: 'raster',
  tiles: [
    'https://kartta.pori.fi/TeklaOGCWeb/WMS.ashx?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.3.0&request=GetMap&layers=zoning,properties'
  ],
  tileSize: 256
});

// PostGIS Vector Tiles (constraint data)
map.addSource('constraints', {
  type: 'vector',
  url: 'postgis://constraints/{z}/{x}/{y}'
});
```

**Finnish Data Integration:**
- Maanmittauslaitos (National Land Survey) API
- Pori Planning Department WFS endpoints
- SYKE environmental data integration
- Real-time constraint overlay system

### 5. PDF Generation Strategy: Hybrid Puppeteer + React-PDF

**Recommendation:** Dual approach based on 2025 enterprise analysis

**For Professional Reports (ISO/AIA compliant):**
```typescript
// Puppeteer for complex layouts with exact compliance
export async function generateComplianceReport(projectId: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Load professional template with ISO 7200 title blocks
  await page.goto(`/reports/${projectId}/professional`);
  
  const pdf = await page.pdf({
    format: 'A3',
    landscape: true,
    margin: { top: '25mm', right: '25mm', bottom: '25mm', left: '25mm' },
    printBackground: true
  });
  
  await browser.close();
  return pdf;
}
```

**For Dynamic Data Sheets:**
```typescript
// React-PDF for programmatic generation
import { Document, Page, Text, View } from '@react-pdf/renderer';

const ConstraintMatrix = ({ constraints }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text>Constraint Analysis Matrix</Text>
        {constraints.map(constraint => (
          <View key={constraint.id} style={styles.row}>
            <Text>{constraint.type}: {constraint.status}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);
```

### 6. Testing Strategy: Comprehensive Enterprise QA

**Unit Testing (Vitest):**
```typescript
// Component testing
import { render, screen } from '@testing-library/react';
import { ProjectDashboard } from './ProjectDashboard';

test('renders project dashboard with correct data', () => {
  render(<ProjectDashboard projects={mockProjects} />);
  expect(screen.getByText('Pori Datacenter')).toBeInTheDocument();
});
```

**Integration Testing (Playwright):**
```typescript
// End-to-end mapping workflow
test('complete site boundary definition workflow', async ({ page }) => {
  await page.goto('/project/pori-datacenter');
  await page.click('[data-testid="draw-polygon"]');
  await page.click('[data-coordinates="61.495,21.810"]');
  // ... complete boundary definition
  await expect(page.getByText('150,000 m²')).toBeVisible();
});
```

**Performance Testing:**
- Lighthouse CI integration
- Core Web Vitals monitoring
- Mapbox rendering performance
- Large dataset handling tests

### 7. Authentication & Authorization Pattern

**Supabase Row Level Security (RLS):**
```sql
-- Project access control
CREATE POLICY "Users can only access their organization's projects"
ON projects FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);
```

**Role-Based Access Control:**
```typescript
enum UserRole {
  VIEWER = 'viewer',
  ANALYST = 'analyst', 
  PROJECT_MANAGER = 'project_manager',
  ADMIN = 'admin'
}

interface RolePermissions {
  canEditBoundaries: boolean;
  canGenerateReports: boolean;
  canManageProjects: boolean;
  canAccessAllProjects: boolean;
}
```

## Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "next": "14.3.0",
    "react": "18.3.1",
    "typescript": "5.6.0",
    "@supabase/supabase-js": "2.45.0",
    "mapbox-gl": "3.7.0",
    "@tanstack/react-query": "5.56.0",
    "zustand": "5.0.0",
    "zod": "3.23.8",
    "tailwindcss": "4.0.0-beta.1",
    "@radix-ui/react-*": "1.1.0",
    "framer-motion": "11.11.0",
    "puppeteer": "23.6.0",
    "@react-pdf/renderer": "4.0.0"
  },
  "devDependencies": {
    "vitest": "2.1.0",
    "@playwright/test": "1.48.0",
    "@types/mapbox-gl": "3.4.0",
    "eslint": "9.0.0",
    "@next/eslint-config-next": "14.3.0"
  }
}
```

### External Services Integration
- **Maanmittauslaitos API:** Property boundaries, topographic data
- **Pori Planning WFS:** Zoning data, building information
- **SYKE Environmental API:** Flood maps, protected areas
- **Fingrid Data:** Power infrastructure (where available)

## Implementation Notes

### 1. Vercel Deployment Configuration

**vercel.json:**
```json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "app/api/pdf-generation/route.ts": {
      "maxDuration": 30
    },
    "app/api/geospatial/route.ts": {
      "maxDuration": 10
    }
  },
  "regions": ["fra1"],
  "env": {
    "NODE_ENV": "production",
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "VITE_MAPBOX_TOKEN": "@mapbox_token"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options", 
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 2. Environment Configuration

**.env.local (development):**
```bash
# Database
VITE_SUPABASE_URL=https://bnvtiwglkfjdqocrrsob.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mapping
VITE_MAPBOX_TOKEN=pk.eyJ1IjoicHJlbHVkZWQiLCJhIjoiY2treXZsYmZhMDdsajJ2dWkwdjZib21hNyJ9...

# APIs
MAANMITTAUSLAITOS_API_KEY=[to_be_obtained]
SYKE_API_KEY=[if_required]

# Features
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Performance Optimizations

**Database Optimization:**
```sql
-- Geospatial indexes for constraint queries
CREATE INDEX idx_projects_geom ON projects USING GIST (boundary_geom);
CREATE INDEX idx_constraints_geom ON constraints USING GIST (geom);

-- Composite indexes for multi-tenant queries
CREATE INDEX idx_projects_org_status ON projects (organization_id, status);
```

**Mapbox Optimization:**
```typescript
// Lazy load constraint layers based on zoom level
useEffect(() => {
  const handleZoom = () => {
    const zoom = map.getZoom();
    if (zoom > 12) {
      loadDetailedConstraints();
    } else {
      loadSummaryConstraints();
    }
  };
  
  map.on('zoom', handleZoom);
}, [map]);
```

### 4. Dark Tech UI Implementation

**Following CLAUDE.md specifications:**
```css
:root {
  --background: #0a0a0b;
  --surface: #131316;
  --surface-hover: #1a1a1f;
  --border: #27272a;
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --accent-primary: #3b82f6;
}
```

**Component Examples:**
```typescript
// Professional button styling
const Button = ({ children, variant = 'primary' }) => (
  <button className={cn(
    "px-4 py-2 font-medium rounded-md transition-all duration-200",
    variant === 'primary' && "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:scale-[1.02]",
    variant === 'secondary' && "bg-[#1a1a1f] hover:bg-[#27272a] text-[#fafafa] border border-[#27272a]"
  )}>
    {children}
  </button>
);
```

## Risks & Considerations

### 1. Technical Risks
- **Mapbox Bundle Size:** Large mapping libraries may impact initial load times
  - *Mitigation:* Dynamic imports, code splitting per route
- **PostGIS Query Performance:** Complex geospatial queries may be slow
  - *Mitigation:* Proper indexing, query optimization, caching strategy
- **PDF Generation Memory Usage:** Puppeteer can consume significant memory
  - *Mitigation:* Serverless function limits, queue-based processing

### 2. Integration Risks  
- **Finnish API Reliability:** Third-party service dependencies
  - *Mitigation:* Fallback strategies, cached data, error boundaries
- **Multi-tenant Data Isolation:** Ensuring proper data separation
  - *Mitigation:* Comprehensive RLS policies, audit logging
- **Standards Compliance:** Meeting international drawing standards
  - *Mitigation:* Template validation, professional review process

### 3. Performance Risks
- **Large Dataset Handling:** Multiple projects with extensive constraint data
  - *Mitigation:* Virtual scrolling, pagination, data streaming
- **Real-time Updates:** Constraint data synchronization
  - *Mitigation:* WebSocket connections, optimistic updates, conflict resolution

### 4. Operational Risks
- **Vercel Function Limits:** 10-second timeout for serverless functions
  - *Mitigation:* Background job processing, status polling
- **Database Connection Pooling:** Supabase connection limits
  - *Mitigation:* Connection pooling, query optimization
- **Cost Management:** Mapbox API usage, Vercel bandwidth
  - *Mitigation:* Usage monitoring, caching strategies, budget alerts

## Next Steps

1. **Development Setup:**
   - Initialize Next.js 14 project with TypeScript
   - Configure Tailwind CSS with dark theme
   - Set up Supabase client with PostGIS extensions

2. **Core Implementation:**
   - Implement authentication with RLS
   - Build multi-project dashboard
   - Create advanced mapping components
   - Develop PDF generation system

3. **Integration Phase:**
   - Connect Finnish data sources
   - Implement constraint overlay system
   - Build professional report templates
   - Set up testing framework

4. **Production Deployment:**
   - Configure Vercel environment
   - Optimize performance settings
   - Implement monitoring and logging
   - Conduct security audit

This architecture plan provides a robust foundation for transitioning from the current boundary tool to a professional-grade datacenter due diligence platform that meets international standards and enterprise requirements.