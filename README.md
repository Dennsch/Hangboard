# Hangboard
A timer application for hangboard training that alternates between hang and rest periods with visual feedback. Built with TypeScript and Vite, deployable to Vercel.

## Features

- **Configurable Intervals**: Set the number of hang/rest cycles (1-20)
- **10-second Hang Phase**: Training period with visual finger position image
- **20-second Rest Phase**: Recovery period between hangs
- **Image Display**: Show custom finger position images during hang phases
- **Visual Timer**: Large, easy-to-read countdown display
- **Progress Tracking**: Shows current interval number and total intervals
- **Pause/Resume**: Pause the session and resume where you left off
- **Reset Function**: Start over at any time

## Requirements

- Node.js 18+ (with npm)

## Installation

Install the required dependencies:

```bash
npm install
```

## Build

Compile the TypeScript code:

```bash
npm run build
```

## Usage

### Local Development

Run the development server:

```bash
npm run dev
```

Then open your browser to `http://localhost:3000`

1. Set the number of intervals in the settings section
2. (Optional) Load a finger position image to display during hangs
3. Click "Start" to begin the training session
4. The timer will alternate between 10-second hangs and 20-second rests
5. Use "Pause" to temporarily stop, "Reset" to start over

### Production Build

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Configuration

- **Number of Intervals**: Configure how many hang/rest cycles to perform
- **Finger Position Image**: Load an image (PNG, JPG, GIF, BMP) to display during hang phases

## Timer Sequence

Each interval consists of:
1. **HANG** - 10 seconds (displays finger position image)
2. **REST** - 20 seconds (clears image)

This sequence repeats for the configured number of intervals.

## Deployment to Vercel

This application is ready to deploy to Vercel. Simply:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project in Vercel
3. Vercel will automatically detect the configuration from `vercel.json`
4. Your app will be deployed and available at a Vercel URL
