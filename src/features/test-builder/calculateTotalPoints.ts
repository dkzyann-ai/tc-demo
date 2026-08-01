export type TestItem = {
  problemId: string;
  points: number;
  order: number;
};

export function calculateTotalPoints(items: readonly TestItem[]): number {
  return items.reduce((total, item) => total + item.points, 0);
}
