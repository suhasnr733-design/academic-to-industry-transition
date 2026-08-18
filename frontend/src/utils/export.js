// frontend/src/utils/export.js

/**
 * Helper function to trigger browser file download from Blob
 */
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export data array to CSV file
 */
export const exportToCSV = async (data, filename = 'export') => {
  if (!data || !data.length) throw new Error('No data available to export')
  
  const headers = Object.keys(data[0])
  const csvRows = []
  
  // Add headers row
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','))
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === undefined || row[header] === null ? '' : row[header]
      const escaped = String(val).replace(/"/g, '""')
      return `"${escaped}"`
    })
    csvRows.push(values.join(','))
  }
  
  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${filename}.csv`)
  return true
}

/**
 * Export data to JSON file
 */
export const exportToJSON = async (data, filename = 'export') => {
  if (!data) throw new Error('No data available to export')
  
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  triggerDownload(blob, `${filename}.json`)
  return true
}

/**
 * Export data to PDF / Print Document format
 */
export const exportToPDF = async (data, filename = 'export') => {
  if (!data || !data.length) throw new Error('No data available to export')
  
  const headers = Object.keys(data[0])
  
  let tableHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; }
          h2 { color: #0f172a; margin-bottom: 8px; }
          p { color: #64748b; font-size: 12px; margin-top: 0; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background-color: #f1f5f9; color: #334155; font-weight: 600; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <h2>${filename.replace(/_/g, ' ').toUpperCase()}</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${headers.map(h => `<td>${row[h] !== undefined && row[h] !== null ? row[h] : ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
  
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(tableHtml)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
    return true
  } else {
    // Fallback if popup blocked: download as HTML report
    const blob = new Blob([tableHtml], { type: 'text/html;charset=utf-8;' })
    triggerDownload(blob, `${filename}_report.html`)
    return true
  }
}

/**
 * Export data to Excel-compatible Spreadsheet (XML format)
 */
export const exportToExcel = async (data, filename = 'export') => {
  if (!data || !data.length) throw new Error('No data available to export')
  
  const headers = Object.keys(data[0])
  let xml = `<?xml version="1.0"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:html="http://www.w3.org/TR/REC-html40">
      <Worksheet ss:Name="Sheet1">
        <Table>
          <Row>
            ${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}
          </Row>
          ${data.map(row => `
            <Row>
              ${headers.map(h => `<Cell><Data ss:Type="String">${row[h] !== undefined && row[h] !== null ? String(row[h]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''}</Data></Cell>`).join('')}
            </Row>
          `).join('')}
        </Table>
      </Worksheet>
    </Workbook>`
    
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  triggerDownload(blob, `${filename}.xls`)
  return true
}
