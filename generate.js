const fs = require('fs');
const path = require('path');

// Item data structure
const items = [
  {
    id: 44,
    name: "Pecah Beling Extract",
    category: "Raw Material",
    batchNumber: "R045/21",
    brand: "ForUs",
    supplier: "FRIM",
    expiryDate: "22/05/2025",
    stock: "3.88 Kg",
    purchaseDate: "09/06/2022",
    invoiceUrl: "https://drive.google.com/file/d/1YcHyopXSSecugI4iEG5eT53TttfNSy8m/view?usp=sharing",
    halalCertAvailable: true,
    certExpiryDate: "No info provided",
    certUrl: "https://drive.google.com/file/d/1pnZwxVCRkokCuzaG5v_2Vo5adOhjxsIo/view?usp=sharing"
  }
  // Add more items here as needed
];

// Generate index.html
function generateIndex() {
  const indexTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>i-HIC - Login</title>
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
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .login-container { 
            max-width: 400px; 
            width: 100%;
            margin: 0 auto; 
            background: white; 
            border-radius: 10px; 
            padding: 30px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            text-align: center;
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
            margin-bottom: 30px;
        }
        .passkey-input {
            width: 100%;
            padding: 12px;
            margin: 20px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            text-align: center;
        }
        .login-btn {
            width: 100%;
            padding: 12px;
            background-color: #0066cc;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .login-btn:hover {
            background-color: #0055aa;
        }
        .error-message {
            color: #e74c3c;
            margin-top: 10px;
            font-size: 14px;
            height: 20px;
        }
        .info-text {
            margin-top: 20px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="header-main">INSTANT HALAL & INVENTORY CHECKER</div>
        <div class="header-sub">(i-HIC)</div>
        
        <input type="password" class="passkey-input" placeholder="Enter Passkey" id="passkeyInput">
        <div class="error-message" id="errorMessage"></div>
        <button class="login-btn" onclick="attemptLogin()">Login</button>
        <div class="info-text">Enter the item ID as passkey to access the system</div>
    </div>

    <script>
        // List of valid item IDs/passkeys
        const validPasskeys = [${items.map(item => `'${item.id}'`).join(', ')}];

        function attemptLogin() {
            const passkey = document.getElementById('passkeyInput').value.trim();
            const errorElement = document.getElementById('errorMessage');
            
            // Clear previous error
            errorElement.textContent = '';
            
            if (!passkey) {
                errorElement.textContent = 'Please enter a passkey';
                return;
            }
            
            // Check if the passkey is valid
            if (validPasskeys.includes(passkey)) {
                // Redirect to the corresponding item page
                window.location.href = 'item_' + passkey + '.html';
            } else {
                errorElement.textContent = 'Invalid passkey. Please try again.';
            }
        }

        // Allow login on Enter key press
        document.getElementById('passkeyInput').addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                attemptLogin();
            }
        });
    </script>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'index.html'), indexTemplate);
  console.log('Generated index.html');
}

// Generate individual item pages
function generateItemPages() {
  items.forEach(item => {
    const itemTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>i-HIC - ${item.name} Details</title>
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
        <div class="item-name">${item.name}</div>
        
        <!-- Product Info Card -->
        <div class="info-card">
            <div class="card-title">Product Info</div>
            <div class="detail-row">
                <div class="detail-label">Item ID:</div>
                <div class="detail-value">${item.id}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Category:</div>
                <div class="detail-value">${item.category}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Batch/GRIS No.:</div>
                <div class="detail-value">${item.batchNumber}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Brand:</div>
                <div class="detail-value">${item.brand}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Supplier:</div>
                <div class="detail-value">${item.supplier}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Item Expiry Date:</div>
                <div class="detail-value" id="itemExpiryDate">${item.expiryDate}</div>
            </div>
            <div id="expiryAlertContainer" class="expiry-alert-container"></div>
            <div class="detail-row">
                <div class="detail-label">Stock Available:</div>
                <div class="detail-value">${item.stock}</div>
            </div>
        </div>
        
        <!-- Purchase Info Card -->
        <div class="info-card">
            <div class="card-title">Purchase Info</div>
            <div class="detail-row">
                <div class="detail-label">Purchased Date:</div>
                <div class="detail-value">${item.purchaseDate}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Invoice:</div>
                <div class="detail-value">
                    <a href="${item.invoiceUrl}" class="btn btn-blue">View Invoice</a>
                </div>
            </div>
        </div>
        
        <!-- Halal Info Card -->
        <div class="info-card">
            <div class="card-title">Halal Info</div>
            <div class="detail-row">
                <div class="detail-label">Halal Certificate:</div>
                <div class="detail-value ${item.halalCertAvailable ? 'cert-available' : 'cert-not-available'}">
                    ${item.halalCertAvailable ? 'Available' : 'Not Available'}
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Certificate Expiry:</div>
                <div class="detail-value" id="certExpiryDate">${item.certExpiryDate}</div>
            </div>
            <div id="certAlertContainer" class="cert-alert-container"></div>
            
            ${item.halalCertAvailable ? `
            <div class="detail-row" style="margin-top: 5px;">
                <div class="detail-label">Certificate:</div>
                <div class="detail-value">
                    <a href="${item.certUrl}" class="btn btn-blue">View Certificate</a>
                </div>
            </div>` : ''}
        </div>
        
        <div class="stock-request-box">
            <button class="btn btn-purple">Stock Request</button>
            <label class="quantity-label">Quantity:</label>
            <input type="text" class="quantity-input" placeholder="Enter quantity">
            <button class="btn btn-green" onclick="sendRequest('${item.name.replace(/'/g, "\\'")}')">Send Request</button>
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
            
            const subject = 'Stock Request - ' + itemName;
            const body = 'Hi. I want to request for ' + itemName + ' with a quantity of ' + quantity + '. Thank you.';
            
            window.location.href = 'mailto:mygml021@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
            quantityInput.value = '';
        }

        function sendItemExpiryAlert(itemName, batchNumber, isExpired) {
            const subject = 'High Important : ' + itemName + ' is ' + (isExpired ? 'Expired' : 'Nearly Expired');
            const body = 'Hi. The ' + itemName + ' with Identification Number of ' + batchNumber + ' is ' + 
                        (isExpired ? 'already expired' : 'nearly expired') + '. Please do the necessary. Thank you.';
            
            window.location.href = 'mailto:mygml021@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        }

        function sendCertExpiryAlert(itemName, isExpired) {
            const subject = 'High Important : ' + itemName + ' Halal Certificate is ' + (isExpired ? 'Expired' : 'Nearly Expired');
            const body = 'Hi. The ' + itemName + ' Halal certificate is ' + 
                        (isExpired ? 'already expired' : 'nearly expired') + '. Please do the necessary. Thank you.';
            
            window.location.href = 'mailto:mygml021@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
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

        function parseDateString(dateString) {
            if (!dateString || dateString === 'No info provided' || dateString === 'Not Applicable') {
                return null;
            }
            
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
            return null;
        }

        function calculateDaysRemaining(expiryDate, elementId, itemName, batchNumber, isCert = false) {
            const expiry = parseDateString(expiryDate);
            if (!expiry) return;
            
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const timeDiff = expiry.getTime() - today.getTime();
                const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                
                const element = document.getElementById(elementId);
                if (element) {
                    const formattedDate = formatDateForDisplay(expiry);
                    
                    if (daysRemaining < 1) {
                        element.textContent = formattedDate + ' (Expired)';
                        element.classList.remove('valid');
                        element.classList.add('expired');
                        if (isCert) {
                            createCertExpiryAlertButton(itemName, daysRemaining);
                        } else {
                            createItemExpiryAlertButton(itemName, batchNumber, daysRemaining);
                        }
                    } else {
                        element.textContent = formattedDate + ' (Expires in ' + daysRemaining + ' days)';
                        if (daysRemaining < 15) {
                            element.classList.remove('valid');
                            element.classList.add('expired');
                            if (isCert) {
                                createCertExpiryAlertButton(itemName, daysRemaining);
                            } else {
                                createItemExpiryAlertButton(itemName, batchNumber, daysRemaining);
                            }
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

        function formatDateForDisplay(date) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return day + '/' + month + '/' + year;
        }

        window.onload = function() {
            const itemName = '${item.name.replace(/'/g, "\\'")}';
            const batchNumber = '${item.batchNumber.replace(/'/g, "\\'")}';
            
            const itemExpiryElement = document.getElementById('itemExpiryDate');
            if (itemExpiryElement) {
                calculateDaysRemaining(itemExpiryElement.textContent.trim(), 'itemExpiryDate', itemName, batchNumber);
            }
            
            const certExpiryElement = document.getElementById('certExpiryDate');
            if (certExpiryElement && certExpiryElement.textContent.trim() !== 'No info provided') {
                calculateDaysRemaining(certExpiryElement.textContent.trim(), 'certExpiryDate', itemName, batchNumber, true);
            }
        };
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(__dirname, `item_${item.id}.html`), itemTemplate);
    console.log(`Generated item_${item.id}.html`);
  });
}

// Main execution
generateIndex();
generateItemPages();