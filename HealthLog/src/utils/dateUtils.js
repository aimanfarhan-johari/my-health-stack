export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function getDaysInMonth(year, month) {
  const days = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    days.push(date.toISOString().split('T')[0]);
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function formatDisplay(isoDate) {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function formatChartLabel(isoDate) {
  const date = new Date(isoDate + 'T00:00:00');
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('en-GB', { month: 'short' });
  return `${day} ${month}`;
}
