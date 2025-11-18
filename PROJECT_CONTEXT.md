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
├── scripts/                    # Implementation scripts (active development)
├── prompts/                    # Development session logs
├── package.json               # Node.js project config
└── README.md                  # Basic project description
```

## Key Files

### Scripts Directory
- Contains the active implementation files
- Grid detection and commit parsing logic
- Uses @napi-rs/canvas for image processing

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
# Run scripts from the scripts/ directory
cd scripts/
tsx <script-name>.ts
```

## Dependencies
- @napi-rs/canvas: Image processing and pixel manipulation
- tsx: TypeScript execution
- @types/node: Node.js type definitions

## Technical Implementation

### Color Detection
Amazon uses blue color scheme (not GitHub's green):
- Level 0: [238, 238, 238] - No commits (gray)
- Level 1: [164, 210, 238] - Light blue
- Level 2: [103, 200, 255] - Blue  
- Level 3: [89, 150, 184] - Slate blue
- Level 4: [0, 64, 134] - Dark blue

### Grid Detection Algorithm
- Scans for non-background pixels in 2px increments
- Identifies squares 8-15px in size
- Calculates spacing between squares (typically 2px gap)
- Returns multiple grids for multi-year images
- Uses flood-fill approach for boundary detection

### Current Processing Logic
- `parse_commits.ts`: Hardcoded for 2022-2023 timeframe (weeks 44-52 + 1-44)
- `detect_grids.ts`: More flexible grid detection with Amazon color scheme
- Both use 11px squares with 2px spacing as default
- Sample from center of each square to avoid border artifacts

### Known Issues
- Hardcoded year ranges in main parser
- Grid detection sometimes finds false positives
- Color classification needs tuning for edge cases
- No automatic year/date detection from images

## Development Notes
- Project tracks Amazon commit history analysis (not GitHub)
- Uses computer vision to extract data from screenshots
- Converts visual commit patterns to structured JSON
- Supports multi-year analysis across 2022-2025 timeframe
- Canvas-based pixel sampling with color distance algorithms
