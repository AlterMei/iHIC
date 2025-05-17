const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const CONFIG = {
    inputCsv: path.join(__dirname, 'Halal_Info_2.csv'),
    outputDir: path.join(__dirname, 'public'),
    indexFile: path.join(__dirname, 'index.html')
};

// Main generation function
async function generateHtmlFiles() {
    try {
        console.log('Starting HTML generation...');
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }

        // Copy index.html to public directory
        if (fs.existsSync(CONFIG.indexFile)) {
            fs.copyFileSync(CONFIG.indexFile, path.join(CONFIG.outputDir, 'index.html'));
            console.log('Copied index.html to public directory');
        }

        // Read and process CSV file
        const items = await readCsvFile(CONFIG.inputCsv);
        
        // Generate HTML files for each item
        items.forEach(item => {
            const htmlContent = generateItemHtml(item);
            const outputFile = path.join(CONFIG.outputDir, `item_id${item.id}.html`);
            fs.writeFileSync(outputFile, htmlContent);
        });

        console.log(`Successfully generated ${items.length} item pages`);
        
    } catch (error) {
        console.error('Error during generation:', error);
        process.exit(1);
    }
}

// Read CSV file and process rows
function readCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        
        if (!fs.existsSync(filePath)) {
            console.error('Directory contents:', fs.readdirSync(path.dirname(filePath)));
            reject(new Error(`CSV file not found: ${filePath}`));
            return;
        }

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                try {
                    results.push(processCsvRow(data));
                } catch (error) {
                    console.error('Error processing CSV row:', error);
                }
            })
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// Process individual CSV row
function processCsvRow(row) {
    const hasCertificate = row['Halal Certificate'] && 
                         row['Halal Certificate'].trim() !== '' && 
                         row['Halal Certificate'].trim() !== 'N/A';
    
    return {
        id: row['Item ID']?.trim() || '',
        name: row['Item Name']?.trim() || '',
        category: row['Category']?.trim() || 'Raw Material',
        batch: row['Batch/GRIS No.']?.trim() || '',
        brand: row['Brand']?.trim() || '',
        supplier: row['Supplier']?.trim() || '',
        expiry: formatDate(row['Item Expiry Date']?.trim()),
        stock: row['Stock Available']?.trim() || '0 pcs',
        purchaseDate: formatDate(row['Purchased Date']?.trim()),
        invoice: validateUrl(row['Invoice']?.trim()),
        certificate: validateUrl(row['Halal Certificate']?.trim()),
        certExpiry: hasCertificate 
            ? formatDate(row['Certificate Expiry']?.trim())
            : 'Not Applicable',
        certStatus: hasCertificate ? 'Available' : 'Not Available'
    };
}

// Generate HTML for individual item
function generateItemHtml(item) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>i-HIC - ${escapeHtml(item.name)} Details</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { padding: 15px; background-color: #f5f5f5; font-family: Arial, sans-serif; }
        .container { max-width: 100%; margin: 0 auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header-container { text-align: center; margin-bottom: 20px; }
        .header-main { 
            font-family: "Century Gothic", CenturyGothic, AppleGothic, sans-serif; 
            color: #0066cc; font-size: 24px; font-weight: 800;
            letter-spacing: 0.5px; margin-bottom: 5px;
        }
        .header-sub { 
            font-family: "Century Gothic", CenturyGothic, AppleGothic, sans-serif; 
            color: #0066cc; font-size: 20px; font-weight: 800;
            letter-spacing: 1px;
        }
        .item-name { 
            font-size: 22px; font-weight: bold; text-align: center; 
            margin-bottom: 25px; color: #333;
            padding-bottom: 10px; border-bottom: 2px solid #0066cc;
        }
        .info-card {
            background: white; border-radius: 8px; padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;
            margin-bottom: 20px;
        }
        .card-title {
            font-weight: bold; color: #0066cc; margin-bottom: 15px;
            font-size: 18px; padding-bottom: 5px; border-bottom: 1px solid #e0e0e0;
        }
        .detail-row { 
            display: flex; margin-bottom: 10px; align-items: center;
            padding-bottom: 10px; border-bottom: 1px solid #f0f0f0;
        }
        .detail-row:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
        .detail-label { 
            font-weight: bold; width: 50%; color: #555; 
            font-size: 16px; padding-right: 5px;
        }
        .detail-value { 
            width: 50%; word-break: break-word;
            font-size: 16px; text-align: left; padding-left: 5px;
        }
        .cert-available { color: #27ae60; font-weight: bold; }
        .cert-not-available { color: #e74c3c; font-weight: bold; }
        .expired { color: #e74c3c; font-weight: bold; }
        .valid { color: #27ae60; font-weight: bold; }
        .btn { 
            display: inline-block; padding: 10px 12px; color: white; 
            text-decoration: none; border-radius: 5px; text-align: center; 
            font-size: 15px; border: none; cursor: pointer; 
            width: 100%; margin-top: 8px;
        }
        .btn:hover { opacity: 0.9; }
        .btn-blue { background-color: #3498db; }
        .btn-green { background-color: #2ecc71; }
        .btn-purple { background-color: #9b59b6; }
        .btn-red { background-color: #e74c3c; margin: 15px 0 20px 0; }
        .stock-request-box { 
            background-color: #f8f9fa; padding: 15px; border-radius: 8px; 
            margin-top: 20px; border: 1px solid #e0e0e0; text-align: left;
        }
        .quantity-input { 
            width: 100%; padding: 12px; margin: 10px 0; 
            border: 1px solid #ddd; border-radius: 5px; 
            font-size: 16px; text-align: left;
        }
        .quantity-label { 
            display: block; margin: 10px 0 5px; font-weight: bold; 
            color: #333; font-size: 16px; text-align: left;
        }
        .back-btn { 
            display: block; text-align: center; margin-top: 20px; 
            color: #3498db; text-decoration: none; 
            font-weight: bold; font-size: 16px;
        }
        .expiry-alert-container, .cert-alert-container { margin: 10px 0 5px 0; }
        .na-value { color: #7f8c8d; font-style: italic; }
        
        @media (min-width: 600px) { 
            .container { max-width: 600px; } 
            .header-main { font-size: 26px; }
            .header-sub { font-size: 22px; }
            .item-name { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-container">
            <div class="header-main">INSTANT HALAL & INVENTORY CHECKER</div>
            <div class="header-sub">(i-HIC)</div>
        </div>
        <div class="item-name">${escapeHtml(item.name)}</div>
        
        <!-- Product Info Card -->
        <div class="info-card">
            <div class="card-title">Product Info</div>
            <div class="detail-row">
                <div class="detail-label">Item ID:</div>
                <div class="detail-value">${escapeHtml(item.id)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Category:</div>
                <div class="detail-value">${escapeHtml(item.category)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Batch/GRIS No.:</div>
                <div class="detail-value">${escapeHtml(item.batch)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Brand:</div>
                <div class="detail-value">${escapeHtml(item.brand)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Supplier:</div>
                <div class="detail-value">${escapeHtml(item.supplier)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Item Expiry Date:</div>
                <div class="detail-value" id="itemExpiryDate">${escapeHtml(item.expiry)}</div>
            </div>
            <div id="expiryAlertContainer" class="expiry-alert-container"></div>
            <div class="detail-row">
                <div class="detail-label">Stock Available:</div>
                <div class="detail-value">${escapeHtml(item.stock)}</div>
            </div>
        </div>
        
        <!-- Purchase Info Card -->
        <div class="info-card">
            <div class="card-title">Purchase Info</div>
            <div class="detail-row">
                <div class="detail-label">Purchased Date:</div>
                <div class="detail-value">${escapeHtml(item.purchaseDate)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Invoice:</div>
                <div class="detail-value">
                    <a href="${escapeHtml(item.invoice)}" class="btn btn-blue">View Invoice</a>
                </div>
            </div>
        </div>
        
        <!-- Halal Info Card -->
        <div class="info-card">
            <div class="card-title">Halal Info</div>
            <div class="detail-row">
                <div class="detail-label">Halal Certificate:</div>
                <div class="detail-value ${item.certStatus === 'Available' ? 'cert-available' : 'cert-not-available'}">
                    ${escapeHtml(item.certStatus)}
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Certificate Expiry:</div>
                <div class="detail-value" id="certExpiryDate">${escapeHtml(item.certExpiry)}</div>
            </div>
            <div id="certAlertContainer" class="cert-alert-container"></div>
            ${item.certificate && item.certificate !== '#' ? `
            <div class="detail-row" style="margin-top: 5px;">
                <div class="detail-label">Certificate:</div>
                <div class="detail-value">
                    <a href="${escapeHtml(item.certificate)}" class="btn btn-blue">View Certificate</a>
                </div>
            </div>` : ''}
        </div>
        
        <div class="stock-request-box">
            <button class="btn btn-purple">Stock Request</button>
            <label class="quantity-label">Quantity:</label>
            <input type="text" class="quantity-input" placeholder="Enter quantity">
            <button class="btn btn-green" onclick="sendRequest('${escapeJsString(item.name)}')">Send Request</button>
        </div>
        
        <a href="index.html" class="back-btn">← Back</a>
    </div>

    <script>
        // Email functions
        function sendRequest(itemName) {
            const quantityInput = document.querySelector('.quantity-input');
            const quantity = quantityInput.value;
            
            if (!quantity) {
                alert('Please enter a quantity');
                return;
            }
            
            const subject = \`Stock Request - \${itemName}\`;
            const body = \`Hi. I want to request for \${itemName} with a quantity of \${quantity}. Thank you.\`;
            
            window.location.href = \`mailto:mygml021@gmail.com?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}\`;
            quantityInput.value = '';
        }

        function sendItemExpiryAlert(itemName, batchNumber, isExpired) {
            const subject = \`High Important : \${itemName} is \${isExpired ? 'Expired' : 'Nearly Expired'}\`;
            const body = \`Hi. The \${itemName} with Identification Number of \${batchNumber} is \${isExpired ? 'already expired' : 'nearly expired'}. Please do the necessary. Thank you.\`;
            
            window.location.href = \`mailto:mygml021@gmail.com?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}\`;
        }

        function sendCertExpiryAlert(itemName, isExpired) {
            const subject = \`High Important : \${itemName} Halal Certificate is \${isExpired ? 'Expired' : 'Nearly Expired'}\`;
            const body = \`Hi. The \${itemName} Halal certificate is \${isExpired ? 'already expired' : 'nearly expired'}. Please do the necessary. Thank you.\`;
            
            window.location.href = \`mailto:mygml021@gmail.com?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}\`;
        }

        // Alert button creation
        function createItemExpiryAlertButton(itemName, batchNumber, daysRemaining) {
            const container = document.getElementById('expiryAlertContainer');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (daysRemaining < 1) {
                const button = document.createElement('button');
                button.className = 'btn btn-red';
                button.textContent = 'Item Expired. Contact PIC';
                button.onclick = () => sendItemExpiryAlert(itemName, batchNumber, true);
                container.appendChild(button);
            } else if (daysRemaining < 15) {
                const button = document.createElement('button');
                button.className = 'btn btn-red';
                button.textContent = 'Nearly Expired. Contact PIC';
                button.onclick = () => sendItemExpiryAlert(itemName, batchNumber, false);
                container.appendChild(button);
            }
        }

        function createCertExpiryAlertButton(itemName, daysRemaining) {
            const container = document.getElementById('certAlertContainer');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (daysRemaining < 1) {
                const button = document.createElement('button');
                button.className = 'btn btn-red';
                button.textContent = 'Certificate Expired. Contact PIC';
                button.onclick = () => sendCertExpiryAlert(itemName, true);
                container.appendChild(button);
            } else if (daysRemaining < 15) {
                const button = document.createElement('button');
                button.className = 'btn btn-red';
                button.textContent = 'Certificate Nearly Expired. Contact PIC';
                button.onclick = () => sendCertExpiryAlert(itemName, false);
                container.appendChild(button);
            }
        }

        // Date parsing and calculation
        function parseDate(dateString) {
            if (!dateString || dateString === 'No info provided' || dateString === 'Not Applicable') {
                return null;
            }
            
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                
                const date = new Date(year, month, day);
                if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
                    return date;
                }
            }
            return null;
        }

        function calculateDaysRemaining(expiryDate, elementId, itemName, batchNumber) {
            const expiry = parseDate(expiryDate);
            if (!expiry) return;
            
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const timeDiff = expiry.getTime() - today.getTime();
                const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                
                const element = document.getElementById(elementId);
                if (element) {
                    const formattedDate = formatDisplayDate(expiry);
                    
                    if (daysRemaining < 1) {
                        element.textContent = \`\${formattedDate} (Expired)\`;
                        element.classList.remove('valid');
                        element.classList.add('expired');
                        createItemExpiryAlertButton(itemName, batchNumber, daysRemaining);
                    } else {
                        element.textContent = \`\${formattedDate} (Expires in \${daysRemaining} days)\`;
                        if (daysRemaining < 15) {
                            element.classList.remove('valid');
                            element.classList.add('expired');
                            createItemExpiryAlertButton(itemName, batchNumber, daysRemaining);
                        } else {
                            element.classList.remove('expired');
                            element.classList.add('valid');
                        }
                    }
                }
            } catch (e) {
                console.error('Error calculating date:', e);
            }
        }

        function formatDisplayDate(date) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return \`\${day}/\${month}/\${year}\`;
        }

        // Initialize on page load
        window.onload = function() {
            const itemName = '${escapeJsString(item.name)}';
            const batchNumber = '${escapeJsString(item.batch)}';
            
            calculateDaysRemaining(
                document.getElementById('itemExpiryDate').textContent.trim(),
                'itemExpiryDate',
                itemName,
                batchNumber
            );
            
            const certExpiry = document.getElementById('certExpiryDate').textContent.trim();
            if (certExpiry !== 'Not Applicable') {
                calculateDaysRemaining(certExpiry, 'certExpiryDate', itemName, batchNumber);
            }
        };
    </script>
</body>
</html>`;
}

// Utility functions
function formatDate(dateString) {
    if (!dateString || dateString.trim() === '' || dateString.trim().toLowerCase() === 'na') {
        return 'No info provided';
    }
    
    try {
        const cleanedDate = dateString.trim().replace(/\s+/g, '').replace(/-/g, '/');
        const parts = cleanedDate.split('/');
        
        if (parts.length !== 3) return 'No info provided';
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        if (year < 1000 || year > 9999 || month < 0 || month > 11) {
            return 'No info provided';
        }
        
        const date = new Date(year, month, day);
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return \`\${day.toString().padStart(2, '0')}/\${(month + 1).toString().padStart(2, '0')}/\${year}\`;
        }
        
        return 'No info provided';
    } catch (e) {
        console.error('Error formatting date:', dateString, e);
        return 'No info provided';
    }
}

function validateUrl(url) {
    if (!url || url.trim() === '' || url.trim().toLowerCase() === 'na') {
        return '#';
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return \`https://\${url}\`;
    }
    return url;
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeJsString(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

// Start the generation process
generateHtmlFiles().catch(error => {
    console.error('Generation failed:', error);
    process.exit(1);
});