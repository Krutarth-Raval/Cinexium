# 🎬 Cinexium

> A modern, interactive movie & TV series discovery platform powered by TMDb API

[![Live Demo](https://img.shields.io/badge/Live%20Demo-cinexium.site-blue?style=for-the-badge)](https://cinexium.site)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://cinexium.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=nextjs)](https://nextjs.org/)

---

## 📸 Home Screen

![Cinexium Home Screen](https://cinexium.site/screenshot.png)

---

## ✨ About Cinexium

Cinexium is a modern **movie & TV series platform** that goes beyond simple content discovery. Inspired by IMDb but built for today's social-first audience, Cinexium combines rich entertainment data with community engagement.

**What makes Cinexium special:**
- 🎥 **Comprehensive Entertainment Database** - Powered by TMDb API with millions of movies and TV shows
- 👥 **Social Community** - Connect with fellow cinephiles, share opinions, and build communities
- 💬 **Real-time Chat** - Discuss movies and shows with other users instantly
- ⭐ **Rich Content** - Ratings, reviews, detailed information, cast & crew, and recommendations
- 🎯 **Smart Discovery** - Find your next favorite movie or series
- 💎 **Premium Features** - Manual request workflow for premium memberships

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- TMDb API Key (get it at [tmdb.org](https://www.themoviedb.org/settings/api))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Krutarth-Raval/Cinexium.git
cd Cinexium
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Then edit `.env.local` with your configuration:
```env
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3

# Optional: Premium Features
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
UPI_ID=your_upi_id
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 📦 Project Structure

```
Cinexium/
├── cinexium/              # Next.js application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Utility functions
│   ├── public/           # Static assets
│   ├── styles/           # Global styles
│   └── ...
├── README.md
├── package.json
└── tsconfig.json
```

---

## 🎨 Features

### Core Features
- ✅ Movie & TV Series Discovery
- ✅ Detailed Content Information
- ✅ Advanced Search & Filtering
- ✅ User Ratings & Reviews
- ✅ Watchlist & Favorites
- ✅ Trending & Popular Content

### Community Features
- 💬 Real-time Chat System
- 👥 User Profiles
- 🤝 Connect with Other Users
- 💡 Share Opinions & Reviews
- 📊 Community Rankings

### Premium Features
- 💎 Premium Membership
- 🎁 Exclusive Content Access
- 📧 Manual Request Workflow
- 💳 UPI Payment Integration

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | Next.js 15+, TypeScript, React |
| **Styling** | Tailwind CSS |
| **State Management** | React Context / Zustand |
| **API** | TMDb API, RESTful endpoints |
| **Database** | Firebase / MongoDB |
| **Authentication** | NextAuth.js |
| **Deployment** | Vercel |
| **Email** | Nodemailer |

---

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Required
NEXT_PUBLIC_TMDB_API_KEY=your_api_key
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3

# Optional: Email Service (for premium requests)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
UPI_ID=your_upi_id@bank

# Optional: Database
MONGODB_URI=your_mongodb_connection_string
FIREBASE_PROJECT_ID=your_firebase_project
```

---

## 📝 Premium Requests

Cinexium Premium uses a **manual request workflow** instead of third-party payment gateways:

1. Users submit premium membership requests
2. Request emails are sent to the admin
3. Admin verifies and processes payments via UPI
4. Premium access is granted upon confirmation

**Configuration:**
```env
EMAIL_USER=admin@cinexium.com
EMAIL_PASS=your_app_specific_password
UPI_ID=cinexium@bank
```

---

## 🚀 Deployment

### Deploy on Vercel (Recommended)

The easiest way to deploy Cinexium is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will auto-detect Next.js and configure it
4. Set environment variables in Vercel dashboard
5. Deploy!

```bash
# Alternative: Deploy using Vercel CLI
npm i -g vercel
vercel
```

### Other Deployment Options
- **Netlify**: Check [Netlify Next.js Guide](https://docs.netlify.com/integrations/frameworks/next-js/)
- **Docker**: Create a Dockerfile for containerized deployment
- **Self-hosted**: Deploy on your own server

---

## 🔗 Live Demo

**🌐 Visit Cinexium:** [cinexium.site](https://cinexium.site)

Experience the full Cinexium platform with real data from TMDb API, community features, and premium options.

---

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features
- [TMDb API Docs](https://developer.themoviedb.org/docs) - API reference
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript guide

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes before submitting

---

## 📄 License

This project is open source. Feel free to use it for personal or commercial purposes.

---

## 👨‍💻 Author

**Krutarth Raval**
- GitHub: [@Krutarth-Raval](https://github.com/Krutarth-Raval)
- Portfolio: Coming soon...

---

## ⭐ Support

If you love Cinexium, please consider:
- ⭐ Giving it a star on GitHub
- 📢 Sharing with your friends
- 💬 Providing feedback and suggestions
- 🐛 Reporting issues

---

## 🙏 Acknowledgments

- **TMDb** for providing the comprehensive movie/TV database API
- **Vercel** for seamless deployment
- **Next.js** community for amazing tools and resources
- All contributors and users supporting this project

---

<div align="center">

Made with ❤️ by [Krutarth Raval](https://github.com/Krutarth-Raval)

**[🌐 Visit Live Demo](https://cinexium.site)** | **[⭐ Star on GitHub](https://github.com/Krutarth-Raval/Cinexium)** | **[📧 Contact](mailto:your-email@example.com)**

</div>
