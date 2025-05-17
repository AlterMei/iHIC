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
        
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
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
        /* CSS styles remain the same */
        ${fs.readFileSync('styles.css', 'utf8') || getDefaultStyles()}
    </style>
</head>
<body>
    <div class="container">
        <!-- HTML structure remains the same -->
    </div>

    <script>
        // JavaScript functions remain the same
        ${fs.readFileSync('scripts.js', 'utf8') || getDefaultScripts(item)}
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
                // Parse day and month (can be 1 or 2 digits)
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
                const year = parseInt(parts[2], 10);
                
                // Validate date values
                if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year > 2000) {
                    const date = new Date(year, month, day);
                    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
                        // Format to DD/MM/YYYY regardless of input format
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

function getDefaultStyles() {
    return `* { box-sizing: border-box; margin: 0; padding: 0; }
    body { padding: 15px; background-color: #f5f5f5; font-family: Arial, sans-serif; }
    /* Other default styles */`;
}

function getDefaultScripts(item) {
    return `function sendRequest(itemName) {
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
    };`;
}

generateHtmlFiles().catch(error => {
    console.error('Generation failed:', error);
    process.exit(1);
});