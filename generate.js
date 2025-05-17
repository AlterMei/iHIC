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

        // Copy index.html to public directory if it exists
        if (fs.existsSync(CONFIG.indexFile)) {
            fs.copyFileSync(CONFIG.indexFile, path.join(CONFIG.outputDir, 'index.html'));
            console.log('Copied index.html to public directory');
        }

        // Read and process CSV
        const items = await readCsvFile(CONFIG.inputCsv);
        
        // Generate HTML for each item
        items.forEach(item => {
            const htmlContent = generateItemHtml(item);
            const outputFile = path.join(CONFIG.outputDir, `item_id${item.id}.html`);
            fs.writeFileSync(outputFile, htmlContent);
            console.log(`Generated: item_id${item.id}.html`);
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
        /* CSS styles here (same as before) */
    </style>
</head>
<body>
    <!-- HTML content here (same as before) -->
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
            if (!expiryDate || expiryDate.trim() === 'NA') {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = 'NA';
                    element.classList.add('na-value');
                }
                return;
            }
            
            try {
                const expiry = parseDate(expiryDate);
                if (!expiry || isNaN(expiry.getTime())) {
                    console.error('Invalid date:', expiryDate);
                    return;
                }
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const timeDiff = expiry.getTime() - today.getTime();
                const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                
                const element = document.getElementById(elementId);
                if (element) {
                    const formattedDate = formatDate(expiry);
                    
                    if (daysRemaining < 1) {
                        element.textContent = formattedDate + ' (Expired)';
                        element.classList.remove('valid');
                        element.classList.add('expired');
                    } else {
                        element.textContent = formattedDate + ' (Expires in ' + daysRemaining + ' days)';
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

        function parseDate(dateString) {
            if (!dateString || dateString.trim() === 'NA') return null;
            
            try {
                if (dateString.includes('/')) {
                    const parts = dateString.split('/');
                    if (parts[0].length === 4) {
                        return new Date(dateString);
                    } else if (parts[2].length === 4) {
                        const dayFirst = new Date(parts[2], parts[1] - 1, parts[0]);
                        const monthFirst = new Date(parts[2], parts[0] - 1, parts[1]);
                        if (!isNaN(dayFirst.getTime())) return dayFirst;
                        if (!isNaN(monthFirst.getTime())) return monthFirst;
                    }
                }
                return new Date(dateString);
            } catch (e) {
                console.error('Error parsing date:', e);
                return null;
            }
        }

        function formatDate(date) {
            if (!date || isNaN(date.getTime())) return 'NA';
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return day + '/' + month + '/' + year;
        }

        window.onload = function() {
            const itemName = '${escapeJsString(item.name)}';
            const batchNumber = '${escapeJsString(item.batch)}';
            
            // Calculate days remaining for item expiry
            const itemExpiryElement = document.getElementById('itemExpiryDate');
            const itemExpiryDate = itemExpiryElement ? itemExpiryElement.textContent.trim() : '${escapeHtml(item.expiry)}';
            calculateDaysRemaining(itemExpiryDate, 'itemExpiryDate', itemName, batchNumber);
            
            // Calculate days remaining for certificate expiry
            const certExpiryElement = document.getElementById('certExpiryDate');
            const certExpiryDate = certExpiryElement ? certExpiryElement.textContent.trim() : '${escapeHtml(item.certExpiry)}';
            if (certExpiryDate && certExpiryDate !== 'N/A') {
                calculateDaysRemaining(certExpiryDate, 'certExpiryDate', itemName, batchNumber);
            }
        };
    </script>
</body>
</html>`;
}

// Helper functions
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

// Run the generation
generateHtmlFiles().catch(error => {
    console.error('Generation failed:', error);
    process.exit(1);
});