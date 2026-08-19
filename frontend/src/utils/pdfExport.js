/**
 * Formats patient health details, 7-day glucose trends, and chronological log history
 * into a highly professional, print-friendly report page and opens the browser print dialog.
 */
export function exportReportToPdf(reportData, existingWindow) {
  const patient = reportData.patient || {};
  const stats = reportData.trends?.stats || {};
  const insights = reportData.trends?.insights || {};
  
  // Merge and sort logs by date (newest first)
  const allLogs = [
    ...(reportData.logs.glucose || []).map(g => ({ 
      logType: 'Glucose', 
      loggedAt: g.loggedAt, 
      displayValue: `${g.value} mg/dL`, 
      details: g.context || '—',
      colorClass: 'glucose-badge'
    })),
    ...(reportData.logs.insulin || []).map(i => ({ 
      logType: 'Insulin', 
      loggedAt: i.loggedAt, 
      displayValue: `${i.units} units`, 
      details: `${i.insulinType || ''} ${i.reason ? `(${i.reason})` : ''}`.trim() || '—',
      colorClass: 'insulin-badge'
    })),
    ...(reportData.logs.meals || []).map(m => ({ 
      logType: 'Meal', 
      loggedAt: m.loggedAt, 
      displayValue: `${m.carbs}g carbs`, 
      details: `${m.mealType || ''} ${m.notes ? `(${m.notes})` : ''}`.trim() || '—',
      colorClass: 'meal-badge'
    })),
    ...(reportData.logs.activity || []).map(a => ({ 
      logType: 'Activity', 
      loggedAt: a.loggedAt, 
      displayValue: `${a.durationMins} mins`, 
      details: a.activityType || '—',
      colorClass: 'activity-badge'
    })),
    ...(reportData.logs.notes || []).map(n => ({ 
      logType: 'Note', 
      loggedAt: n.loggedAt, 
      displayValue: 'Text Note', 
      details: n.content || '—',
      colorClass: 'note-badge'
    }))
  ].sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));

  const totalLogsCount = allLogs.length;
  const printWindow = existingWindow || window.open('', '_blank');
  
  if (!printWindow) {
    alert('Could not open report window. Please allow popups for this website.');
    return;
  }

  // Construct report HTML
  const reportHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>iT1DXpert Patient Health Report - ${patient.fullName || 'Patient'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          background-color: #ffffff;
          line-height: 1.5;
          padding: 20px;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }

        .logo-section h1 {
          font-size: 22px;
          font-weight: 800;
          color: #2b6cb0;
          letter-spacing: -0.5px;
        }

        .logo-section p {
          font-size: 11px;
          color: #718096;
          font-weight: 500;
        }

        .report-meta {
          text-align: right;
          font-size: 11px;
          color: #718096;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #2d3748;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          border-left: 3px solid #2b6cb0;
          padding-left: 8px;
        }

        .profile-container {
          background-color: #f7fafc;
          border: 1px solid #edf2f7;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 25px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .profile-item {
          display: flex;
          flex-direction: column;
        }

        .profile-label {
          font-size: 10px;
          font-weight: 700;
          color: #718096;
          text-transform: uppercase;
        }

        .profile-value {
          font-size: 13px;
          font-weight: 600;
          color: #2d3748;
          margin-top: 2px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }

        .stat-card {
          border: 1px solid #edf2f7;
          border-radius: 12px;
          padding: 15px;
          background-color: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .stat-card-title {
          font-size: 11px;
          font-weight: 700;
          color: #718096;
          text-transform: uppercase;
        }

        .stat-card-value {
          font-size: 26px;
          font-weight: 800;
          color: #1a202c;
          margin-top: 4px;
        }

        .stat-card-subtitle {
          font-size: 10px;
          color: #a0aec0;
          font-weight: 500;
          margin-top: 2px;
        }

        .stat-primary { border-top: 3px solid #2b6cb0; }
        .stat-success { border-top: 3px solid #48bb78; }
        .stat-warning { border-top: 3px solid #ecc94b; }
        .stat-danger { border-top: 3px solid #f56565; }

        .more-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 25px;
          background-color: #f7fafc;
          border: 1px solid #edf2f7;
          border-radius: 12px;
          padding: 14px;
        }

        .log-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 30px;
        }

        .log-table th {
          background-color: #edf2f7;
          color: #4a5568;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          text-align: left;
          padding: 10px 12px;
          border-bottom: 2px solid #cbd5e0;
        }

        .log-table td {
          padding: 10px 12px;
          font-size: 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #2d3748;
        }

        .log-table tr:nth-child(even) {
          background-color: #fcfdfd;
        }

        .badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2.5px 8px;
          border-radius: 9999px;
          letter-spacing: 0.2px;
        }

        .glucose-badge { background-color: #ebf8ff; color: #2b6cb0; border: 1px solid #bee3f8; }
        .insulin-badge { background-color: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }
        .meal-badge { background-color: #fffaf0; color: #dd6b20; border: 1px solid #feebc8; }
        .activity-badge { background-color: #f0fff4; color: #2f855a; border: 1px solid #c6f6d5; }
        .note-badge { background-color: #edf2f7; color: #4a5568; border: 1px solid #e2e8f0; }

        footer {
          margin-top: 40px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 15px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #a0aec0;
          font-weight: 500;
        }

        @media print {
          body {
            padding: 0;
            background: transparent;
          }
          .no-print {
            display: none;
          }
          .log-table tr {
            page-break-inside: avoid;
          }
          .stat-card {
            page-break-inside: avoid;
          }
          .profile-container {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background-color: #ebf8ff; border: 1px solid #bee3f8; border-radius: 8px; padding: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; color: #2b6cb0; font-weight: 600;">Print Report: Select "Save as PDF" in your browser's print dialog destination if you wish to export a PDF file.</span>
        <button onclick="window.print()" style="background-color: #2b6cb0; color: white; border: none; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; font-family: inherit;">Print / Save PDF</button>
      </div>

      <header>
        <div class="logo-section">
          <h1>iT1DXpert / DiabetesCare</h1>
          <p>INTELLIGENT DIABETES CLINICAL LOGBOOK</p>
        </div>
        <div class="report-meta">
          <p style="font-weight: 700; color: #2d3748; font-size: 12px;">7-Day Patient Health Summary Report</p>
          <p>Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
      </header>

      <div class="section-title">Patient Profile</div>
      <div class="profile-container">
        <div class="profile-item">
          <span class="profile-label">Name</span>
          <span class="profile-value">${patient.fullName || '—'}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">Diabetes Type</span>
          <span class="profile-value">${patient.diabetesType || '—'}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">Hospital</span>
          <span class="profile-value">${patient.hospitalName || '—'}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">Assigned Doctor</span>
          <span class="profile-value">${patient.doctorName ? `Dr. ${patient.doctorName}` : '—'}</span>
        </div>
        <div class="profile-item" style="margin-top: 8px;">
          <span class="profile-label">DOB / Age</span>
          <span class="profile-value">${patient.dateOfBirth || '—'}</span>
        </div>
        <div class="profile-item" style="margin-top: 8px;">
          <span class="profile-label">Gender</span>
          <span class="profile-value">${patient.gender || '—'}</span>
        </div>
        <div class="profile-item" style="margin-top: 8px;">
          <span class="profile-label">Phone</span>
          <span class="profile-value">${patient.phone || '—'}</span>
        </div>
        <div class="profile-item" style="margin-top: 8px;">
          <span class="profile-label">Email</span>
          <span class="profile-value">${patient.email || '—'}</span>
        </div>
      </div>

      <div class="section-title">7-Day Health Status Summary</div>
      <div class="stats-grid">
        <div class="stat-card stat-success">
          <span class="stat-card-title">Time In Range</span>
          <div class="stat-card-value">${insights.inRangePercent !== undefined ? `${insights.inRangePercent}%` : '—'}</div>
          <span class="stat-card-subtitle">Target range (70-180 mg/dL)</span>
        </div>
        <div class="stat-card stat-primary">
          <span class="stat-card-title">Average Glucose</span>
          <div class="stat-card-value">${stats.average ? `${stats.average} <span style="font-size: 14px; font-weight: 500;">mg/dL</span>` : '—'}</div>
          <span class="stat-card-subtitle">Mean of logged glucose readings</span>
        </div>
        <div class="stat-card stat-primary">
          <span class="stat-card-title">Estimated HbA1c</span>
          <div class="stat-card-value">${insights.gmi ? `${insights.gmi}%` : '—'}</div>
          <span class="stat-card-subtitle">Derived Glucose Management Indicator</span>
        </div>
      </div>

      <div class="more-stats">
        <div class="profile-item">
          <span class="profile-label">Highest Glucose</span>
          <span class="profile-value" style="color: #f56565;">${stats.highest ? `${stats.highest} mg/dL` : '—'}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">Lowest Glucose</span>
          <span class="profile-value" style="color: #ecc94b;">${stats.lowest ? `${stats.lowest} mg/dL` : '—'}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">High Readings (>180)</span>
          <span class="profile-value">${insights.highPercent !== undefined ? `${insights.highPercent}%` : '—'}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">Low Readings (<70)</span>
          <span class="profile-value">${insights.lowPercent !== undefined ? `${insights.lowPercent}%` : '—'}</span>
        </div>
      </div>

      <div class="section-title">Chronological Logbook Records (${totalLogsCount} total entries)</div>
      ${totalLogsCount > 0 ? `
        <table class="log-table">
          <thead>
            <tr>
              <th style="width: 15%;">Date & Time</th>
              <th style="width: 15%;">Log Type</th>
              <th style="width: 25%;">Value / Amount</th>
              <th style="width: 45%;">Details / Context</th>
            </tr>
          </thead>
          <tbody>
            ${allLogs.map(log => `
              <tr>
                <td style="font-weight: 500;">
                  ${new Date(log.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br/>
                  <span style="color: #718096; font-size: 10px;">
                    ${new Date(log.loggedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </td>
                <td>
                  <span class="badge ${log.colorClass}">${log.logType}</span>
                </td>
                <td style="font-weight: 700; color: #2d3748;">
                  ${log.displayValue}
                </td>
                <td style="color: #4a5568;">
                  ${log.details}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <p style="font-size: 13px; color: #718096; font-style: italic; margin-top: 10px; margin-bottom: 30px;">
          No metrics or logs have been recorded in the past 7 days.
        </p>
      `}

      <footer>
        <span>Confidential Medical Information — Authorized personnel only.</span>
        <span>iT1DXpert Clinical Platform</span>
      </footer>

      <script>
        // Trigger browser print dialog after loading styles and structure
        window.onload = () => {
          setTimeout(() => {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(reportHtml);
  printWindow.document.close();
}
