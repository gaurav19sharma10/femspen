import { Expense } from '../types';

export function exportExpensesToCSV(expenses: Expense[], filename = 'expenses_export.csv') {
  if (!expenses.length) return;

  const headers = ['ID', 'Title', 'Amount', 'Currency', 'Category', 'Mode', 'Date', 'Family Member', 'Recurring', 'Notes'];
  
  const rows = expenses.map(e => [
    `"${e.id}"`,
    `"${(e.title || '').replace(/"/g, '""')}"`,
    e.amount,
    `"${e.currency}"`,
    `"${e.category}"`,
    `"${e.mode}"`,
    `"${e.date}"`,
    `"${e.familyMember || ''}"`,
    e.isRecurring ? 'Yes' : 'No',
    `"${(e.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportExpensesToJSON(expenses: Expense[], filename = 'expenses_export.json') {
  const jsonContent = JSON.stringify(expenses, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
