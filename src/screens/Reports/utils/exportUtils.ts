import { Share, Alert } from 'react-native';

/**
 * Escapes a cell value for safe CSV output.
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Exports data as a CSV format via native Share sheet (allows saving to Files, Drive, WhatsApp, Email, Sheets).
 */
export async function exportToCsv(
  reportTitle: string,
  headers: string[],
  rows: (string | number)[][],
): Promise<void> {
  try {
    const timestamp = new Date().toLocaleString();
    const metaHeader = [
      `"REPORT: ${reportTitle.toUpperCase()}"`,
      `"Generated: ${timestamp}"`,
      `"Total Records: ${rows.length}"`,
      '',
    ].join('\n');

    const csvHeader = headers.map(escapeCsvCell).join(',');
    const csvRows = rows.map((r) => r.map(escapeCsvCell).join(',')).join('\n');

    const fullCsv = `${metaHeader}\n${csvHeader}\n${csvRows}\n`;

    const result = await Share.share({
      title: `${reportTitle}.csv`,
      message: fullCsv,
    });

    if (result.action === Share.sharedAction) {
      // Shared successfully
    }
  } catch (error: any) {
    Alert.alert('Export Error', error?.message || 'Unable to generate CSV file.');
  }
}

/**
 * Generates a clean, formatted text statement ready for direct printing or text sharing.
 */
export async function exportToStatement(
  reportTitle: string,
  metrics: Record<string, string | number>,
  headers: string[],
  rows: (string | number)[][],
): Promise<void> {
  try {
    const divider = '==================================================';
    const subDivider = '--------------------------------------------------';
    const lines: string[] = [];

    lines.push(divider);
    lines.push(`         ${reportTitle.toUpperCase()}`);
    lines.push(`         Date: ${new Date().toLocaleDateString()}`);
    lines.push(divider);

    if (metrics && Object.keys(metrics).length > 0) {
      lines.push('SUMMARY OVERVIEW:');
      Object.entries(metrics).forEach(([k, v]) => {
        lines.push(`  * ${k}: ${v}`);
      });
      lines.push(subDivider);
    }

    lines.push(headers.join('  |  '));
    lines.push(subDivider);

    rows.slice(0, 100).forEach((row) => {
      lines.push(row.map((val) => String(val ?? '-')).join('  |  '));
    });

    if (rows.length > 100) {
      lines.push(`... and ${rows.length - 100} more records`);
    }

    lines.push(divider);
    lines.push('Generated via Antigravity Business Management');
    lines.push(divider);

    const statementText = lines.join('\n');

    await Share.share({
      title: `${reportTitle} Statement`,
      message: statementText,
    });
  } catch (error: any) {
    Alert.alert('Print / Statement Error', error?.message || 'Unable to export statement.');
  }
}
