# Frontend - Cashew Forecast Application

## 🎨 Design System

### Color Scheme (Navy/Red - từ Trips Management App)
```css
--primary: Navy Blue (HSL 222.2 47.4% 11.2%)    /* Màu chính */
--accent: Red (HSL 0 84% 60%)                   /* Nhấn mạnh */
--success: Emerald (HSL 142.1 76.2% 36.3%)     /* Thành công */
--warning: Orange (HSL 38 92% 50%)              /* Cảnh báo */
```

### Technology Stack
- **Framework**: Next.js 14 (Pages Router)
- **Styling**: Tailwind CSS v3.4.1
- **Components**: shadcn/ui pattern
- **Icons**: Lucide React
- **Charts**: Chart.js + react-chartjs-2
- **Data Fetching**: SWR (React Hooks for data fetching)
- **HTTP Client**: Axios

## 📁 Cấu trúc thư mục

```
frontend/
├── components/              # React components
│   ├── ui/                 # shadcn/ui base components
│   │   ├── badge.js       # Badge component
│   │   ├── button.js      # Button component
│   │   └── card.js        # Card component
│   ├── DashboardLayout.js  # Main layout with top nav
│   ├── KpiCardModern.js   # KPI metric cards
│   └── PriceChart.js      # Chart.js wrapper
│
├── pages/                  # Next.js pages
│   ├── _app.js            # App wrapper
│   ├── index.js           # Home page
│   ├── dashboard.js       # Dashboard overview
│   ├── price-forecast.js  # Price forecasting
│   ├── market-insights.js # Market analysis
│   ├── news-watch.js      # News feed
│   └── lstm-demo.js       # LSTM testing
│
├── hooks/                  # Custom React hooks
│   └── useDashboardData.js # SWR data fetching hooks
│
├── lib/                    # Utilities
│   ├── apiClient.js       # Axios instance
│   └── utils.js           # cn() utility
│
├── styles/                 # Global styles
│   └── globals.css        # Tailwind + CSS variables
│
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
└── package.json

```

## 🧩 Components

### DashboardLayout
Main layout component với top navigation bar (thay thế sidebar cũ).

**Features:**
- Top navigation bar với logo navy
- Horizontal nav links với red accent cho active state
- System status indicator
- Mobile responsive với scrolling nav
- Footer với API status

**Usage:**
```jsx
import DashboardLayout from '../components/DashboardLayout';

export default function MyPage() {
  return (
    <DashboardLayout title="Page Title">
      {/* Page content */}
    </DashboardLayout>
  );
}
```

### KpiCardModern
Modern KPI metric card với icons, badges, và trend indicators.

**Props:**
```jsx
<KpiCardModern
  title="Current Price"
  value="$5,234"
  change="+5.2%"
  badge={{ label: "High", variant: "success" }}
  icon={DollarSign}
  trend="up"
/>
```

### UI Components (shadcn/ui pattern)

#### Badge
```jsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Info</Badge>
```

#### Button
```jsx
<Button variant="default">Click me</Button>
<Button variant="outline" size="sm">Small</Button>
<Button variant="ghost">Ghost</Button>
```

#### Card
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

## 📊 Pages

### Dashboard (`/dashboard`)
- Overview metrics (Current Price, Forecast, Confidence, Trend)
- Latest forecast snapshot
- Price history chart
- API usage summary

### Price Forecast (`/price-forecast`)
- Forecast controls (14d, 30d, 60d, 90d)
- KPI metrics
- Interactive chart
- Forecast metadata

### Market Insights (`/market-insights`)
- Sentiment overview
- Market intelligence feed
- Impact scoring
- Confidence indicators

### News Watch (`/news-watch`)
- News feed settings
- Article cards with tags
- Source and date metadata

### LSTM Demo (`/lstm-demo`)
- LSTM configuration
- Loading states
- Results visualization
- JSON output

## 🎣 Custom Hooks

### useDashboardData
SWR-based hooks for data fetching with automatic caching and revalidation.

```javascript
import { useDashboardOverview, useHistoricalData, useMarketSentiment, useNewsSummary } from '../hooks/useDashboardData';

function MyComponent() {
  const { data, error, isLoading, mutate } = useDashboardOverview();
  const { data: history } = useHistoricalData(12);
  const { data: sentiment } = useMarketSentiment();
  const { data: news } = useNewsSummary(5);
}
```

## 🔧 Configuration

### Tailwind Config (`tailwind.config.js`)
```javascript
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Uses CSS variables from globals.css
        primary: 'hsl(var(--primary))',
        accent: 'hsl(var(--accent))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
      }
    }
  }
}
```

### PostCSS Config
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Opens at http://localhost:5173

# Build for production
npm run build

# Start production server
npm start
```

## 📦 Dependencies

### Production
- `next@14.2.3` - React framework
- `react@18.2.0` - UI library
- `axios@1.6.8` - HTTP client
- `swr@2.2.5` - Data fetching hooks
- `chart.js@4.4.2` - Charting library
- `lucide-react@0.554.0` - Icons
- `class-variance-authority@0.7.1` - Component variants
- `tailwind-merge@3.4.0` - className merging

### Development
- `tailwindcss@3.4.1` - CSS framework
- `postcss@8.5.6` - CSS processing
- `autoprefixer@10.4.22` - CSS vendor prefixes

## 🎨 Styling Guidelines

### Colors
- Use semantic color variables instead of hardcoded values
- Primary (Navy) for main UI elements
- Accent (Red) for CTAs and active states
- Success (Emerald) for positive states
- Warning (Orange) for warnings

### Typography
- Headings: `text-2xl font-bold text-primary`
- Body: `text-sm text-muted-foreground`
- Labels: `text-xs font-medium`

### Spacing
- Cards: `space-y-6` for vertical spacing
- Grids: `gap-4` for consistent gaps
- Container: `container mx-auto px-4`

### Responsive Design
- Mobile first approach
- Breakpoints: sm, md, lg, xl
- Example: `grid sm:grid-cols-2 lg:grid-cols-4`

## 🔌 API Integration

API base URL: `http://localhost:8000/api/v1`

### Endpoints
```javascript
// Dashboard
GET /dashboard/overview
GET /dashboard/historical/:months
GET /dashboard/market-sentiment
GET /dashboard/news-summary/:limit

// Price
GET /price/latest
POST /price/run-forecast
POST /price/upload-excel

// LSTM
POST /lstm/run
```

## 🐛 Common Issues

### Tailwind not working
```bash
# Make sure dependencies are installed
npm install -D tailwindcss@3.4.1 postcss autoprefixer

# Clear .next cache
rm -rf .next
npm run dev
```

### Module not found errors
- Check import paths are relative (not using `@/` alias)
- Verify file exists at specified path
- Check file extension (.js not .ts)

### SSR errors with hooks
- Don't use `useRouter()` in layout components
- Use title-based logic for active states
- Ensure components are client-side safe

## 📝 Code Style

- Use functional components
- Prefer const over let
- Use arrow functions
- Destructure props
- Use template literals
- Add prop types comments

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type check (if using TypeScript)
npx tsc --noEmit
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [SWR Documentation](https://swr.vercel.app/)
- [Lucide Icons](https://lucide.dev/)
