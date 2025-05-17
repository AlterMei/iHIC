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
        console.log('Current directory:', __dirname);
        console.log('Directory contents:', fs.readdirSync(__dirname));
        
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }

        // Copy index.html to public directory
        if (fs.existsSync(CONFIG.indexFile)) {
            fs.copyFileSync(CONFIG.indexFile, path.join(CONFIG.outputDir, 'index.html'));
            console.log('Copied index.html to public directory');
        }

        const items = await readCsvFile(CONFIG.inputCsv);
        
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
            : 'Not Applicable'
    };
}

function generateItemHtml(item) {
    const hasCertificate = item.certificate && item.certificate !== '#' && item.certificate !== 'N/A';
    const certExpiry = hasCertificate ? item.certExpiry : 'Not Applicable';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>i-HIC - ${escapeHtml(item.name)} Details</title>
    <style>
        * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
        }
        body { 
            padding: 20px; 
            background-color: #f5f5f5; 
            font-family: Arial, sans-serif; 
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0066cc;
            margin-bottom: 20px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        .info-item {
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        .info-value {
            margin-top: 5px;
        }
        .valid {
            color: green;
        }
        .expired {
            color: red;
        }
        .na-value {
            color: #777;
            font-style: italic;
        }
        .action-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        .quantity-input {
            padding: 8px;
            width: 100px;
            margin-right: 10px;
        }
        .request-btn {
            padding: 8px 15px;
            background-color: #0066cc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .request-btn:hover {
            background-color: #0055aa;
        }
        .document-link {
            color: #0066cc;
            text-decoration: none;
        }
        .document-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${escapeHtml(item.name)} Details</h1>
        
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Item ID:</div>
                <div class="info-value">${escapeHtml(item.id)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Category:</div>
                <div class="info-value">${escapeHtml(item.category)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Batch/GRIS No.:</div>
                <div class="info-value">${escapeHtml(item.batch)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Brand:</div>
                <div class="info-value">${escapeHtml(item.brand)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Supplier:</div>
                <div class="info-value">${escapeHtml(item.supplier)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Purchased Date:</div>
                <div class="info-value">${escapeHtml(item.purchaseDate)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Item Expiry Date:</div>
                <div class="info-value" id="itemExpiryDate">${escapeHtml(item.expiry)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Stock Available:</div>
                <div class="info-value">${escapeHtml(item.stock)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Invoice:</div>
                <div class="info-value">
                    <a href="${escapeHtml(item.invoice)}" class="document-link" target="_blank">View Invoice</a>
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Halal Certificate:</div>
                <div class="info-value">
                    ${hasCertificate ? 
                        `<a href="${escapeHtml(item.certificate)}" class="document-link" target="_blank">View Certificate</a>` : 
                        'Not Available'}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Certificate Expiry:</div>
                <div class="info-value" id="certExpiryDate">${escapeHtml(certExpiry)}</div>
            </div>
        </div>
        
        <div class="action-section">
            <h3>Request Item</h3>
            <div>
                <input type="number" class="quantity-input" placeholder="Quantity" min="1">
                <button class="request-btn" onclick="sendRequest('${escapeJsString(item.name)}')">Request</button>
            </div>
        </div>
    </div>

    <script>
        function sendRequest(itemName) {
            const quantityInput = document.querySelector('.quantity-input');
            const quantity = quantityInput.value;
            
            if (!quantity) {
                alert('Please enter a quantity');
                return;
            }
            
            const subject = 'Stock Request - ' + itemName;
            const body = 'Hi. I want to request for ' + itemName + ' with a quantity of ' + quantity + '. Thank you.';
            
            window.location.href = 'mailto:mygml021@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
            quantityInput.value = '';
        }

        function calculateDaysRemaining(expiryDate, elementId, itemName, batchNumber) {
            if (!expiryDate || expiryDate.trim() === 'No info provided' || expiryDate.trim() === 'Not Applicable') {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = expiryDate;
                    element.classList.add('na-value');
                }
                return;
            }
            
            try {
                const parts = expiryDate.split('/');
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                const expiry = new Date(year, month, day);
                
                if (isNaN(expiry.getTime())) {
                    console.error('Invalid date:', expiryDate);
                    return;
                }
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const timeDiff = expiry.getTime() - today.getTime();
                const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                
                const element = document.getElementById(elementId);
                if (element) {
                    if (daysRemaining < 1) {
                        element.textContent = expiryDate + ' (Expired)';
                        element.classList.remove('valid');
                        element.classList.add('expired');
                    } else {
                        element.textContent = expiryDate + ' (Expires in ' + daysRemaining + ' days)';
                        if (daysRemaining < 15) {
                            element.classList.remove('valid');
                            element.classList.add('expired');
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

        window.onload = function() {
            const itemName = '${escapeJsString(item.name)}';
            const batchNumber = '${escapeJsString(item.batch)}';
            
            const itemExpiryElement = document.getElementById('itemExpiryDate');
            const itemExpiryDate = itemExpiryElement ? itemExpiryElement.textContent.trim() : 'No info provided';
            calculateDaysRemaining(itemExpiryDate, 'itemExpiryDate', itemName, batchNumber);
            
            const certExpiryElement = document.getElementById('certExpiryDate');
            const certExpiryDate = certExpiryElement ? certExpiryElement.textContent.trim() : 'Not Applicable';
            if (certExpiryDate !== 'Not Applicable') {
                calculateDaysRemaining(certExpiryDate, 'certExpiryDate', itemName, batchNumber);
            }
        };
    </script>
</body>
</html>`;
}

function formatDate(dateString) {
    if (!dateString || dateString.trim() === '' || dateString.trim().toLowerCase() === 'na') {
        return 'No info provided';
    }
    
    try {
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3 && parts[2].length === 4) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                
                if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year > 2000) {
                    const date = new Date(year, month, day);
                    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
                        const formattedDay = day.toString().padStart(2, '0');
                        const formattedMonth = (month + 1).toString().padStart(2, '0');
                        return `${formattedDay}/${formattedMonth}/${year}`;
                    }
                }
            }
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
        return `https://${url}`;
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

generateHtmlFiles().catch(error => {
    console.error('Generation failed:', error);
    process.exit(1);
});