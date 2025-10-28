/**
 * Utility functions for date formatting
 */

/**
 * Converts a date string from ISO format (YYYY-MM-DD) to Brazilian format (dd/mm/yyyy)
 * @param dateString - Date in ISO format (YYYY-MM-DD)
 * @returns Date in Brazilian format (dd/mm/yyyy)
 */
export const formatDateToBrazilian = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Converts a date string from Brazilian format (dd/mm/yyyy) to ISO format (YYYY-MM-DD)
 * @param dateString - Date in Brazilian format (dd/mm/yyyy)
 * @returns Date in ISO format (YYYY-MM-DD)
 */
export const formatDateToISO = (dateString: string): string => {
  if (!dateString) return '';
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
};
