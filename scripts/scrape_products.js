/**
 * Enhanced Alibaba/1688 Product Scraper
 * Comprehensive product extraction with smart categorization and pricing analysis
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { Cluster } = require('puppeteer-cluster');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

puppeteer.use(StealthPlugin());

class ProductScraper {
    constructor(options = {}) {
        this.options = {
            concurrency: 3,
            timeout: 30000,
            headless: true,
            userDataDir: './scraper_data',
            screenshots: true,
            debug: false,
            outputDir: './scraped_products',
            ...options
        };
        
        this.browser = null;
        this.products = [];
        this.failedUrls = [];
        this.stats = {
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0
        };
    }

    async initialize() {
        console.log('🚀 Initializing product scraper...');
        
        // Create output directory
        await fs.mkdir(this.options.outputDir, { recursive: true });
        
        // Initialize browser
        this.browser = await puppeteer.launch({
            headless: this.options.headless,
            userDataDir: this.options.userDataDir,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });
        
        console.log('✅ Browser initialized successfully');
    }

    async scrapeUrls(urls) {
        console.log(`📊 Starting to scrape ${urls.length} URLs...`);
        
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: this.options.concurrency,
            puppeteerOptions: {
                headless: this.options.headless,
                args: this.browser.args()
            }
        });

        await cluster.task(async ({ page, data: url }) => {
            try {
                const product = await this.scrapeProductPage(page, url);
                if (product) {
                    this.products.push(product);
                    this.stats.success++;
                } else {
                    this.stats.skipped++;
                }
            } catch (error) {
                console.error(`❌ Failed to scrape ${url}:`, error.message);
                this.failedUrls.push({ url, error: error.message });
                this.stats.failed++;
            } finally {
                this.stats.total++;
            }
        });

        for (const url of urls) {
            await cluster.queue(url);
        }

        await cluster.idle();
        await cluster.close();
        
        console.log(`📈 Scraping completed: ${this.stats.success}/${this.stats.total} successful`);
    }

    async scrapeProductPage(page, url) {
        const platform = this.detectPlatform(url);
        
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: this.options.timeout 
        });

        // Wait for product content to load
        await this.waitForContent(page, platform);

        // Extract basic product data
        const product = await this.extractProductData(page, platform, url);
        
        if (!product.title || !product.supplierPrice) {
            console.warn(`⚠️  Incomplete product data for ${url}`);
            return null;
        }

        // Enhance product data
        product.uploadDate = await this.extractUploadDate(page, platform);
        product.category = await this.categorizeProduct(product);
        product.isNew = this.checkIfNew(product.uploadDate);
        product.promoCode = product.isNew ? this.generatePromoCode() : null;
        product.promotionEndDate = product.isNew ? 
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

        // Extract supplier information
        product.supplier = await this.extractSupplierInfo(page, platform);

        // Extract shipping information
        product.shippingOptions = await this.extractShippingOptions(page, platform);

        // Extract competitor pricing
        product.competitorPricing = await this.extractCompetitorPricing(product);

        // Take screenshot if enabled
        if (this.options.screenshots) {
            product.screenshot = await this.takeScreenshot(page, product.id);
        }

        // Extract AIBuy insights if available
        product.aibuyData = await this.extractAIBuyData(page, product);

        // Generate AI insights
        product.aiInsights = await this.generateAIInsights(product);

        console.log(`✅ Extracted product: ${product.title.substring(0, 50)}...`);
        return product;
    }

    async extractProductData(page, platform, url) {
        const selectors = this.getSelectors(platform);
        
        try {
            const product = await page.evaluate((selectors) => {
                const getText = (selector) => {
                    const element = document.querySelector(selector);
                    return element ? element.textContent.trim() : '';
                };
                
                const getAttribute = (selector, attr) => {
                    const element = document.querySelector(selector);
                    return element ? element.getAttribute(attr) : null;
                };
                
                const getImages = (selector) => {
                    const images = document.querySelectorAll(selector);
                    return Array.from(images).map(img => ({
                        url: img.src || img.getAttribute('data-src'),
                        alt: img.alt || '',
                        title: img.title || ''
                    })).filter(img => img.url);
                };
                
                const getSpecifications = () => {
                    const specs = {};
                    const specRows = document.querySelectorAll(selectors.specifications);
                    specRows.forEach(row => {
                        const key = row.querySelector('th, .spec-key, .label')?.textContent?.trim();
                        const value = row.querySelector('td, .spec-value, .value')?.textContent?.trim();
                        if (key && value) {
                            specs[key] = value;
                        }
                    });
                    return specs;
                };

                const getVariants = () => {
                    const variants = [];
                    const variantGroups = document.querySelectorAll(selectors.variants);
                    
                    variantGroups.forEach(group => {
                        const type = group.querySelector(selectors.variantType)?.textContent?.trim();
                        const options = Array.from(group.querySelectorAll(selectors.variantOptions)).map(option => ({
                            value: option.textContent?.trim(),
                            price: option.getAttribute('data-price') || null,
                            image: option.getAttribute('data-image') || null,
                            available: !option.classList.contains('disabled')
                        }));
                        
                        if (type && options.length > 0) {
                            variants.push({ type, options });
                        }
                    });
                    
                    return variants;
                };

                const getPriceRange = () => {
                    const prices = [];
                    
                    // Try multiple price selectors
                    const priceSelectors = [
                        selectors.price,
                        selectors.priceRange,
                        selectors.minPrice,
                        selectors.maxPrice
                    ];
                    
                    priceSelectors.forEach(selector => {
                        if (selector) {
                            const elements = document.querySelectorAll(selector);
                            elements.forEach(el => {
                                const priceText = el.textContent?.trim();
                                if (priceText) {
                                    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                                    if (!isNaN(price) && price > 0) {
                                        prices.push(price);
                                    }
                                }
                            });
                        }
                    });
                    
                    if (prices.length === 0) return null;
                    
                    return {
                        min: Math.min(...prices),
                        max: Math.max(...prices),
                        currency: document.querySelector(selectors.currency)?.textContent?.trim() || 'USD'
                    };
                };

                return {
                    title: getText(selectors.title),
                    description: getText(selectors.description),
                    images: getImages(selectors.images),
                    specifications: getSpecifications(),
                    variants: getVariants(),
                    priceRange: getPriceRange(),
                    sku: getAttribute(selectors.sku, 'content') || getText(selectors.sku),
                    brand: getText(selectors.brand),
                    moq: parseInt(getText(selectors.moq)) || 1,
                    sourceUrl: window.location.href,
                    extractedAt: new Date().toISOString()
                };
            }, selectors);

            // Post-processing
            product.id = this.generateProductId(product);
            product.sourcePlatform = platform;
            product.sourceProductId = this.extractSourceProductId(url, platform);
            
            // Set supplier price from price range
            if (product.priceRange) {
                product.supplierPrice = product.priceRange.min;
                product.maxPrice = product.priceRange.max;
                product.currency = product.priceRange.currency;
            }

            return product;
        } catch (error) {
            console.error(`Error extracting product data: ${error.message}`);
            throw error;
        }
    }

    async extractSupplierInfo(page, platform) {
        const selectors = this.getSupplierSelectors(platform);
        
        try {
            const supplier = await page.evaluate((selectors) => {
                const getText = (selector) => {
                    const element = document.querySelector(selector);
                    return element ? element.textContent.trim() : '';
                };
                
                const getAttribute = (selector, attr) => {
                    const element = document.querySelector(selector);
                    return element ? element.getAttribute(attr) : null;
                };
                
                const getRating = (selector) => {
                    const element = document.querySelector(selector);
                    if (!element) return null;
                    
                    const text = element.textContent.trim();
                    const rating = parseFloat(text.match(/[\d.]+/)?.[0]);
                    const reviews = parseInt(text.match(/\d+/)?.[1] || '0');
                    
                    return { rating: rating || 0, reviews: reviews || 0 };
                };

                return {
                    name: getText(selectors.name),
                    companyName: getText(selectors.companyName),
                    contactEmail: getAttribute(selectors.email, 'href')?.replace('mailto:', ''),
                    contactPhone: getText(selectors.phone),
                    location: getText(selectors.location),
                    yearsOnPlatform: parseInt(getText(selectors.yearsOnPlatform)) || null,
                    rating: getRating(selectors.rating),
                    responseRate: parseFloat(getText(selectors.responseRate).replace('%', '')) || null,
                    responseTime: getText(selectors.responseTime),
                    totalTransactions: parseInt(getText(selectors.transactions).replace(/[^0-9]/g, '')) || null,
                    verified: document.querySelector(selectors.verified) !== null,
                    platformUrl: window.location.origin
                };
            }, selectors);

            return supplier;
        } catch (error) {
            console.warn(`Could not extract supplier info: ${error.message}`);
            return null;
        }
    }

    async extractShippingOptions(page, platform) {
        try {
            const shipping = await page.evaluate(() => {
                const shippingElements = document.querySelectorAll('[data-shipping], .shipping-option, .delivery-option');
                
                return Array.from(shippingElements).map(el => ({
                    name: el.querySelector('.shipping-name, .carrier-name')?.textContent?.trim(),
                    carrier: el.querySelector('.carrier, .shipping-company')?.textContent?.trim(),
                    type: el.querySelector('.shipping-type, .delivery-type')?.textContent?.trim(),
                    estimatedDays: {
                        min: parseInt(el.querySelector('.min-days')?.textContent) || null,
                        max: parseInt(el.querySelector('.max-days')?.textContent) || null
                    },
                    cost: parseFloat(el.querySelector('.shipping-cost, .delivery-cost')?.textContent?.replace(/[^0-9.]/g, '')) || 0
                })).filter(option => option.name);
            });

            return shipping;
        } catch (error) {
            console.warn(`Could not extract shipping options: ${error.message}`);
            return [];
        }
    }

    async extractCompetitorPricing(product) {
        // This would integrate with external pricing services
        // For now, return placeholder data
        return {
            amazon: await this.getAmazonPricing(product),
            aliexpress: await this.getAliexpressPricing(product),
            lastUpdated: new Date().toISOString()
        };
    }

    async getAmazonPricing(product) {
        // Implement Amazon pricing lookup
        return {
            price: null,
            currency: 'USD',
            availability: null,
            url: null,
            lastChecked: new Date().toISOString()
        };
    }

    async getAliexpressPricing(product) {
        // Implement AliExpress pricing lookup
        return {
            price: null,
            currency: 'USD',
            availability: null,
            url: null,
            lastChecked: new Date().toISOString()
        };
    }

    async extractAIBuyData(page, product) {
        // Check if 1688AIBUY extension data is available
        try {
            const aibuyData = await page.evaluate(() => {
                // Look for injected AIBuy data
                if (window.aibuyData) {
                    return window.aibuyData;
                }
                
                // Look for AIBuy elements
                const aibuyElement = document.querySelector('[data-aibuy], .aibuy-data');
                if (aibuyElement) {
                    try {
                        return JSON.parse(aibuyElement.textContent || aibuyElement.getAttribute('data-aibuy'));
                    } catch (e) {
                        return null;
                    }
                }
                
                return null;
            });

            return aibuyData;
        } catch (error) {
            console.warn(`Could not extract AIBuy data: ${error.message}`);
            return null;
        }
    }

    async generateAIInsights(product) {
        const insights = {
            demandScore: this.calculateDemandScore(product),
            competitionLevel: this.assessCompetition(product),
            qualityScore: this.assessQuality(product),
            marketFit: this.assessMarketFit(product),
            recommendations: this.generateRecommendations(product)
        };

        return insights;
    }

    calculateDemandScore(product) {
        // Simple heuristic based on product attributes
        let score = 0.5; // Base score
        
        if (product.images && product.images.length > 5) score += 0.1;
        if (product.description && product.description.length > 500) score += 0.1;
        if (product.supplier && product.supplier.rating && product.supplier.rating.rating > 4.5) score += 0.1;
        if (product.supplier && product.supplier.verified) score += 0.1;
        if (product.specifications && Object.keys(product.specifications).length > 5) score += 0.1;
        
        return Math.min(score, 1.0);
    }

    assessCompetition(product) {
        // Assess competition level based on various factors
        const factors = {
            marketSaturation: this.calculateMarketSaturation(product),
            priceCompetitiveness: this.assessPriceCompetitiveness(product),
            supplierQuality: product.supplier ? (product.supplier.rating?.rating || 0) / 5 : 0
        };
        
        const avgCompetition = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
        
        if (avgCompetition > 0.7) return 'high';
        if (avgCompetition > 0.4) return 'medium';
        return 'low';
    }

    assessQuality(product) {
        let score = 0.5;
        
        if (product.images && product.images.length >= 8) score += 0.2;
        if (product.description && product.description.includes('specification')) score += 0.1;
        if (product.specifications && Object.keys(product.specifications).length > 3) score += 0.1;
        if (product.supplier && product.supplier.verified) score += 0.1;
        
        return Math.min(score, 1.0);
    }

    assessMarketFit(product) {
        // Assess how well the product fits the target market
        const category = product.category?.toLowerCase() || '';
        const title = product.title?.toLowerCase() || '';
        
        const trendingCategories = ['electronics', 'apparel', 'home', 'beauty', 'toys'];
        const trendingKeywords = ['smart', 'wireless', 'eco', 'portable', 'premium'];
        
        let score = 0.3; // Base score
        
        if (trendingCategories.some(cat => category.includes(cat))) score += 0.3;
        if (trendingKeywords.some(keyword => title.includes(keyword))) score += 0.2;
        if (product.supplierPrice && product.supplierPrice < 50) score += 0.1; // Affordable
        if (product.supplierPrice && product.supplierPrice > 5) score += 0.1; // Not too cheap
        
        return Math.min(score, 1.0);
    }

    generateRecommendations(product) {
        const recommendations = [];
        
        if (product.aiInsights.demandScore > 0.7) {
            recommendations.push('High demand - consider premium pricing');
        }
        
        if (product.aiInsights.competitionLevel === 'low') {
            recommendations.push('Low competition - good market opportunity');
        }
        
        if (product.supplierPrice < 10) {
            recommendations.push('Low cost - consider bulk pricing strategy');
        }
        
        if (!product.images || product.images.length < 5) {
            recommendations.push('Add more product images');
        }
        
        if (!product.description || product.description.length < 200) {
            recommendations.push('Improve product description');
        }
        
        return recommendations;
    }

    async categorizeProduct(product) {
        const title = (product.title || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const text = `${title} ${description}`;
        
        const categories = {
            'Electronics': ['phone', 'laptop', 'computer', 'tablet', 'headphone', 'speaker', 'camera', 'tv', 'smart', 'electronic'],
            'Apparel': ['shirt', 'pants', 'dress', 'shoes', 'clothing', 'fashion', 'wear', 't-shirt', 'jacket', 'jeans'],
            'Home & Garden': ['furniture', 'decor', 'kitchen', 'bedroom', 'living room', 'garden', 'home', 'house'],
            'Beauty & Personal Care': ['makeup', 'skincare', 'cosmetic', 'beauty', 'hair', 'face', 'body', 'cream'],
            'Toys & Games': ['toy', 'game', 'play', 'kid', 'child', 'baby', 'puzzle', 'lego'],
            'Sports & Outdoors': ['sport', 'fitness', 'outdoor', 'exercise', 'gym', 'camping', 'hiking'],
            'Automotive': ['car', 'auto', 'vehicle', 'motorcycle', 'parts', 'accessories'],
            'Books & Media': ['book', 'movie', 'music', 'cd', 'dvd', 'media'],
            'Health & Medical': ['health', 'medical', 'medicine', 'supplement', 'vitamin'],
            'Industrial & Business': ['industrial', 'business', 'office', 'equipment', 'machinery']
        };
        
        let bestCategory = 'Other';
        let bestScore = 0;
        
        for (const [category, keywords] of Object.entries(categories)) {
            const score = keywords.reduce((acc, keyword) => {
                return acc + (text.includes(keyword) ? 1 : 0);
            }, 0);
            
            if (score > bestScore) {
                bestScore = score;
                bestCategory = category;
            }
        }
        
        return bestCategory;
    }

    checkIfNew(uploadDate) {
        if (!uploadDate) return false;
        
        const upload = new Date(uploadDate);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        return upload > twentyFourHoursAgo;
    }

    generatePromoCode() {
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `JEANTRAIL-NEW-${random}`;
    }

    async extractUploadDate(page, platform) {
        try {
            const date = await page.evaluate((platform) => {
                const selectors = {
                    alibaba: [
                        '.product-date',
                        '[data-date]',
                        '.upload-time',
                        '.publish-date'
                    ],
                    '1688': [
                        '.date-published',
                        '.product-time',
                        '[data-time]'
                    ]
                };
                
                const platformSelectors = selectors[platform] || [];
                
                for (const selector of platformSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        const dateText = element.textContent || element.getAttribute('data-date') || element.getAttribute('data-time');
                        if (dateText) {
                            // Try to parse the date
                            const date = new Date(dateText);
                            if (!isNaN(date.getTime())) {
                                return date.toISOString();
                            }
                        }
                    }
                }
                
                return null;
            }, platform);
            
            return date;
        } catch (error) {
            console.warn(`Could not extract upload date: ${error.message}`);
            return null;
        }
    }

    async takeScreenshot(page, productId) {
        try {
            const screenshotPath = path.join(this.options.outputDir, 'screenshots', `${productId}.png`);
            await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
            await page.screenshot({ path: screenshotPath, fullPage: true });
            return screenshotPath;
        } catch (error) {
            console.warn(`Could not take screenshot: ${error.message}`);
            return null;
        }
    }

    async waitForContent(page, platform) {
        const waitSelectors = this.getWaitSelectors(platform);
        
        for (const selector of waitSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                break;
            } catch (e) {
                // Continue to next selector
            }
        }
        
        // Additional wait for dynamic content
        await page.waitForTimeout(2000);
    }

    detectPlatform(url) {
        if (url.includes('1688.com')) return '1688';
        if (url.includes('alibaba.com')) return 'alibaba';
        if (url.includes('aliexpress.com')) return 'aliexpress';
        if (url.includes('amazon.com')) return 'amazon';
        return 'unknown';
    }

    generateProductId(product) {
        const hash = crypto.createHash('md5');
        hash.update(`${product.title}-${product.sourceUrl}-${Date.now()}`);
        return hash.digest('hex').substring(0, 12);
    }

    extractSourceProductId(url, platform) {
        const patterns = {
            alibaba: /\/product\/(\d+)/,
            '1688': /\/offer\/(\d+)/,
            aliexpress: /\/item\/(\d+)/,
            amazon: /\/dp\/(\w+)/
        };
        
        const pattern = patterns[platform];
        if (pattern) {
            const match = url.match(pattern);
            return match ? match[1] : null;
        }
        
        return null;
    }

    getSelectors(platform) {
        const selectors = {
            alibaba: {
                title: '.product-title, h1',
                description: '.product-description, .description-content',
                images: '.product-gallery img, .image-gallery img',
                price: '.product-price, .price-current',
                priceRange: '.price-range',
                minPrice: '.price-min',
                maxPrice: '.price-max',
                currency: '.currency-symbol',
                sku: '[data-sku], .product-sku',
                brand: '.brand-name, .product-brand',
                moq: '.moq, .min-order',
                specifications: '.spec-table tr, .product-specs tr',
                variants: '.product-variants, .variant-options',
                variantType: '.variant-type',
                variantOptions: '.variant-option'
            },
            '1688': {
                title: '.d-title, h1',
                description: '.d-detail, .description',
                images: '.d-gallery img',
                price: '.d-price, .price',
                priceRange: '.price-range',
                currency: '.currency',
                sku: '[data-sku]',
                brand: '.brand',
                moq: '.moq',
                specifications: '.attribute tr',
                variants: '.sku-attr',
                variantType: '.attr-name',
                variantOptions: '.attr-value'
            }
        };
        
        return selectors[platform] || selectors.alibaba;
    }

    getSupplierSelectors(platform) {
        const selectors = {
            alibaba: {
                name: '.supplier-name, .company-name',
                companyName: '.company-title',
                email: '[href^="mailto:"]',
                phone: '.supplier-phone',
                location: '.supplier-location',
                yearsOnPlatform: '.years-on-platform',
                rating: '.supplier-rating',
                responseRate: '.response-rate',
                responseTime: '.response-time',
                transactions: '.total-transactions',
                verified: '.verified-badge, .verified-supplier'
            },
            '1688': {
                name: '.company-name',
                companyName: '.corp-name',
                email: '[href^="mailto:"]',
                phone: '.phone',
                location: '.location',
                yearsOnPlatform: '.years',
                rating: '.rate',
                responseRate: '.response',
                verified: '.verified'
            }
        };
        
        return selectors[platform] || selectors.alibaba;
    }

    getWaitSelectors(platform) {
        const selectors = {
            alibaba: ['.product-title', '.product-price'],
            '1688': ['.d-title', '.d-price']
        };
        
        return selectors[platform] || ['.product-title'];
    }

    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `products_${timestamp}.json`;
        const filepath = path.join(this.options.outputDir, filename);
        
        const results = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            products: this.products,
            failedUrls: this.failedUrls,
            scraperVersion: '2.0.0'
        };
        
        await fs.writeFile(filepath, JSON.stringify(results, null, 2));
        
        // Also save latest copy
        const latestPath = path.join(this.options.outputDir, 'latest_products.json');
        await fs.writeFile(latestPath, JSON.stringify(results, null, 2));
        
        console.log(`💾 Results saved to ${filepath}`);
        console.log(`📊 Total products extracted: ${this.products.length}`);
        
        return filepath;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// CLI interface
async function main() {
    const urls = process.argv.slice(2);
    
    if (urls.length === 0) {
        console.error('Usage: node scrape_products.js <url1> <url2> ...');
        process.exit(1);
    }
    
    const scraper = new ProductScraper({
        concurrency: 2,
        headless: true,
        screenshots: true,
        debug: process.argv.includes('--debug')
    });
    
    try {
        await scraper.initialize();
        await scraper.scrapeUrls(urls);
        const resultFile = await scraper.saveResults();
        console.log(`✅ Scraping completed. Results saved to: ${resultFile}`);
    } catch (error) {
        console.error('❌ Scraping failed:', error);
        process.exit(1);
    } finally {
        await scraper.cleanup();
    }
}

// Export for use as module
module.exports = ProductScraper;

if (require.main === module) {
    main().catch(console.error);
}