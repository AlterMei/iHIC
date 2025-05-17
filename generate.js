const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Function to generate HTML content for an item
function generateHTML(item) {
  const today = new Date();
  const itemExpiryDate = item['Item Expiry Date'] === 'NA' ? null : parseDate(item['Item Expiry Date']);
  const certExpiryDate = item['Certificate Expiry Date'] === 'NA' ? null : parseDate(item['Certificate Expiry Date']);

  const itemExpiryStatus = getExpiryStatus(itemExpiryDate);
  const certExpiryStatus = getExpiryStatus(certExpiryDate);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>i-HIC - ${item['Item Name']} Details</title>
    <style>
        * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
        }
        body { 
            padding: 15px; 
            background-color: #f5f5f5; 
            font-family: Arial, sans-serif; 
        }
        .container { 
            max-width: 100%; 
            margin: 0 auto; 
            background: white; 
            border-radius: 10px; 
            padding: 20px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header-container {
            text-align: center;
            margin-bottom: 20px;
        }
        .header-main { 
            font-family: "Century Gothic", CenturyGothic, AppleGothic, sans-serif; 
            color: #0066cc; 
            font-size: 24px; 
            font-weight: 800;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .header-sub { 
            font-family: "Century Gothic", CenturyGothic, AppleGothic, sans-serif; 
            color: #0066cc; 
            font-size: 20px; 
            font-weight: 800;
            letter-spacing: 1px;
        }
        .item-name { 
            font-size: 22px; 
            font-weight: bold; 
            text-align: center; 
            margin-bottom: 25px; 
            color: #333;
            padding-bottom: 10px;
            border-bottom: 2px solid #0066cc;
        }
        .info-card {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
            margin-bottom: 20px;
        }
        .card-title {
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 15px;
            font-size: 18px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e0e0e0;
        }
        .detail-row { 
            display: flex; 
            margin-bottom: 10px; 
            align-items: center;
            padding-bottom: 10px;
            border-bottom: 1px solid #f0f0f0;
        }
        .detail-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
        }
        .detail-label { 
            font-weight: bold; 
            width: 50%; 
            color: #555; 
            font-size: 16px;
            padding-right: 5px;
        }
        .detail-value { 
            width: 50%; 
            word-break: break-word;
            font-size: 16px;
            text-align: left;
            padding-left: 5px;
        }
        .cert-available { color: #27ae60; font-weight: bold; }
        .cert-not-available { color: #e74c3c; font-weight: bold; }
        .expired { color: #e74c3c; font-weight: bold; }
        .valid { color: #27ae60; font-weight: bold; }
        .btn { 
            display: inline-block; 
            padding: 10px 12px; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            text-align: center; 
            font-size: 15px; 
            border: none; 
            cursor: pointer; 
            width: 100%;
            margin-top: 8px;
        }
        .btn:hover { opacity: 0.9; }
        .btn-blue { background-color: #3498db; }
        .btn-green { background-color: #2ecc71; }
        .btn-purple { background-color: #9b59b6; }
        .btn-red { 
            background-color: #e74c3c; 
            margin: 15px 0 20px 0;
        }
        .stock-request-box { 
            background-color: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            margin-top: 20px; 
            border: 1px solid #e0e0e0;
            text-align: left;
        }
        .quantity-input { 
            width: 100%; 
            padding: 12px; 
            margin: 10px 0; 
            border: 1px solid #ddd; 
            border-radius: 5px; 
            font-size: 16px; 
            text-align: left;
        }
        .quantity-label { 
            display: block; 
            margin: 10px 0 5px; 
            font-weight: bold; 
            color: #333; 
            font-size: 16px;
            text-align: left;
        }
        .back-btn { 
            display: block; 
            text-align: center; 
            margin-top: 20px; 
            color: #3498db; 
            text-decoration: none; 
            font-weight: bold; 
            font-size: 16px;
        }
        .expiry-alert-container {
            margin: 10px 0 5px 0;
        }
        .cert-alert-container {
            margin: 10px 0 5px 0;
        }
        .na-value {
            color: #7f8c8d;
            font-style: italic;
        }
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
            ` : '<div id="expiryAlertContainer" class="expiry-alert-container"></div>'}
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
                <div class="detail-value ${item['Halal Certificate'] === 'Available' ? 'cert-available' : 'cert-not-available'}">
                    ${item['Halal Certificate']}
                </div>
            </div>
            ${item['Halal Certificate'] === 'Available' ? `
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
            ` : '<div id="certAlertContainer" class="cert-alert-container"></div>'}
            <div class="detail-row" style="margin-top: 5px;">
                <div class="detail-label">Certificate:</div>
                <div class="detail-value">
                    <a href="${item['Halal Certificate URL']}" class="btn btn-blue">View Certificate</a>
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

        function parseDate(dateString) {
            if (dateString.includes('/')) {
                const parts = dateString.split('/');
                return new Date(parts[2], parts[1] - 1, parts[0]);
            }
            return new Date(dateString);
        }

        function calculateDaysRemaining(expiryDate, elementId, itemName, batchNumber) {
            if (!expiryDate || expiryDate === 'NA') return;
            
            try {
                const expiry = parseDate(expiryDate);
                const today = new Date();
                const timeDiff = expiry.getTime() - today.getTime();
                const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                
                const element = document.getElementById(elementId);
                if (element) {
                    const formattedDate = formatDate(expiry);
                    
                    if (daysRemaining < 1) {
                        element.textContent = \`\${formattedDate} (Expired)\`;
                        element.classList.remove('valid');
                        element.classList.add('expired');
                        
                        if (elementId === 'itemExpiryDate') {
                            createItemExpiryAlertButton(itemName, batchNumber, daysRemaining);
                        } else if (elementId === 'certExpiryDate') {
                            createCertExpiryAlertButton(itemName, daysRemaining);
                        }
                    } else {
                        element.textContent = \`\${formattedDate} (Expires in \${daysRemaining} days)\`;
                        
                        if (daysRemaining < 15) {
                            element.classList.remove('valid');
                            element.classList.add('expired');
                            
                            if (elementId === 'itemExpiryDate') {
                                createItemExpiryAlertButton(itemName, batchNumber, daysRemaining);
                            } else if (elementId === 'certExpiryDate') {
                                createCertExpiryAlertButton(itemName, daysRemaining);
                            }
                        } else {
                            element.classList.remove('expired');
                            element.classList.add('valid');
                        }
                    }
                }
                
                return daysRemaining;
            } catch (e) {
                console.error('Error calculating date:', e);
                return null;
            }
        }

        function formatDate(date) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return \`\${day}/\${month}/\${year}\`;
        }

        window.onload = function() {
            const itemName = '${item['Item Name']}';
            const batchNumber = '${item['Batch/GRIS No.']}';
            ${item['Item Expiry Date'] !== 'NA' ? `calculateDaysRemaining('${item['Item Expiry Date']}', 'itemExpiryDate', itemName, batchNumber);` : ''}
            ${item['Certificate Expiry Date'] !== 'NA' && item['Halal Certificate'] === 'Available' ? `calculateDaysRemaining('${item['Certificate Expiry Date']}', 'certExpiryDate', itemName, batchNumber);` : ''}
        };
    </script>
</body>
</html>`;
}

// Helper functions
function parseDate(dateString) {
    if (!dateString || dateString === 'NA') return null;
    const parts = dateString.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function formatDate(date) {
    if (!date) return 'N/A';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function getExpiryStatus(expiryDate) {
    if (!expiryDate) {
        return {
            class: 'na-value',
            text: '',
            alert: false
        };
    }

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
    } else {
        return {
            class: 'valid',
            text: `(Expires in ${daysRemaining} days)`,
            alert: false
        };
    }
}

// Main function to process CSV and generate HTML files
function generateFromCSV() {
    const items = [];
    
    fs.createReadStream('Halal_Info_2.csv')
        .pipe(csv())
        .on('data', (data) => items.push(data))
        .on('end', () => {
            // Create output directory if it doesn't exist
            const outputDir = path.join(__dirname, 'generated');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }

            // Generate HTML for each item
            items.forEach(item => {
                const htmlContent = generateHTML(item);
                const fileName = `item_${item['Item ID']}.html`;
                fs.writeFileSync(path.join(outputDir, fileName), htmlContent);
                console.log(`Generated: ${fileName}`);
            });

            console.log('HTML generation complete!');
        });
}

// Run the generator
generateFromCSV();