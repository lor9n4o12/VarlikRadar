# Design Guidelines: Turkish Investment Portfolio Platform

## Design Approach
**Reference-Based**: Inspired by Yahoo Finance and Investing.com's professional financial dashboards - clean, data-focused interfaces with emphasis on readability and financial clarity.

## Color Palette (User-Specified)
- **Primary**: #1E3A8A (koyu mavi/dark blue) - for headers, primary actions, key elements
- **Secondary**: #6B7280 (gri/gray) - for secondary text, borders, subtle elements
- **Background**: #FFFFFF (beyaz/white) - main background
- **Text**: #111827 (koyu gri/dark gray) - primary text color
- **Positive/Gains**: #10B981 (yeşil/green) - profit indicators, positive changes
- **Negative/Losses**: #EF4444 (kırmızı/red) - loss indicators, negative changes

## Typography
- **Font Families**: Inter, Roboto, or Poppins (via Google Fonts CDN)
- **Hierarchy**:
  - Headers (H1): 32px, semibold
  - Section Titles (H2): 24px, semibold
  - Card Headers (H3): 18px, medium
  - Body Text: 14-16px, regular
  - Financial Numbers: 20-24px, medium/semibold (emphasis on data)
  - Small Labels/Captions: 12px, regular

## Layout System
- **Spacing Units**: Tailwind units of 4, 5, 6, 8, and 12 (p-4, m-5, gap-6, py-8, px-12)
- **Card Padding**: p-5 or p-6 (20-24px as specified)
- **Grid System**: 
  - Desktop: 3-column layout for summary cards, 2-column for detailed views
  - Tablet: 2-column adaptive
  - Mobile: Single column stack
- **Container**: max-w-7xl with responsive padding

## Component Library

### Navigation
- **Left Sidebar**: Fixed position, dark blue (#1E3A8A) background
  - Logo at top
  - Main menu items: Portföyüm, İşlemler, Raporlar, Ayarlar
  - Icons from Heroicons (outline style)
  - Active state: lighter blue background + white text

### Dashboard Cards
- **Financial Summary Cards**: White background, subtle shadow, rounded-lg borders
  - Top row: Toplam Varlık, Toplam Borç, Net Değer (3 cards)
  - Large numbers (24px) with labels (12px gray text)
  - Aylık Değişim indicator with green/red percentage

### Data Visualization
- **Pie Chart (Varlık Dağılımı)**: Use Chart.js or similar
  - Color segments by asset type
  - Interactive tooltips showing percentages
  
- **Line Chart (Aylık Performans)**: 
  - Blue line (#1E3A8A) for trend
  - Grid lines in light gray
  - Y-axis: currency values, X-axis: months in Turkish

### Data Tables
- **Asset List Table**:
  - Headers: Varlık, Tip, Miktar, Fiyat, Toplam Değer, Değişim
  - Alternating row backgrounds (white/light gray)
  - Right-aligned numbers
  - Green/red text for percentage changes with arrow icons
  - Hover state: subtle gray background

### Forms & Inputs
- Border: 1px solid #6B7280
- Focus: 2px border #1E3A8A
- Padding: px-4 py-2
- Rounded: rounded-md
- Labels: 14px, #111827, mb-2

### Buttons
- **Primary**: bg-[#1E3A8A], white text, px-6 py-3, rounded-lg, shadow-sm
- **Secondary**: border-2 border-[#1E3A8A], #1E3A8A text, px-6 py-3, rounded-lg
- **Danger**: bg-[#EF4444] for delete actions

## Responsive Breakpoints
- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (full 3-column grid)

## Turkish Language Considerations
- All UI text in Turkish
- Number formatting: Turkish locale (1.234,56 format)
- Date formatting: DD.MM.YYYY
- Currency symbols: ₺ for TRY, $ for USD

## Key Screens Layout

**Dashboard (Portföyüm)**:
- Top: 3 summary cards (Toplam Varlık, Borç, Net Değer)
- Middle row: Varlık Dağılımı pie chart + Aylık Performans line chart (2-column grid)
- Bottom: Asset list table with all holdings

**İşlemler**: Transaction history table with filters

**Raporlar**: Summary reports by asset class

**Ayarlar**: User preferences and settings forms