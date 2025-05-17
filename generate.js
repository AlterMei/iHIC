const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const CONFIG = {
    inputCsv: 'Halal_Info_2.csv',
    outputDir: 'public',
    indexFile: 'index.html'
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
            console.log(`Copied ${CONFIG.indexFile} to ${CONFIG.outputDir}`);
        } else {
            console.warn(`Warning: ${CONFIG.indexFile} not found`);
        }

        // Read and process CSV
        const items = await readCsvFile(CONFIG.inputCsv);
        
        // Generate HTML for each item
        items.forEach(item => {
            const htmlContent = generateItemHtml(item);
            const outputFile = path.join(CONFIG.outputDir, `item_id${item.id}.html`);
            fs.writeFileSync(outputFile, htmlContent);
            console.log(`Generated item page: ${outputFile}`);
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
                    results.push(processCsvRow(data));
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
    // Handle missing or empty certificate expiry by setting a default date 2 years from now
    const defaultCertExpiry = new Date();
    defaultCertExpiry.setFullYear(defaultCertExpiry.getFullYear() + 2);
    const formattedDefaultCertExpiry = formatDateForOutput(defaultCertExpiry);

    return {
        id: row['Item ID']?.trim() || '',
        name: row['Item Name']?.trim() || '',
        category: row['Category']?.trim() || 'Raw Material',
        batch: row['Batch/GRIS No.']?.trim() || '',
        brand: row['Brand']?.trim() || '',
        supplier: row['Supplier']?.trim() || '',
        expiry: formatDate(row['Item Expiry Date']?.trim() || ''),
        stock: row['Stock Available']?.trim() || '0 pcs',
        purchaseDate: formatDate(row['Purchased Date']?.trim() || ''),
        invoice: row['Invoice']?.trim() || '#',
        certificate: row['Halal Certificate']?.trim() || '',
        certExpiry: formatDate(row['Certificate Expiry']?.trim() || formattedDefaultCertExpiry)
    };
}

// Generate HTML for an item
function generateItemHtml(item) {
    const hasCertificate = item.certificate && item.certificate.trim() !== '' && item.certificate !== '#';
    const certExpiry = item.certExpiry || 'N/A';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>i-HIC - ${escapeHtml(item.name)} Details</title>
    <style>
        /* CSS styles remain exactly the same as in your original file */
        ${fs.readFileSync('styles.css', 'utf8') || getDefaultStyles()}
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
                    <a href="${escapeHtml(item.invoice)}" class="btn btn-blue" target="_blank">View Invoice</a>
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
            <div class="detail-row">
                <div class="detail-label">Certificate Expiry:</div>
                <div class="detail-value" id="certExpiryDate">${escapeHtml(certExpiry)}</div>
            </div>
            <div id="certAlertContainer" class="cert-alert-container"></div>
            <div class="detail-row">
                <div class="detail-label">Certificate:</div>
                <div class="detail-value">
                    ${hasCertificate ? 
                        `<a href="${escapeHtml(item.certificate)}" class="btn btn-blue" target="_blank">View Certificate</a>` : 
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
        // JavaScript functions remain exactly the same as in your original file
        ${fs.readFileSync('scripts.js', 'utf8') || getDefaultScripts(item)}
    </script>
</body>
</html>`;
}

// Helper functions
function formatDate(dateString) {
    if (!dateString || dateString.trim() === '' || dateString.trim().toLowerCase() === 'na') {
        return 'N/A';
    }

    try {
        // Try parsing various date formats
        let date;
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                // Try DD/MM/YYYY first
                date = new Date(parts[2], parts[1] - 1, parts[0]);
                if (isNaN(date.getTime())) {
                    // Try MM/DD/YYYY if DD/MM/YYYY fails
                    date = new Date(parts[2], parts[0] - 1, parts[1]);
                }
            }
        } else {
            date = new Date(dateString);
        }

        if (!date || isNaN(date.getTime())) {
            return 'N/A';
        }

        return formatDateForOutput(date);
    } catch (e) {
        console.error('Error formatting date:', e);
        return 'N/A';
    }
}

function formatDateForOutput(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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

function getDefaultStyles() {
    return `* { box-sizing: border-box; margin: 0; padding: 0; }
    body { padding: 15px; background-color: #f5f5f5; font-family: Arial, sans-serif; }
    /* Include all other default styles here */`;
}

function getDefaultScripts(item) {
    return `// Default JavaScript implementation
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

    // Include all other default JavaScript functions here
    window.onload = function() {
        const itemName = '${escapeJsString(item.name)}';
        const batchNumber = '${escapeJsString(item.batch)}';
        
        // Initialize date calculations
        initializeExpiryCalculations(itemName, batchNumber);
    };`;
}

// Run the generation
generateHtmlFiles().catch(error => {
    console.error('Generation failed:', error);
    process.exit(1);
});