# commit-image-read Project Context

> **Quick Start**: Use `/context add PROJECT_CONTEXT.md` to load this context into your Q session.

## Overview
This project analyzes GitHub commit history images and extracts commit data into structured JSON format. It's designed to parse GitHub contribution graph screenshots and convert them into machine-readable data.

## Project Structure
```
./
├── images/                     # GitHub commit history screenshots
│   ├── 22_23_CommitHistory.png
│   ├── 23_24_CommitHistory.png  
│   ├── 24_25_CommitHistory.png
│   └── *_CommitOnly.png        # Filtered versions showing only commits
├── prompts/                    # Development session logs
├── detect_grids.ts            # Grid detection and box finding logic
├── parse_commits.ts           # Main commit parsing and JSON generation
├── package.json               # Node.js project config
└── README.md                  # Basic project description
```

## Key Files

### parse_commits.ts
- Main entry point (`npm start`)
- Processes GitHub commit history images
- Extracts commit levels (0-4 intensity) from color values
- Outputs structured JSON: `{year: {week: {day: level}}}`
- Uses @napi-rs/canvas for image processing

### detect_grids.ts  
- Grid detection utility (`npm run detect-grids`)
- Finds rectangular boxes/cells in commit grid images
- Identifies background vs commit colors
- Flood-fill algorithm for box detection

### Images Directory
Contains GitHub contribution graph screenshots:
- Full history images (with all activity types)
- CommitOnly filtered versions (commits only)
- Covers 2022-2025 timeframe
- PNG format, typical GitHub heatmap styling

## Data Model
```typescript
interface CommitData {
  [year: string]: {
    [week: string]: {
      su: number;  // Sunday
      m: number;   // Monday  
      t: number;   // Tuesday
      w: number;   // Wednesday
      th: number;  // Thursday
      f: number;   // Friday
      s: number;   // Saturday
    };
  };
}
```

## Commit Levels
- 0: No commits (light gray: [235, 237, 240])
- 1: Light activity (light green: [155, 233, 168])
- 2-4: Increasing intensity (darker greens)

## Usage
```bash
npm start          # Parse commit images to JSON
npm run detect-grids  # Analyze grid structure
```

## Dependencies
- @napi-rs/canvas: Image processing and pixel manipulation
- tsx: TypeScript execution
- @types/node: Node.js type definitions

## Development Notes
- Project tracks Amazon commit history analysis
- Uses computer vision to extract data from screenshots
- Converts visual commit patterns to structured data
- Supports multi-year analysis across different time periods
