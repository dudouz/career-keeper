# Career Keeper v2

**AI-Powered Resume Builder from GitHub Contributions**

Career Keeper helps developers maintain up-to-date resumes by automatically analyzing their GitHub contributions and transforming them into compelling professional content using AI.

## 🎯 What is Career Keeper?

Career Keeper solves a common problem: developers struggle to keep their resumes current with their latest accomplishments. Your GitHub profile contains valuable information about your work, but translating technical activity into professional resume content is time-consuming and often neglected.

**Career Keeper automates this process by:**

- 🔍 **Scanning** your GitHub contributions (commits, PRs, issues, releases)
- 📊 **Extracting** meaningful achievements from your work
- 🤖 **Analyzing** contributions with AI to generate professional content
- 📝 **Comparing** your current resume with new accomplishments
- 💡 **Providing** actionable insights for career progression
- 📄 **Exporting** updated resume content in multiple formats

## ✨ Key Features

### Current Implementation (MVP)

- ✅ **Authentication System**
  - Email/password authentication
  - OAuth integration (Google & GitHub)
  - Secure session management with JWT
  - Password reset functionality

- ✅ **GitHub Integration**
  - Connect using Personal Access Token (PAT)
  - Scan public/private repositories
  - Track commits, PRs, issues, and releases
  - Extract programming languages and project descriptions
  - Generate automated "brag list" from contributions
  - Release tracking with version management insights

- ✅ **Resume Management**
  - Upload existing resume (PDF, DOCX, TXT)
  - Intelligent parsing of resume sections
  - Store and manage resume data
  - Version tracking

- ✅ **AI-Powered Analysis**
  - OpenAI integration for content generation
  - Professional summary generation
  - Resume vs. GitHub comparison
  - Improvement suggestions
  - Achievement highlighting

- ✅ **Dashboard**
  - User profile management
  - Statistics overview
  - Quick access to all features
  - Onboarding flow for new users

- ✅ **Security & Privacy**
  - API keys stored in session only (never persisted)
  - Encrypted data at rest
  - Rate limiting
  - Protected API routes
  - HTTPS enforcement

## 🏗️ How It Works

### User Flow

```
1. Sign Up/Login
   └─> OAuth (Google/GitHub) or Email/Password

2. Onboarding
   └─> Dashboard → Connect GitHub → Upload Resume

3. GitHub Connection
   └─> Enter Personal Access Token (PAT)
   └─> App scans contributions
   └─> Generates "Brag List"

4. AI Analysis
   └─> Enter OpenAI API Key (session-only)
   └─> AI analyzes contributions
   └─> Compares with current resume
   └─> Generates suggestions

5. Resume Enhancement
   └─> Review comparison
   └─> View insights & suggestions
   └─> Export updated content

6. Ongoing Use
   └─> Refresh GitHub data periodically
   └─> Track new contributions
   └─> Keep resume current
```

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                   │
│  (React 18 + TypeScript + Tailwind + Shadcn UI)    │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│              Next.js API Routes                      │
│  /api/auth/*      - Authentication (NextAuth)       │
│  /api/github/*    - GitHub integration              │
│  /api/resume/*    - Resume parsing & management     │
│  /api/llm/*       - OpenAI proxy & analysis         │
│  /api/openai/*    - API key management              │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────────┐
        │                     │                  │
   ┌────┴─────┐         ┌────┴────┐       ┌────┴────┐
   │PostgreSQL│         │ GitHub  │       │ OpenAI  │
   │(Drizzle) │         │   API   │       │   API   │
   └──────────┘         └─────────┘       └─────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI + Radix UI
- **Icons:** Lucide React

### Backend
- **API:** Next.js API Routes
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** NextAuth.js v5

### External Integrations
- **GitHub API:** Repository and contribution data
- **OpenAI API:** GPT-4 for resume analysis and generation

### Development Tools
- **Package Manager:** pnpm
- **Testing:** Vitest + React Testing Library
- **Code Quality:** ESLint + Prettier
- **Database Tools:** Drizzle Kit + Drizzle Studio

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- PostgreSQL database
- GitHub OAuth App credentials
- Google OAuth App credentials

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/career-keeper-v2.git
cd career-keeper-v2
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Environment Setup**

Create a `.env.local` file in the project root:

```bash
# Database (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/career_keeper

# Authentication (Required)
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-secret-key-here

# Session Encryption (Required)
# Generate with: openssl rand -hex 16
SESSION_ENCRYPTION_KEY=your-32-character-key-here

# OAuth - Google (Required)
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# OAuth - GitHub (Required)
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret
```

**Important Security Notes:**
- GitHub PAT and OpenAI API keys are **NOT** stored in `.env`
- Users provide these directly in the app UI
- Keys are stored in session only (never persisted to database)
- This ensures users maintain control of their sensitive credentials

For detailed OAuth setup instructions, see [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)

4. **Database Setup**
```bash
# Generate migrations
pnpm db:generate

# Push schema to database
pnpm db:push
```

5. **Start Development Server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
career-keeper-v2/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   ├── github/        # GitHub integration
│   │   │   ├── llm/           # AI analysis endpoints
│   │   │   ├── openai/        # OpenAI key management
│   │   │   └── resume/        # Resume upload & parsing
│   │   ├── auth/              # Auth pages (login, signup)
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── brag-list/    # GitHub contributions view
│   │   │   ├── github/       # GitHub connection
│   │   │   ├── onboarding/   # New user setup
│   │   │   ├── resume/       # Resume management
│   │   │   ├── settings/     # User settings
│   │   │   └── summary/      # AI-generated summaries
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   ├── dashboard/        # Dashboard-specific components
│   │   ├── providers/        # React context providers
│   │   └── ui/              # Reusable UI components (Shadcn)
│   ├── lib/
│   │   ├── auth/            # Authentication utilities
│   │   ├── db/              # Database schema & connection
│   │   ├── github/          # GitHub client & encryption
│   │   ├── llm/             # OpenAI client
│   │   ├── resume/          # Resume parsing logic
│   │   ├── export/          # Export utilities (PDF, TXT)
│   │   ├── rate-limit.ts    # API rate limiting
│   │   └── utils.ts         # Shared utilities
│   ├── types/               # TypeScript type definitions
│   ├── auth.config.ts       # NextAuth configuration
│   ├── auth.ts              # Auth handlers
│   └── middleware.ts        # Next.js middleware (route protection)
├── drizzle/                 # Database migrations
├── docs/                    # Documentation
├── tests/                   # Test files
├── coverage/                # Test coverage reports
├── .cursor/                 # Development rules & guidelines
├── docker-compose.yml       # Docker setup
├── Dockerfile              # Production Docker image
├── drizzle.config.ts       # Drizzle ORM config
├── next.config.js          # Next.js config
├── tailwind.config.ts      # Tailwind config
├── tsconfig.json           # TypeScript config
└── vitest.config.ts        # Vitest config
```

## 🧪 Testing

Career Keeper uses Vitest for testing with comprehensive coverage:

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

**Test Coverage:**
- Unit tests for utilities and helpers
- Component tests with React Testing Library
- API route tests with MSW (Mock Service Worker)
- Database schema and query tests

## 📜 Available Scripts

### Development
- `pnpm dev` - Start development server (http://localhost:3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

### Database
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Run migrations
- `pnpm db:studio` - Open Drizzle Studio GUI (visual database editor)

### Testing
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once
- `pnpm test:ui` - Run tests with interactive UI
- `pnpm test:coverage` - Generate coverage report

## 🐳 Docker Support

Career Keeper includes Docker support for easy deployment:

```bash
# Development with Docker
docker-compose up

# Production build
docker-compose -f docker-compose.prod.yml up
```

See [README.Docker.md](README.Docker.md) and [DOCKER_STARTUP.md](DOCKER_STARTUP.md) for detailed Docker instructions.

## 🔒 Security Features

- **Authentication:** Secure password hashing with bcrypt
- **Session Management:** JWT tokens with secure cookies
- **API Protection:** Rate limiting on all endpoints
- **Data Encryption:** Sensitive data encrypted at rest
- **HTTPS:** Enforced for all connections
- **Input Validation:** Zod schemas for all user inputs
- **CSRF Protection:** Built into Next.js
- **XSS Prevention:** React's built-in protections
- **SQL Injection Prevention:** ORM-based queries

### API Key Security Model

Career Keeper uses a unique security approach for sensitive API keys:

- **GitHub PAT & OpenAI API Keys:** Never stored in database
- **Session-Only Storage:** Keys exist only during user session
- **User Control:** Users provide and control their own keys
- **Encryption:** Keys encrypted in session storage
- **Proxy Pattern:** All API calls proxied through Next.js routes
- **Automatic Cleanup:** Keys cleared on logout or session expiration

## 📊 Database Schema

Career Keeper uses PostgreSQL with Drizzle ORM. Key tables include:

- **users** - User accounts and authentication
- **accounts** - OAuth account links (Google, GitHub)
- **sessions** - Active user sessions
- **verification_tokens** - Email verification
- **resume_data** - Parsed resume content
- **github_scan_results** - Cached GitHub contributions
- **openai_keys** - Temporary session-based key storage

See [src/lib/db/schema.ts](src/lib/db/schema.ts) for complete schema definition.

## 🗺️ Roadmap

### Current (MVP - Phase 1) ✅
- Basic authentication
- GitHub integration
- Resume upload & parsing
- LLM integration (OpenAI)
- Brag list generation
- Resume comparison
- Basic insights

### Coming Soon (Phase 2)
- Rich text editor for resume editing
- Section-based resume management
- Version control for resumes
- LinkedIn profile integration
- Advanced AI insights
- Multiple export formats (DOCX, HTML, MD)
- Custom resume templates
- Subscription billing (Basic/Premium tiers)

### Future (Phase 3+)
- Multiple LLM provider support (Anthropic, Google)
- ATS (Applicant Tracking System) optimization
- Cover letter generation
- Job posting analysis
- Skills gap recommendations
- GitLab and Bitbucket integration
- Portfolio website generation

## 🤝 Contributing

This is currently a private project. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the TypeScript and React best practices
- Write tests for new features
- Maintain code coverage above 80%
- Use functional and declarative programming patterns
- Follow the existing code style (enforced by ESLint/Prettier)
- Update documentation as needed

## 📝 Documentation

Additional documentation available:

- [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md) - Detailed OAuth setup
- [PRD.md](PRD.md) - Complete Product Requirements Document
- [DOCKER_STARTUP.md](DOCKER_STARTUP.md) - Docker deployment guide
- [Component README](src/components/dashboard/README.md) - Dashboard components
- [Database README](src/lib/db/README.md) - Database architecture
- [Testing Summary](TESTING_SUMMARY.md) - Testing approach

## 🐛 Known Issues & Limitations

- Resume parsing accuracy depends on resume format consistency
- GitHub API rate limits may affect users with extensive contribution history
- OpenAI API usage requires user to provide their own API key
- Currently only supports English language resumes
- PDF export styling is basic (will be enhanced in Phase 2)

## 📄 License

Proprietary - All rights reserved.

## 👏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Shadcn UI](https://ui.shadcn.com/) - Beautiful UI components
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database toolkit
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [OpenAI](https://openai.com/) - AI-powered content generation
- [GitHub API](https://docs.github.com/en/rest) - Contribution data

## 💬 Support

For questions or issues:

1. Check existing [documentation](docs/)
2. Review [PRD.md](PRD.md) for feature details
3. Open an issue on GitHub
4. Contact the development team

---

**Built with ❤️ by developers, for developers.**

*Keep your resume as active as your GitHub profile!*
