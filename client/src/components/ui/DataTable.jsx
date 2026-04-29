export function DataTable({ columns, rows, emptyText = 'No data found.' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {columns.map((col) => (
              <th key={col.key} style={{
                textAlign: 'left',
                padding: '10px 14px',
                paddingLeft: col === columns[0] ? '20px' : '14px',
                paddingRight: col === columns[columns.length - 1] ? '20px' : '14px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--text)' }}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row._id || i} style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{
                    padding: '12px 14px',
                    paddingLeft: col === columns[0] ? '20px' : '14px',
                    paddingRight: col === columns[columns.length - 1] ? '20px' : '14px',
                    color: 'var(--text-h)', verticalAlign: 'middle'
                  }}>
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
