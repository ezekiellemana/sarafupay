export const getCurrentMonth = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const getNextDueDate = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 5);

export const monthRange = (start?: Date, end?: Date) => {
  if (!start || !end || start > end) return [];
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    months.push(getCurrentMonth(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
};
