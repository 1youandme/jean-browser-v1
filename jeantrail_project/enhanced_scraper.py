#!/usr/bin/env python3
"""
Enhanced Product Scraper for JeanTrail Browser
Advanced web scraping with multi-account support, error handling, and data extraction
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
from urllib.parse import urljoin, urlparse
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
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    import smtplib
    from concurrent.futures import ThreadPoolExecutor, as_completed
    import pandas as pd
    import numpy as np
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except ImportError as e:
    print(f"Missing required dependency: {e}")
    print("Please install with: pip install beautifulsoup4 selenium undetected-chromedriver fake-useragent requests pandas numpy google-api-python-client google-auth-httplib2 google-auth-oauthlib")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('enhanced_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ScraperStatus(Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"
    COMPLETED = "completed"

@dataclass
class ProductData:
    """Enhanced product data structure"""
    id: str
    title: str
    description: str
    price: float
    currency: str
    availability: str
    rating: Optional[float]
    reviews_count: Optional[int]
    images: List[str]
    categories: List[str]
    tags: List[str]
    seller: str
    seller_url: Optional[str]
    upload_date: Optional[datetime]
    last_updated: datetime
    url: str
    source: str
    specifications: Dict[str, Any]
    shipping_info: Dict[str, Any]
    variant_info: Dict[str, Any]
    metadata: Dict[str, Any]

@dataclass
class ScraperConfig:
    """Scraper configuration"""
    max_retries: int = 3
    retry_delay: float = 2.0
    request_timeout: int = 30
    concurrent_requests: int = 5
    delay_between_requests: float = 1.0
    use_proxies: bool = True
    use_selenium: bool = False
    headless: bool = True
    max_products_per_run: int = 100
    enable_categorization: bool = True
    save_images: bool = False
    enable_notifications: bool = True

@dataclass
class ProxyConfig:
    """Proxy configuration"""
    enabled: bool = False
    proxy_list: List[str] = None
    rotation_enabled: bool = True
    current_proxy_index: int = 0

@dataclass
class GmailConfig:
    """Gmail configuration for multiple accounts"""
    credentials_file: str = 'credentials.json'
    token_file: str = 'token.json'
    accounts: List[Dict[str, str]] = None
    current_account_index: int = 0

class ProxyManager:
    """Proxy rotation and management"""
    
    def __init__(self, proxy_config: ProxyConfig):
        self.config = proxy_config
        self.failed_proxies = set()
        
    def get_proxy(self) -> Optional[str]:
        """Get next available proxy"""
        if not self.config.enabled or not self.config.proxy_list:
            return None
            
        available_proxies = [
            proxy for proxy in self.config.proxy_list 
            if proxy not in self.failed_proxies
        ]
        
        if not available_proxies:
            logger.warning("No available proxies")
            return None
            
        if self.config.rotation_enabled:
            proxy = available_proxies[self.config.current_proxy_index % len(available_proxies)]
            self.config.current_proxy_index += 1
        else:
            proxy = random.choice(available_proxies)
            
        return proxy
    
    def mark_proxy_failed(self, proxy: str):
        """Mark proxy as failed"""
        self.failed_proxies.add(proxy)
        logger.warning(f"Proxy marked as failed: {proxy}")
    
    def reset_failed_proxies(self):
        """Reset failed proxy list"""
        self.failed_proxies.clear()

class DatabaseManager:
    """SQLite database management for products and scraping sessions"""
    
    def __init__(self, db_path: str = "products.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database tables"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    price REAL,
                    currency TEXT,
                    availability TEXT,
                    rating REAL,
                    reviews_count INTEGER,
                    images TEXT,  -- JSON array
                    categories TEXT,  -- JSON array
                    tags TEXT,  -- JSON array
                    seller TEXT,
                    seller_url TEXT,
                    upload_date TEXT,
                    last_updated TEXT,
                    url TEXT NOT NULL,
                    source TEXT NOT NULL,
                    specifications TEXT,  -- JSON object
                    shipping_info TEXT,  -- JSON object
                    variant_info TEXT,  -- JSON object
                    metadata TEXT  -- JSON object
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
                    source TEXT,
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
                    timestamp TEXT,
                    FOREIGN KEY (session_id) REFERENCES scraping_sessions (id)
                )
            """)
            
            conn.commit()
    
    def save_product(self, product: ProductData) -> bool:
        """Save product to database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO products 
                    (id, title, description, price, currency, availability, rating, 
                     reviews_count, images, categories, tags, seller, seller_url, 
                     upload_date, last_updated, url, source, specifications, 
                     shipping_info, variant_info, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    product.id,
                    product.title,
                    product.description,
                    product.price,
                    product.currency,
                    product.availability,
                    product.rating,
                    product.reviews_count,
                    json.dumps(product.images),
                    json.dumps(product.categories),
                    json.dumps(product.tags),
                    product.seller,
                    product.seller_url,
                    product.upload_date.isoformat() if product.upload_date else None,
                    product.last_updated.isoformat(),
                    product.url,
                    product.source,
                    json.dumps(product.specifications),
                    json.dumps(product.shipping_info),
                    json.dumps(product.variant_info),
                    json.dumps(product.metadata)
                ))
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to save product: {e}")
            return False
    
    def get_products(self, limit: Optional[int] = None, source: Optional[str] = None) -> List[ProductData]:
        """Get products from database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                query = "SELECT * FROM products"
                params = []
                
                if source:
                    query += " WHERE source = ?"
                    params.append(source)
                
                if limit:
                    query += " LIMIT ?"
                    params.append(limit)
                
                cursor = conn.execute(query, params)
                products = []
                
                for row in cursor.fetchall():
                    products.append(ProductData(
                        id=row[0],
                        title=row[1],
                        description=row[2],
                        price=row[3],
                        currency=row[4],
                        availability=row[5],
                        rating=row[6],
                        reviews_count=row[7],
                        images=json.loads(row[8]) if row[8] else [],
                        categories=json.loads(row[9]) if row[9] else [],
                        tags=json.loads(row[10]) if row[10] else [],
                        seller=row[11],
                        seller_url=row[12],
                        upload_date=datetime.fromisoformat(row[13]) if row[13] else None,
                        last_updated=datetime.fromisoformat(row[14]),
                        url=row[15],
                        source=row[16],
                        specifications=json.loads(row[17]) if row[17] else {},
                        shipping_info=json.loads(row[18]) if row[18] else {},
                        variant_info=json.loads(row[19]) if row[19] else {},
                        metadata=json.loads(row[20]) if row[20] else {}
                    ))
                
                return products
        except Exception as e:
            logger.error(f"Failed to get products: {e}")
            return []

class GmailManager:
    """Gmail API manager for multiple accounts"""
    
    def __init__(self, config: GmailConfig):
        self.config = config
        self.current_credentials = None
        self.service = None
    
    def authenticate(self, account_index: int = 0) -> bool:
        """Authenticate with Gmail API"""
        try:
            if not self.config.accounts or account_index >= len(self.config.accounts):
                logger.error("Invalid account index")
                return False
            
            account = self.config.accounts[account_index]
            
            creds = None
            if os.path.exists(self.config.token_file):
                creds = Credentials.from_authorized_user_file(self.config.token_file)
            
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.config.credentials_file,
                        ['https://www.googleapis.com/auth/gmail.send']
                    )
                    creds = flow.run_local_server(port=0)
                
                with open(self.config.token_file, 'w') as token:
                    token.write(creds.to_json())
            
            self.current_credentials = creds
            self.service = build('gmail', 'v1', credentials=creds)
            self.config.current_account_index = account_index
            
            logger.info(f"Authenticated with Gmail account: {account['email']}")
            return True
            
        except Exception as e:
            logger.error(f"Gmail authentication failed: {e}")
            return False
    
    def send_email(self, to: str, subject: str, body: str, is_html: bool = False) -> bool:
        """Send email via Gmail API"""
        try:
            if not self.service:
                if not self.authenticate(self.config.current_account_index):
                    return False
            
            message = MIMEMultipart()
            message['to'] = to
            message['subject'] = subject
            
            if is_html:
                message.attach(MIMEText(body, 'html'))
            else:
                message.attach(MIMEText(body, 'plain'))
            
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            self.service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            logger.info(f"Email sent successfully to {to}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    def rotate_account(self) -> bool:
        """Rotate to next Gmail account"""
        next_index = (self.config.current_account_index + 1) % len(self.config.accounts)
        return self.authenticate(next_index)

class ProductCategorizer:
    """Automatic product categorization using keywords and patterns"""
    
    def __init__(self):
        self.category_keywords = {
            'electronics': [
                'phone', 'laptop', 'computer', 'tablet', 'tv', 'camera', 'headphone',
                'speaker', 'watch', 'gadget', 'smartphone', 'notebook', 'monitor'
            ],
            'clothing': [
                'shirt', 'pants', 'dress', 'jacket', 'coat', 'shoes', 'boots',
                'sneakers', 't-shirt', 'jeans', 'skirt', 'blouse', 'sweater'
            ],
            'home': [
                'furniture', 'sofa', 'chair', 'table', 'bed', 'mattress', 'lamp',
                'decor', 'kitchen', 'appliance', 'vacuum', 'cleaning', 'storage'
            ],
            'beauty': [
                'makeup', 'cosmetic', 'skincare', 'cream', 'lotion', 'perfume',
                'shampoo', 'hair', 'beauty', 'face', 'body', 'nail'
            ],
            'sports': [
                'fitness', 'gym', 'exercise', 'sport', 'outdoor', 'bike', 'running',
                'yoga', 'training', 'equipment', 'gear', 'athletic'
            ],
            'books': [
                'book', 'novel', 'textbook', 'magazine', 'comics', 'ebook',
                'reading', 'literature', 'fiction', 'non-fiction'
            ],
            'toys': [
                'toy', 'game', 'puzzle', 'lego', 'doll', 'action figure', 'board game',
                'educational', 'kids', 'children', 'play'
            ],
            'automotive': [
                'car', 'auto', 'vehicle', 'motorcycle', 'parts', 'accessories',
                'tires', 'engine', 'battery', 'oil', 'maintenance'
            ]
        }
    
    def categorize_product(self, title: str, description: str = "") -> List[str]:
        """Categorize product based on title and description"""
        text = f"{title} {description}".lower()
        categories = []
        
        for category, keywords in self.category_keywords.items():
            if any(keyword in text for keyword in keywords):
                categories.append(category)
        
        # If no categories found, assign 'other'
        if not categories:
            categories.append('other')
        
        return categories
    
    def extract_tags(self, title: str, description: str = "") -> List[str]:
        """Extract tags from product text"""
        text = f"{title} {description}".lower()
        
        # Extract potential tags (single words, brands, etc.)
        words = re.findall(r'\b\w+\b', text)
        
        # Filter common stop words and short words
        stop_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        tags = [word for word in words if len(word) > 3 and word not in stop_words]
        
        # Remove duplicates and limit to 10 tags
        tags = list(set(tags))[:10]
        
        return tags

class EnhancedProductScraper:
    """Enhanced product scraper with all advanced features"""
    
    def __init__(self, config: ScraperConfig = None):
        self.config = config or ScraperConfig()
        self.status = ScraperStatus.IDLE
        self.proxy_manager = ProxyManager(ProxyConfig())
        self.db_manager = DatabaseManager()
        self.gmail_manager = GmailManager(GmailConfig())
        self.categorizer = ProductCategorizer()
        self.session_stats = {
            'start_time': None,
            'end_time': None,
            'products_scraped': 0,
            'errors_count': 0,
            'current_session_id': None
        }
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        ]
    
    async def scrape_product_page(self, url: str) -> Optional[ProductData]:
        """Scrape single product page with enhanced features"""
        try:
            # Get proxy
            proxy = self.proxy_manager.get_proxy()
            
            # Prepare headers
            headers = {
                'User-Agent': random.choice(self.user_agents),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            # Make request
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.config.request_timeout),
                headers=headers
            ) as session:
                async with session.get(url, proxy=proxy) as response:
                    if response.status == 200:
                        html = await response.text()
                        return self.parse_product_page(html, url)
                    else:
                        logger.warning(f"HTTP {response.status} for {url}")
                        if proxy:
                            self.proxy_manager.mark_proxy_failed(proxy)
                        return None
                        
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            self.session_stats['errors_count'] += 1
            return None
    
    def parse_product_page(self, html: str, url: str) -> Optional[ProductData]:
        """Parse product page HTML with enhanced extraction"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extract basic information
            title = self.extract_title(soup)
            if not title:
                return None
            
            price = self.extract_price(soup)
            description = self.extract_description(soup)
            availability = self.extract_availability(soup)
            rating = self.extract_rating(soup)
            reviews_count = self.extract_reviews_count(soup)
            images = self.extract_images(soup, url)
            seller = self.extract_seller(soup)
            seller_url = self.extract_seller_url(soup)
            upload_date = self.extract_upload_date(soup)
            specifications = self.extract_specifications(soup)
            shipping_info = self.extract_shipping_info(soup)
            
            # Generate unique ID
            product_id = hashlib.md5(f"{title}{url}".encode()).hexdigest()
            
            # Auto-categorization
            categories = []
            tags = []
            if self.config.enable_categorization:
                categories = self.categorizer.categorize_product(title, description)
                tags = self.categorizer.extract_tags(title, description)
            
            # Create product data
            product = ProductData(
                id=product_id,
                title=title,
                description=description,
                price=price,
                currency='USD',  # Default, can be extracted
                availability=availability,
                rating=rating,
                reviews_count=reviews_count,
                images=images,
                categories=categories,
                tags=tags,
                seller=seller,
                seller_url=seller_url,
                upload_date=upload_date,
                last_updated=datetime.now(),
                url=url,
                source=urlparse(url).netloc,
                specifications=specifications,
                shipping_info=shipping_info,
                variant_info={},  # Can be enhanced later
                metadata={
                    'scraped_at': datetime.now().isoformat(),
                    'scraper_version': '2.0'
                }
            )
            
            return product
            
        except Exception as e:
            logger.error(f"Error parsing product page: {e}")
            return None
    
    def extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract product title"""
        selectors = [
            'h1.product-title',
            'h1[data-testid="product-title"]',
            'h1.pdp-product-title',
            'h1.product-name',
            'h1.title',
            'h1',
            '[data-testid="heading"]',
            '.product-title',
            '.product-name',
            '.title'
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                title = element.get_text(strip=True)
                if len(title) > 10:  # Reasonable title length
                    return title
        
        return None
    
    def extract_price(self, soup: BeautifulSoup) -> float:
        """Extract product price"""
        price_selectors = [
            '.price',
            '.current-price',
            '.product-price',
            '[data-testid="price"]',
            '.price-current',
            '.sale-price',
            '.amount'
        ]
        
        for selector in price_selectors:
            element = soup.select_one(selector)
            if element:
                price_text = element.get_text(strip=True)
                price = self.parse_price(price_text)
                if price > 0:
                    return price
        
        return 0.0
    
    def parse_price(self, price_text: str) -> float:
        """Parse price text to float"""
        # Remove currency symbols and whitespace
        price_text = re.sub(r'[^\d.,]', '', price_text)
        
        # Handle different decimal separators
        if ',' in price_text and '.' in price_text:
            # Assume format like 1,234.56
            price_text = price_text.replace(',', '')
        elif ',' in price_text:
            # Could be 1,234 or 1.234 (depending on locale)
            parts = price_text.split(',')
            if len(parts) == 2 and len(parts[1]) <= 2:
                # Likely decimal separator (e.g., 123,45)
                price_text = price_text.replace(',', '.')
            else:
                # Likely thousand separator
                price_text = price_text.replace(',', '')
        
        try:
            return float(price_text)
        except ValueError:
            return 0.0
    
    def extract_description(self, soup: BeautifulSoup) -> str:
        """Extract product description"""
        desc_selectors = [
            '.product-description',
            '.description',
            '[data-testid="product-description"]',
            '.product-details',
            '.details',
            '.product-content',
            'meta[name="description"]'
        ]
        
        for selector in desc_selectors:
            if selector.startswith('meta'):
                element = soup.select_one(selector)
                if element and element.get('content'):
                    return element.get('content')
            else:
                element = soup.select_one(selector)
                if element:
                    desc = element.get_text(strip=True)
                    if len(desc) > 20:
                        return desc
        
        return ""
    
    def extract_availability(self, soup: BeautifulSoup) -> str:
        """Extract product availability"""
        availability_selectors = [
            '.availability',
            '.stock-status',
            '[data-testid="availability"]',
            '.in-stock',
            '.out-of-stock'
        ]
        
        for selector in availability_selectors:
            element = soup.select_one(selector)
            if element:
                availability = element.get_text(strip=True).lower()
                if 'out of stock' in availability or 'unavailable' in availability:
                    return 'out_of_stock'
                elif 'in stock' in availability or 'available' in availability:
                    return 'in_stock'
                elif 'limited' in availability:
                    return 'limited'
        
        return 'unknown'
    
    def extract_rating(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract product rating"""
        rating_selectors = [
            '.rating',
            '.stars',
            '[data-testid="rating"]',
            '.review-rating',
            '.average-rating'
        ]
        
        for selector in rating_selectors:
            element = soup.select_one(selector)
            if element:
                rating_text = element.get_text(strip=True)
                rating = self.parse_rating(rating_text)
                if rating is not None:
                    return rating
        
        return None
    
    def parse_rating(self, rating_text: str) -> Optional[float]:
        """Parse rating text to float"""
        # Look for patterns like "4.5", "4.5 out of 5", "4.5/5"
        patterns = [
            r'(\d+\.?\d*)\s*out\s*of\s*5',
            r'(\d+\.?\d*)/5',
            r'(\d+\.?\d*)\s*stars?',
            r'^(\d+\.?\d*)$'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, rating_text, re.IGNORECASE)
            if match:
                try:
                    rating = float(match.group(1))
                    if 0 <= rating <= 5:
                        return rating
                except ValueError:
                    continue
        
        return None
    
    def extract_reviews_count(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract reviews count"""
        reviews_selectors = [
            '.reviews-count',
            '.review-count',
            '[data-testid="reviews-count"]',
            '.num-reviews',
            '.reviews'
        ]
        
        for selector in reviews_selectors:
            element = soup.select_one(selector)
            if element:
                reviews_text = element.get_text(strip=True)
                count = self.parse_number(reviews_text)
                if count is not None:
                    return count
        
        return None
    
    def parse_number(self, text: str) -> Optional[int]:
        """Parse number from text"""
        # Remove non-digit characters except for k, m, etc.
        text = re.sub(r'[^\dkm.,]', '', text.lower())
        
        # Handle k (thousands) and m (millions)
        multiplier = 1
        if 'k' in text:
            multiplier = 1000
            text = text.replace('k', '')
        elif 'm' in text:
            multiplier = 1000000
            text = text.replace('m', '')
        
        text = text.replace(',', '')
        
        try:
            return int(float(text) * multiplier)
        except ValueError:
            return None
    
    def extract_images(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract product images"""
        images = []
        
        # Look for product images
        img_selectors = [
            '.product-image img',
            '.gallery img',
            '.carousel img',
            '[data-testid="product-image"]',
            '.main-image img',
            '.product-photo img'
        ]
        
        for selector in img_selectors:
            for img in soup.select(selector):
                src = img.get('src') or img.get('data-src')
                if src:
                    # Convert relative URLs to absolute
                    if src.startswith('/'):
                        src = urljoin(base_url, src)
                    elif src.startswith('//'):
                        src = 'https:' + src
                    
                    if src not in images:
                        images.append(src)
        
        return images[:5]  # Limit to 5 images
    
    def extract_seller(self, soup: BeautifulSoup) -> str:
        """Extract seller information"""
        seller_selectors = [
            '.seller-name',
            '.brand',
            '.vendor',
            '[data-testid="seller"]',
            '.store-name'
        ]
        
        for selector in seller_selectors:
            element = soup.select_one(selector)
            if element:
                seller = element.get_text(strip=True)
                if len(seller) > 2:
                    return seller
        
        return ""
    
    def extract_seller_url(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract seller URL"""
        seller_link_selectors = [
            '.seller-link a',
            '.brand a',
            '.vendor a',
            '[data-testid="seller-link"]'
        ]
        
        for selector in seller_link_selectors:
            element = soup.select_one(selector)
            if element and element.get('href'):
                return element['href']
        
        return None
    
    def extract_upload_date(self, soup: BeautifulSoup) -> Optional[datetime]:
        """Extract product upload date"""
        date_selectors = [
            '.upload-date',
            '.listed-date',
            '.published-date',
            '[data-testid="upload-date"]',
            'meta[property="article:published_time"]',
            'meta[name="date"]'
        ]
        
        for selector in date_selectors:
            element = soup.select_one(selector)
            if element:
                date_text = element.get('content') or element.get_text(strip=True)
                date = self.parse_date(date_text)
                if date:
                    return date
        
        return None
    
    def parse_date(self, date_text: str) -> Optional[datetime]:
        """Parse date from text"""
        # Common date formats
        formats = [
            '%Y-%m-%d',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%SZ',
            '%d/%m/%Y',
            '%m/%d/%Y',
            '%d-%m-%Y',
            '%m-%d-%Y'
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_text.strip(), fmt)
            except ValueError:
                continue
        
        return None
    
    def extract_specifications(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract product specifications"""
        specs = {}
        
        # Look for specification tables or lists
        spec_selectors = [
            '.specifications table',
            '.specs table',
            '.product-details table',
            '.technical-specs table',
            '.specs-list'
        ]
        
        for selector in spec_selectors:
            element = soup.select_one(selector)
            if element:
                rows = element.select('tr') or element.select('li')
                for row in rows:
                    if row.name == 'tr':
                        cells = row.select('td, th')
                        if len(cells) >= 2:
                            key = cells[0].get_text(strip=True)
                            value = cells[1].get_text(strip=True)
                            if key and value:
                                specs[key] = value
                    elif row.name == 'li':
                        text = row.get_text(strip=True)
                        if ':' in text:
                            key, value = text.split(':', 1)
                            specs[key.strip()] = value.strip()
        
        return specs
    
    def extract_shipping_info(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract shipping information"""
        shipping = {}
        
        shipping_selectors = [
            '.shipping-info',
            '.delivery-info',
            '.shipping-details',
            '[data-testid="shipping"]'
        ]
        
        for selector in shipping_selectors:
            element = soup.select_one(selector)
            if element:
                text = element.get_text(strip=True)
                # Extract shipping cost, delivery time, etc.
                if 'free shipping' in text.lower():
                    shipping['cost'] = 0
                    shipping['free'] = True
                
                # Look for delivery time patterns
                delivery_match = re.search(r'delivery\s*(?:in|within)\s*(\d+)\s*(?:days?|business days?)', text, re.IGNORECASE)
                if delivery_match:
                    shipping['delivery_days'] = int(delivery_match.group(1))
        
        return shipping
    
    async def scrape_products(self, urls: List[str]) -> List[ProductData]:
        """Scrape multiple product URLs with concurrent requests"""
        self.status = ScraperStatus.RUNNING
        self.session_stats['start_time'] = datetime.now()
        products = []
        
        logger.info(f"Starting to scrape {len(urls)} products")
        
        # Create semaphore to limit concurrent requests
        semaphore = asyncio.Semaphore(self.config.concurrent_requests)
        
        async def scrape_with_semaphore(url: str) -> Optional[ProductData]:
            async with semaphore:
                await asyncio.sleep(self.config.delay_between_requests)
                return await self.scrape_product_page(url)
        
        # Execute scraping tasks
        tasks = [scrape_with_semaphore(url) for url in urls]
        
        for i, task in enumerate(asyncio.as_completed(tasks)):
            try:
                product = await task
                if product:
                    products.append(product)
                    self.db_manager.save_product(product)
                    self.session_stats['products_scraped'] += 1
                    
                    # Limit products per run
                    if len(products) >= self.config.max_products_per_run:
                        break
                
                if i % 10 == 0:
                    logger.info(f"Processed {i}/{len(urls)} URLs, found {len(products)} products")
                    
            except Exception as e:
                logger.error(f"Error in scraping task: {e}")
                self.session_stats['errors_count'] += 1
        
        self.session_stats['end_time'] = datetime.now()
        self.status = ScraperStatus.COMPLETED
        
        logger.info(f"Scraping completed: {len(products)} products found, {self.session_stats['errors_count']} errors")
        
        return products
    
    def export_to_csv(self, products: List[ProductData], filename: str = None) -> str:
        """Export products to CSV file"""
        if not filename:
            filename = f"products_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        # Convert products to dictionary format
        rows = []
        for product in products:
            row = asdict(product)
            # Convert complex objects to JSON strings
            row['images'] = json.dumps(product.images)
            row['categories'] = json.dumps(product.categories)
            row['tags'] = json.dumps(product.tags)
            row['specifications'] = json.dumps(product.specifications)
            row['shipping_info'] = json.dumps(product.shipping_info)
            row['variant_info'] = json.dumps(product.variant_info)
            row['metadata'] = json.dumps(product.metadata)
            rows.append(row)
        
        # Write to CSV
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            if rows:
                fieldnames = rows[0].keys()
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
        
        logger.info(f"Exported {len(products)} products to {filename}")
        return filename
    
    def send_to_admin_dashboard(self, products: List[ProductData]) -> bool:
        """Send scraped products to admin dashboard"""
        try:
            # Convert products to JSON
            products_data = [asdict(product) for product in products]
            
            # Send via email to admin
            html_content = self.generate_admin_email_html(products_data)
            
            success = self.gmail_manager.send_email(
                to="admin@jeantrail.com",  # Admin email
                subject=f"New Products Scraped - {len(products)} items",
                body=html_content,
                is_html=True
            )
            
            if success:
                logger.info(f"Sent {len(products)} products to admin dashboard")
                return True
            else:
                # Try next Gmail account
                self.gmail_manager.rotate_account()
                return self.gmail_manager.send_email(
                    to="admin@jeantrail.com",
                    subject=f"New Products Scraped - {len(products)} items",
                    body=html_content,
                    is_html=True
                )
                
        except Exception as e:
            logger.error(f"Failed to send products to admin dashboard: {e}")
            return False
    
    def generate_admin_email_html(self, products_data: List[Dict]) -> str:
        """Generate HTML email for admin dashboard"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>New Products Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background: #f0f0f0; padding: 20px; border-radius: 5px; }}
                .product {{ border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }}
                .title {{ font-size: 18px; font-weight: bold; color: #333; }}
                .price {{ font-size: 16px; color: #2ecc71; font-weight: bold; }}
                .meta {{ font-size: 12px; color: #666; margin-top: 5px; }}
                .stats {{ background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🛍️ New Products Scraped Report</h1>
                <p>Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="stats">
                <h2>📊 Statistics</h2>
                <p><strong>Total Products:</strong> {len(products_data)}</p>
                <p><strong>Scraping Duration:</strong> {self.session_stats['end_time'] - self.session_stats['start_time'] if self.session_stats['end_time'] else 'N/A'}</p>
                <p><strong>Errors Encountered:</strong> {self.session_stats['errors_count']}</p>
            </div>
            
            <h2>📦 Products ({len(products_data)} items)</h2>
        """
        
        for product in products_data[:20]:  # Limit to 20 products in email
            html += f"""
            <div class="product">
                <div class="title">{product['title']}</div>
                <div class="price">${product['price']:.2f} {product['currency']}</div>
                <div class="meta">
                    <strong>Source:</strong> {product['source']}<br>
                    <strong>Category:</strong> {', '.join(json.loads(product['categories']))}<br>
                    <strong>Availability:</strong> {product['availability']}<br>
                    <strong>URL:</strong> <a href="{product['url']}">{product['url']}</a>
                </div>
            </div>
            """
        
        if len(products_data) > 20:
            html += f"<p><em>... and {len(products_data) - 20} more products</em></p>"
        
        html += """
        </body>
        </html>
        """
        
        return html
    
    def get_status(self) -> Dict[str, Any]:
        """Get current scraper status"""
        return {
            'status': self.status.value,
            'stats': self.session_stats,
            'config': asdict(self.config)
        }

# Example usage and main function
async def main():
    """Main function demonstrating scraper usage"""
    
    # Initialize scraper with configuration
    config = ScraperConfig(
        max_products_per_run=50,
        concurrent_requests=3,
        delay_between_requests=2.0,
        enable_categorization=True,
        use_proxies=True,
        enable_notifications=True
    )
    
    scraper = EnhancedProductScraper(config)
    
    # Example URLs to scrape (replace with actual product URLs)
    example_urls = [
        "https://example-store.com/product1",
        "https://example-store.com/product2",
        "https://example-store.com/product3",
    ]
    
    try:
        # Scrape products
        products = await scraper.scrape_products(example_urls)
        
        # Export to CSV
        csv_file = scraper.export_to_csv(products)
        print(f"Products exported to: {csv_file}")
        
        # Send to admin dashboard
        if scraper.send_to_admin_dashboard(products):
            print("Products sent to admin dashboard")
        
        # Print status
        print(f"Final status: {scraper.get_status()}")
        
    except KeyboardInterrupt:
        print("Scraping interrupted by user")
    except Exception as e:
        print(f"Error during scraping: {e}")
        logger.error(f"Scraping error: {e}")

if __name__ == "__main__":
    # Run the main function
    asyncio.run(main())