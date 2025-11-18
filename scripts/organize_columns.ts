interface GroupedPixels {
  [key: string]: number;
}

interface ColumnData {
  [x: number]: Array<{coord: string, level: number}>;
}

export function organizeByColumns(grouped: GroupedPixels): ColumnData {
  const columns: ColumnData = {};
  
  Object.entries(grouped).forEach(([coord, level]) => {
    const x = parseInt(coord.split(',')[0]);
    
    if (!columns[x]) columns[x] = [];
    columns[x].push({coord, level});
  });
  
  // Sort each column by y coordinate
  Object.keys(columns).forEach(x => {
    columns[parseInt(x)].sort((a, b) => {
      const yA = parseInt(a.coord.split(',')[1]);
      const yB = parseInt(b.coord.split(',')[1]);
      return yA - yB;
    });
  });
  
  return columns;
}

export function groupByX(grouped: GroupedPixels): ColumnData {
  const xGroups: ColumnData = {};
  
  Object.entries(grouped).forEach(([coord, level]) => {
    const x = parseInt(coord.split(',')[0]);
    
    if (!xGroups[x]) xGroups[x] = [];
    xGroups[x].push({coord, level});
  });
  
  // Sort each x group by y coordinate
  Object.keys(xGroups).forEach(x => {
    xGroups[parseInt(x)].sort((a, b) => {
      const yA = parseInt(a.coord.split(',')[1]);
      const yB = parseInt(b.coord.split(',')[1]);
      return yA - yB;
    });
  });
  
  return xGroups;
}

export function fuzzyGroupColumns(grouped: GroupedPixels, tolerance: number = 3): ColumnData {
  const allRegions = Object.entries(grouped).map(([coord, level]) => ({
    x: parseInt(coord.split(',')[0]),
    coord,
    level
  })).sort((a, b) => a.x - b.x);
  
  const columns: ColumnData = {};
  let columnIndex = 0;
  
  for (const region of allRegions) {
    let assigned = false;
    
    // Try to assign to existing column within tolerance
    for (const [colKey, colRegions] of Object.entries(columns)) {
      const colX = parseInt(colKey);
      if (Math.abs(region.x - colX) <= tolerance) {
        columns[colX].push({coord: region.coord, level: region.level});
        assigned = true;
        break;
      }
    }
    
    // Create new column if not assigned
    if (!assigned) {
      columns[region.x] = [{coord: region.coord, level: region.level}];
    }
  }
  
  // Filter columns with at least 7 regions and sort by y
  const validColumns: ColumnData = {};
  Object.entries(columns).forEach(([x, regions]) => {
    if (regions.length >= 7) {
      regions.sort((a, b) => {
        const yA = parseInt(a.coord.split(',')[1]);
        const yB = parseInt(b.coord.split(',')[1]);
        return yA - yB;
      });
      validColumns[parseInt(x)] = regions;
    }
  });
  
  return validColumns;
}
