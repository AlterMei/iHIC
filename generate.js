const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const chokidar = require('chokidar');

// Configuration
const CSV_FILE = 'Halal_Info_2.csv';
const OUTPUT_DIR = 'generated';
const EMAIL = 'mygml021@gmail.com';

// Helper Functions
function parseDate(dateString) {
    if (!dateString || dateString === 'NA') return null;
    if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(year, month - 1, day);
    }
    return new Date(dateString);
}

function formatDate(date) {
    if (!date) return 'N/A';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function getExpiryStatus(expiryDate) {
    if (!expiryDate) return { class: 'na-value', text: '', alert: false };

    const today = new Date();
    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysRemaining < 1) {
        return {
            class: 'expired',
            text: '(Expired)',
            alert: true,
            alertText: 'Item Expired. Contact PIC',
            isExpired: true
        };
    } else if (daysRemaining < 15) {
        return {
            class: 'expired',
            text: `(Expires in ${daysRemaining} days)`,
            alert: true,
            alertText: 'Nearly Expired. Contact PIC',
            isExpired: false
        };
    }
    return {
        class: 'valid',
        text: `(Expires in ${daysRemaining} days)`,
        alert: false
    };
}

// HTML Template Generator
function generateHTML(item) {
    const itemExpiryDate = parseDate(item['Item Expiry Date']);
    const certExpiryDate = parseDate(item['Certificate Expiry Date']);
    const itemExpiryStatus = getExpiryStatus(itemExpiryDate);
    const certExpiryStatus = getExpiryStatus(certExpiryDate);

    // Determine Halal Certificate URL
    const halalCertUrl = item['Halal Certificate URL'] || 
                        (item['Halal Certificate'] && item['Halal Certificate'].startsWith('http') ? item['Halal Certificate'] : null);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>i-HIC - ${item['Item Name']} Details</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { padding: 15px; background-color: #f5f5f5; font-family: Arial, sans-serif; }
        .container { max-width: 100%; margin: 0 auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header-container { text-align: center; margin-bottom: 20px; }
        .header-main { font-family: "Century Gothic", sans-serif; color: #0066cc; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 5px; }
        .header-sub { font-family: "Century Gothic", sans-serif; color: #0066cc; font-size: 20px; font-weight: 800; letter-spacing: 1px; }
        .item-name { font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 25px; color: #333; padding-bottom: 10px; border-bottom: 2px solid #0066cc; }
        .info-card { background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; margin-bottom: 20px; }
        .card-title { font-weight: bold; color: #0066cc; margin-bottom: 15px; font-size: 18px; padding-bottom: 5px; border-bottom: 1px solid #e0e0e0; }
        .detail-row { display: flex; margin-bottom: 10px; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; }
        .detail-row:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
        .detail-label { font-weight: bold; width: 50%; color: #555; font-size: 16px; padding-right: 5px; }
        .detail-value { width: 50%; word-break: break-word; font-size: 16px; text-align: left; padding-left: 5px; }
        .cert-available { color: #27ae60; font-weight: bold; }
        .cert-not-available { color: #e74c3c; font-weight: bold; }
        .expired { color: #e74c3c; font-weight: bold; }
        .valid { color: #27ae60; font-weight: bold; }
        .btn { display: inline-block; padding: 10px 12px; color: white; text-decoration: none; border-radius: 5px; text-align: center; font-size: 15px; border: none; cursor: pointer; width: 100%; margin-top: 8px; }
        .btn:hover { opacity: 0.9; }
        .btn-blue { background-color: #3498db; }
        .btn-green { background-color: #2ecc71; }
        .btn-purple { background-color: #9b59b6; }
        .btn-red { background-color: #e74c3c; margin: 15px 0 20px 0; }
        .stock-request-box { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #e0e0e0; text-align: left; }
        .quantity-input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; text-align: left; }
        .quantity-label { display: block; margin: 10px 0 5px; font-weight: bold; color: #333; font-size: 16px; text-align: left; }
        .back-btn { display: block; text-align: center; margin-top: 20px; color: #3498db; text-decoration: none; font-weight: bold; font-size: 16px; }
        .expiry-alert-container { margin: 10px 0 5px 0; }
        .cert-alert-container { margin: 10px 0 5px 0; }
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
        <div class="item-name">${item['Item Name']}</div>
        
        <!-- Product Info Card -->
        <div class="info-card">
            <div class="card-title">Product Info</div>
            <div class="detail-row">
                <div class="detail-label">Item ID:</div>
                <div class="detail-value">${item['Item ID']}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Category:</div>
                <div class="detail-value">${item['Category']}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Batch/GRIS No.:</div>
                <div class="detail-value">${item['Batch/GRIS No.']}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Brand:</div>
                <div class="detail-value">${item['Brand']}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Supplier:</div>
                <div class="detail-value">${item['Supplier']}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Item Expiry Date:</div>
                <div class="detail-value ${itemExpiryStatus.class}" id="itemExpiryDate">
                    ${item['Item Expiry Date'] === 'NA' ? 'N/A' : `${formatDate(itemExpiryDate)} ${itemExpiryStatus.text}`}
                </div>
            </div>
            ${itemExpiryStatus.alert ? `
            <div id="expiryAlertContainer" class="expiry-alert-container">
                <button class="btn btn-red" onclick="sendItemExpiryAlert('${item['Item Name']}', '${item['Batch/GRIS No.']}', ${itemExpiryStatus.isExpired})">
                    ${itemExpiryStatus.alertText}
                </button>
            </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">Stock Available:</div>
                <div class="detail-value">${item['Stock Available']}</div>
            </div>
        </div>
        
        <!-- Purchase Info Card -->
        <div class="info-card">
            <div class="card-title">Purchase Info</div>
            <div class="detail-row">
                <div class="detail-label">Purchased Date:</div>
                <div class="detail-value">${formatDate(parseDate(item['Purchased Date']))}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Invoice:</div>
                <div class="detail-value">
                    <a href="${item['Invoice']}" class="btn btn-blue">View Invoice</a>
                </div>
            </div>
        </div>
        
        <!-- Halal Info Card -->
        <div class="info-card">
            <div class="card-title">Halal Info</div>
            <div class="detail-row">
                <div class="detail-label">Halal Certificate:</div>
                <div class="detail-value ${halalCertUrl ? 'cert-available' : 'cert-not-available'}">
                    ${halalCertUrl ? 'Available' : 'Not Available'}
                </div>
            </div>
            ${halalCertUrl ? `
            <div class="detail-row">
                <div class="detail-label">Certificate Expiry:</div>
                <div class="detail-value ${certExpiryStatus.class}" id="certExpiryDate">
                    ${item['Certificate Expiry Date'] === 'NA' ? 'N/A' : `${formatDate(certExpiryDate)} ${certExpiryStatus.text}`}
                </div>
            </div>
            ${certExpiryStatus.alert ? `
            <div id="certAlertContainer" class="cert-alert-container">
                <button class="btn btn-red" onclick="sendCertExpiryAlert('${item['Item Name']}', ${certExpiryStatus.isExpired})">
                    ${certExpiryStatus.alertText}
                </button>
            </div>
            ` : ''}
            <div class="detail-row" style="margin-top: 5px;">
                <div class="detail-label">Certificate:</div>
                <div class="detail-value">
                    <a href="${halalCertUrl}" class="btn btn-blue">View Certificate</a>
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="stock-request-box">
            <button class="btn btn-purple">Stock Request</button>
            <label class="quantity-label">Quantity:</label>
            <input type="text" class="quantity-input" placeholder="Enter quantity">
            <button class="btn btn-green" onclick="sendRequest('${item['Item Name']}')">Send Request</button>
        </div>
        
        <a href="index.html" class="back-btn">← Back</a>
    </div>

    <script>
        // Email Functions
        function sendRequest(itemName) {
            const quantityInput = document.querySelector('.quantity-input');
            const quantity = quantityInput.value;
            
            if (!quantity) {
                alert('Please enter a quantity');
                return;
            }
            
            const subject = \`Stock Request - \${itemName}\`;
            const body = \`Hi. I want to request for \${itemName} with a quantity of \${quantity}. Thank you.\`;
            
            window.location.href = \`mailto:${EMAIL}?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}\`;
            quantityInput.value = '';
        }

        function sendItemExpiryAlert(itemName, batchNumber, isExpired) {
            const subject = \`High Importance : \${itemName} is \${isExpired ? 'Expired' : 'Nearly Expired'}\`;
            const body = \`Hi. The \${itemName} with Identification Number of \${batchNumber} is \${isExpired ? 'already expired' : 'nearly expired'}. Please do the necessary. Thank you.\`;
            
            window.location.href = \`mailto:${EMAIL}?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}\`;
        }

        function sendCertExpiryAlert(itemName, isExpired) {
            const subject = \`High Importance : \${itemName} Halal Certificate is \${isExpired ? 'Expired' : 'Nearly Expired'}\`;
            const body = \`Hi. The \${itemName} Halal certificate is \${isExpired ? 'already expired' : 'nearly expired'}. Please do the necessary. Thank you.\`;
            
            window.location.href = \`mailto:${EMAIL}?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}\`;
        }

        // Initialize on load
        window.onload = function() {
            const itemName = '${item['Item Name']}';
            const batchNumber = '${item['Batch/GRIS No.']}';
            
            ${item['Item Expiry Date'] !== 'NA' ? `
                const itemExpiryDate = new Date('${item['Item Expiry Date'].split('/').reverse().join('-')}');
                const today = new Date();
                const itemTimeDiff = itemExpiryDate.getTime() - today.getTime();
                const itemDaysRemaining = Math.ceil(itemTimeDiff / (1000 * 3600 * 24));
                
                const itemExpiryElement = document.getElementById('itemExpiryDate');
                if (itemExpiryElement) {
                    itemExpiryElement.textContent = \`${formatDate(parseDate(item['Item Expiry Date']))} \${itemDaysRemaining < 1 ? '(Expired)' : \`(Expires in \${itemDaysRemaining} days)\`}\`;
                    itemExpiryElement.className = \`detail-value \${itemDaysRemaining < 15 ? 'expired' : 'valid'}\`;
                }
            ` : ''}
            
            ${item['Certificate Expiry Date'] !== 'NA' && halalCertUrl ? `
                const certExpiryDate = new Date('${item['Certificate Expiry Date'].split('/').reverse().join('-')}');
                const certTimeDiff = certExpiryDate.getTime() - today.getTime();
                const certDaysRemaining = Math.ceil(certTimeDiff / (1000 * 3600 * 24));
                
                const certExpiryElement = document.getElementById('certExpiryDate');
                if (certExpiryElement) {
                    certExpiryElement.textContent = \`${formatDate(parseDate(item['Certificate Expiry Date']))} \${certDaysRemaining < 1 ? '(Expired)' : \`(Expires in \${certDaysRemaining} days)\`}\`;
                    certExpiryElement.className = \`detail-value \${certDaysRemaining < 15 ? 'expired' : 'valid'}\`;
                }
            ` : ''}
        };
    </script>
</body>
</html>`;
}

// File Generation
async function generateFiles() {
    console.log('Starting build process...');
    
    // Verify CSV file exists
    if (!fs.existsSync(CSV_FILE)) {
        console.error(`Error: Missing CSV file at ${path.resolve(CSV_FILE)}`);
        process.exit(1);
    }

    const items = [];
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(CSV_FILE)
            .pipe(csv())
            .on('data', (data) => {
                // Normalize data fields
                if (!data['Halal Certificate URL'] && data['Halal Certificate'] && data['Halal Certificate'].startsWith('http')) {
                    data['Halal Certificate URL'] = data['Halal Certificate'];
                }
                items.push(data);
            })
            .on('end', () => {
                console.log(`Processed ${items.length} items from CSV`);
                
                // Create output directory
                if (!fs.existsSync(OUTPUT_DIR)) {
                    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
                }

                // Generate HTML files
                items.forEach(item => {
                    const filePath = path.join(OUTPUT_DIR, `item_${item['Item ID']}.html`);
                    fs.writeFileSync(filePath, generateHTML(item));
                    console.log(`Generated: ${filePath}`);
                });

                // Generate manifest
                fs.writeFileSync(
                    path.join(OUTPUT_DIR, 'manifest.json'),
                    JSON.stringify({
                        generatedAt: new Date().toISOString(),
                        items: items.length,
                        availableItems: items.map(item => item['Item ID'].toString())
                    }, null, 2)
                );

                // Copy index.html
                if (fs.existsSync('index.html')) {
                    fs.copyFileSync('index.html', path.join(OUTPUT_DIR, 'index.html'));
                    console.log('Copied index.html to output directory');
                }

                console.log('Build completed successfully');
                resolve();
            })
            .on('error', reject);
    });
}

// Watch Mode
function setupWatcher() {
    console.log(`Watching for changes to ${CSV_FILE}...`);
    chokidar.watch(CSV_FILE)
        .on('change', () => {
            console.log('CSV modified - regenerating files...');
            generateFiles().catch(console.error);
        });
}

// Main Execution
(async () => {
    try {
        await generateFiles();
        if (process.argv.includes('--watch')) setupWatcher();
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
})();