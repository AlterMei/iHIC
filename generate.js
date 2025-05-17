const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration with absolute paths
const CONFIG = {
    inputCsv: path.resolve(__dirname, 'Halal_Info_2.csv'),
    outputDir: path.resolve(__dirname, 'public'),
    indexFile: path.resolve(__dirname, 'index.html')
};

// Error handling setup
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});

async function generateHtmlFiles() {
    try {
        console.log('Starting HTML generation...');
        
        // Create or clean output directory
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
            console.log(`Created directory: ${CONFIG.outputDir}`);
        } else {
            console.log(`Directory exists: ${CONFIG.outputDir}`);
        }

        // Copy index.html
        if (fs.existsSync(CONFIG.indexFile)) {
            fs.copyFileSync(CONFIG.indexFile, path.join(CONFIG.outputDir, 'index.html'));
            console.log('Copied index.html to public directory');
        }

        // Process CSV
        const items = await readCsvFile(CONFIG.inputCsv);
        console.log(`Processing ${items.length} items...`);
        
        items.forEach(item => {
            const htmlContent = generateItemHtml(item);
            const outputFile = path.join(CONFIG.outputDir, `item_${item.id}.html`);
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
    const hasCertificate = row['Halal Certificate']?.trim() && 
                         row['Halal Certificate'].trim() !== 'N/A';
    
    return {
        id: row['Item ID']?.trim() || '0',
        name: row['Item Name']?.trim() || 'Unknown',
        category: row['Category']?.trim() || 'Raw Material',
        batch: row['Batch/GRIS No.']?.trim() || '',
        brand: row['Brand']?.trim() || '',
        supplier: row['Supplier']?.trim() || '',
        expiry: formatDate(row['Item Expiry Date']?.trim()),
        stock: row['Stock Available']?.trim() || '0 pcs',
        purchaseDate: formatDate(row['Purchased Date']?.trim()),
        invoice: validateUrl(row['Invoice']?.trim()),
        certificate: validateUrl(row['Halal Certificate']?.trim()),
        certExpiry: hasCertificate ? formatDate(row['Certificate Expiry']?.trim()) : 'Not Applicable',
        certStatus: hasCertificate ? 'Available' : 'Not Available'
    };
}

function generateItemHtml(item) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>i-HIC - ${escapeHtml(item.name)} Details</title>
    <style>
        /* All your CSS styles from previous examples */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { padding: 15px; background-color: #f5f5f5; font-family: Arial, sans-serif; }
        .container { max-width: 100%; margin: 0 auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        /* Include all other CSS rules from your previous template */
    </style>
</head>
<body>
    <div class="container">
        <!-- Your complete HTML template structure from previous examples -->
        <div class="header-container">
            <div class="header-main">INSTANT HALAL & INVENTORY CHECKER</div>
            <div class="header-sub">(i-HIC)</div>
        </div>
        <div class="item-name">${escapeHtml(item.name)}</div>
        
        <!-- Include all your card sections and detail rows -->
        <!-- Product Info Card -->
        <div class="info-card">
            <!-- All your product info fields -->
        </div>
        
        <!-- Purchase Info Card -->
        <div class="info-card">
            <!-- All your purchase info fields -->
        </div>
        
        <!-- Halal Info Card -->
        <div class="info-card">
            <!-- All your halal info fields -->
        </div>
        
        <!-- Stock request section -->
        <div class="stock-request-box">
            <!-- Your request form elements -->
        </div>
        
        <a href="index.html" class="back-btn">← Back</a>
    </div>

    <script>
        // All your JavaScript functions from previous examples
        function sendRequest(itemName) {
            // Your existing implementation
        }

        function calculateDaysRemaining(expiryDate, elementId, itemName, batchNumber) {
            // Your existing implementation with enhanced date handling
            if (!expiryDate || expiryDate.trim() === 'No info provided' || expiryDate.trim() === 'Not Applicable') {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = expiryDate;
                    element.classList.add('na-value');
                }
                return;
            }
            
            try {
                const dateObj = parseDateString(expiryDate);
                if (!dateObj) return;
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const timeDiff = dateObj.getTime() - today.getTime();
                const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                
                const element = document.getElementById(elementId);
                if (element) {
                    const formattedDate = formatDateForDisplay(dateObj);
                    
                    if (daysRemaining < 1) {
                        element.textContent = \`\${formattedDate} (Expired)\`;
                        element.classList.remove('valid');
                        element.classList.add('expired');
                    } else {
                        element.textContent = \`\${formattedDate} (Expires in \${daysRemaining} days)\`;
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

        // Enhanced date parsing that accepts multiple formats
        function parseDateString(dateString) {
            if (!dateString) return null;
            
            // Try different date formats
            const formats = [
                /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/,  // D/M/YYYY or DD/MM/YYYY
                /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/     // YYYY/M/D
            ];
            
            for (const regex of formats) {
                const match = dateString.match(regex);
                if (match) {
                    const day = parseInt(match[1], 10);
                    const month = parseInt(match[2], 10) - 1;
                    const year = parseInt(match[3], 10);
                    
                    const date = new Date(year, month, day);
                    if (!isNaN(date.getTime()) {
                        return date;
                    }
                }
            }
            return null;
        }

        function formatDateForDisplay(date) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return \`\${day}/\${month}/\${year}\`;
        }

        window.onload = function() {
            const itemName = '${escapeJsString(item.name)}';
            const batchNumber = '${escapeJsString(item.batch)}';
            
            const itemExpiryElement = document.getElementById('itemExpiryDate');
            if (itemExpiryElement) {
                calculateDaysRemaining(itemExpiryElement.textContent.trim(), 'itemExpiryDate', itemName, batchNumber);
            }
            
            const certExpiryElement = document.getElementById('certExpiryDate');
            if (certExpiryElement && certExpiryElement.textContent.trim() !== 'Not Applicable') {
                calculateDaysRemaining(certExpiryElement.textContent.trim(), 'certExpiryDate', itemName, batchNumber);
            }
        };
    </script>
</body>
</html>`;
}

// Enhanced date formatting function (accepts multiple formats)
function formatDate(dateString) {
    if (!dateString || dateString.trim() === '' || dateString.trim().toLowerCase() === 'na') {
        return 'No info provided';
    }
    
    try {
        // Try to parse the date string
        const dateObj = parseDateString(dateString.trim());
        if (!dateObj) return 'No info provided';
        
        // Format to DD/MM/YYYY
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        
        return \`\${day}/\${month}/\${year}\`;
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