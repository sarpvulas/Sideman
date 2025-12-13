# Sideman - Jazz Piano AI Teacher

An AI-powered web application for learning jazz piano voicings and chord comping.

## Features

- **Score Analysis**: Upload jazz lead sheets (PDF/PNG/JPEG) for AI-powered chord extraction using Gemini Vision
- **Interactive Lessons**: Practice chords with visual piano diagrams
- **Audio Recognition**: Real-time chord detection from microphone input
- **AI Coaching**: Personalized feedback on voicings and technique
- **Progress Tracking**: Monitor your improvement over time

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **AI**: Google Gemini API
- **Testing**: Vitest + React Testing Library

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Run development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── lesson/         # Lesson pages
│   └── progress/       # Progress tracking
├── components/         # React components
│   ├── ui/            # Primitive UI components
│   ├── audio/         # Audio recording components
│   ├── piano/         # Piano visualization
│   ├── lesson/        # Lesson flow components
│   ├── score/         # Score upload/analysis
│   ├── feedback/      # User feedback components
│   └── layout/        # Layout components
├── hooks/             # Custom React hooks
├── lib/               # Utilities and stores
├── types/             # TypeScript types
└── styles/            # Global styles

tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── e2e/              # End-to-end tests
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code

## License

MIT
