const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const CONFIG = {
    inputCsv: path.join(__dirname, 'Halal_Info_2.csv'),
    outputDir: path.join(__dirname, 'public'),
    indexFile: path.join(__dirname, 'index.html'),
    stylesFile: path.join(__dirname, 'styles.css'),
    scriptsFile: path.join(__dirname, 'scripts.js')
};

// Main generation function
async function generateHtmlFiles() {
    try {
        console.log('Starting HTML generation...');
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }

        // Read and process CSV
        const items = await readCsvFile(CONFIG.inputCsv);
        
        // Generate HTML for each item
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

// Read CSV file
function readCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        
        if (!fs.existsSync(filePath)) {
            reject(new Error(`CSV file not found: ${filePath}`));
            return;
        }

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                try {
                    const processed = processCsvRow(data);
                    if (processed) results.push(processed);
                } catch (error) {
                    console.error('Error processing CSV row:', error);
                }
            })
            .on('end', () => {
                console.log(`Processed ${results.length} items from CSV`);
                resolve(results);
            })
            .on('error', reject);
    });
}

// Process CSV row data
function processCsvRow(row) {
    try {
        // Set default certificate expiry to 2 years from now if not provided
        const defaultCertExpiry = new Date();
        defaultCertExpiry.setFullYear(defaultCertExpiry.getFullYear() + 2);
        
        return {
            id: row['Item ID']?.trim() || '0',
            name: row['Item Name']?.trim() || 'Unnamed Item',
            category: row['Category']?.trim() || 'Raw Material',
            batch: row['Batch/GRIS No.']?.trim() || 'N/A',
            brand: row['Brand']?.trim() || 'N/A',
            supplier: row['Supplier']?.trim() || 'N/A',
            expiry: formatDate(row['Item Expiry Date']?.trim()),
            stock: row['Stock Available']?.trim() || '0 pcs',
            purchaseDate: formatDate(row['Purchased Date']?.trim()),
            invoice: validateUrl(row['Invoice']?.trim()),
            certificate: validateUrl(row['Halal Certificate']?.trim()),
            certExpiry: formatDate(row['Certificate Expiry']?.trim()) || formatDate(defaultCertExpiry)
        };
    } catch (error) {
        console.error('Error processing row:', row, error);
        return null;
    }
}

// Generate HTML for an item
function generateItemHtml(item) {
    if (!item) return '';
    
    const hasCertificate = item.certificate && item.certificate !== '#' && item.certificate !== 'N/A';
    const certExpiry = item.certExpiry || 'N/A';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>i-HIC - ${escapeHtml(item.name)} Details</title>
    <style>
        ${getFileContent(CONFIG.stylesFile, getDefaultStyles())}
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
            ${generateDetailRow('Item ID:', item.id)}
            ${generateDetailRow('Category:', item.category)}
            ${generateDetailRow('Batch/GRIS No.:', item.batch)}
            ${generateDetailRow('Brand:', item.brand)}
            ${generateDetailRow('Supplier:', item.supplier)}
            ${generateDetailRow('Item Expiry Date:', item.expiry, 'itemExpiryDate')}
            <div id="expiryAlertContainer" class="expiry-alert-container"></div>
            ${generateDetailRow('Stock Available:', item.stock)}
        </div>
        
        <!-- Purchase Info Card -->
        <div class="info-card">
            <div class="card-title">Purchase Info</div>
            ${generateDetailRow('Purchased Date:', item.purchaseDate)}
            <div class="detail-row">
                <div class="detail-label">Invoice:</div>
                <div class="detail-value">
                    <a href="${escapeHtml(item.invoice)}" class="btn btn-blue" target="_blank" rel="noopener noreferrer">View Invoice</a>
                </div>
            </div>
        </div>
        
        <!-- Halal Info Card -->
        <div class="info-card">
            <div class="card-title">Halal Info</div>
            <div class="detail-row">
                <div class="detail-label">Halal Certificate:</div>
                <div class="detail-value ${hasCertificate ? 'cert-available' : 'cert-not-available'}">
                    ${hasCertificate ? 'Available' : 'Not Available'}
                </div>
            </div>
            ${generateDetailRow('Certificate Expiry:', certExpiry, 'certExpiryDate')}
            <div id="certAlertContainer" class="cert-alert-container"></div>
            <div class="detail-row">
                <div class="detail-label">Certificate:</div>
                <div class="detail-value">
                    ${hasCertificate ? 
                        `<a href="${escapeHtml(item.certificate)}" class="btn btn-blue" target="_blank" rel="noopener noreferrer">View Certificate</a>` : 
                        '<span class="cert-not-available">Not Applicable</span>'}
                </div>
            </div>
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
        ${getFileContent(CONFIG.scriptsFile, getDefaultScripts(item))}
    </script>
</body>
</html>`;
}

// Helper functions
function generateDetailRow(label, value, id = '') {
    return `<div class="detail-row">
        <div class="detail-label">${escapeHtml(label)}</div>
        <div class="detail-value" ${id ? `id="${id}"` : ''}>${escapeHtml(value)}</div>
    </div>`;
}

function formatDate(dateInput) {
    if (!dateInput) return 'N/A';
    
    try {
        // If already formatted, return as-is
        if (typeof dateInput === 'string' && dateInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            return dateInput;
        }

        let date;
        if (typeof dateInput === 'string') {
            const parts = dateInput.split(/[\/-]/);
            if (parts.length === 3) {
                // Try DD/MM/YYYY first
                date = new Date(parts[2], parts[1] - 1, parts[0]);
                if (isNaN(date.getTime())) {
                    // Try MM/DD/YYYY if DD/MM/YYYY fails
                    date = new Date(parts[2], parts[0] - 1, parts[1]);
                }
            } else {
                date = new Date(dateInput);
            }
        } else if (dateInput instanceof Date) {
            date = dateInput;
        }

        if (!date || isNaN(date.getTime())) return 'N/A';

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        console.error('Error formatting date:', dateInput, e);
        return 'N/A';
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

function getFileContent(filePath, defaultValue = '') {
    try {
        return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : defaultValue;
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return defaultValue;
    }
}

function getDefaultStyles() {
    return `* { box-sizing: border-box; margin: 0; padding: 0; }
    body { padding: 15px; background-color: #f5f5f5; font-family: Arial, sans-serif; }
    .container { max-width: 100%; margin: 0 auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    /* Include all other default styles here */`;
}

function getDefaultScripts(item) {
    return `function sendRequest(itemName) {
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

    window.onload = function() {
        const itemName = '${escapeJsString(item.name)}';
        const batchNumber = '${escapeJsString(item.batch)}';
        
        // Initialize your scripts here
    };`;
}

// Run the generation
generateHtmlFiles().catch(error => {
    console.error('Generation failed:', error);
    process.exit(1);
});