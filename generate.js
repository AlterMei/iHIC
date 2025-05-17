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
                <div class="