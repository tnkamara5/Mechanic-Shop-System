# Auto Shop Excellence

A modern, local-first auto shop management system focused on operational excellence and customer satisfaction.

## 🎯 Vision

Transform auto shops through technology that saves owners 6+ hours daily while improving customer experience through transparency and efficiency.

## 🚀 Live Demo

- **Customer Check-in:** [View Demo](https://tnkamara5.github.io/Mechanic-Shop-System/)
- **Owner Dashboard:** [View Demo](https://tnkamara5.github.io/Mechanic-Shop-System/dashboard)

## ✨ Current Features (MVP)

### 📱 Customer Self-Service Check-In
- Mobile-first responsive design
- **VIN auto-decode** using free NHTSA API (no more manual vehicle entry!)
- Customer information capture with validation
- Vehicle details with smart auto-population
- Service concern description
- Appointment scheduling
- **Offline-capable PWA** - works without internet

### 💼 Owner Dashboard
- Real-time view of pending check-ins
- **One-tap work order creation** (10 minutes → 30 seconds)
- Work order status tracking with visual indicators
- Customer and vehicle information display
- Quick statistics overview
- Responsive design optimized for tablets

### 🏗️ Technical Architecture
- **Progressive Web App (PWA)** with full offline support
- **Local-first database** using browser localStorage (upgradeable to IndexedDB/SQLite)
- **Free VIN decoder** integration with NHTSA government API
- **Responsive UI** with Tailwind CSS
- **TypeScript** for type safety and better development experience
- **Zero ongoing costs** for core functionality

## 💰 Cost Structure

### MVP: $0/month
- ✅ No server costs
- ✅ No database hosting fees
- ✅ No monthly subscriptions
- ✅ VIN decoder: Free (NHTSA API)
- ✅ PWA hosting: Free (GitHub Pages)
- ✅ Data storage: Browser localStorage (free)

### Future Features (Optional)
- SMS notifications: ~$15/month (Twilio)
- Payment processing: Transaction fees only (Stripe)
- Advanced features: Pay-as-you-grow

## 🎯 Value Proposition

### For Shop Owners
- **Time Savings:** Eliminate 6+ hours of daily paperwork
- **Error Reduction:** VIN auto-decode eliminates manual entry mistakes
- **Professional Image:** Modern, clean customer experience
- **Instant Organization:** All customer data automatically structured
- **Work Order Speed:** Create work orders in 30 seconds instead of 10 minutes

### For Customers
- **No Waiting:** Check in from parking lot, skip the line
- **Convenience:** Fill out information at their own pace
- **Professional Experience:** Clean, modern interface
- **Accuracy:** VIN auto-fills vehicle details correctly

## 🛠️ Technology Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Build Tool:** Vite with PWA plugin
- **Database:** Browser localStorage (local-first architecture)
- **APIs:** Free NHTSA VIN decoder
- **Hosting:** GitHub Pages (free)
- **Offline:** Service Worker with Workbox

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/tnkamara5/Mechanic-Shop-System.git
cd Mechanic-Shop-System

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app in action!

### Building for Production

```bash
# Build the app
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## 📱 Usage

### Customer Flow
1. Navigate to the check-in form
2. Enter VIN (vehicle details auto-populate)
3. Fill in contact information
4. Describe service needs
5. Submit check-in
6. Data automatically saved for shop owner

### Shop Owner Flow
1. Navigate to `/dashboard`
2. View pending check-ins in real-time
3. Click "Create Work Order" for one-tap conversion
4. Track work order status
5. View customer history and vehicle details

## 🔮 Planned Features

### Phase 2: Trust & Customer Loyalty Builders
- **Educational Knowledge Base:** "Learn why you need this service"
- **Manufacturer Specs Integration:** "Don't trust us, trust Honda"
- **Service History Package:** Professional PDFs for customer resale value
- **Customer Portal:** Login to view service history and book appointments

### Phase 3: Operational Excellence & Scaling
- **Intelligent Scheduling:** Optimize bay utilization
- **Parts Integration:** Real-time pricing and auto-ordering
- **Advanced Reporting:** Continuous improvement analytics
- **Multi-Shop Management:** Network-wide optimization

### Phase 4: Revenue Enhancement
- **Digital Estimate Approval:** Photo-based SMS approval system
- **SMS Notifications:** Real-time customer updates
- **Stripe Payment Integration:** "Pay Now" links
- **Knowledge Base SEO:** New customer acquisition channel

## 🎯 Business Model

This isn't just software - it's a **partnership model** for operational excellence:

1. **Free 2-week trial** to prove value
2. **Equity partnership** instead of monthly SaaS fees
3. **Operational consulting** to optimize beyond just software
4. **Scale together** to build a network of excellent shops

## 🤝 Contributing

This project is designed to help auto shops succeed. Contributions welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

**Nick Kamara** - [GitHub](https://github.com/tnkamara5)

**Project Link:** [https://github.com/tnkamara5/Mechanic-Shop-System](https://github.com/tnkamara5/Mechanic-Shop-System)

---

*Built with ❤️ for auto shop operational excellence*
