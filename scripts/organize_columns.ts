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
