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

// HTML Template
function generateHTML(item) {
    const itemExpiryDate = parseDate(item['Item Expiry Date']);
    const certExpiryDate = parseDate(item['Certificate Expiry Date']);
    const itemExpiryStatus = getExpiryStatus(itemExpiryDate);
    const certExpiryStatus = getExpiryStatus(certExpiryDate);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>i-HIC - ${item['Item Name']} Details</title>
    <style>
        /* CSS styles remain exactly the same as before */
    </style>
</head>
<body>
    <!-- HTML content remains exactly the same as before -->
</body>
</html>`;
}

// File Generation
async function generateFiles() {
    console.log('Starting build process...');
    console.log(`Checking for CSV file at: ${path.resolve(CSV_FILE)}`);
    
    if (!fs.existsSync(CSV_FILE)) {
        console.error(`Error: Missing CSV file at ${path.resolve(CSV_FILE)}`);
        process.exit(1);
    }

    const items = [];
    
    return new Promise((resolve, reject) => {
        console.log('Processing CSV file...');
        fs.createReadStream(CSV_FILE)
            .pipe(csv())
            .on('data', (data) => {
                // Ensure all required fields exist
                if (!data['Halal Certificate URL'] && data['Halal Certificate'] && data['Halal Certificate'].startsWith('http')) {
                    data['Halal Certificate URL'] = data['Halal Certificate'];
                }
                items.push(data);
            })
            .on('end', () => {
                console.log(`Found ${items.length} items in CSV`);
                
                // Create output directory
                if (!fs.existsSync(OUTPUT_DIR)) {
                    console.log(`Creating output directory: ${OUTPUT_DIR}`);
                    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
                }

                // Generate HTML files
                items.forEach(item => {
                    const filePath = path.join(OUTPUT_DIR, `item_${item['Item ID']}.html`);
                    try {
                        fs.writeFileSync(filePath, generateHTML(item));
                        console.log(`Generated: ${filePath}`);
                    } catch (err) {
                        console.error(`Failed to write ${filePath}:`, err);
                    }
                });

                // Generate manifest
                const manifest = {
                    generatedAt: new Date().toISOString(),
                    availableItems: items.map(item => item['Item ID'].toString())
                };
                fs.writeFileSync(
                    path.join(OUTPUT_DIR, 'manifest.json'),
                    JSON.stringify(manifest, null, 2)
                );
                console.log('Generated manifest.json');

                // Copy index.html
                const indexSource = 'index.html';
                const indexDest = path.join(OUTPUT_DIR, 'index.html');
                if (fs.existsSync(indexSource)) {
                    fs.copyFileSync(indexSource, indexDest);
                    console.log(`Copied ${indexSource} to ${indexDest}`);
                } else {
                    console.warn(`Warning: ${indexSource} not found`);
                }

                console.log(`Successfully generated ${items.length} item pages`);
                resolve();
            })
            .on('error', (err) => {
                console.error('CSV processing error:', err);
                reject(err);
            });
    });
}

// Watch Mode
function setupWatcher() {
    console.log(`\nWatching for changes to ${CSV_FILE}...`);
    chokidar.watch(CSV_FILE)
        .on('change', () => {
            console.log('\nCSV file modified. Regenerating files...');
            generateFiles().catch(err => {
                console.error('Regeneration failed:', err);
            });
        })
        .on('error', err => console.error('Watcher error:', err));
}

// Main Execution
(async () => {
    try {
        await generateFiles();
        
        if (process.argv.includes('--watch')) {
            setupWatcher();
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
})();