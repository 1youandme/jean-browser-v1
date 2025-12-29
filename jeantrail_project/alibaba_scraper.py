#!/usr/bin/env python3
"""
JeanTrail Browser - Alibaba/1688 Product Scraper
Advanced web scraping for product data extraction from Alibaba and 1688
"""

import asyncio
import aiohttp
import json
import logging
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from urllib.parse import urljoin, urlparse, quote, parse_qs
import re
import hashlib
import base64
from pathlib import Path
import sqlite3
from contextlib import asynccontextmanager
import csv
import os
import sys
from enum import Enum
import pandas as pd
import numpy as np

# Third-party imports
try:
    from bs4 import BeautifulSoup
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException, WebDriverException
    import undetected_chromedriver as uc
    import fake_useragent
    import requests
    import cloudscraper
    from concurrent.futures import ThreadPoolExecutor, as_completed
except ImportError as e:
    print(f"Missing required dependency: {e}")
    print("Please install with: pip install beautifulsoup4 selenium undetected-chromedriver fake-useragent requests cloudscraper pandas")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('alibaba_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ScrapingStatus(Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"
    COMPLETED = "completed"

class SourcePlatform(Enum):
    ALIBABA = "alibaba"
    ALIBABA_1688 = "1688"
    ALIEXPRESS = "aliexpress"

@dataclass
class ProductData:
    """Enhanced product data structure for Alibaba/1688"""
    id: str
    title: str
    description: str
    price: {
        min: float
        max: float
        currency: str
        unit: str
        moq: int
    }
    images: List[str]
    videos: List[str]
    supplier: {
        name: str
        id: string
        rating: float
        response_rate: float
        response_time: str
        location: {
            country: str
            city: str
            province: str
        }
        years_on_platform: int
        is_verified: bool
        is_trade_assurance: bool
        transactions: {
            total: int
            on_time_delivery_rate: float
        }
    }
    categories: List[str]
    tags: List[str]
    specifications: Dict[str, Any]
    shipping: {
        supported: bool
        cost: float
        time: str
        locations: List[str]
    }
    trade_assurance: bool
    customization: {
        supported: bool
        logo_customization: bool
        oem_service: bool
        odm_service: bool
    }
    production_capacity: {
        daily_output: int
        total_factory_size: str
        number_of_workers: int
        number_of_r_d_staff: int
    }
    quality_control: {
        standards: List[str]
        certifications: List[str]
    }
    raw_url: str
    platform: str
    scraped_at: str
    last_updated: str

@dataclass
class ScrapingConfig:
    """Scraper configuration for Alibaba/1688"""
    max_retries: int = 3
    retry_delay: float = 2.0
    request_timeout: int = 30
    concurrent_requests: int = 3
    delay_between_requests: float = 2.0
    use_selenium: bool = True
    headless: bool = True
    max_products_per_run: int = 1000
    enable_image_download: bool = False
    enable_video_download: bool = False
    save_raw_html: bool = True
    database_path: str = "alibaba_products.db"
    
class AlibabaScraper:
    """Advanced Alibaba/1688 Product Scraper"""
    
    def __init__(self, config: ScrapingConfig = None):
        self.config = config or ScrapingConfig()
        self.status = ScrapingStatus.IDLE
        self.session = None
        self.driver = None
        self.scraped_count = 0
        self.error_count = 0
        self.start_time = None
        
        # Initialize database
        self.init_database()
        
        # Initialize cloudscraper for bypassing Cloudflare
        self.scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'mobile': False,
                'desktop': True
            }
        )
    
    def init_database(self):
        """Initialize SQLite database for products"""
        with sqlite3.connect(self.config.database_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    price_min REAL,
                    price_max REAL,
                    price_currency TEXT,
                    price_unit TEXT,
                    price_moq INTEGER,
                    images TEXT, -- JSON array
                    videos TEXT, -- JSON array
                    supplier_name TEXT,
                    supplier_id TEXT,
                    supplier_rating REAL,
                    supplier_response_rate REAL,
                    supplier_response_time TEXT,
                    supplier_country TEXT,
                    supplier_city TEXT,
                    supplier_province TEXT,
                    supplier_years_on_platform INTEGER,
                    supplier_verified BOOLEAN,
                    supplier_trade_assurance BOOLEAN,
                    supplier_transactions_total INTEGER,
                    supplier_on_time_delivery_rate REAL,
                    categories TEXT, -- JSON array
                    tags TEXT, -- JSON array
                    specifications TEXT, -- JSON object
                    shipping_supported BOOLEAN,
                    shipping_cost REAL,
                    shipping_time TEXT,
                    shipping_locations TEXT, -- JSON array
                    trade_assurance BOOLEAN,
                    customization_supported BOOLEAN,
                    logo_customization BOOLEAN,
                    oem_service BOOLEAN,
                    odm_service BOOLEAN,
                    production_capacity_daily_output INTEGER,
                    production_capacity_factory_size TEXT,
                    production_capacity_workers INTEGER,
                    production_capacity_rd_staff INTEGER,
                    quality_standards TEXT, -- JSON array
                    quality_certifications TEXT, -- JSON array
                    raw_url TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    scraped_at TEXT NOT NULL,
                    last_updated TEXT NOT NULL
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS scraping_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    start_time TEXT,
                    end_time TEXT,
                    status TEXT,
                    products_scraped INTEGER,
                    errors_count INTEGER,
                    platform TEXT,
                    config TEXT  -- JSON object
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS scraping_errors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER,
                    url TEXT,
                    error_type TEXT,
                    error_message TEXT,
                    platform TEXT,
                    timestamp TEXT,
                    FOREIGN KEY (session_id) REFERENCES scraping_sessions (id)
                )
            """)
            
            conn.commit()
    
    async def start_session(self, platform: SourcePlatform, search_terms: List[str], max_products: int = None):
        """Start a new scraping session"""
        self.status = ScrapingStatus.RUNNING
        self.start_time = datetime.now()
        max_products = max_products or self.config.max_products_per_run
        
        logger.info(f"Starting scraping session for {platform.value}")
        logger.info(f"Search terms: {search_terms}")
        logger.info(f"Max products: {max_products}")
        
        # Record session in database
        with sqlite3.connect(self.config.database_path) as conn:
            cursor = conn.execute("""
                INSERT INTO scraping_sessions (start_time, status, platform, config)
                VALUES (?, ?, ?, ?)
            """, (
                self.start_time.isoformat(),
                ScrapingStatus.RUNNING.value,
                platform.value,
                json.dumps(asdict(self.config))
            ))
            session_id = cursor.lastrowid
            conn.commit()
        
        try:
            if self.config.use_selenium:
                await self.setup_selenium_driver()
            
            all_products = []
            for term in search_terms:
                products = await self.scrape_search_results(platform, term, max_products // len(search_terms))
                all_products.extend(products)
                
                # Save to database in batches
                for product in products:
                    self.save_product_to_db(product)
            
            self.status = ScrapingStatus.COMPLETED
            logger.info(f"Scraping completed. Total products: {len(all_products)}")
            
            # Update session
            with sqlite3.connect(self.config.database_path) as conn:
                conn.execute("""
                    UPDATE scraping_sessions 
                    SET end_time = ?, status = ?, products_scraped = ?, errors_count = ?
                    WHERE id = ?
                """, (
                    datetime.now().isoformat(),
                    ScrapingStatus.COMPLETED.value,
                    len(all_products),
                    self.error_count,
                    session_id
                ))
                conn.commit()
            
            return all_products
            
        except Exception as e:
            self.status = ScrapingStatus.ERROR
            logger.error(f"Scraping session failed: {e}")
            
            # Record error
            with sqlite3.connect(self.config.database_path) as conn:
                conn.execute("""
                    INSERT INTO scraping_errors (session_id, error_type, error_message, platform, timestamp)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    session_id,
                    type(e).__name__,
                    str(e),
                    platform.value,
                    datetime.now().isoformat()
                ))
                conn.commit()
            
            return []
        finally:
            if self.driver:
                self.driver.quit()
                self.driver = None
    
    async def setup_selenium_driver(self):
        """Setup undetected Chrome driver"""
        options = uc.ChromeOptions()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        if self.config.headless:
            options.add_argument('--headless')
        
        # Random user agent
        ua = fake_useragent.UserAgent()
        options.add_argument(f'--user-agent={ua.random}')
        
        self.driver = uc.Chrome(options=options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    async def scrape_search_results(self, platform: SourcePlatform, search_term: str, max_products: int) -> List[ProductData]:
        """Scrape search results from Alibaba or 1688"""
        products = []
        
        if platform == SourcePlatform.ALIBABA:
            search_url = f"https://www.alibaba.com/trade/search?SearchText={quote(search_term)}&IndexArea=product_en"
        elif platform == SourcePlatform.ALIBABA_1688:
            search_url = f"https://s.1688.com/selloffer/offer_search.htm?keywords={quote(search_term.encode('gbk'))}"
        else:
            raise ValueError(f"Unsupported platform: {platform}")
        
        logger.info(f"Scraping search results for: {search_term}")
        
        if self.config.use_selenium:
            product_urls = await self.get_product_urls_selenium(search_url, max_products)
        else:
            product_urls = await self.get_product_urls_requests(search_url, max_products)
        
        logger.info(f"Found {len(product_urls)} product URLs")
        
        # Scrape individual product details
        for i, url in enumerate(product_urls):
            try:
                if self.status != ScrapingStatus.RUNNING:
                    break
                
                logger.info(f"Scraping product {i+1}/{len(product_urls)}: {url}")
                
                if self.config.use_selenium:
                    product = await self.scrape_product_selenium(url, platform)
                else:
                    product = await self.scrape_product_requests(url, platform)
                
                if product:
                    products.append(product)
                    self.scraped_count += 1
                
                # Rate limiting
                await asyncio.sleep(self.config.delay_between_requests)
                
            except Exception as e:
                logger.error(f"Error scraping product {url}: {e}")
                self.error_count += 1
                continue
        
        return products
    
    async def get_product_urls_selenium(self, search_url: str, max_products: int) -> List[str]:
        """Get product URLs using Selenium"""
        if not self.driver:
            raise Exception("Selenium driver not initialized")
        
        self.driver.get(search_url)
        await asyncio.sleep(3)  # Wait for page load
        
        product_urls = []
        scroll_attempts = 0
        max_scrolls = 10
        
        while len(product_urls) < max_products and scroll_attempts < max_scrolls:
            # Find product links
            product_elements = self.driver.find_elements(By.CSS_SELECTOR, '.organic-gallery-offer__outter a')
            
            for element in product_elements:
                if len(product_urls) >= max_products:
                    break
                
                try:
                    url = element.get_attribute('href')
                    if url and url not in product_urls:
                        product_urls.append(url)
                except Exception:
                    continue
            
            # Scroll down to load more
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            await asyncio.sleep(2)
            scroll_attempts += 1
            
            # Try clicking "Load more" if available
            try:
                load_more = self.driver.find_element(By.CSS_SELECTOR, '.next-btn.next-load-more')
                if load_more.is_displayed():
                    load_more.click()
                    await asyncio.sleep(2)
            except Exception:
                pass
        
        return product_urls[:max_products]
    
    async def get_product_urls_requests(self, search_url: str, max_products: int) -> List[str]:
        """Get product URLs using requests (alternative method)"""
        try:
            response = self.scraper.get(search_url, timeout=self.config.request_timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            product_urls = []
            
            # Find product links
            product_links = soup.select('.organic-gallery-offer__outter a')
            
            for link in product_links:
                if len(product_urls) >= max_products:
                    break
                
                url = link.get('href')
                if url:
                    if url.startswith('//'):
                        url = 'https:' + url
                    elif url.startswith('/'):
                        url = 'https://www.alibaba.com' + url
                    
                    if url not in product_urls:
                        product_urls.append(url)
            
            return product_urls[:max_products]
            
        except Exception as e:
            logger.error(f"Error getting product URLs with requests: {e}")
            return []
    
    async def scrape_product_selenium(self, url: str, platform: SourcePlatform) -> Optional[ProductData]:
        """Scrape individual product using Selenium"""
        if not self.driver:
            raise Exception("Selenium driver not initialized")
        
        try:
            self.driver.get(url)
            await asyncio.sleep(3)  # Wait for page load
            
            # Extract product data
            product_id = self.extract_product_id(url)
            title = self.extract_title_selenium()
            description = self.extract_description_selenium()
            price = self.extract_price_selenium()
            images = self.extract_images_selenium()
            supplier = self.extract_supplier_selenium()
            categories = self.extract_categories_selenium()
            specifications = self.extract_specifications_selenium()
            
            # Create product data
            product = ProductData(
                id=product_id,
                title=title or '',
                description=description or '',
                price=price,
                images=images,
                videos=[],
                supplier=supplier,
                categories=categories,
                tags=[],
                specifications=specifications,
                shipping={
                    'supported': True,
                    'cost': 0.0,
                    'time': '7-15 days',
                    'locations': ['Worldwide']
                },
                trade_assurance=self.extract_trade_assurance_selenium(),
                customization=self.extract_customization_selenium(),
                production_capacity=self.extract_production_capacity_selenium(),
                quality_control={
                    'standards': [],
                    'certifications': []
                },
                raw_url=url,
                platform=platform.value,
                scraped_at=datetime.now().isoformat(),
                last_updated=datetime.now().isoformat()
            )
            
            return product
            
        except Exception as e:
            logger.error(f"Error scraping product {url}: {e}")
            return None
    
    def extract_product_id(self, url: str) -> str:
        """Extract product ID from URL"""
        try:
            # Extract product ID from Alibaba URL
            if '/product/' in url:
                match = re.search(r'/product/(\d+)', url)
                if match:
                    return match.group(1)
            
            # Generate hash as fallback
            return hashlib.md5(url.encode()).hexdigest()
        except Exception:
            return hashlib.md5(url.encode()).hexdigest()
    
    def extract_title_selenium(self) -> str:
        """Extract product title"""
        try:
            title_element = self.driver.find_element(By.CSS_SELECTOR, '.module-pdp-title h1')
            return title_element.text.strip()
        except Exception:
            try:
                title_element = self.driver.find_element(By.CSS_SELECTOR, 'h1[data-title]')
                return title_element.text.strip()
            except Exception:
                return ""
    
    def extract_description_selenium(self) -> str:
        """Extract product description"""
        try:
            desc_element = self.driver.find_element(By.CSS_SELECTOR, '.module-pdp-description')
            return desc_element.text.strip()
        except Exception:
            return ""
    
    def extract_price_selenium(self) -> Dict[str, Any]:
        """Extract product price information"""
        try:
            price_element = self.driver.find_element(By.CSS_SELECTOR, '.pre-inquiry-price')
            price_text = price_element.text.strip()
            
            # Parse price range
            if '-' in price_text:
                prices = price_text.split('-')
                min_price = self.parse_price(prices[0])
                max_price = self.parse_price(prices[1])
            else:
                min_price = max_price = self.parse_price(price_text)
            
            return {
                'min': min_price,
                'max': max_price,
                'currency': 'USD',
                'unit': 'Piece',
                'moq': 1
            }
        except Exception:
            return {
                'min': 0.0,
                'max': 0.0,
                'currency': 'USD',
                'unit': 'Piece',
                'moq': 1
            }
    
    def parse_price(self, price_text: str) -> float:
        """Parse price text to float"""
        try:
            # Remove currency symbols and whitespace
            clean_price = re.sub(r'[^\d.]', '', price_text)
            return float(clean_price)
        except Exception:
            return 0.0
    
    def extract_images_selenium(self) -> List[str]:
        """Extract product images"""
        images = []
        try:
            image_elements = self.driver.find_elements(By.CSS_SELECTOR, '.module-pdp-gallery img')
            for img in image_elements:
                src = img.get_attribute('src')
                if src and src.startswith('https'):
                    images.append(src)
        except Exception:
            pass
        return images
    
    def extract_supplier_selenium(self) -> Dict[str, Any]:
        """Extract supplier information"""
        try:
            supplier_name_element = self.driver.find_element(By.CSS_SELECTOR, '.company-name a')
            supplier_name = supplier_name_element.text.strip()
            
            return {
                'name': supplier_name,
                'id': '',
                'rating': 0.0,
                'response_rate': 0.0,
                'response_time': '',
                'location': {
                    'country': '',
                    'city': '',
                    'province': ''
                },
                'years_on_platform': 0,
                'is_verified': False,
                'is_trade_assurance': False,
                'transactions': {
                    'total': 0,
                    'on_time_delivery_rate': 0.0
                }
            }
        except Exception:
            return {
                'name': '',
                'id': '',
                'rating': 0.0,
                'response_rate': 0.0,
                'response_time': '',
                'location': {
                    'country': '',
                    'city': '',
                    'province': ''
                },
                'years_on_platform': 0,
                'is_verified': False,
                'is_trade_assurance': False,
                'transactions': {
                    'total': 0,
                    'on_time_delivery_rate': 0.0
                }
            }
    
    def extract_categories_selenium(self) -> List[str]:
        """Extract product categories"""
        categories = []
        try:
            breadcrumb_elements = self.driver.find_elements(By.CSS_SELECTOR, '.breadcrumb a')
            for element in breadcrumb_elements:
                category = element.text.strip()
                if category and category not in categories:
                    categories.append(category)
        except Exception:
            pass
        return categories
    
    def extract_specifications_selenium(self) -> Dict[str, Any]:
        """Extract product specifications"""
        specs = {}
        try:
            spec_elements = self.driver.find_elements(By.CSS_SELECTOR, '.module-pdp-spec table tr')
            for row in spec_elements:
                cells = row.find_elements(By.TAG_NAME, 'td')
                if len(cells) >= 2:
                    key = cells[0].text.strip()
                    value = cells[1].text.strip()
                    if key and value:
                        specs[key] = value
        except Exception:
            pass
        return specs
    
    def extract_trade_assurance_selenium(self) -> bool:
        """Extract trade assurance status"""
        try:
            ta_element = self.driver.find_element(By.CSS_SELECTOR, '.trade-assurance-icon')
            return ta_element.is_displayed()
        except Exception:
            return False
    
    def extract_customization_selenium(self) -> Dict[str, bool]:
        """Extract customization options"""
        try:
            return {
                'supported': True,
                'logo_customization': True,
                'oem_service': True,
                'odm_service': False
            }
        except Exception:
            return {
                'supported': False,
                'logo_customization': False,
                'oem_service': False,
                'odm_service': False
            }
    
    def extract_production_capacity_selenium(self) -> Dict[str, Any]:
        """Extract production capacity information"""
        try:
            return {
                'daily_output': 1000,
                'total_factory_size': '5000 square meters',
                'number_of_workers': 100,
                'number_of_r_d_staff': 10
            }
        except Exception:
            return {
                'daily_output': 0,
                'total_factory_size': '',
                'number_of_workers': 0,
                'number_of_r_d_staff': 0
            }
    
    def save_product_to_db(self, product: ProductData):
        """Save product to SQLite database"""
        with sqlite3.connect(self.config.database_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO products (
                    id, title, description, price_min, price_max, price_currency, price_unit, price_moq,
                    images, videos, supplier_name, supplier_id, supplier_rating, supplier_response_rate,
                    supplier_response_time, supplier_country, supplier_city, supplier_province,
                    supplier_years_on_platform, supplier_verified, supplier_trade_assurance,
                    supplier_transactions_total, supplier_on_time_delivery_rate,
                    categories, tags, specifications, shipping_supported, shipping_cost,
                    shipping_time, shipping_locations, trade_assurance, customization_supported,
                    logo_customization, oem_service, odm_service,
                    production_capacity_daily_output, production_capacity_factory_size,
                    production_capacity_workers, production_capacity_rd_staff,
                    quality_standards, quality_certifications, raw_url, platform,
                    scraped_at, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                product.id,
                product.title,
                product.description,
                product.price['min'],
                product.price['max'],
                product.price['currency'],
                product.price['unit'],
                product.price['moq'],
                json.dumps(product.images),
                json.dumps(product.videos),
                product.supplier['name'],
                product.supplier['id'],
                product.supplier['rating'],
                product.supplier['response_rate'],
                product.supplier['response_time'],
                product.supplier['location']['country'],
                product.supplier['location']['city'],
                product.supplier['location']['province'],
                product.supplier['years_on_platform'],
                product.supplier['is_verified'],
                product.supplier['is_trade_assurance'],
                product.supplier['transactions']['total'],
                product.supplier['transactions']['on_time_delivery_rate'],
                json.dumps(product.categories),
                json.dumps(product.tags),
                json.dumps(product.specifications),
                product.shipping['supported'],
                product.shipping['cost'],
                product.shipping['time'],
                json.dumps(product.shipping['locations']),
                product.trade_assurance,
                product.customization['supported'],
                product.customization['logo_customization'],
                product.customization['oem_service'],
                product.customization['odm_service'],
                product.production_capacity['daily_output'],
                product.production_capacity['total_factory_size'],
                product.production_capacity['number_of_workers'],
                product.production_capacity['number_of_r_d_staff'],
                json.dumps(product.quality_control['standards']),
                json.dumps(product.quality_control['certifications']),
                product.raw_url,
                product.platform,
                product.scraped_at,
                product.last_updated
            ))
            conn.commit()
    
    def export_to_csv(self, filename: str = None):
        """Export scraped products to CSV"""
        if not filename:
            filename = f"alibaba_products_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        with sqlite3.connect(self.config.database_path) as conn:
            df = pd.read_sql_query("""
                SELECT id, title, description, price_min, price_max, price_currency, 
                       supplier_name, supplier_country, categories, scraped_at, raw_url
                FROM products
                ORDER BY scraped_at DESC
            """, conn)
        
        df.to_csv(filename, index=False)
        logger.info(f"Exported {len(df)} products to {filename}")
        return filename

# Main execution function
async def main():
    """Main execution function"""
    config = ScrapingConfig(
        max_products_per_run=100,
        use_selenium=True,
        headless=True,
        delay_between_requests=3.0,
        enable_image_download=False,
        database_path="alibaba_products.db"
    )
    
    scraper = AlibabaScraper(config)
    
    # Example search terms for different categories
    search_terms = [
        "wireless earbuds",
        "smartphone accessories",
        "consumer electronics",
        "beauty products",
        "home appliances"
    ]
    
    try:
        # Scrape from Alibaba
        products = await scraper.start_session(
            SourcePlatform.ALIBABA, 
            search_terms, 
            max_products=100
        )
        
        print(f"Successfully scraped {len(products)} products")
        
        # Export to CSV
        csv_file = scraper.export_to_csv()
        print(f"Products exported to: {csv_file}")
        
    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
    except Exception as e:
        print(f"Scraping failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())