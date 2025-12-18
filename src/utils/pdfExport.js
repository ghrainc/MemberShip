export const generateApplicationPDF = (application) => {
  const { storeName, submittedDate, id, fullData = {} } = application
  const data = fullData

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>GHRA Membership Application - ${storeName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          color: #2c3e50;
          line-height: 1.6;
          background: white;
          padding: 40px;
        }
        
        .pdf-container {
          max-width: 850px;
          margin: 0 auto;
        }
        
        .pdf-header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #667eea;
          padding-bottom: 20px;
        }
        
        .pdf-logo {
          max-width: 80px;
          height: auto;
          margin-bottom: 15px;
        }
        
        .pdf-header h1 {
          font-size: 28px;
          margin-bottom: 5px;
          color: #2c3e50;
        }
        
        .pdf-header p {
          font-size: 13px;
          color: #7f8c8d;
          margin-bottom: 10px;
        }
        
        .submission-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .submission-info div {
          flex: 1;
          min-width: 150px;
        }
        
        .submission-info strong {
          display: block;
          color: #667eea;
          margin-bottom: 3px;
        }
        
        .section {
          margin: 30px 0;
          page-break-inside: avoid;
        }
        
        .section-number {
          display: inline-block;
          background: #667eea;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          text-align: center;
          line-height: 28px;
          font-weight: 600;
          font-size: 12px;
          margin-right: 8px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 15px;
          border-bottom: 2px solid #e0e6ed;
          padding-bottom: 10px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 15px;
        }
        
        .info-grid.full {
          grid-template-columns: 1fr;
        }
        
        .info-grid.three {
          grid-template-columns: 1fr 1fr 1fr;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 11px;
          font-weight: 600;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .info-value {
          font-size: 13px;
          color: #2c3e50;
          word-break: break-word;
        }
        
        .category-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 5px;
        }
        
        .tag {
          background: #e8eef5;
          color: #667eea;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .owner-block {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          border-left: 3px solid #667eea;
        }
        
        .owner-block h4 {
          font-size: 12px;
          margin-bottom: 8px;
          color: #2c3e50;
        }
        
        .reference-block {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        
        .reference-block h4 {
          font-size: 12px;
          margin-bottom: 8px;
          color: #2c3e50;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #e0e6ed;
          font-size: 12px;
        }
        
        th {
          background: #667eea;
          color: white;
          font-weight: 600;
        }
        
        tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e6ed;
          font-size: 11px;
          color: #7f8c8d;
          text-align: center;
        }
        
        @media print {
          body {
            padding: 0;
          }
          .pdf-container {
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <div class="pdf-header">
          <h1>GHRA Membership Application</h1>
          <p>Greater Houston Retailers Cooperative Association, Inc.</p>
          <div class="submission-info">
            <div>
              <strong>Store Name:</strong>
              ${storeName}
            </div>
            <div>
              <strong>Application ID:</strong>
              ${id}
            </div>
            <div>
              <strong>Submitted:</strong>
              ${formatDate(submittedDate)}
            </div>
          </div>
        </div>

        <!-- Section 1: Qualifying Business -->
        <div class="section">
          <div class="section-title"><span class="section-number">1</span>Qualifying Business Information</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Hard Liquor Sales</span>
              <span class="info-value">${data.hardLiquor === 'yes' ? 'Yes' : 'No'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Age Requirement</span>
              <span class="info-value">${data.ageRequirement === 'yes' ? 'Yes' : 'No'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Closed Sunday After 9pm</span>
              <span class="info-value">${data.closedSundayAfter9pm === 'yes' ? 'Yes' : 'No'}</span>
            </div>
          </div>
          ${data.storeProductCategories && data.storeProductCategories.length > 0 ? `
            <div class="info-item">
              <span class="info-label">Product Categories</span>
              <div class="category-tags">
                ${data.storeProductCategories.map(cat => `<span class="tag">${cat}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Section 2: Business Information -->
        <div class="section">
          <div class="section-title"><span class="section-number">2</span>Business Information</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Member Name</span>
              <span class="info-value">${data.memberName || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">DBA/Assumed Name</span>
              <span class="info-value">${data.dbaName || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">EIN</span>
              <span class="info-value">${data.ein || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Sales Tax ID</span>
              <span class="info-value">${data.salesTaxId || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Ownership Type</span>
              <span class="info-value">${data.ownershipType || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Business Type</span>
              <span class="info-value">${data.businessType || '-'}</span>
            </div>
          </div>
        </div>

        <!-- Section 3: Store Information -->
        <div class="section">
          <div class="section-title"><span class="section-number">3</span>Store Information</div>
          <div class="info-grid full">
            <div class="info-item">
              <span class="info-label">Store Address</span>
              <span class="info-value">${data.storeAddress || '-'}</span>
            </div>
          </div>
          <div class="info-grid three">
            <div class="info-item">
              <span class="info-label">City</span>
              <span class="info-value">${data.storeCity || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">State</span>
              <span class="info-value">TX</span>
            </div>
            <div class="info-item">
              <span class="info-label">Zip Code</span>
              <span class="info-value">${data.storeZip || '-'}</span>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Store Phone</span>
              <span class="info-value">${data.storePhone || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email Address</span>
              <span class="info-value">${data.emailAddress || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Store Size (sq ft)</span>
              <span class="info-value">${data.storeSize || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Business Property</span>
              <span class="info-value">${data.businessProperty || '-'}</span>
            </div>
          </div>
        </div>

        <!-- Section 4: Owners & Management -->
        <div class="section">
          <div class="section-title"><span class="section-number">4</span>Owners & Management</div>
          ${data.owners && data.owners.length > 0 ? `
            <div class="info-item">
              <span class="info-label">Owners/Partners</span>
            </div>
            ${data.owners.map((owner, idx) => `
              <div class="owner-block">
                <h4>Owner ${idx + 1}</h4>
                <div class="info-grid three">
                  <div class="info-item">
                    <span class="info-label">First Name</span>
                    <span class="info-value">${owner.firstName || '-'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Middle Initial</span>
                    <span class="info-value">${owner.middleInitial || '-'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Last Name</span>
                    <span class="info-value">${owner.lastName || '-'}</span>
                  </div>
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Title</span>
                    <span class="info-value">${owner.title || '-'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Ownership %</span>
                    <span class="info-value">${owner.ownershipPercent || '-'}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          ` : ''}
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Authorized Representative</span>
              <span class="info-value">${data.authorizedRepName || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Title</span>
              <span class="info-value">${data.authorizedRepTitle || '-'}</span>
            </div>
          </div>
        </div>

        <!-- Section 5: References -->
        <div class="section">
          <div class="section-title"><span class="section-number">5</span>References</div>
          <div class="reference-block">
            <h4>Reference 1</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Company Name</span>
                <span class="info-value">${data.reference1Company || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">GHRA Membership #</span>
                <span class="info-value">${data.reference1GhraNumber || '-'}</span>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${data.reference1Email || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Representative Name</span>
                <span class="info-value">${data.reference1RepName || '-'}</span>
              </div>
            </div>
          </div>
          <div class="reference-block">
            <h4>Reference 2</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Company Name</span>
                <span class="info-value">${data.reference2Company || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">GHRA Membership #</span>
                <span class="info-value">${data.reference2GhraNumber || '-'}</span>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${data.reference2Email || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Representative Name</span>
                <span class="info-value">${data.reference2RepName || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 6: Financial Information -->
        <div class="section">
          <div class="section-title"><span class="section-number">6</span>Financial Information</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Bank Name</span>
              <span class="info-value">${data.bankName || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Bank Address</span>
              <span class="info-value">${data.bankAddress || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Bank City</span>
              <span class="info-value">${data.bankCity || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Transit/ABA Number</span>
              <span class="info-value">${data.transitAbaNumber || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Account Number</span>
              <span class="info-value">${data.accountNumber || '-'}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>This is an official GHRA Membership Application record.</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <p>&copy; 2024 Greater Houston Retailers Cooperative Association. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  // Create a blob and open in new window for printing
  const blob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  const printWindow = window.open(url, '_blank')

  if (printWindow) {
    // Use timeout to ensure content is loaded before printing
    setTimeout(() => {
      try {
        printWindow.print()
      } catch (error) {
        console.error('Error printing PDF:', error)
      }
    }, 500)
  } else {
    // Fallback if popup is blocked - download as file instead
    const link = document.createElement('a')
    link.href = url
    link.download = `GHRA_Application_${storeName.replace(/\s+/g, '_')}_${id}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
