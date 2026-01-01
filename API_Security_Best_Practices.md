# API Security Best Practices: Comprehensive Guide to Key Management and Security

## Table of Contents
1. [Introduction](#introduction)
2. [API Key Generation Best Practices](#api-key-generation-best-practices)
3. [Secure Storage & Management](#secure-storage--management)
4. [Access Control & Authentication](#access-control--authentication)
5. [Key Rotation & Lifecycle Management](#key-rotation--lifecycle-management)
6. [Monitoring & Threat Detection](#monitoring--threat-detection)
7. [Common Vulnerabilities & Mitigation](#common-vulnerabilities--mitigation)
8. [Implementation & Tools](#implementation--tools)
9. [Security Checklist](#security-checklist)
10. [References & Further Reading](#references--further-reading)

---

## Introduction

API security is a critical component of modern software architecture, protecting sensitive data, maintaining service availability, and ensuring regulatory compliance. This comprehensive guide covers essential best practices for API key management and security, providing actionable strategies for organizations of all sizes.

### Why API Security Matters
- **Data Protection**: APIs often serve as gateways to sensitive customer and business data
- **Business Continuity**: Security breaches can lead to service disruptions and financial losses
- **Compliance Requirements**: Regulations like GDPR, HIPAA, and PCI-DSS mandate specific security measures
- **Reputation Management**: Security incidents can severely damage brand trust and customer relationships

### Key Security Principles
1. **Defense in Depth**: Multiple layers of security controls
2. **Principle of Least Privilege**: Minimum necessary access permissions
3. **Zero Trust**: Never trust, always verify
4. **Security by Design**: Built-in security from the ground up

---

## API Key Generation Best Practices

### Cryptographic Standards and Requirements

#### Entropy Requirements
API keys must be generated with sufficient entropy to resist brute force attacks:

**Minimum Recommended Entropy:**
- **Production APIs**: Minimum 128 bits of entropy (recommended: 256 bits)
- **Development APIs**: Minimum 64 bits of entropy (recommended: 128 bits)
- **Internal APIs**: Minimum 96 bits of entropy (recommended: 192 bits)

#### Key Generation Algorithms
```python
import secrets
import hashlib
import base64
from cryptography.fernet import Fernet

class APIKeyGenerator:
    """Secure API key generation with various formats"""
    
    @staticmethod
    def generate_hex_key(length=32):
        """Generate hexadecimal API key"""
        return secrets.token_hex(length)
    
    @staticmethod
    def generate_base64_key(length=32):
        """Generate Base64-encoded API key"""
        return base64.urlsafe_b64encode(secrets.token_bytes(length)).decode('utf-8')
    
    @staticmethod
    def generate_custom_key(prefix="", length=32):
        """Generate API key with custom prefix"""
        random_part = secrets.token_urlsafe(length)
        return f"{prefix}_{random_part}" if prefix else random_part
    
    @staticmethod
    def generate_uuid_style_key():
        """Generate UUID-style API key"""
        import uuid
        return str(uuid.uuid4())
    
    @staticmethod
    def generate_segmented_key(segments=4, segment_length=8):
        """Generate segmented API key (like: abc12345-def67890-ghi12345-jkl67890)"""
        segments_list = []
        for _ in range(segments):
            segments_list.append(secrets.token_hex(segment_length // 2))
        return '-'.join(segments_list)

# Usage examples
generator = APIKeyGenerator()

# Different key formats for different use cases
production_key = generator.generate_custom_key("prod", 32)
development_key = generator.generate_base64_key(24)
internal_key = generator.generate_segmented_key(4, 8)
```

#### Key Format Recommendations

| Use Case | Format | Length | Example |
|----------|--------|--------|---------|
| Production APIs | Custom prefix + Base64 | 40-64 chars | `prod_3aF7b2K9mP5xQ8rT1wY4uI7o` |
| Development APIs | Hexadecimal | 32-48 chars | `a1b2c3d4e5f6789012345678901234ab` |
| Internal Services | Segmented | 32-48 chars | `abc12345-def67890-ghi12345-jkl67890` |
| Third-party Integration | UUID v4 | 36 chars | `550e8400-e29b-41d4-a716-446655440000` |

### Key Structure and Metadata

#### Recommended Key Structure
```json
{
  "key_id": "key_550e8400e29b41d4a716446655440000",
  "key_value": "prod_3aF7b2K9mP5xQ8rT1wY4uI7o",
  "key_type": "production",
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-07-15T10:30:00Z",
  "permissions": ["read", "write"],
  "rate_limit": {
    "requests_per_minute": 1000,
    "requests_per_hour": 50000
  },
  "ip_whitelist": ["192.168.1.0/24", "10.0.0.0/8"],
  "created_by": "admin@company.com",
  "description": "Production API key for customer portal"
}
```

#### Key Classification System
```python
class APIKeyClassification:
    """API key classification for different security levels"""
    
    CLASSIFICATIONS = {
        "CRITICAL": {
            "description": "Full access to all systems and data",
            "rotation_frequency": "30_days",
            "approval_required": True,
            "max_keys_per_service": 1
        },
        "HIGH": {
            "description": "Access to sensitive customer data and financial operations",
            "rotation_frequency": "60_days",
            "approval_required": True,
            "max_keys_per_service": 2
        },
        "MEDIUM": {
            "description": "Access to business operations and analytics",
            "rotation_frequency": "90_days",
            "approval_required": False,
            "max_keys_per_service": 5
        },
        "LOW": {
            "description": "Read-only access to public data",
            "rotation_frequency": "180_days",
            "approval_required": False,
            "max_keys_per_service": 10
        }
    }
```

### Secure Key Generation Implementation

#### Production-Ready Key Generator
```python
import os
import secrets
import time
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import redis
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet

class SecureAPIKeyManager:
    """Production-ready API key management system"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = redis.from_url(redis_url)
        self.encryption_key = self._get_or_create_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)
    
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for storing API keys"""
        key = self.redis_client.get("encryption_key")
        if not key:
            key = Fernet.generate_key()
            self.redis_client.set("encryption_key", key)
        return key
    
    def generate_api_key(
        self,
        service_name: str,
        classification: str = "MEDIUM",
        expires_in_days: int = 90,
        custom_prefix: Optional[str] = None
    ) -> Dict[str, str]:
        """Generate a new API key with metadata"""
        
        # Validate inputs
        if classification not in APIKeyClassification.CLASSIFICATIONS:
            raise ValueError(f"Invalid classification: {classification}")
        
        # Generate key value
        timestamp = int(time.time())
        random_bytes = secrets.token_bytes(32)
        
        # Create key components
        key_components = [
            custom_prefix or service_name.lower(),
            str(timestamp),
            secrets.token_hex(16)
        ]
        
        api_key = "_".join(key_components)
        key_id = f"key_{secrets.token_hex(16)}"
        
        # Calculate expiration
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        # Create key metadata
        key_data = {
            "key_id": key_id,
            "key_value_hash": self._hash_key(api_key),
            "service_name": service_name,
            "classification": classification,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at.isoformat(),
            "status": "active",
            "created_by": "system"
        }
        
        # Store in Redis
        self.redis_client.hset(f"api_key:{key_id}", mapping=key_data)
        self.redis_client.sadd(f"service_keys:{service_name}", key_id)
        
        return {
            "key_id": key_id,
            "api_key": api_key,
            "expires_at": key_data["expires_at"],
            "classification": classification
        }
    
    def _hash_key(self, api_key: str) -> str:
        """Create secure hash of API key for verification"""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    def validate_api_key(self, api_key: str) -> Optional[Dict]:
        """Validate API key and return metadata"""
        key_hash = self._hash_key(api_key)
        
        # Find key by hash (in production, use an index for faster lookup)
        for key_id in self.redis_client.scan_iter(match="api_key:*"):
            stored_hash = self.redis_client.hget(key_id, "key_value_hash")
            if stored_hash and stored_hash.decode() == key_hash:
                key_data = self.redis_client.hgetall(key_id)
                key_data = {k.decode(): v.decode() for k, v in key_data.items()}
                
                # Check expiration
                if datetime.fromisoformat(key_data["expires_at"]) < datetime.utcnow():
                    key_data["status"] = "expired"
                    return None
                
                return key_data
        
        return None
```

---

## Secure Storage & Management

### Environment Variables vs Secret Management

#### Environment Variables (Limited Use)
```bash
# .env file (NEVER commit to version control)
API_KEY_PROD=prod_3aF7b2K9mP5xQ8rT1wY4uI7o
API_KEY_DEV=dev_1bC2d3E4f5G6h7I8j9K0lM1n
DATABASE_URL=postgresql://user:password@localhost:5432/db
```

**Pros:**
- Simple to implement
- Built-in support in most frameworks
- No external dependencies

**Cons:**
- Plain text storage
- Shared across all containers/environments
- Difficult to rotate and audit
- Not suitable for production secrets

#### Secret Management Solutions Comparison

| Solution | Best For | Complexity | Cost | Key Features |
|----------|----------|------------|------|--------------|
| HashiCorp Vault | Enterprise | High | $$ | Dynamic secrets, audit logs, HSM integration |
| AWS Secrets Manager | AWS environments | Medium | $$$ | Automatic rotation, IAM integration |
| Azure Key Vault | Azure environments | Medium | $$ | Hardware security, key management |
| Google Secret Manager | GCP environments | Medium | $$ | IAM integration, replication |
| Doppler | Multi-cloud | Low | $$ | Development sync, team collaboration |

### HashiCorp Vault Implementation

```python
import hvac
import os
from typing import Dict, Optional
import json

class VaultSecretManager:
    """HashiCorp Vault integration for API key management"""
    
    def __init__(self, vault_url: str = "https://vault.company.com", token: str = None):
        self.vault_url = vault_url
        self.token = token or os.getenv("VAULT_TOKEN")
        self.client = hvac.Client(url=vault_url, token=self.token)
        
        if not self.client.is_authenticated():
            raise Exception("Failed to authenticate with Vault")
    
    def store_api_key(
        self,
        key_name: str,
        api_key: str,
        metadata: Dict = None,
        ttl: str = "90d"
    ) -> bool:
        """Store API key in Vault with metadata"""
        
        secret_data = {
            "api_key": api_key,
            "created_at": datetime.utcnow().isoformat(),
            "status": "active"
        }
        
        if metadata:
            secret_data.update(metadata)
        
        try:
            # Store in KV v2 secrets engine
            self.client.secrets.kv.v2.create_secret(
                path=f"api_keys/{key_name}",
                secret=secret_data,
                ttl=ttl
            )
            return True
        except Exception as e:
            print(f"Failed to store secret: {e}")
            return False
    
    def retrieve_api_key(self, key_name: str) -> Optional[Dict]:
        """Retrieve API key from Vault"""
        
        try:
            response = self.client.secrets.kv.v2.read_secret_version(
                path=f"api_keys/{key_name}"
            )
            return response['data']['data']
        except Exception as e:
            print(f"Failed to retrieve secret: {e}")
            return None
    
    def rotate_api_key(self, key_name: str, new_key: str) -> bool:
        """Rotate API key in Vault"""
        
        try:
            # Get existing secret
            existing = self.retrieve_api_key(key_name)
            if existing:
                # Archive old key
                self.store_api_key(
                    f"{key_name}_archived_{int(time.time())}",
                    existing["api_key"],
                    {"status": "archived", "rotated_from": key_name}
                )
            
            # Store new key
            return self.store_api_key(key_name, new_key)
        except Exception as e:
            print(f"Failed to rotate key: {e}")
            return False

# Usage example
vault_manager = VaultSecretManager()

# Store a new API key
vault_manager.store_api_key(
    "production_customer_api",
    "prod_3aF7b2K9mP5xQ8rT1wY4uI7o",
    {
        "service": "customer_portal",
        "classification": "CRITICAL",
        "created_by": "admin@company.com",
        "permissions": ["read", "write", "delete"]
    }
)
```

### AWS Secrets Manager Integration

```python
import boto3
import json
from botocore.exceptions import ClientError

class AWSSecretManager:
    """AWS Secrets Manager integration for API key storage"""
    
    def __init__(self, region_name: str = "us-east-1"):
        self.client = boto3.client('secretsmanager', region_name=region_name)
    
    def create_api_key_secret(
        self,
        secret_name: str,
        api_key: str,
        description: str = "",
        rotation_days: int = 90,
        tags: List[Dict] = None
    ) -> bool:
        """Create new API key secret in AWS Secrets Manager"""
        
        secret_string = json.dumps({
            "api_key": api_key,
            "created_at": datetime.utcnow().isoformat(),
            "version": "1"
        })
        
        try:
            response = self.client.create_secret(
                Name=secret_name,
                Description=description,
                SecretString=secret_string,
                Tags=tags or []
            )
            
            # Configure automatic rotation if needed
            if rotation_days > 0:
                self._configure_rotation(secret_name, rotation_days)
            
            return True
        except ClientError as e:
            print(f"Failed to create secret: {e}")
            return False
    
    def rotate_api_key(self, secret_name: str, new_api_key: str) -> bool:
        """Rotate API key in AWS Secrets Manager"""
        
        try:
            # Get current secret
            current_secret = self.client.get_secret_value(SecretId=secret_name)
            current_data = json.loads(current_secret['SecretString'])
            
            # Create new version
            new_version = str(int(current_data.get('version', '1')) + 1)
            
            new_secret_string = json.dumps({
                "api_key": new_api_key,
                "created_at": datetime.utcnow().isoformat(),
                "version": new_version,
                "previous_version": current_data.get('version', '1')
            })
            
            self.client.update_secret(
                SecretId=secret_name,
                SecretString=new_secret_string
            )
            
            return True
        except ClientError as e:
            print(f"Failed to rotate secret: {e}")
            return False
    
    def _configure_rotation(self, secret_name: str, rotation_days: int):
        """Configure automatic rotation for the secret"""
        
        rotation_rules = {
            'AutomaticallyAfterDays': rotation_days
        }
        
        self.client.rotate_secret(
            SecretId=secret_name,
            RotationRules=rotation_rules,
            RotationLambdaARN='arn:aws:lambda:us-east-1:123456789012:function:APIKeyRotation'
        )
```

### Encryption at Rest and in Transit

#### Encryption at Rest Implementation

```python
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os

class EncryptionManager:
    """Handle encryption for API keys at rest"""
    
    def __init__(self, password: str = None):
        self.password = password or os.getenv("MASTER_ENCRYPTION_KEY", "default_password")
        self.salt = os.urandom(16)
        self.key = self._derive_key()
        self.cipher_suite = Fernet(self.key)
    
    def _derive_key(self) -> bytes:
        """Derive encryption key from password using PBKDF2"""
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.password.encode()))
        return key
    
    def encrypt_api_key(self, api_key: str) -> str:
        """Encrypt API key for storage"""
        
        encrypted_data = self.cipher_suite.encrypt(api_key.encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt_api_key(self, encrypted_key: str) -> str:
        """Decrypt API key for use"""
        
        encrypted_data = base64.urlsafe_b64decode(encrypted_key.encode())
        decrypted_data = self.cipher_suite.decrypt(encrypted_data)
        return decrypted_data.decode()
    
    @staticmethod
    def generate_key() -> str:
        """Generate new encryption key"""
        return Fernet.generate_key().decode()

# Database storage with encryption
import sqlite3
from contextlib import contextmanager

class EncryptedKeyStorage:
    """SQLite database with encrypted API key storage"""
    
    def __init__(self, db_path: str = "api_keys.db"):
        self.db_path = db_path
        self.encryption_manager = EncryptionManager()
        self._initialize_database()
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    def _initialize_database(self):
        """Initialize database tables"""
        
        with self.get_connection() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS api_keys (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key_id TEXT UNIQUE NOT NULL,
                    key_name TEXT NOT NULL,
                    encrypted_key TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    classification TEXT DEFAULT 'MEDIUM',
                    status TEXT DEFAULT 'active',
                    metadata TEXT,
                    last_used_at TIMESTAMP,
                    usage_count INTEGER DEFAULT 0
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS access_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key_id TEXT NOT NULL,
                    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT,
                    endpoint TEXT,
                    success BOOLEAN,
                    error_message TEXT,
                    FOREIGN KEY (key_id) REFERENCES api_keys (key_id)
                )
            ''')
            
            conn.commit()
    
    def store_key(
        self,
        key_id: str,
        key_name: str,
        api_key: str,
        classification: str = "MEDIUM",
        expires_at: str = None,
        metadata: Dict = None
    ) -> bool:
        """Store encrypted API key in database"""
        
        try:
            encrypted_key = self.encryption_manager.encrypt_api_key(api_key)
            
            with self.get_connection() as conn:
                conn.execute('''
                    INSERT INTO api_keys 
                    (key_id, key_name, encrypted_key, salt, classification, expires_at, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    key_id,
                    key_name,
                    encrypted_key,
                    base64.b64encode(self.encryption_manager.salt).decode(),
                    classification,
                    expires_at,
                    json.dumps(metadata) if metadata else None
                ))
                conn.commit()
                return True
        except Exception as e:
            print(f"Failed to store key: {e}")
            return False
    
    def retrieve_key(self, key_id: str) -> Optional[Dict]:
        """Retrieve and decrypt API key"""
        
        with self.get_connection() as conn:
            cursor = conn.execute(
                'SELECT * FROM api_keys WHERE key_id = ? AND status = "active"',
                (key_id,)
            )
            row = cursor.fetchone()
            
            if row:
                # Reconstruct encryption manager with stored salt
                stored_salt = base64.b64decode(row['salt'])
                temp_manager = EncryptionManager()
                temp_manager.salt = stored_salt
                temp_manager.key = temp_manager._derive_key()
                temp_manager.cipher_suite = Fernet(temp_manager.key)
                
                decrypted_key = temp_manager.decrypt_api_key(row['encrypted_key'])
                
                # Update usage statistics
                conn.execute('''
                    UPDATE api_keys 
                    SET last_used_at = CURRENT_TIMESTAMP, usage_count = usage_count + 1
                    WHERE key_id = ?
                ''', (key_id,))
                conn.commit()
                
                return {
                    'key_id': row['key_id'],
                    'key_name': row['key_name'],
                    'api_key': decrypted_key,
                    'classification': row['classification'],
                    'created_at': row['created_at'],
                    'expires_at': row['expires_at'],
                    'metadata': json.loads(row['metadata']) if row['metadata'] else None,
                    'usage_count': row['usage_count']
                }
        
        return None
```

#### Encryption in Transit

```python
import ssl
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class SecureAPIClient:
    """API client with enhanced security for key transmission"""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.session = self._create_secure_session()
    
    def _create_secure_session(self) -> requests.Session:
        """Create HTTP session with strong security settings"""
        
        session = requests.Session()
        
        # Configure SSL context
        ctx = ssl.create_default_context()
        ctx.check_hostname = True
        ctx.verify_mode = ssl.CERT_REQUIRED
        ctx.options |= ssl.OP_NO_SSLv2
        ctx.options |= ssl.OP_NO_SSLv3
        ctx.options |= ssl.OP_NO_TLSv1
        ctx.options |= ssl.OP_NO_TLSv1_1
        
        # Mount with SSL context
        session.mount('https://', HTTPAdapter(
            max_retries=Retry(
                total=3,
                backoff_factor=1,
                status_forcelist=[500, 502, 503, 504]
            )
        ))
        
        # Set secure headers
        session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'User-Agent': 'SecureAPIClient/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        
        return session
    
    def secure_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make secure API request with proper error handling"""
        
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            response.raise_for_status()
            return response
        except requests.exceptions.SSLError as e:
            print(f"SSL Error: {e}")
            raise
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise

# Mutual TLS (mTLS) Implementation
import pem
from OpenSSL import crypto

class MutualTLSClient:
    """API client with mutual TLS authentication"""
    
    def __init__(
        self,
        cert_path: str,
        key_path: str,
        ca_cert_path: str,
        base_url: str,
        api_key: str
    ):
        self.base_url = base_url
        self.api_key = api_key
        self.cert_path = cert_path
        self.key_path = key_path
        self.ca_cert_path = ca_cert_path
        self.session = self._create_mtls_session()
    
    def _create_mtls_session(self) -> requests.Session:
        """Create session with mutual TLS"""
        
        session = requests.Session()
        
        # Load certificates
        cert = pem.load_file(self.cert_path)[0]
        key = pem.load_file(self.key_path)[0]
        ca_cert = pem.load_file(self.ca_cert_path)[0]
        
        # Configure SSL context for mTLS
        ctx = ssl.create_default_context()
        ctx.check_hostname = True
        ctx.verify_mode = ssl.CERT_REQUIRED
        ctx.load_cert_chain(self.cert_path, self.key_path)
        ctx.load_verify_locations(cafile=self.ca_cert_path)
        
        session.mount('https://', HTTPAdapter())
        session.cert = (self.cert_path, self.key_path)
        session.verify = self.ca_cert_path
        
        session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'X-Client-Cert': crypto.dump_certificate(crypto.FILETYPE_PEM, cert.as_bytes()).decode()
        })
        
        return session
```

---

## Access Control & Authentication

### Principle of Least Privilege

The principle of least privilege (PoLP) ensures that API keys have only the minimum permissions necessary to perform their intended functions. This reduces the attack surface and limits potential damage from compromised keys.

#### Permission Scoping Implementation

```python
from enum import Enum
from typing import Set, Dict, List
from dataclasses import dataclass
import re

class Permission(Enum):
    """API permission types"""
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    ADMIN = "admin"
    READ_USERS = "read_users"
    WRITE_USERS = "write_users"
    READ_ORDERS = "read_orders"
    WRITE_ORDERS = "write_orders"
    READ_PRODUCTS = "read_products"
    WRITE_PRODUCTS = "write_products"
    READ_ANALYTICS = "read_analytics"
    MANAGE_KEYS = "manage_keys"

@dataclass
class ResourcePattern:
    """Resource pattern for API access control"""
    pattern: str
    permissions: Set[Permission]
    
    def matches(self, resource: str) -> bool:
        """Check if resource matches the pattern"""
        return bool(re.match(self.pattern.replace("*", ".*"), resource))

class APIAccessControl:
    """API access control system with scoped permissions"""
    
    def __init__(self):
        self.key_permissions = {}
        self.resource_patterns = []
    
    def create_scoped_key(
        self,
        key_id: str,
        permissions: List[Permission],
        resource_patterns: List[str],
        rate_limits: Dict = None
    ) -> bool:
        """Create API key with scoped permissions"""
        
        try:
            # Convert permissions to set
            permission_set = set(permissions)
            
            # Validate permission combinations
            self._validate_permission_combination(permission_set)
            
            # Create resource patterns
            patterns = [
                ResourcePattern(pattern, permission_set)
                for pattern in resource_patterns
            ]
            
            # Store key configuration
            self.key_permissions[key_id] = {
                'permissions': permission_set,
                'resource_patterns': patterns,
                'rate_limits': rate_limits or {
                    'requests_per_minute': 100,
                    'requests_per_hour': 5000,
                    'requests_per_day': 100000
                },
                'created_at': datetime.utcnow().isoformat(),
                'status': 'active'
            }
            
            return True
        except Exception as e:
            print(f"Failed to create scoped key: {e}")
            return False
    
    def _validate_permission_combination(self, permissions: Set[Permission]):
        """Validate permission combinations for security"""
        
        # Admin permission requires justification
        if Permission.ADMIN in permissions:
            if len(permissions) > 1:
                raise ValueError("Admin permission cannot be combined with other permissions")
        
        # Delete permission requires write permission
        if Permission.DELETE in permissions and Permission.WRITE not in permissions:
            raise ValueError("Delete permission requires write permission")
    
    def check_access(
        self,
        key_id: str,
        required_permission: Permission,
        resource: str,
        ip_address: str = None
    ) -> bool:
        """Check if API key has access to resource with required permission"""
        
        key_config = self.key_permissions.get(key_id)
        if not key_config or key_config['status'] != 'active':
            return False
        
        # Check permission
        if required_permission not in key_config['permissions']:
            return False
        
        # Check resource access
        for pattern in key_config['resource_patterns']:
            if pattern.matches(resource) and required_permission in pattern.permissions:
                return True
        
        return False
    
    def revoke_key(self, key_id: str, reason: str = "") -> bool:
        """Revoke API key access"""
        
        if key_id in self.key_permissions:
            self.key_permissions[key_id]['status'] = 'revoked'
            self.key_permissions[key_id]['revoked_at'] = datetime.utcnow().isoformat()
            self.key_permissions[key_id]['revoke_reason'] = reason
            return True
        return False

# Usage examples
access_control = APIAccessControl()

# Create read-only key for public API
access_control.create_scoped_key(
    "public_read_key_001",
    [Permission.READ],
    ["/api/v1/products/*", "/api/v1/categories/*"],
    {"requests_per_minute": 60, "requests_per_hour": 1000}
)

# Create key for customer service
access_control.create_scoped_key(
    "customer_service_key_001",
    [Permission.READ_USERS, Permission.WRITE_ORDERS, Permission.READ_PRODUCTS],
    ["/api/v1/users/*", "/api/v1/orders/*", "/api/v1/products/*"],
    {"requests_per_minute": 200, "requests_per_hour": 10000}
)

# Check access
has_access = access_control.check_access(
    "public_read_key_001",
    Permission.READ,
    "/api/v1/products/123"
)
```

#### Role-Based Access Control (RBAC)

```python
from typing import Dict, List, Set
from dataclasses import dataclass
from enum import Enum

class Role(Enum):
    """User roles in the system"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    DEVELOPER = "developer"
    ANALYST = "analyst"
    SUPPORT = "support"
    READ_ONLY = "read_only"

@dataclass
class RoleDefinition:
    """Role definition with permissions"""
    role: Role
    permissions: Set[Permission]
    description: str
    max_keys: int
    key_rotation_days: int

class RBACManager:
    """Role-based access control manager"""
    
    def __init__(self):
        self.role_definitions = self._initialize_roles()
        self.user_roles = {}
        self.role_assignments = {}
    
    def _initialize_roles(self) -> Dict[Role, RoleDefinition]:
        """Initialize role definitions"""
        
        return {
            Role.SUPER_ADMIN: RoleDefinition(
                Role.SUPER_ADMIN,
                {p for p in Permission},
                "Full system access",
                max_keys=5,
                key_rotation_days=30
            ),
            Role.ADMIN: RoleDefinition(
                Role.ADMIN,
                {
                    Permission.READ, Permission.WRITE, Permission.DELETE,
                    Permission.READ_USERS, Permission.WRITE_USERS,
                    Permission.MANAGE_KEYS
                },
                "Administrative access",
                max_keys=10,
                key_rotation_days=45
            ),
            Role.MANAGER: RoleDefinition(
                Role.MANAGER,
                {
                    Permission.READ, Permission.WRITE,
                    Permission.READ_ORDERS, Permission.WRITE_ORDERS,
                    Permission.READ_ANALYTICS
                },
                "Manager access",
                max_keys=15,
                key_rotation_days=60
            ),
            Role.DEVELOPER: RoleDefinition(
                Role.DEVELOPER,
                {
                    Permission.READ, Permission.WRITE,
                    Permission.READ_PRODUCTS, Permission.WRITE_PRODUCTS
                },
                "Developer access",
                max_keys=20,
                key_rotation_days=90
            ),
            Role.ANALYST: RoleDefinition(
                Role.ANALYST,
                {Permission.READ, Permission.READ_ANALYTICS},
                "Analytics access",
                max_keys=10,
                key_rotation_days=90
            ),
            Role.SUPPORT: RoleDefinition(
                Role.SUPPORT,
                {
                    Permission.READ,
                    Permission.READ_USERS,
                    Permission.READ_ORDERS,
                    Permission.WRITE_ORDERS
                },
                "Customer support access",
                max_keys=15,
                key_rotation_days=60
            ),
            Role.READ_ONLY: RoleDefinition(
                Role.READ_ONLY,
                {Permission.READ},
                "Read-only access",
                max_keys=25,
                key_rotation_days=180
            )
        }
    
    def assign_role(self, user_id: str, role: Role, assigned_by: str = "") -> bool:
        """Assign role to user"""
        
        if role not in self.role_definitions:
            raise ValueError(f"Invalid role: {role}")
        
        self.user_roles[user_id] = {
            'role': role,
            'assigned_at': datetime.utcnow().isoformat(),
            'assigned_by': assigned_by,
            'status': 'active'
        }
        
        return True
    
    def create_key_for_user(
        self,
        user_id: str,
        key_name: str,
        additional_permissions: List[Permission] = None
    ) -> Optional[str]:
        """Create API key for user based on their role"""
        
        user_role_info = self.user_roles.get(user_id)
        if not user_role_info or user_role_info['status'] != 'active':
            return None
        
        role = user_role_info['role']
        role_def = self.role_definitions[role]
        
        # Check key limit
        user_key_count = len(self.role_assignments.get(user_id, []))
        if user_key_count >= role_def.max_keys:
            print(f"User {user_id} has reached maximum key limit ({role_def.max_keys})")
            return None
        
        # Combine role permissions with additional permissions
        permissions = role_def.permissions.copy()
        if additional_permissions:
            permissions.update(additional_permissions)
        
        # Generate API key
        key_id = f"key_{role.value}_{user_id}_{secrets.token_hex(8)}"
        
        # Store key assignment
        if user_id not in self.role_assignments:
            self.role_assignments[user_id] = []
        
        self.role_assignments[user_id].append({
            'key_id': key_id,
            'key_name': key_name,
            'permissions': list(permissions),
            'created_at': datetime.utcnow().isoformat(),
            'expires_at': (datetime.utcnow() + timedelta(days=role_def.key_rotation_days)).isoformat()
        })
        
        return key_id
    
    def check_user_permission(
        self,
        user_id: str,
        required_permission: Permission,
        resource: str
    ) -> bool:
        """Check if user has permission for resource"""
        
        user_role_info = self.user_roles.get(user_id)
        if not user_role_info or user_role_info['status'] != 'active':
            return False
        
        role = user_role_info['role']
        role_def = self.role_definitions[role]
        
        return required_permission in role_def.permissions

# Usage example
rbac = RBACManager()

# Assign roles to users
rbac.assign_role("user_001", Role.DEVELOPER, "admin@company.com")
rbac.assign_role("user_002", Role.ANALYST, "manager@company.com")
rbac.assign_role("user_003", Role.SUPPORT, "team_lead@company.com")

# Create API keys for users
dev_key = rbac.create_key_for_user("user_001", "Development API Key")
analyst_key = rbac.create_key_for_user("user_002", "Analytics API Key")
support_key = rbac.create_key_for_user("user_003", "Support API Key")

# Check permissions
can_write_products = rbac.check_user_permission("user_001", Permission.WRITE_PRODUCTS, "/api/v1/products")
can_read_analytics = rbac.check_user_permission("user_002", Permission.READ_ANALYTICS, "/api/v1/analytics")
```

### Multi-Factor Authentication for APIs

#### Time-based One-Time Password (TOTP) Implementation

```python
import pyotp
import qrcode
from io import BytesIO
import base64

class APIMFA:
    """Multi-factor authentication for API access"""
    
    def __init__(self, issuer_name: str = "Company API"):
        self.issuer_name = issuer_name
        self.user_secrets = {}
    
    def setup_mfa_for_user(self, user_id: str) -> Dict[str, str]:
        """Setup MFA for a user"""
        
        # Generate secret
        secret = pyotp.random_base32()
        
        # Store user secret (in production, encrypt this)
        self.user_secrets[user_id] = {
            'secret': secret,
            'backup_codes': self._generate_backup_codes(),
            'enabled': False,
            'setup_date': datetime.utcnow().isoformat()
        }
        
        # Generate QR code for user
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_id,
            issuer_name=self.issuer_name
        )
        
        # Create QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        qr_image = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 for transmission
        buffered = BytesIO()
        qr_image.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            'secret': secret,
            'qr_code': qr_base64,
            'backup_codes': self.user_secrets[user_id]['backup_codes']
        }
    
    def _generate_backup_codes(self, count: int = 10) -> List[str]:
        """Generate backup codes for MFA"""
        return [secrets.token_hex(4).upper() for _ in range(count)]
    
    def verify_mfa_setup(self, user_id: str, totp_code: str) -> bool:
        """Verify MFA setup with TOTP code"""
        
        if user_id not in self.user_secrets:
            return False
        
        secret = self.user_secrets[user_id]['secret']
        totp = pyotp.TOTP(secret)
        
        if totp.verify(totp_code):
            self.user_secrets[user_id]['enabled'] = True
            return True
        
        return False
    
    def verify_api_request(
        self,
        user_id: str,
        api_key: str,
        totp_code: str = None,
        backup_code: str = None
    ) -> bool:
        """Verify API request with MFA"""
        
        # First verify API key
        if not self._verify_api_key(api_key):
            return False
        
        # Check if MFA is enabled for user
        if user_id not in self.user_secrets or not self.user_secrets[user_id]['enabled']:
            return False
        
        # Verify TOTP or backup code
        if totp_code:
            return self._verify_totp(user_id, totp_code)
        elif backup_code:
            return self._verify_backup_code(user_id, backup_code)
        
        return False
    
    def _verify_totp(self, user_id: str, totp_code: str) -> bool:
        """Verify TOTP code"""
        
        secret = self.user_secrets[user_id]['secret']
        totp = pyotp.TOTP(secret)
        
        return totp.verify(totp_code, valid_window=1)  # Allow 1 step tolerance
    
    def _verify_backup_code(self, user_id: str, backup_code: str) -> bool:
        """Verify backup code"""
        
        user_data = self.user_secrets[user_id]
        backup_codes = user_data.get('backup_codes', [])
        
        if backup_code.upper() in backup_codes:
            # Remove used backup code
            backup_codes.remove(backup_code.upper())
            user_data['backup_codes'] = backup_codes
            return True
        
        return False
    
    def _verify_api_key(self, api_key: str) -> bool:
        """Verify API key (placeholder implementation)"""
        # In production, this would integrate with your API key verification system
        return len(api_key) > 20

# Enhanced API endpoint with MFA
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app = FastAPI()
security = HTTPBearer()
mfa_system = APIMFA()

@app.post("/api/v1/secure-data")
async def secure_endpoint(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    totp_code: str = None,
    backup_code: str = None
):
    """Secure API endpoint requiring MFA"""
    
    api_key = credentials.credentials
    user_id = "user_001"  # Extract from API key in production
    
    # Verify with MFA
    if not mfa_system.verify_api_request(user_id, api_key, totp_code, backup_code):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Access granted", "data": "Secure information"}
```

---

## Key Rotation & Lifecycle Management

### Automated Rotation Strategies

Key rotation is crucial for maintaining security. Regular rotation reduces the risk window for compromised keys and ensures compliance with security standards.

#### Rotation Schedule Implementation

```python
from datetime import datetime, timedelta
from typing import Dict, List, Callable
import threading
import time
import schedule

class KeyRotationManager:
    """Automated API key rotation management"""
    
    def __init__(self, notification_service: Callable = None):
        self.rotation_schedules = {}
        self.rotation_history = []
        self.notification_service = notification_service
        self.is_running = False
        self.rotation_thread = None
    
    def schedule_rotation(
        self,
        key_id: str,
        rotation_frequency: str,  # "daily", "weekly", "monthly", "quarterly"
        notification_days_before: int = 7,
        auto_rotate: bool = False
    ) -> bool:
        """Schedule key rotation"""
        
        # Calculate next rotation date
        frequency_map = {
            "daily": 1,
            "weekly": 7,
            "monthly": 30,
            "quarterly": 90
        }
        
        if rotation_frequency not in frequency_map:
            raise ValueError(f"Invalid rotation frequency: {rotation_frequency}")
        
        days = frequency_map[rotation_frequency]
        next_rotation = datetime.utcnow() + timedelta(days=days)
        
        # Store rotation schedule
        self.rotation_schedules[key_id] = {
            'frequency': rotation_frequency,
            'next_rotation': next_rotation.isoformat(),
            'notification_days_before': notification_days_before,
            'auto_rotate': auto_rotate,
            'created_at': datetime.utcnow().isoformat(),
            'last_rotation': None
        }
        
        return True
    
    def start_rotation_scheduler(self):
        """Start the background rotation scheduler"""
        
        if self.is_running:
            return
        
        self.is_running = True
        self.rotation_thread = threading.Thread(target=self._scheduler_loop, daemon=True)
        self.rotation_thread.start()
    
    def stop_rotation_scheduler(self):
        """Stop the rotation scheduler"""
        
        self.is_running = False
        if self.rotation_thread:
            self.rotation_thread.join()
    
    def _scheduler_loop(self):
        """Background scheduler loop"""
        
        while self.is_running:
            try:
                self._check_rotations()
                time.sleep(3600)  # Check every hour
            except Exception as e:
                print(f"Scheduler error: {e}")
                time.sleep(300)  # Wait 5 minutes on error
    
    def _check_rotations(self):
        """Check for pending rotations and notifications"""
        
        current_time = datetime.utcnow()
        
        for key_id, schedule_info in self.rotation_schedules.items():
            next_rotation = datetime.fromisoformat(schedule_info['next_rotation'])
            notification_threshold = next_rotation - timedelta(
                days=schedule_info['notification_days_before']
            )
            
            # Check if notification is needed
            if current_time >= notification_threshold and not schedule_info.get('notification_sent'):
                self._send_rotation_notification(key_id, next_rotation)
                schedule_info['notification_sent'] = True
            
            # Check if rotation is due
            if current_time >= next_rotation and schedule_info['auto_rotate']:
                self._rotate_key(key_id)
    
    def _send_rotation_notification(self, key_id: str, rotation_date: datetime):
        """Send rotation notification"""
        
        message = f"""
        API Key Rotation Notification
        
        Key ID: {key_id}
        Rotation Date: {rotation_date.strftime('%Y-%m-%d %H:%M:%S UTC')}
        Days Until Rotation: {(rotation_date - datetime.utcnow()).days}
        
        Action Required: Please rotate your API key before the rotation date.
        
        If auto-rotation is enabled, the key will be rotated automatically.
        """
        
        if self.notification_service:
            self.notification_service(message)
        
        # Log notification
        self.rotation_history.append({
            'key_id': key_id,
            'action': 'notification_sent',
            'timestamp': datetime.utcnow().isoformat(),
            'message': message
        })
    
    def _rotate_key(self, key_id: str) -> bool:
        """Perform automated key rotation"""
        
        try:
            # Generate new key
            generator = APIKeyGenerator()
            new_key = generator.generate_custom_key("rotated", 32)
            
            # Update key in storage (placeholder - integrate with your storage)
            old_key = self._get_current_key(key_id)
            self._store_new_key(key_id, new_key)
            
            # Update schedule
            schedule_info = self.rotation_schedules[key_id]
            frequency_map = {"daily": 1, "weekly": 7, "monthly": 30, "quarterly": 90}
            days = frequency_map[schedule_info['frequency']]
            
            schedule_info['last_rotation'] = datetime.utcnow().isoformat()
            schedule_info['next_rotation'] = (datetime.utcnow() + timedelta(days=days)).isoformat()
            schedule_info['notification_sent'] = False
            
            # Log rotation
            self.rotation_history.append({
                'key_id': key_id,
                'action': 'rotated',
                'timestamp': datetime.utcnow().isoformat(),
                'old_key_hash': self._hash_key(old_key) if old_key else None,
                'new_key_hash': self._hash_key(new_key)
            })
            
            # Send notification about successful rotation
            if self.notification_service:
                self.notification_service(f"API key {key_id} has been successfully rotated.")
            
            return True
        except Exception as e:
            print(f"Failed to rotate key {key_id}: {e}")
            return False
    
    def _get_current_key(self, key_id: str) -> str:
        """Get current API key (placeholder implementation)"""
        # In production, this would retrieve from your key storage
        return f"current_key_for_{key_id}"
    
    def _store_new_key(self, key_id: str, new_key: str):
        """Store new API key (placeholder implementation)"""
        # In production, this would update in your key storage
        pass
    
    def _hash_key(self, api_key: str) -> str:
        """Create hash of API key for logging"""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    def get_rotation_status(self, key_id: str) -> Dict:
        """Get rotation status for a specific key"""
        
        if key_id not in self.rotation_schedules:
            return {"error": "Key not found in rotation schedule"}
        
        schedule_info = self.rotation_schedules[key_id]
        next_rotation = datetime.fromisoformat(schedule_info['next_rotation'])
        days_until_rotation = (next_rotation - datetime.utcnow()).days
        
        return {
            'key_id': key_id,
            'frequency': schedule_info['frequency'],
            'next_rotation': schedule_info['next_rotation'],
            'days_until_rotation': days_until_rotation,
            'auto_rotate': schedule_info['auto_rotate'],
            'last_rotation': schedule_info['last_rotation'],
            'notification_sent': schedule_info.get('notification_sent', False)
        }
    
    def get_rotation_history(self, key_id: str = None) -> List[Dict]:
        """Get rotation history"""
        
        if key_id:
            return [entry for entry in self.rotation_history if entry['key_id'] == key_id]
        
        return self.rotation_history

# Usage example
rotation_manager = KeyRotationManager()

# Schedule rotations for different keys
rotation_manager.schedule_rotation("prod_api_key_001", "monthly", 7, True)
rotation_manager.schedule_rotation("dev_api_key_001", "weekly", 3, True)
rotation_manager.schedule_rotation("internal_api_key_001", "quarterly", 14, False)

# Start the scheduler
rotation_manager.start_rotation_scheduler()
```

#### Manual Rotation Workflow

```python
class ManualKeyRotation:
    """Manual API key rotation workflow"""
    
    def __init__(self, storage_manager, notification_service):
        self.storage_manager = storage_manager
        self.notification_service = notification_service
        self.rotation_queue = []
    
    def initiate_rotation(
        self,
        key_id: str,
        requested_by: str,
        reason: str = "",
        immediate: bool = False
    ) -> Dict:
        """Initiate manual key rotation"""
        
        # Get current key information
        current_key_info = self.storage_manager.get_key_info(key_id)
        if not current_key_info:
            return {"error": "Key not found"}
        
        # Create rotation request
        rotation_request = {
            'key_id': key_id,
            'requested_by': requested_by,
            'reason': reason,
            'immediate': immediate,
            'status': 'pending_approval',
            'created_at': datetime.utcnow().isoformat(),
            'current_key_info': current_key_info
        }
        
        # For immediate rotation, skip approval
        if immediate:
            return self._execute_rotation(rotation_request)
        
        # Add to approval queue
        self.rotation_queue.append(rotation_request)
        
        # Send approval request
        self._request_approval(rotation_request)
        
        return {
            "message": "Rotation request submitted for approval",
            "request_id": len(self.rotation_queue),
            "status": "pending_approval"
        }
    
    def approve_rotation(self, request_id: int, approved_by: str) -> Dict:
        """Approve rotation request"""
        
        if request_id >= len(self.rotation_queue):
            return {"error": "Invalid request ID"}
        
        rotation_request = self.rotation_queue[request_id]
        rotation_request['approved_by'] = approved_by
        rotation_request['approved_at'] = datetime.utcnow().isoformat()
        rotation_request['status'] = 'approved'
        
        return self._execute_rotation(rotation_request)
    
    def _execute_rotation(self, rotation_request: Dict) -> Dict:
        """Execute the key rotation"""
        
        try:
            key_id = rotation_request['key_id']
            
            # Generate new key
            generator = APIKeyGenerator()
            new_key = generator.generate_custom_key("rotated", 32)
            
            # Backup old key
            old_key = rotation_request['current_key_info']['key_value']
            backup_result = self._backup_old_key(key_id, old_key)
            
            # Update with new key
            update_result = self.storage_manager.update_key(key_id, new_key)
            
            if not update_result:
                raise Exception("Failed to update key in storage")
            
            # Update rotation request status
            rotation_request['status'] = 'completed'
            rotation_request['completed_at'] = datetime.utcnow().isoformat()
            rotation_request['new_key_id'] = f"{key_id}_new"
            
            # Send notifications
            self._send_rotation_notifications(rotation_request)
            
            return {
                "message": "Key rotation completed successfully",
                "key_id": key_id,
                "new_key": new_key,  # Only return key in secure environments
                "backup_id": backup_result.get('backup_id'),
                "completed_at": rotation_request['completed_at']
            }
            
        except Exception as e:
            rotation_request['status'] = 'failed'
            rotation_request['error'] = str(e)
            rotation_request['failed_at'] = datetime.utcnow().isoformat()
            
            return {"error": f"Rotation failed: {e}"}
    
    def _backup_old_key(self, key_id: str, old_key: str) -> Dict:
        """Backup old key for recovery"""
        
        backup_data = {
            'key_id': key_id,
            'key_value': old_key,
            'backed_up_at': datetime.utcnow().isoformat(),
            'backup_id': f"backup_{secrets.token_hex(8)}"
        }
        
        # Store backup (in production, use secure archival)
        self.storage_manager.store_backup(backup_data)
        
        return backup_data
    
    def _request_approval(self, rotation_request: Dict):
        """Send approval request for rotation"""
        
        message = f"""
        API Key Rotation Approval Required
        
        Key ID: {rotation_request['key_id']}
        Requested By: {rotation_request['requested_by']}
        Reason: {rotation_request['reason']}
        Immediate: {rotation_request['immediate']}
        
        Please review and approve this rotation request.
        """
        
        self.notification_service.send_approval_request(message)
    
    def _send_rotation_notifications(self, rotation_request: Dict):
        """Send notifications about completed rotation"""
        
        # Notify requester
        requester_message = f"""
        Your API key rotation request has been completed.
        
        Key ID: {rotation_request['key_id']}
        Completed At: {rotation_request['completed_at']}
        
        Please update your applications with the new API key.
        """
        
        self.notification_service.send_notification(
            rotation_request['requested_by'],
            requester_message
        )
        
        # Notify key owner/administrators
        admin_message = f"""
        API key rotation completed:
        
        Key ID: {rotation_request['key_id']}
        Requested By: {rotation_request['requested_by']}
        Reason: {rotation_request['reason']}
        Completed At: {rotation_request['completed_at']}
        """
        
        self.notification_service.send_admin_notification(admin_message)
```

---

## Monitoring & Threat Detection

### Comprehensive Logging and Audit Trails

Effective monitoring is essential for detecting security threats, maintaining compliance, and investigating incidents. A comprehensive logging system should capture all API key activities with sufficient detail for forensic analysis.

#### Audit Trail Implementation

```python
import logging
import json
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

class AuditEventType(Enum):
    """Audit event types"""
    KEY_GENERATED = "key_generated"
    KEY_ACCESSED = "key_accessed"
    KEY_ROTATED = "key_rotated"
    KEY_REVOKED = "key_revoked"
    KEY_EXPIRED = "key_expired"
    PERMISSION_GRANTED = "permission_granted"
    PERMISSION_DENIED = "permission_denied"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    INVALID_REQUEST = "invalid_request"
    CONFIGURATION_CHANGED = "configuration_changed"

@dataclass
class AuditEvent:
    """Audit event structure"""
    event_id: str
    event_type: AuditEventType
    timestamp: str
    key_id: str
    user_id: Optional[str]
    ip_address: str
    user_agent: str
    resource: str
    action: str
    success: bool
    error_message: Optional[str]
    additional_data: Dict

class APAuditLogger:
    """Comprehensive API audit logging system"""
    
    def __init__(self, log_level: str = "INFO"):
        self.setup_logging(log_level)
        self.event_buffer = []
        self.buffer_size = 100
        self.alert_thresholds = self._initialize_alert_thresholds()
    
    def setup_logging(self, log_level: str):
        """Setup logging configuration"""
        
        # Create logger
        self.logger = logging.getLogger('api_audit')
        self.logger.setLevel(getattr(logging, log_level.upper()))
        
        # Create handlers
        file_handler = logging.FileHandler('api_audit.log')
        console_handler = logging.StreamHandler()
        
        # Create formatters
        detailed_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        json_formatter = logging.Formatter('%(message)s')
        
        # Set formatters
        file_handler.setFormatter(detailed_formatter)
        
        # Add handlers
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
    
    def log_event(
        self,
        event_type: AuditEventType,
        key_id: str,
        user_id: str = None,
        ip_address: str = "unknown",
        user_agent: str = "unknown",
        resource: str = "unknown",
        action: str = "unknown",
        success: bool = True,
        error_message: str = None,
        additional_data: Dict = None
    ) -> str:
        """Log an audit event"""
        
        event = AuditEvent(
            event_id=f"evt_{secrets.token_hex(8)}",
            event_type=event_type,
            timestamp=datetime.utcnow().isoformat(),
            key_id=key_id,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            resource=resource,
            action=action,
            success=success,
            error_message=error_message,
            additional_data=additional_data or {}
        )
        
        # Convert to JSON for structured logging
        event_json = json.dumps(asdict(event), default=str)
        
        # Log to different levels based on event type
        if event_type in [AuditEventType.SUSPICIOUS_ACTIVITY, AuditEventType.PERMISSION_DENIED]:
            self.logger.warning(event_json)
        elif not success:
            self.logger.error(event_json)
        else:
            self.logger.info(event_json)
        
        # Add to buffer for real-time analysis
        self.event_buffer.append(event)
        if len(self.event_buffer) > self.buffer_size:
            self.event_buffer.pop(0)
        
        # Check for alerts
        self._check_alerts(event)
        
        return event.event_id
    
    def _initialize_alert_thresholds(self) -> Dict:
        """Initialize alert thresholds for threat detection"""
        
        return {
            'failed_attempts_per_minute': 10,
            'failed_attempts_per_hour': 100,
            'unique_ips_per_key_per_hour': 5,
            'rapid_requests_per_second': 50,
            'unusual_time_access': True,
            'geographic_anomaly': True,
            'permission_denials_per_hour': 20
        }
    
    def _check_alerts(self, event: AuditEvent):
        """Check event against alert thresholds"""
        
        current_time = datetime.utcnow()
        one_minute_ago = current_time - timedelta(minutes=1)
        one_hour_ago = current_time - timedelta(hours=1)
        
        # Check failed attempts
        if not event.success:
            recent_failures = [
                e for e in self.event_buffer
                if (not e.success and
                    datetime.fromisoformat(e.timestamp) > one_minute_ago and
                    e.key_id == event.key_id)
            ]
            
            if len(recent_failures) > self.alert_thresholds['failed_attempts_per_minute']:
                self._trigger_alert(
                    "HIGH_FAILURE_RATE",
                    f"High failure rate detected for key {event.key_id}",
                    {"failure_count": len(recent_failures), "timeframe": "1 minute"}
                )
        
        # Check rapid requests
        recent_requests = [
            e for e in self.event_buffer
            if (datetime.fromisoformat(e.timestamp) > one_minute_ago and
                e.key_id == event.key_id)
        ]
        
        if len(recent_requests) > self.alert_thresholds['rapid_requests_per_second'] * 60:
            self._trigger_alert(
                "RAPID_REQUESTS",
                f"Rapid request rate detected for key {event.key_id}",
                {"request_count": len(recent_requests), "timeframe": "1 minute"}
            )
        
        # Check permission denials
        permission_denials = [
            e for e in self.event_buffer
            if (e.event_type == AuditEventType.PERMISSION_DENIED and
                datetime.fromisoformat(e.timestamp) > one_hour_ago and
                e.key_id == event.key_id)
        ]
        
        if len(permission_denials) > self.alert_thresholds['permission_denials_per_hour']:
            self._trigger_alert(
                "HIGH_PERMISSION_DENIALS",
                f"High permission denial rate for key {event.key_id}",
                {"denial_count": len(permission_denials), "timeframe": "1 hour"}
            )
    
    def _trigger_alert(self, alert_type: str, message: str, details: Dict):
        """Trigger security alert"""
        
        alert = {
            'alert_type': alert_type,
            'message': message,
            'details': details,
            'timestamp': datetime.utcnow().isoformat(),
            'severity': self._get_alert_severity(alert_type)
        }
        
        # Log alert
        self.logger.critical(f"SECURITY ALERT: {json.dumps(alert)}")
        
        # In production, send to SIEM, security team, etc.
        # self.send_to_siem(alert)
        # self.notify_security_team(alert)
    
    def _get_alert_severity(self, alert_type: str) -> str:
        """Get alert severity level"""
        
        severity_map = {
            'HIGH_FAILURE_RATE': 'HIGH',
            'RAPID_REQUESTS': 'MEDIUM',
            'HIGH_PERMISSION_DENIALS': 'HIGH',
            'UNUSUAL_GEOGRAPHIC_ACCESS': 'HIGH',
            'UNUSUAL_TIME_ACCESS': 'MEDIUM'
        }
        
        return severity_map.get(alert_type, 'MEDIUM')
    
    def get_key_usage_summary(
        self,
        key_id: str,
        start_time: datetime = None,
        end_time: datetime = None
    ) -> Dict:
        """Get usage summary for a specific key"""
        
        if not end_time:
            end_time = datetime.utcnow()
        if not start_time:
            start_time = end_time - timedelta(days=1)
        
        # Filter events for the key and time range
        key_events = [
            e for e in self.event_buffer
            if (e.key_id == key_id and
                start_time <= datetime.fromisoformat(e.timestamp) <= end_time)
        ]
        
        # Calculate metrics
        total_requests = len(key_events)
        successful_requests = len([e for e in key_events if e.success])
        failed_requests = total_requests - successful_requests
        
        # Unique IPs
        unique_ips = set(e.ip_address for e in key_events)
        
        # Top resources
        resource_counts = {}
        for event in key_events:
            resource_counts[event.resource] = resource_counts.get(event.resource, 0) + 1
        
        top_resources = sorted(resource_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            'key_id': key_id,
            'time_period': {
                'start': start_time.isoformat(),
                'end': end_time.isoformat()
            },
            'metrics': {
                'total_requests': total_requests,
                'successful_requests': successful_requests,
                'failed_requests': failed_requests,
                'success_rate': (successful_requests / total_requests * 100) if total_requests > 0 else 0,
                'unique_ip_addresses': len(unique_ips),
                'top_resources': top_resources
            }
        }

# Middleware for automatic logging
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import time

class AuditMiddleware:
    """FastAPI middleware for automatic audit logging"""
    
    def __init__(self, app, audit_logger: APAuditLogger):
        self.app = app
        self.audit_logger = audit_logger
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            await self._handle_http_request(scope, receive, send)
        else:
            await self.app(scope, receive, send)
    
    async def _handle_http_request(self, scope, receive, send):
        """Handle HTTP request for audit logging"""
        
        start_time = time.time()
        
        # Extract request information
        request = Request(scope, receive)
        
        # Get API key from headers
        api_key = request.headers.get("Authorization", "").replace("Bearer ", "")
        key_id = self._extract_key_id(api_key)
        
        # Extract client information
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("User-Agent", "unknown")
        
        # Process request
        response_sent = False
        response_status = 200
        error_message = None
        
        async def send_wrapper(message):
            nonlocal response_sent, response_status
            if message["type"] == "http.response.start":
                response_status = message["status"]
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
            success = response_status < 400
        except Exception as e:
            success = False
            error_message = str(e)
            response_status = 500
            # Send error response
            await send({
                "type": "http.response.start",
                "status": response_status,
                "headers": [[b"content-type", b"application/json"]],
            })
            await send({
                "type": "http.response.body",
                "body": json.dumps({"error": "Internal server error"}).encode(),
            })
        
        # Log the event
        duration = time.time() - start_time
        
        if key_id:
            self.audit_logger.log_event(
                event_type=AuditEventType.KEY_ACCESSED if success else AuditEventType.PERMISSION_DENIED,
                key_id=key_id,
                ip_address=client_ip,
                user_agent=user_agent,
                resource=request.url.path,
                action=request.method,
                success=success,
                error_message=error_message,
                additional_data={
                    "duration_seconds": duration,
                    "response_status": response_status,
                    "query_params": dict(request.query_params)
                }
            )
    
    def _extract_key_id(self, api_key: str) -> Optional[str]:
        """Extract key ID from API key (placeholder implementation)"""
        # In production, this would validate and extract key ID from your key store
        if api_key and len(api_key) > 20:
            return f"key_{hashlib.sha256(api_key.encode()).hexdigest()[:16]}"
        return None
```

### Real-time Threat Detection

Implementing real-time threat detection helps identify and respond to security incidents as they happen, minimizing potential damage.

```python
from collections import defaultdict, deque
from datetime import datetime, timedelta
import geoip2.database
import numpy as np
from typing import Dict, List, Set, Tuple

class ThreatDetector:
    """Real-time threat detection system"""
    
    def __init__(self, audit_logger: APAuditLogger):
        self.audit_logger = audit_logger
        self.traffic_patterns = defaultdict(lambda: deque(maxlen=1000))
        self.ip_reputation = {}
        self.geolocation_cache = {}
        self.baseline_metrics = {}
        self.anomaly_thresholds = self._initialize_anomaly_thresholds()
        
        # Initialize GeoIP database (requires MaxMind GeoIP2 database)
        try:
            self.geoip_reader = geoip2.database.Reader('GeoLite2-City.mmdb')
        except:
            self.geoip_reader = None
            print("Warning: GeoIP database not found. Geographic analysis disabled.")
    
    def _initialize_anomaly_thresholds(self) -> Dict:
        """Initialize anomaly detection thresholds"""
        
        return {
            'request_rate_spike_multiplier': 5.0,
            'error_rate_threshold': 0.1,  # 10%
            'new_country_threshold': 3,  # Alert on 3+ new countries
            'off_hours_activity': True,
            'rapid_user_switching': 5,  # 5+ different users in 5 minutes
            'api_key_reuse_across_ips': 3,  # Same key used from 3+ IPs in 1 hour
            'unusual_endpoint_access': True,
            'data_volume_anomaly': True
        }
    
    def analyze_request(self, event: AuditEvent):
        """Analyze incoming request for threats"""
        
        current_time = datetime.utcnow()
        
        # Update traffic patterns
        self._update_traffic_patterns(event)
        
        # Detect various threat patterns
        threats_detected = []
        
        # 1. Request rate anomaly
        if self._detect_request_rate_anomaly(event.key_id, current_time):
            threats_detected.append("REQUEST_RATE_ANOMALY")
        
        # 2. Geographic anomaly
        geographic_threat = self._detect_geographic_anomaly(event, current_time)
        if geographic_threat:
            threats_detected.append(geographic_threat)
        
        # 3. Time-based anomaly
        if self._detect_time_anomaly(event, current_time):
            threats_detected.append("TIME_ANOMALY")
        
        # 4. User switching anomaly
        if self._detect_user_switching_anomaly(event.key_id, current_time):
            threats_detected.append("USER_SWITCHING_ANOMALY")
        
        # 5. IP diversity anomaly
        if self._detect_ip_diversity_anomaly(event.key_id, current_time):
            threats_detected.append("IP_DIVERSITY_ANOMALY")
        
        # 6. Error rate anomaly
        if self._detect_error_rate_anomaly(event.key_id, current_time):
            threats_detected.append("ERROR_RATE_ANOMALY")
        
        # 7. Data volume anomaly
        if self._detect_data_volume_anomaly(event, current_time):
            threats_detected.append("DATA_VOLUME_ANOMALY")
        
        # Take action if threats detected
        if threats_detected:
            self._handle_threat_detection(event, threats_detected)
    
    def _update_traffic_patterns(self, event: AuditEvent):
        """Update traffic pattern tracking"""
        
        key_patterns = self.traffic_patterns[event.key_id]
        key_patterns.append({
            'timestamp': datetime.fromisoformat(event.timestamp),
            'ip_address': event.ip_address,
            'user_id': event.user_id,
            'resource': event.resource,
            'success': event.success,
            'response_size': event.additional_data.get('response_size', 0)
        })
    
    def _detect_request_rate_anomaly(self, key_id: str, current_time: datetime) -> bool:
        """Detect unusual request rate spikes"""
        
        patterns = self.traffic_patterns[key_id]
        if len(patterns) < 10:
            return False  # Need baseline data
        
        # Calculate current request rate (last 5 minutes)
        five_minutes_ago = current_time - timedelta(minutes=5)
        recent_requests = [
            p for p in patterns
            if p['timestamp'] > five_minutes_ago
        ]
        
        current_rate = len(recent_requests) / 5.0  # requests per minute
        
        # Calculate baseline rate (previous hour excluding last 5 minutes)
        one_hour_ago = current_time - timedelta(hours=1)
        baseline_requests = [
            p for p in patterns
            if one_hour_ago < p['timestamp'] < five_minutes_ago
        ]
        
        if len(baseline_requests) < 10:
            return False
        
        baseline_rate = len(baseline_requests) / 55.0  # requests per minute
        
        # Check if current rate exceeds threshold
        if current_rate > baseline_rate * self.anomaly_thresholds['request_rate_spike_multiplier']:
            return True
        
        return False
    
    def _detect_geographic_anomaly(self, event: AuditEvent, current_time: datetime) -> Optional[str]:
        """Detect geographic access anomalies"""
        
        if not self.geoip_reader:
            return None
        
        key_patterns = self.traffic_patterns[event.key_id]
        if len(key_patterns) < 5:
            return None
        
        # Get country for current IP
        current_country = self._get_country_for_ip(event.ip_address)
        if not current_country:
            return None
        
        # Get countries seen in last 24 hours
        one_day_ago = current_time - timedelta(hours=24)
        recent_countries = set()
        
        for pattern in key_patterns:
            if pattern['timestamp'] > one_day_ago:
                country = self._get_country_for_ip(pattern['ip_address'])
                if country:
                    recent_countries.add(country)
        
        # Check if this is a new country
        if current_country not in recent_countries:
            # Count new countries in last hour
            one_hour_ago = current_time - timedelta(hours=1)
            very_recent_countries = set()
            
            for pattern in key_patterns:
                if pattern['timestamp'] > one_hour_ago:
                    country = self._get_country_for_ip(pattern['ip_address'])
                    if country:
                        very_recent_countries.add(country)
            
            if len(very_recent_countries) >= self.anomaly_thresholds['new_country_threshold']:
                return "MULTIPLE_NEW_COUNTRIES"
            else:
                return "NEW_COUNTRY_ACCESS"
        
        return None
    
    def _get_country_for_ip(self, ip_address: str) -> Optional[str]:
        """Get country code for IP address"""
        
        if ip_address in self.geolocation_cache:
            return self.geolocation_cache[ip_address]
        
        try:
            if self.geoip_reader and ip_address != "unknown":
                response = self.geoip_reader.city(ip_address)
                country = response.country.iso_code
                self.geolocation_cache[ip_address] = country
                return country
        except:
            pass
        
        self.geolocation_cache[ip_address] = None
        return None
    
    def _detect_time_anomaly(self, event: AuditEvent, current_time: datetime) -> bool:
        """Detect off-hours access anomalies"""
        
        if not self.anomaly_thresholds['off_hours_activity']:
            return False
        
        key_patterns = self.traffic_patterns[event.key_id]
        if len(key_patterns) < 20:
            return False  # Need baseline data
        
        # Get normal access hours for this key
        access_hours = []
        for pattern in key_patterns[:-10]:  # Exclude recent requests
            access_hours.append(pattern['timestamp'].hour)
        
        if len(access_hours) < 10:
            return False
        
        # Calculate normal access hours (90% of requests)
        hour_counts = defaultdict(int)
        for hour in access_hours:
            hour_counts[hour] += 1
        
        total_requests = sum(hour_counts.values())
        normal_hours = set()
        
        for hour, count in hour_counts.items():
            if count / total_requests >= 0.05:  # At least 5% of requests
                normal_hours.add(hour)
        
        # Check if current access is outside normal hours
        if current_time.hour not in normal_hours:
            return True
        
        return False
    
    def _detect_user_switching_anomaly(self, key_id: str, current_time: datetime) -> bool:
        """Detect rapid user switching"""
        
        key_patterns = self.traffic_patterns[key_id]
        if len(key_patterns) < 5:
            return False
        
        # Get unique users in last 5 minutes
        five_minutes_ago = current_time - timedelta(minutes=5)
        recent_users = set()
        
        for pattern in key_patterns:
            if pattern['timestamp'] > five_minutes_ago and pattern['user_id']:
                recent_users.add(pattern['user_id'])
        
        if len(recent_users) >= self.anomaly_thresholds['rapid_user_switching']:
            return True
        
        return False
    
    def _detect_ip_diversity_anomaly(self, key_id: str, current_time: datetime) -> bool:
        """Detect API key used from many different IPs"""
        
        key_patterns = self.traffic_patterns[key_id]
        if len(key_patterns) < 10:
            return False
        
        # Get unique IPs in last hour
        one_hour_ago = current_time - timedelta(hours=1)
        recent_ips = set()
        
        for pattern in key_patterns:
            if pattern['timestamp'] > one_hour_ago:
                recent_ips.add(pattern['ip_address'])
        
        if len(recent_ips) >= self.anomaly_thresholds['api_key_reuse_across_ips']:
            return True
        
        return False
    
    def _detect_error_rate_anomaly(self, key_id: str, current_time: datetime) -> bool:
        """Detect unusual error rates"""
        
        key_patterns = self.traffic_patterns[key_id]
        if len(key_patterns) < 20:
            return False
        
        # Calculate current error rate (last 10 minutes)
        ten_minutes_ago = current_time - timedelta(minutes=10)
        recent_requests = [
            p for p in key_patterns
            if p['timestamp'] > ten_minutes_ago
        ]
        
        if len(recent_requests) < 10:
            return False
        
        current_error_rate = sum(1 for r in recent_requests if not r['success']) / len(recent_requests)
        
        # Check if error rate exceeds threshold
        if current_error_rate > self.anomaly_thresholds['error_rate_threshold']:
            return True
        
        return False
    
    def _detect_data_volume_anomaly(self, event: AuditEvent, current_time: datetime) -> bool:
        """Detect unusual data transfer volumes"""
        
        if not self.anomaly_thresholds['data_volume_anomaly']:
            return False
        
        response_size = event.additional_data.get('response_size', 0)
        if response_size == 0:
            return False
        
        key_patterns = self.traffic_patterns[event.key_id]
        if len(key_patterns) < 10:
            return False
        
        # Calculate average response size
        sizes = [p['response_size'] for p in key_patterns if p['response_size'] > 0]
        if len(sizes) < 5:
            return False
        
        avg_size = np.mean(sizes)
        std_size = np.std(sizes)
        
        # Check if current response is an outlier (> 3 standard deviations)
        if response_size > avg_size + (3 * std_size):
            return True
        
        return False
    
    def _handle_threat_detection(self, event: AuditEvent, threats: List[str]):
        """Handle detected threats"""
        
        # Log threat detection
        self.audit_logger.log_event(
            event_type=AuditEventType.SUSPICIOUS_ACTIVITY,
            key_id=event.key_id,
            user_id=event.user_id,
            ip_address=event.ip_address,
            user_agent=event.user_agent,
            resource=event.resource,
            action="threat_detected",
            success=False,
            error_message=f"Threats detected: {', '.join(threats)}",
            additional_data={
                'detected_threats': threats,
                'original_event': event.event_id
            }
        )
        
        # Take automated actions based on threat level
        self._take_automated_action(event, threats)
    
    def _take_automated_action(self, event: AuditEvent, threats: List[str]):
        """Take automated response actions"""
        
        # High-priority threats - immediate action
        high_priority_threats = [
            "REQUEST_RATE_ANOMALY",
            "MULTIPLE_NEW_COUNTRIES",
            "IP_DIVERSITY_ANOMALY"
        ]
        
        if any(threat in high_priority_threats for threat in threats):
            # Could implement temporary key suspension, rate limiting, etc.
            # self._temporarily_suspend_key(event.key_id, duration_minutes=5)
            # self._increase_rate_limiting(event.ip_address)
            pass
        
        # Medium-priority threats - alert and monitor
        medium_priority_threats = [
            "TIME_ANOMALY",
            "USER_SWITCHING_ANOMALY",
            "ERROR_RATE_ANOMALY"
        ]
        
        if any(threat in medium_priority_threats for threat in threats):
            # Could implement enhanced monitoring, alerts to security team
            # self._send_alert_to_security_team(event, threats)
            pass
    
    def get_threat_summary(self, key_id: str = None) -> Dict:
        """Get threat detection summary"""
        
        summary = {
            'total_threats_detected': 0,
            'threat_types': defaultdict(int),
            'keys_with_threats': set(),
            'time_period': {
                'start': (datetime.utcnow() - timedelta(days=1)).isoformat(),
                'end': datetime.utcnow().isoformat()
            }
        }
        
        # Analyze recent events
        one_day_ago = datetime.utcnow() - timedelta(days=1)
        
        for event in self.audit_logger.event_buffer:
            if datetime.fromisoformat(event.timestamp) > one_day_ago:
                if event.event_type == AuditEventType.SUSPICIOUS_ACTIVITY:
                    summary['total_threats_detected'] += 1
                    summary['keys_with_threats'].add(event.key_id)
                    
                    threats = event.additional_data.get('detected_threats', [])
                    for threat in threats:
                        summary['threat_types'][threat] += 1
        
        summary['keys_with_threats'] = list(summary['keys_with_threats'])
        summary['threat_types'] = dict(summary['threat_types'])
        
        return summary
```

---

## Common Vulnerabilities & Mitigation

### OWASP API Security Top 10 (2023)

The OWASP API Security Top 10 identifies the most critical security risks for APIs. Understanding and mitigating these vulnerabilities is essential for comprehensive API protection.

#### API1:2023 - Broken Object Level Authorization (BOLA)

BOLA occurs when APIs allow users to access objects they shouldn't have permission to access, typically by manipulating object IDs in requests.

```python
from functools import wraps
from fastapi import HTTPException, Depends
from typing import List, Optional

class AuthorizationError(Exception):
    """Custom exception for authorization failures"""
    pass

class BOLAMiddleware:
    """Middleware to prevent Broken Object Level Authorization"""
    
    def __init__(self, audit_logger: APAuditLogger):
        self.audit_logger = audit_logger
        self.resource_owners = {}  # In production, use database
    
    def check_object_ownership(
        self,
        resource_type: str,
        resource_id: str,
        user_id: str,
        required_permission: str = "read"
    ) -> bool:
        """Check if user has access to specific object"""
        
        # Define ownership rules
        ownership_rules = {
            "user_profile": lambda uid, rid: uid == rid,
            "order": self._check_order_ownership,
            "product": self._check_product_access,
            "analytics": self._check_analytics_access
        }
        
        rule = ownership_rules.get(resource_type)
        if not rule:
            return False
        
        try:
            return rule(user_id, resource_id, required_permission)
        except Exception as e:
            self.audit_logger.log_event(
                event_type=AuditEventType.PERMISSION_DENIED,
                key_id="system",
                user_id=user_id,
                resource=f"{resource_type}/{resource_id}",
                action="ownership_check",
                success=False,
                error_message=str(e)
            )
            return False
    
    def _check_order_ownership(self, user_id: str, order_id: str, permission: str) -> bool:
        """Check if user owns the order"""
        # In production, query database
        # Example: SELECT user_id FROM orders WHERE order_id = ?
        return True  # Placeholder
    
    def _check_product_access(self, user_id: str, product_id: str, permission: str) -> bool:
        """Check product access based on user role"""
        # In production, check user roles and product visibility
        return True  # Placeholder
    
    def _check_analytics_access(self, user_id: str, resource_id: str, permission: str) -> bool:
        """Check analytics access based on user role"""
        # Only admin and analyst roles can access analytics
        return True  # Placeholder

# Decorator for BOLA protection
def require_object_ownership(
    resource_type: str,
    resource_id_param: str = "id",
    permission: str = "read"
):
    """Decorator to enforce object level authorization"""
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user and resource information
            # This depends on your framework and authentication setup
            user_id = kwargs.get("current_user_id")
            resource_id = kwargs.get(resource_id_param)
            
            if not user_id or not resource_id:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # Check ownership
            if not bola_middleware.check_object_ownership(
                resource_type, resource_id, user_id, permission
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: insufficient permissions"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

# Usage example
@app.get("/api/v1/orders/{order_id}")
@require_object_ownership("order", "order_id", "read")
async def get_order(order_id: str, current_user_id: str = Depends(get_current_user)):
    """Get order details with BOLA protection"""
    # Implementation here
    return {"order_id": order_id, "details": "..."}

@app.put("/api/v1/users/{user_id}")
@require_object_ownership("user_profile", "user_id", "write")
async def update_user_profile(
    user_id: str,
    profile_data: dict,
    current_user_id: str = Depends(get_current_user)
):
    """Update user profile with BOLA protection"""
    # Implementation here
    return {"message": "Profile updated successfully"}
```

#### API2:2023 - Broken Authentication

Broken authentication vulnerabilities allow attackers to compromise authentication tokens or impersonate other users.

```python
import jwt
from datetime import datetime, timedelta
from typing import Dict, Optional
import secrets
import bcrypt

class SecureAuthentication:
    """Secure authentication system with proper token management"""
    
    def __init__(self, secret_key: str, audit_logger: APAuditLogger):
        self.secret_key = secret_key
        self.audit_logger = audit_logger
        self.token_blacklist = set()
        self.failed_attempts = defaultdict(list)
        self.max_attempts = 5
        self.lockout_duration = 900  # 15 minutes
    
    def generate_jwt_token(
        self,
        user_id: str,
        api_key_id: str,
        expires_in_minutes: int = 60,
        additional_claims: Dict = None
    ) -> str:
        """Generate secure JWT token"""
        
        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=expires_in_minutes)
        
        payload = {
            "sub": user_id,
            "api_key_id": api_key_id,
            "iat": now.timestamp(),
            "exp": expires_at.timestamp(),
            "jti": secrets.token_hex(16),  # JWT ID for revocation
            "type": "access_token"
        }
        
        if additional_claims:
            payload.update(additional_claims)
        
        token = jwt.encode(payload, self.secret_key, algorithm="HS256")
        
        # Log token generation
        self.audit_logger.log_event(
            event_type=AuditEventType.KEY_GENERATED,
            key_id=api_key_id,
            user_id=user_id,
            resource="/auth/token",
            action="token_generation",
            success=True,
            additional_data={
                "token_id": payload["jti"],
                "expires_at": expires_at.isoformat()
            }
        )
        
        return token
    
    def verify_jwt_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token with comprehensive checks"""
        
        try:
            # Decode token
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            
            # Check if token is blacklisted
            jti = payload.get("jti")
            if jti in self.token_blacklist:
                raise jwt.InvalidTokenError("Token has been revoked")
            
            # Check token type
            if payload.get("type") != "access_token":
                raise jwt.InvalidTokenError("Invalid token type")
            
            # Check expiration (additional check beyond JWT library)
            if datetime.utcnow().timestamp() > payload.get("exp"):
                raise jwt.ExpiredSignatureError("Token has expired")
            
            # Log successful verification
            self.audit_logger.log_event(
                event_type=AuditEventType.KEY_ACCESSED,
                key_id=payload.get("api_key_id"),
                user_id=payload.get("sub"),
                resource="/auth/verify",
                action="token_verification",
                success=True
            )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            self.audit_logger.log_event(
                event_type=AuditEventType.PERMISSION_DENIED,
                key_id="unknown",
                resource="/auth/verify",
                action="token_verification",
                success=False,
                error_message="Token expired"
            )
            return None
        
        except jwt.InvalidTokenError as e:
            self.audit_logger.log_event(
                event_type=AuditEventType.PERMISSION_DENIED,
                key_id="unknown",
                resource="/auth/verify",
                action="token_verification",
                success=False,
                error_message=str(e)
            )
            return None
    
    def revoke_token(self, token: str, reason: str = "") -> bool:
        """Revoke JWT token"""
        
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            jti = payload.get("jti")
            
            if jti:
                self.token_blacklist.add(jti)
                
                # Log revocation
                self.audit_logger.log_event(
                    event_type=AuditEventType.KEY_REVOKED,
                    key_id=payload.get("api_key_id"),
                    user_id=payload.get("sub"),
                    resource="/auth/revoke",
                    action="token_revocation",
                    success=True,
                    additional_data={
                        "revoked_jti": jti,
                        "reason": reason
                    }
                )
                
                return True
        except:
            pass
        
        return False
    
    def check_rate_limiting(self, identifier: str) -> bool:
        """Check if identifier exceeds rate limits"""
        
        current_time = datetime.utcnow()
        
        # Clean old attempts
        self.failed_attempts[identifier] = [
            attempt for attempt in self.failed_attempts[identifier]
            if current_time - attempt < timedelta(seconds=self.lockout_duration)
        ]
        
        # Check if locked out
        if len(self.failed_attempts[identifier]) >= self.max_attempts:
            return False
        
        return True
    
    def record_failed_attempt(self, identifier: str):
        """Record failed authentication attempt"""
        
        self.failed_attempts[identifier].append(datetime.utcnow())
        
        # Log suspicious activity
        if len(self.failed_attempts[identifier]) >= self.max_attempts:
            self.audit_logger.log_event(
                event_type=AuditEventType.SUSPICIOUS_ACTIVITY,
                key_id="unknown",
                resource="/auth/login",
                action="failed_auth",
                success=False,
                error_message=f"Account locked due to {len(self.failed_attempts[identifier])} failed attempts",
                additional_data={
                    "identifier": identifier,
                    "failed_attempts": len(self.failed_attempts[identifier])
                }
            )

# Password hashing and verification
class PasswordManager:
    """Secure password management"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        try:
            return bcrypt.checkpw(
                password.encode('utf-8'),
                hashed_password.encode('utf-8')
            )
        except:
            return False
    
    @staticmethod
    def generate_strong_password(length: int = 16) -> str:
        """Generate strong random password"""
        alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))

# Session management
class SecureSessionManager:
    """Secure session management for APIs"""
    
    def __init__(self, redis_client):
        self.redis_client = redis_client
        self.session_timeout = 3600  # 1 hour
    
    def create_session(
        self,
        user_id: str,
        api_key_id: str,
        additional_data: Dict = None
    ) -> str:
        """Create secure session"""
        
        session_id = secrets.token_urlsafe(32)
        session_data = {
            "user_id": user_id,
            "api_key_id": api_key_id,
            "created_at": datetime.utcnow().isoformat(),
            "last_accessed": datetime.utcnow().isoformat(),
            "ip_address": additional_data.get("ip_address", ""),
            "user_agent": additional_data.get("user_agent", "")
        }
        
        if additional_data:
            session_data.update(additional_data)
        
        # Store session in Redis with expiration
        self.redis_client.setex(
            f"session:{session_id}",
            self.session_timeout,
            json.dumps(session_data)
        )
        
        return session_id
    
    def validate_session(self, session_id: str, current_ip: str = "") -> Optional[Dict]:
        """Validate session and detect anomalies"""
        
        session_data_json = self.redis_client.get(f"session:{session_id}")
        if not session_data_json:
            return None
        
        session_data = json.loads(session_data_json)
        
        # Check session age
        last_accessed = datetime.fromisoformat(session_data["last_accessed"])
        if datetime.utcnow() - last_accessed > timedelta(seconds=self.session_timeout):
            self.redis_client.delete(f"session:{session_id}")
            return None
        
        # Check for IP address change (optional security check)
        if current_ip and session_data.get("ip_address"):
            if current_ip != session_data["ip_address"]:
                # Log potential session hijacking
                self.audit_logger.log_event(
                    event_type=AuditEventType.SUSPICIOUS_ACTIVITY,
                    key_id=session_data.get("api_key_id"),
                    user_id=session_data["user_id"],
                    resource="/session/validate",
                    action="session_validation",
                    success=False,
                    error_message="IP address changed during session",
                    additional_data={
                        "original_ip": session_data["ip_address"],
                        "current_ip": current_ip,
                        "session_id": session_id
                    }
                )
        
        # Update last accessed time
        session_data["last_accessed"] = datetime.utcnow().isoformat()
        self.redis_client.setex(
            f"session:{session_id}",
            self.session_timeout,
            json.dumps(session_data)
        )
        
        return session_data
```

#### API3:2023 - Broken Object Property Level Authorization (BOPLA)

BOPLA occurs when APIs expose sensitive object properties that users shouldn't have access to, even if they can access the object itself.

```python
class PropertyAccessControl:
    """Control access to specific object properties"""
    
    def __init__(self):
        self.property_permissions = self._initialize_property_permissions()
        self.sensitive_fields = self._initialize_sensitive_fields()
    
    def _initialize_property_permissions(self) -> Dict:
        """Initialize property-level permissions"""
        
        return {
            "user": {
                "public": ["id", "username", "created_at"],
                "owner": ["id", "username", "email", "created_at", "last_login", "profile_settings"],
                "admin": ["id", "username", "email", "created_at", "last_login", "profile_settings", "roles", "permissions", "account_status"],
                "super_admin": ["*"]  # All properties
            },
            "order": {
                "public": ["id", "status", "created_at"],
                "owner": ["id", "status", "created_at", "items", "total_amount", "shipping_address", "payment_method"],
                "admin": ["id", "status", "created_at", "items", "total_amount", "shipping_address", "payment_method", "customer_info", "internal_notes"],
                "finance": ["id", "status", "created_at", "total_amount", "payment_method", "transaction_id", "refunds"]
            },
            "product": {
                "public": ["id", "name", "price", "description", "images"],
                "manager": ["id", "name", "price", "description", "images", "inventory", "cost", "supplier_id"],
                "admin": ["*"]
            }
        }
    
    def _initialize_sensitive_fields(self) -> Dict:
        """Initialize sensitive fields that require special handling"""
        
        return {
            "user": ["password_hash", "ssn", "credit_card_number", "bank_account"],
            "order": ["credit_card_last_four", "payment_token", "internal_notes"],
            "product": ["cost", "supplier_margin", "internal_sku"]
        }
    
    def filter_object_properties(
        self,
        object_type: str,
        object_data: Dict,
        user_role: str,
        user_id: str = None,
        object_owner_id: str = None
    ) -> Dict:
        """Filter object properties based on user permissions"""
        
        if object_type not in self.property_permissions:
            raise ValueError(f"Unknown object type: {object_type}")
        
        # Determine permission level
        permission_level = self._determine_permission_level(
            user_role, user_id, object_owner_id
        )
        
        allowed_properties = self.property_permissions[object_type].get(permission_level, [])
        
        # If wildcard permission, return all non-sensitive fields
        if "*" in allowed_properties:
            filtered_data = object_data.copy()
            # Remove highly sensitive fields
            sensitive_fields = self.sensitive_fields.get(object_type, [])
            for field in sensitive_fields:
                filtered_data.pop(field, None)
            return filtered_data
        
        # Filter based on allowed properties
        filtered_data = {}
        for prop in allowed_properties:
            if prop in object_data:
                filtered_data[prop] = object_data[prop]
        
        return filtered_data
    
    def _determine_permission_level(
        self,
        user_role: str,
        user_id: str = None,
        object_owner_id: str = None
    ) -> str:
        """Determine permission level for user"""
        
        # Check if user is owner
        if user_id and object_owner_id and user_id == object_owner_id:
            return "owner"
        
        # Role-based permissions
        role_hierarchy = {
            "super_admin": 4,
            "admin": 3,
            "finance": 2,
            "manager": 2,
            "user": 1,
            "public": 0
        }
        
        return user_role
    
    def mask_sensitive_data(self, object_type: str, object_data: Dict) -> Dict:
        """Mask or remove sensitive data from objects"""
        
        if object_type not in self.sensitive_fields:
            return object_data
        
        masked_data = object_data.copy()
        sensitive_fields = self.sensitive_fields[object_type]
        
        for field in sensitive_fields:
            if field in masked_data:
                if field.endswith("number") or field.endswith("card"):
                    # Mask credit card numbers
                    value = str(masked_data[field])
                    if len(value) > 4:
                        masked_data[field] = f"*{value[-4:]}"
                elif field == "ssn":
                    # Mask SSN
                    value = str(masked_data[field])
                    if len(value) > 4:
                        masked_data[field] = f"***-**-{value[-4:]}"
                elif field.endswith("email"):
                    # Partially mask emails
                    email = str(masked_data[field])
                    if "@" in email:
                        local, domain = email.split("@", 1)
                        if len(local) > 2:
                            masked_data[field] = f"{local[0]}*{local[-1]}@{domain}"
                else:
                    # Remove other sensitive fields
                    del masked_data[field]
        
        return masked_data

# Usage example in API endpoints
@app.get("/api/v1/users/{user_id}")
async def get_user(
    user_id: str,
    current_user_id: str = Depends(get_current_user),
    current_user_role: str = Depends(get_current_user_role)
):
    """Get user information with property-level access control"""
    
    # Get user data from database
    user_data = get_user_from_database(user_id)
    
    # Apply property filtering
    filtered_data = property_access_control.filter_object_properties(
        "user",
        user_data,
        current_user_role,
        current_user_id,
        user_id
    )
    
    # Mask sensitive data
    final_data = property_access_control.mask_sensitive_data("user", filtered_data)
    
    return final_data
```

#### API4:2023 - Unrestricted Resource Consumption

This vulnerability allows attackers to exhaust API resources through large requests, high-frequency calls, or expensive operations.

```python
import asyncio
from typing import Dict, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class RateLimitConfig:
    """Rate limiting configuration"""
    requests_per_minute: int
    requests_per_hour: int
    requests_per_day: int
    concurrent_requests: int
    data_size_limit_mb: int

class ResourceConsumptionGuard:
    """Guard against unrestricted resource consumption"""
    
    def __init__(self, audit_logger: APAuditLogger):
        self.audit_logger = audit_logger
        self.rate_limits = {}
        self.active_requests = defaultdict(int)
        self.request_sizes = defaultdict(list)
        self.cleanup_interval = 3600  # 1 hour
        self.last_cleanup = datetime.utcnow()
    
    def configure_rate_limits(self, key_id: str, config: RateLimitConfig):
        """Configure rate limits for API key"""
        
        self.rate_limits[key_id] = config
    
    def check_rate_limit(self, key_id: str, request_size: int = 0) -> bool:
        """Check if request exceeds rate limits"""
        
        current_time = datetime.utcnow()
        
        # Cleanup old data periodically
        if current_time - self.last_cleanup > timedelta(seconds=self.cleanup_interval):
            self._cleanup_old_data()
            self.last_cleanup = current_time
        
        # Get rate limit configuration
        config = self.rate_limits.get(key_id)
        if not config:
            return False
        
        # Check concurrent requests
        if self.active_requests[key_id] >= config.concurrent_requests:
            self._log_rate_limit_violation(key_id, "concurrent_requests")
            return False
        
        # Check request size
        if request_size > config.data_size_limit_mb * 1024 * 1024:
            self._log_rate_limit_violation(key_id, "data_size_limit")
            return False
        
        # Check rate limits (using Redis or database in production)
        if not self._check_time_based_limits(key_id, config, current_time):
            return False
        
        # Record request
        self._record_request(key_id, request_size, current_time)
        
        return True
    
    def _check_time_based_limits(
        self,
        key_id: str,
        config: RateLimitConfig,
        current_time: datetime
    ) -> bool:
        """Check time-based rate limits"""
        
        # This is a simplified implementation
        # In production, use Redis with sliding window algorithms
        
        # Get recent requests (would use Redis in production)
        recent_requests = self.request_sizes.get(key_id, [])
        
        # Count requests in different time windows
        one_minute_ago = current_time - timedelta(minutes=1)
        one_hour_ago = current_time - timedelta(hours=1)
        one_day_ago = current_time - timedelta(days=1)
        
        minute_count = len([
            r for r in recent_requests
            if r['timestamp'] > one_minute_ago
        ])
        
        hour_count = len([
            r for r in recent_requests
            if r['timestamp'] > one_hour_ago
        ])
        
        day_count = len([
            r for r in recent_requests
            if r['timestamp'] > one_day_ago
        ])
        
        # Check limits
        if minute_count >= config.requests_per_minute:
            self._log_rate_limit_violation(key_id, "requests_per_minute")
            return False
        
        if hour_count >= config.requests_per_hour:
            self._log_rate_limit_violation(key_id, "requests_per_hour")
            return False
        
        if day_count >= config.requests_per_day:
            self._log_rate_limit_violation(key_id, "requests_per_day")
            return False
        
        return True
    
    def _record_request(self, key_id: str, size: int, timestamp: datetime):
        """Record request for rate limiting"""
        
        self.active_requests[key_id] += 1
        
        if key_id not in self.request_sizes:
            self.request_sizes[key_id] = []
        
        self.request_sizes[key_id].append({
            'timestamp': timestamp,
            'size': size
        })
    
    def _cleanup_old_data(self):
        """Clean up old rate limiting data"""
        
        cutoff_time = datetime.utcnow() - timedelta(days=1)
        
        for key_id in list(self.request_sizes.keys()):
            self.request_sizes[key_id] = [
                r for r in self.request_sizes[key_id]
                if r['timestamp'] > cutoff_time
            ]
            
            if not self.request_sizes[key_id]:
                del self.request_sizes[key_id]
    
    def _log_rate_limit_violation(self, key_id: str, limit_type: str):
        """Log rate limit violation"""
        
        self.audit_logger.log_event(
            event_type=AuditEventType.RATE_LIMIT_EXCEEDED,
            key_id=key_id,
            resource="/api",
            action="rate_limit_check",
            success=False,
            error_message=f"Rate limit exceeded: {limit_type}",
            additional_data={"limit_type": limit_type}
        )
    
    def release_request(self, key_id: str):
        """Release request from concurrent count"""
        
        if self.active_requests[key_id] > 0:
            self.active_requests[key_id] -= 1

# Request size and complexity limiting
class RequestComplexityLimiter:
    """Limit request complexity to prevent resource exhaustion"""
    
    def __init__(self):
        self.max_depth = 10
        self.max_total_items = 1000
        self.max_nested_objects = 50
    
    def validate_request_complexity(self, data: Dict) -> tuple[bool, str]:
        """Validate request data complexity"""
        
        try:
            depth = self._calculate_depth(data)
            if depth > self.max_depth:
                return False, f"Request depth ({depth}) exceeds maximum ({self.max_depth})"
            
            total_items = self._count_items(data)
            if total_items > self.max_total_items:
                return False, f"Request contains too many items ({total_items}) (max: {self.max_total_items})"
            
            nested_objects = self._count_nested_objects(data)
            if nested_objects > self.max_nested_objects:
                return False, f"Request contains too many nested objects ({nested_objects}) (max: {self.max_nested_objects})"
            
            return True, "Request complexity is acceptable"
        
        except Exception as e:
            return False, f"Error validating request complexity: {str(e)}"
    
    def _calculate_depth(self, obj, current_depth=0) -> int:
        """Calculate maximum depth of nested object"""
        
        if isinstance(obj, dict):
            if not obj:
                return current_depth
            return max(self._calculate_depth(v, current_depth + 1) for v in obj.values())
        elif isinstance(obj, list):
            if not obj:
                return current_depth
            return max(self._calculate_depth(item, current_depth + 1) for item in obj)
        else:
            return current_depth
    
    def _count_items(self, obj) -> int:
        """Count total items in object"""
        
        if isinstance(obj, dict):
            return len(obj) + sum(self._count_items(v) for v in obj.values())
        elif isinstance(obj, list):
            return len(obj) + sum(self._count_items(item) for item in obj)
        else:
            return 1
    
    def _count_nested_objects(self, obj) -> int:
        """Count nested objects in request"""
        
        count = 0
        if isinstance(obj, dict):
            count += 1
            for v in obj.values():
                count += self._count_nested_objects(v)
        elif isinstance(obj, list):
            for item in obj:
                count += self._count_nested_objects(item)
        
        return count

# Middleware for resource consumption protection
class ResourceConsumptionMiddleware:
    """Middleware to protect against resource consumption attacks"""
    
    def __init__(
        self,
        consumption_guard: ResourceConsumptionGuard,
        complexity_limiter: RequestComplexityLimiter
    ):
        self.consumption_guard = consumption_guard
        self.complexity_limiter = complexity_limiter
    
    async def __call__(self, request, call_next):
        """Process request with resource consumption checks"""
        
        # Extract API key
        api_key = request.headers.get("Authorization", "").replace("Bearer ", "")
        key_id = self._extract_key_id(api_key)
        
        if not key_id:
            return JSONResponse(
                status_code=401,
                content={"error": "Valid API key required"}
            )
        
        # Check request size
        content_length = request.headers.get("content-length", 0)
        request_size = int(content_length) if content_length else 0
        
        # Check rate limits
        if not self.consumption_guard.check_rate_limit(key_id, request_size):
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded"}
            )
        
        try:
            # Process request
            response = await call_next(request)
            return response
        
        finally:
            # Release request from concurrent count
            self.consumption_guard.release_request(key_id)
    
    def _extract_key_id(self, api_key: str) -> str:
        """Extract key ID from API key"""
        # Implementation depends on your key format
        return f"key_{hashlib.sha256(api_key.encode()).hexdigest()[:16]}"
```

#### API5:2023 - Broken Function Level Authorization

This vulnerability occurs when API functions are not properly protected with authorization checks, allowing users to access functions beyond their privilege level.

```python
from enum import Enum
from typing import Dict, Set, List, Callable
import functools

class FunctionLevel(Enum):
    """Function access levels"""
    PUBLIC = "public"
    USER = "user"
    MANAGER = "manager"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class FunctionAuthorization:
    """Function-level authorization system"""
    
    def __init__(self, audit_logger: APAuditLogger):
        self.audit_logger = audit_logger
        self.function_permissions = {}
        self.user_roles = {}
        self.role_hierarchy = {
            FunctionLevel.PUBLIC: 0,
            FunctionLevel.USER: 1,
            FunctionLevel.MANAGER: 2,
            FunctionLevel.ADMIN: 3,
            FunctionLevel.SUPER_ADMIN: 4
        }
    
    def register_function(
        self,
        function_name: str,
        required_level: FunctionLevel,
        description: str = ""
    ):
        """Register function with required access level"""
        
        self.function_permissions[function_name] = {
            "required_level": required_level,
            "description": description,
            "registered_at": datetime.utcnow().isoformat()
        }
    
    def assign_user_role(self, user_id: str, role: FunctionLevel):
        """Assign role to user"""
        
        self.user_roles[user_id] = role
    
    def check_function_access(
        self,
        user_id: str,
        function_name: str,
        context: Dict = None
    ) -> bool:
        """Check if user can access function"""
        
        user_role = self.user_roles.get(user_id)
        if not user_role:
            self._log_access_denied(user_id, function_name, "No role assigned")
            return False
        
        function_info = self.function_permissions.get(function_name)
        if not function_info:
            self._log_access_denied(user_id, function_name, "Function not registered")
            return False
        
        required_level = function_info["required_level"]
        
        # Check role hierarchy
        if self.role_hierarchy[user_role] < self.role_hierarchy[required_level]:
            self._log_access_denied(user_id, function_name, f"Insufficient privileges: {user_role} < {required_level}")
            return False
        
        # Additional context-based checks
        if context and not self._check_context_permissions(user_id, function_name, context):
            return False
        
        # Log successful access
        self.audit_logger.log_event(
            event_type=AuditEventType.PERMISSION_GRANTED,
            key_id="system",
            user_id=user_id,
            resource=f"/function/{function_name}",
            action="function_access",
            success=True,
            additional_data={
                "function_name": function_name,
                "user_role": user_role.value,
                "required_level": required_level.value
            }
        )
        
        return True
    
    def _check_context_permissions(self, user_id: str, function_name: str, context: Dict) -> bool:
        """Check context-specific permissions"""
        
        # Example: Only allow users to access their own data
        if function_name in ["get_user_data", "update_user_data"]:
            target_user_id = context.get("target_user_id")
            if target_user_id and target_user_id != user_id:
                # Check if user has admin privileges
                user_role = self.user_roles.get(user_id)
                if self.role_hierarchy.get(user_role, 0) < self.role_hierarchy[FunctionLevel.ADMIN]:
                    self._log_access_denied(user_id, function_name, "Attempting to access another user's data")
                    return False
        
        # Example: Only managers can approve orders
        if function_name == "approve_order":
            user_role = self.user_roles.get(user_id)
            if self.role_hierarchy.get(user_role, 0) < self.role_hierarchy[FunctionLevel.MANAGER]:
                self._log_access_denied(user_id, function_name, "Insufficient privileges for order approval")
                return False
        
        return True
    
    def _log_access_denied(self, user_id: str, function_name: str, reason: str):
        """Log access denial"""
        
        self.audit_logger.log_event(
            event_type=AuditEventType.PERMISSION_DENIED,
            key_id="system",
            user_id=user_id,
            resource=f"/function/{function_name}",
            action="function_access",
            success=False,
            error_message=reason,
            additional_data={
                "function_name": function_name,
                "denial_reason": reason
            }
        )

# Decorator for function-level authorization
def require_function_level(required_level: FunctionLevel, description: str = ""):
    """Decorator to enforce function-level authorization"""
    
    def decorator(func: Callable):
        # Register function
        function_auth.register_function(func.__name__, required_level, description)
        
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user ID (depends on your framework)
            user_id = kwargs.get("current_user_id")
            
            if not user_id:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # Create context for additional checks
            context = {
                "target_user_id": kwargs.get("target_user_id"),
                "order_id": kwargs.get("order_id"),
                "other_context": {k: v for k, v in kwargs.items() if k not in ["current_user_id", "target_user_id", "order_id"]}
            }
            
            # Check authorization
            if not function_auth.check_function_access(user_id, func.__name__, context):
                raise HTTPException(status_code=403, detail="Access denied")
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

# Usage examples
function_auth = FunctionAuthorization(audit_logger)

# Register users with roles
function_auth.assign_user_role("user_001", FunctionLevel.USER)
function_auth.assign_user_role("user_002", FunctionLevel.MANAGER)
function_auth.assign_user_role("user_003", FunctionLevel.ADMIN)

# Protected functions
@require_function_level(FunctionLevel.PUBLIC, "Get public information")
async def get_public_info():
    return {"message": "Public information"}

@require_function_level(FunctionLevel.USER, "Get user data")
async def get_user_data(current_user_id: str, target_user_id: str = None):
    # Context check ensures users can only access their own data unless admin
    return {"user_id": target_user_id or current_user_id, "data": "..."}

@require_function_level(FunctionLevel.MANAGER, "Approve order")
async def approve_order(order_id: str, current_user_id: str):
    # Only managers and above can approve orders
    return {"order_id": order_id, "status": "approved"}

@require_function_level(FunctionLevel.ADMIN, "Delete user")
async def delete_user(target_user_id: str, current_user_id: str):
    # Only admins can delete users
    return {"message": f"User {target_user_id} deleted"}
```

---

## Implementation & Tools

### Recommended Security Tools and Frameworks

Choosing the right tools is crucial for implementing effective API security. Below are recommended solutions categorized by their primary function.

#### API Gateway Solutions

##### Kong Enterprise
```yaml
# Kong configuration example for API security
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: api-security-plugin
  namespace: default
plugin: rate-limiting
config:
  minute: 100
  hour: 1000
  day: 10000
  limit_by: ip
---
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: key-auth-plugin
  namespace: default
plugin: key-auth
config:
  key_names:
    - apikey
    - x-api-key
  hide_credentials: true
---
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: jwt-plugin
  namespace: default
plugin: jwt
config:
  secret_is_base64: false
  key_claim_name: "iss"
  algorithm: "HS256"
```

##### AWS API Gateway with Security Features
```python
import boto3
import json
from botocore.exceptions import ClientError

class AWSAPIGatewaySecurity:
    """Configure AWS API Gateway with security features"""
    
    def __init__(self, region_name: str = "us-east-1"):
        self.client = boto3.client('apigateway', region_name=region_name)
    
    def create_secure_api(
        self,
        api_name: str,
        description: str,
        enable_cors: bool = True,
        enable_api_key: bool = True,
        enable_usage_plan: bool = True
    ) -> str:
        """Create secure API gateway"""
        
        try:
            # Create API
            api_response = self.client.create_rest_api(
                name=api_name,
                description=description,
                version='1.0',
                endpointConfiguration={
                    'types': ['REGIONAL']
                }
            )
            
            api_id = api_response['id']
            
            # Enable API key authentication
            if enable_api_key:
                self._setup_api_key_authentication(api_id)
            
            # Setup usage plans and throttling
            if enable_usage_plan:
                self._setup_usage_plans(api_id)
            
            # Configure CORS
            if enable_cors:
                self._setup_cors(api_id)
            
            # Deploy API
            self._deploy_api(api_id)
            
            return api_id
            
        except ClientError as e:
            print(f"Failed to create API: {e}")
            return None
    
    def _setup_api_key_authentication(self, api_id: str):
        """Setup API key authentication"""
        
        # Create API key
        api_key_response = self.client.create_api_key(
            name=f"{api_id}-key",
            description=f"API key for {api_id}",
            enabled=True,
            generateDistinctId=True
        )
        
        print(f"API Key created: {api_key_response['value']}")
    
    def _setup_usage_plans(self, api_id: str):
        """Setup usage plans with throttling"""
        
        # Create usage plan
        usage_plan = self.client.create_usage_plan(
            name=f"{api_id}-plan",
            description="Usage plan with rate limiting",
            apiStages=[
                {
                    'apiId': api_id,
                    'stage': 'prod'
                }
            ],
            throttle={
                'rateLimit': 100.0,  # requests per second
                'burstLimit': 200     # burst capacity
            },
            quota={
                'limit': 10000,
                'period': 'DAY'
            }
        )
        
        return usage_plan['id']
    
    def _setup_cors(self, api_id: str):
        """Setup CORS configuration"""
        
        # This would involve setting up OPTIONS method with proper headers
        # Implementation depends on specific requirements
        pass
    
    def _deploy_api(self, api_id: str):
        """Deploy API to production stage"""
        
        # Get root resource
        resources = self.client.get_resources(restApiId=api_id)
        root_id = [r for r in resources['items'] if r['path'] == '/'][0]['id']
        
        # Create deployment
        deployment = self.client.create_deployment(
            restApiId=api_id,
            stageName='prod',
            description='Production deployment'
        )
        
        return deployment['id']
```

#### Web Application Firewall (WAF) Solutions

##### ModSecurity Core Rule Set
```apache
# ModSecurity configuration for API security
SecRuleEngine On
SecRequestBodyAccess On
SecResponseBodyAccess On

# Core rules for API protection
Include /etc/modsecurity.d/owasp-modsecurity-crs/crs-setup.conf
Include /etc/modsecurity.d/owasp-modsecurity-crs/rules/*.conf

# Custom API security rules
SecRule REQUEST_HEADERS:Content-Type "^application/json" \
    "id:100001,\
    phase:1,\
    pass,\
    t:none,\
    nolog,\
    ctl:requestBodyProcessor=JSON"

# Detect SQL injection in API parameters
SecRule ARGS "@detectSQLi" \
    "id:100002,\
    phase:2,\
    block,\
    msg:'SQL Injection Attack Detected',\
    logdata:'Matched Data: %{MATCHED_VAR} found within %{MATCHED_VAR_NAME}',\
    tag:'application-multi',\
    tag:'language-multi',\
    tag:'platform-multi',\
    tag:'attack-sqli'"

# Rate limiting for API endpoints
SecRule IP:REQUESTS_PER_MINUTE "@gt 100" \
    "id:100003,\
    phase:1,\
    deny,\
    status:429,\
    msg:'Rate limit exceeded'"

# Block suspicious user agents
SecRule REQUEST_HEADERS:User-Agent "@pmFromFile suspicious_user_agents.txt" \
    "id:100004,\
    phase:1,\
    deny,\
    status:403,\
    msg:'Suspicious User Agent'"
```

#### API Security Testing Tools

##### OWASP ZAP API Security Scan
```python
import subprocess
import json
from typing import List, Dict

class OWASPZAPScanner:
    """OWASP ZAP API security scanner"""
    
    def __init__(self, zap_path: str = "/usr/bin/zap.sh"):
        self.zap_path = zap_path
        self.api_key = "your-zap-api-key"
        self.zap_port = 8080
    
    def scan_api_security(
        self,
        target_url: str,
        api_spec_file: str = None,
        context_name: str = "API-Test"
    ) -> Dict:
        """Perform comprehensive API security scan"""
        
        results = {
            "target_url": target_url,
            "scan_start": datetime.utcnow().isoformat(),
            "vulnerabilities": [],
            "alerts": []
        }
        
        try:
            # Start ZAP daemon
            self._start_zap_daemon()
            
            # Load API specification if provided
            if api_spec_file:
                self._import_api_spec(api_spec_file, context_name)
            
            # Configure authentication
            self._configure_authentication(target_url)
            
            # Perform passive scan
            passive_results = self._passive_scan(target_url)
            results["vulnerabilities"].extend(passive_results["vulnerabilities"])
            
            # Perform active scan
            active_results = self._active_scan(target_url, context_name)
            results["vulnerabilities"].extend(active_results["vulnerabilities"])
            
            # Generate report
            results["report"] = self._generate_report()
            results["scan_end"] = datetime.utcnow().isoformat()
            
        except Exception as e:
            results["error"] = str(e)
        
        finally:
            self._stop_zap_daemon()
        
        return results
    
    def _start_zap_daemon(self):
        """Start ZAP in daemon mode"""
        
        cmd = [
            self.zap_path,
            "-daemon",
            f"-port {self.zap_port}",
            f"-config api.addrs.addr.name=.*",
            f"-config api.addrs.addr.regex=true",
            f"-config api.key={self.api_key}"
        ]
        
        subprocess.run(cmd, check=True)
        
        # Wait for ZAP to start
        import time
        time.sleep(10)
    
    def _import_api_spec(self, spec_file: str, context_name: str):
        """Import OpenAPI/Swagger specification"""
        
        import requests
        
        url = f"http://localhost:{self.zap_port}/JSON/openapi/action/importFile/"
        params = {
            "apiKey": self.api_key,
            "filePath": spec_file,
            "contextName": context_name
        }
        
        response = requests.get(url, params=params)
        if response.status_code != 200:
            raise Exception("Failed to import API specification")
    
    def _configure_authentication(self, target_url: str):
        """Configure authentication for scanning"""
        
        # Example: API key authentication
        import requests
        
        url = f"http://localhost:{self.zap_port}/JSON/authentication/action/setAuthenticationMethod/"
        params = {
            "apiKey": self.api_key,
            "contextId": "0",
            "authMethodName": "apiKey",
            "authMethodConfigParams": "apiKeyHeaderName=X-API-Key"
        }
        
        response = requests.get(url, params=params)
        return response.json()
    
    def _passive_scan(self, target_url: str) -> Dict:
        """Perform passive security scan"""
        
        # Spider the API
        self._spider_api(target_url)
        
        # Wait for passive scan to complete
        self._wait_for_passive_scan()
        
        # Get alerts
        alerts = self._get_alerts()
        
        return {
            "vulnerabilities": alerts,
            "scan_type": "passive"
        }
    
    def _active_scan(self, target_url: str, context_name: str) -> Dict:
        """Perform active security scan"""
        
        import requests
        
        url = f"http://localhost:{self.zap_port}/JSON/ascan/action/scan/"
        params = {
            "apiKey": self.api_key,
            "url": target_url,
            "contextId": "0",
            "recurse": "true"
        }
        
        response = requests.get(url, params=params)
        scan_id = response.json().get("scan")
        
        # Wait for active scan to complete
        self._wait_for_active_scan(scan_id)
        
        # Get alerts
        alerts = self._get_alerts()
        
        return {
            "vulnerabilities": alerts,
            "scan_type": "active"
        }
    
    def _spider_api(self, target_url: str):
        """Spider API to discover endpoints"""
        
        import requests
        
        url = f"http://localhost:{self.zap_port}/JSON/spider/action/scan/"
        params = {
            "apiKey": self.api_key,
            "url": target_url,
            "maxChildren": "100",
            "recurse": "true"
        }
        
        response = requests.get(url, params=params)
        scan_id = response.json().get("scan")
        
        # Wait for spider to complete
        self._wait_for_spider(scan_id)
    
    def _wait_for_spider(self, scan_id: str):
        """Wait for spider scan to complete"""
        
        import requests
        import time
        
        while True:
            url = f"http://localhost:{self.zap_port}/JSON/spider/view/status/"
            params = {"apiKey": self.api_key, "scanId": scan_id}
            
            response = requests.get(url, params=params)
            status = response.json().get("status")
            
            if status == "100":
                break
            
            time.sleep(5)
    
    def _get_alerts(self) -> List[Dict]:
        """Get security alerts from ZAP"""
        
        import requests
        
        url = f"http://localhost:{self.zap_port}/JSON/core/view/alerts/"
        params = {"apiKey": self.api_key}
        
        response = requests.get(url, params=params)
        alerts_data = response.json()
        
        alerts = []
        for alert in alerts_data.get("alerts", []):
            alerts.append({
                "name": alert.get("alert"),
                "risk": alert.get("risk"),
                "confidence": alert.get("confidence"),
                "description": alert.get("desc"),
                "solution": alert.get("solution"),
                "reference": alert.get("reference"),
                "instances": alert.get("instances", [])
            })
        
        return alerts
```

### Complete API Security Implementation Example

#### Production-Ready API Security Framework
```python
"""
Complete API Security Framework
Integrates all security components for production use
"""

from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import asyncio
from contextlib import asynccontextmanager

class ProductionAPISecurityFramework:
    """Complete production-ready API security framework"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.audit_logger = APAuditLogger(config.get("log_level", "INFO"))
        self.threat_detector = ThreatDetector(self.audit_logger)
        self.auth_manager = SecureAuthentication(config["jwt_secret"], self.audit_logger)
        self.consumption_guard = ResourceConsumptionGuard(self.audit_logger)
        self.function_auth = FunctionAuthorization(self.audit_logger)
        self.property_access = PropertyAccessControl()
        self.complexity_limiter = RequestComplexityLimiter()
        
        # Configure rate limits
        self._configure_rate_limits()
    
    def _configure_rate_limits(self):
        """Configure rate limits for different key types"""
        
        for key_type, limits in self.config.get("rate_limits", {}).items():
            config = RateLimitConfig(**limits)
            self.consumption_guard.configure_rate_limits(key_type, config)
    
    def create_secure_app(self) -> FastAPI:
        """Create FastAPI app with all security middleware"""
        
        # Create FastAPI app with lifecycle management
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            # Startup
            self.threat_detector.start_threat_detection()
            yield
            # Shutdown
            self.threat_detector.stop_threat_detection()
        
        app = FastAPI(
            title=self.config.get("app_title", "Secure API"),
            version="1.0.0",
            lifespan=lifespan
        )
        
        # Add security middleware
        self._add_security_middleware(app)
        
        # Add authentication endpoints
        self._add_auth_endpoints(app)
        
        # Add security monitoring endpoints
        self._add_monitoring_endpoints(app)
        
        return app
    
    def _add_security_middleware(self, app: FastAPI):
        """Add comprehensive security middleware"""
        
        # HTTPS redirect
        if self.config.get("enforce_https", True):
            app.add_middleware(HTTPSRedirectMiddleware)
        
        # Trusted hosts
        if self.config.get("trusted_hosts"):
            app.add_middleware(
                TrustedHostMiddleware,
                allowed_hosts=self.config["trusted_hosts"]
            )
        
        # Audit logging middleware
        app.add_middleware(AuditMiddleware, audit_logger=self.audit_logger)
        
        # Rate limiting middleware
        app.add_middleware(
            ResourceConsumptionMiddleware,
            consumption_guard=self.consumption_guard,
            complexity_limiter=self.complexity_limiter
        )
        
        # CORS middleware with strict settings
        from fastapi.middleware.cors import CORSMiddleware
        app.add_middleware(
            CORSMiddleware,
            allow_origins=self.config.get("cors_origins", []),
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE"],
            allow_headers=["Authorization", "Content-Type", "X-API-Key"]
        )
    
    def _add_auth_endpoints(self, app: FastAPI):
        """Add authentication and authorization endpoints"""
        
        security = HTTPBearer()
        
        @app.post("/auth/token")
        async def create_token(request: Request):
            """Create JWT token"""
            
            # Validate request
            data = await request.json()
            
            # Validate complexity
            is_valid, message = self.complexity_limiter.validate_request_complexity(data)
            if not is_valid:
                raise HTTPException(status_code=400, detail=message)
            
            # Authenticate user (simplified)
            username = data.get("username")
            password = data.get("password")
            
            if not self._authenticate_user(username, password):
                self.audit_logger.log_event(
                    event_type=AuditEventType.PERMISSION_DENIED,
                    key_id="auth_system",
                    user_id=username,
                    resource="/auth/token",
                    action="authentication",
                    success=False,
                    error_message="Invalid credentials"
                )
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            # Generate token
            token = self.auth_manager.generate_jwt_token(
                user_id=username,
                api_key_id=f"user_{username}",
                expires_in_minutes=60
            )
            
            return {"access_token": token, "token_type": "bearer"}
        
        @app.post("/auth/verify")
        async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
            """Verify JWT token"""
            
            payload = self.auth_manager.verify_jwt_token(credentials.credentials)
            if not payload:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            return {"valid": True, "payload": payload}
        
        @app.post("/auth/revoke")
        async def revoke_token(
            request: Request,
            credentials: HTTPAuthorizationCredentials = Depends(security)
        ):
            """Revoke JWT token"""
            
            success = self.auth_manager.revoke_token(
                credentials.credentials,
                reason="User requested revocation"
            )
            
            if not success:
                raise HTTPException(status_code=400, detail="Failed to revoke token")
            
            return {"message": "Token revoked successfully"}
    
    def _add_monitoring_endpoints(self, app: FastAPI):
        """Add security monitoring and admin endpoints"""
        
        @app.get("/admin/security/summary")
        async def get_security_summary():
            """Get security monitoring summary"""
            
            threat_summary = self.threat_detector.get_threat_summary()
            
            return {
                "threat_detection": threat_summary,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        @app.get("/admin/keys/{key_id}/usage")
        async def get_key_usage_summary(key_id: str):
            """Get usage summary for specific key"""
            
            summary = self.audit_logger.get_key_usage_summary(key_id)
            return summary
    
    def _authenticate_user(self, username: str, password: str) -> bool:
        """Authenticate user (simplified implementation)"""
        
        # In production, use proper user authentication
        # This is just a placeholder
        valid_users = {
            "admin": "secure_password_123",
            "user1": "user_password_456"
        }
        
        return valid_users.get(username) == password

# Configuration example
security_config = {
    "app_title": "Secure Production API",
    "jwt_secret": "your-super-secret-jwt-key-change-in-production",
    "enforce_https": True,
    "trusted_hosts": ["api.yourdomain.com", "yourdomain.com"],
    "cors_origins": ["https://yourdomain.com"],
    "log_level": "INFO",
    "rate_limits": {
        "production": {
            "requests_per_minute": 1000,
            "requests_per_hour": 50000,
            "requests_per_day": 1000000,
            "concurrent_requests": 100,
            "data_size_limit_mb": 50
        },
        "development": {
            "requests_per_minute": 100,
            "requests_per_hour": 5000,
            "requests_per_day": 50000,
            "concurrent_requests": 10,
            "data_size_limit_mb": 10
        }
    }
}

# Create and run secure application
framework = ProductionAPISecurityFramework(security_config)
app = framework.create_secure_app()

# Add your API endpoints with security
@app.get("/api/v1/secure-data")
@require_function_level(FunctionLevel.USER, "Access secure user data")
async def get_secure_data(
    current_user_id: str = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """Secure endpoint with multiple layers of protection"""
    
    # Verify JWT token
    payload = framework.auth_manager.verify_jwt_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Process request
    return {"message": "Secure data accessed successfully", "user": current_user_id}

if __name__ == "__main__":
    import uvicorn
    
    # Run with security best practices
    uvicorn.run(
        "secure_api:app",
        host="0.0.0.0",
        port=8000,
        ssl_keyfile="path/to/key.pem",
        ssl_certfile="path/to/cert.pem",
        reload=False,
        workers=4
    )
```

---

## Security Checklist

### Pre-Deployment Security Checklist

#### API Key Management
- [ ] API keys are generated with sufficient entropy (256 bits recommended)
- [ ] Key format follows organizational standards
- [ ] Keys are properly classified (CRITICAL, HIGH, MEDIUM, LOW)
- [ ] Rotation schedules are configured based on classification
- [ ] Automated rotation is enabled for critical keys
- [ ] Backup procedures are in place for key recovery
- [ ] Revocation process is documented and tested

#### Authentication & Authorization
- [ ] Multi-factor authentication is implemented for sensitive operations
- [ ] JWT tokens have appropriate expiration times
- [ ] Token blacklisting is implemented for revocation
- [ ] Role-based access control (RBAC) is properly configured
- [ ] Principle of least privilege is enforced
- [ ] Function-level authorization is implemented
- [ ] Object-level authorization checks are in place
- [ ] Property-level access control is configured

#### Data Protection
- [ ] Data is encrypted at rest using AES-256 or stronger
- [ ] Data is encrypted in transit using TLS 1.3
- [ ] Sensitive data is masked in logs and responses
- [ ] Database connections use encrypted connections
- [ ] Backup data is encrypted
- [ ] PII is properly identified and protected
- [ ] Data retention policies are implemented

#### Rate Limiting & Resource Protection
- [ ] Rate limits are configured for different user tiers
- [ ] Concurrent request limits are enforced
- [ ] Request size limits are implemented
- [ ] Request complexity validation is in place
- [ ] DDoS protection is configured
- [ ] Resource exhaustion attacks are mitigated
- [ ] Geographic rate limiting is considered

#### Monitoring & Logging
- [ ] Comprehensive audit logging is implemented
- [ ] Failed authentication attempts are logged
- [ ] API usage patterns are monitored
- [ ] Anomaly detection is configured
- [ ] Real-time alerting is set up
- [ ] Logs are securely stored and rotated
- [ ] Log tampering is prevented

#### Network Security
- [ ] HTTPS is enforced for all API communications
- [ ] TLS certificates are properly configured
- [ ] Security headers are implemented
- [ ] CORS is properly configured
- [ ] IP whitelisting is used where appropriate
- [ ] VPN or private networks are used for internal APIs
- [ ] Network segmentation is implemented

#### Testing & Validation
- [ ] Security testing is integrated in CI/CD pipeline
- [ ] Penetration testing is performed regularly
- [ ] API specification security is validated
- [ ] Input validation is comprehensive
- [ ] Output encoding is implemented
- [ ] Error messages don't leak sensitive information
- [ ] Dependency scanning is performed

#### Compliance & Documentation
- [ ] Security policies are documented
- [ ] Compliance requirements are identified and met
- [ ] Security training is provided to developers
- [ ] Incident response plan is documented
- [ ] Data privacy notices are accurate
- [ ] Security metrics are tracked and reported
- [ ] Regular security reviews are scheduled

### Post-Deployment Monitoring Checklist

#### Daily Monitoring Tasks
- [ ] Review security alerts and incidents
- [ ] Check for unusual API usage patterns
- [ ] Monitor failed authentication attempts
- [ ] Verify system performance and availability
- [ ] Review error rates and types
- [ ] Check for new IP addresses accessing APIs
- [ ] Validate rate limit compliance

#### Weekly Monitoring Tasks
- [ ] Analyze threat detection summaries
- [ ] Review audit logs for suspicious activities
- [ ] Check API key rotation compliance
- [ ] Update security patches and dependencies
- [ ] Review and update security configurations
- [ ] Analyze geographic access patterns
- [ ] Check for newly discovered vulnerabilities

#### Monthly Monitoring Tasks
- [ ] Generate comprehensive security reports
- [ ] Perform security assessment reviews
- [ ] Update risk assessments
- [ ] Review and update security policies
- [ ] Conduct security training refreshers
- [ ] Perform backup and recovery tests
- [ ] Review compliance status and updates

### Incident Response Checklist

#### Immediate Response (First Hour)
- [ ] Identify and confirm the security incident
- [ ] Activate incident response team
- [ ] Isolate affected systems if necessary
- [ ] Preserve evidence and logs
- [ ] Implement temporary containment measures
- [ ] Notify stakeholders as required
- [ ] Document all response actions

#### Investigation Phase (First 24 Hours)
- [ ] Analyze attack vectors and impact
- [ ] Identify affected data and systems
- [ ] Determine root cause of the incident
- [ ] Assess regulatory notification requirements
- [ ] Communicate with law enforcement if needed
- [ ] Begin recovery planning
- [ ] Update incident documentation

#### Recovery Phase (Following Days)
- [ ] Implement permanent fixes
- [ ] Restore systems from clean backups
- [ ] Monitor for recurring threats
- [ ] Update security configurations
- [ ] Conduct post-incident review
- [ ] Update security policies and procedures
- [ ] Provide customer notifications if required

#### Post-Incident Review
- [ ] Document lessons learned
- [ ] Update threat detection rules
- [ ] Improve monitoring and alerting
- [ ] Update security training materials
- [ ] Review and improve incident response plan
- [ ] Implement preventive measures
- [ ] Schedule follow-up assessments

---

## References & Further Reading

### Security Standards and Frameworks
- **OWASP API Security Top 10** - https://owasp.org/www-project-api-security/
- **NIST Cybersecurity Framework** - https://www.nist.gov/cyberframework
- **ISO 27001** - Information Security Management
- **SOC 2 Compliance** - Service Organization Control 2
- **PCI DSS** - Payment Card Industry Data Security Standard

### Documentation and Resources
- **REST API Security Best Practices** - OWASP Cheat Sheet Series
- **JWT Handbook** - https://jwt.io/
- **OAuth 2.0 Security Best Practices** - https://tools.ietf.org/html/draft-ietf-oauth-security-topics
- **API Security Architecture** - O'Reilly Media
- **Microservices Security** - Manning Publications

### Tools and Technologies
- **OWASP ZAP** - https://www.zaproxy.org/
- **Burp Suite** - https://portswigger.net/burp
- **Postman** - API testing and security
- **Kong API Gateway** - https://konghq.com/
- **AWS API Gateway** - https://aws.amazon.com/api-gateway/
- **HashiCorp Vault** - https://www.vaultproject.io/

### Compliance and Regulations
- **GDPR** - General Data Protection Regulation
- **CCPA** - California Consumer Privacy Act
- **HIPAA** - Health Insurance Portability and Accountability Act
- **SOX** - Sarbanes-Oxley Act
- **FIPS** - Federal Information Processing Standards

### Training and Certification
- **CISSP** - Certified Information Systems Security Professional
- **CEH** - Certified Ethical Hacker
- **CompTIA Security+** - Security Certification
- **AWS Security Specialty** - Cloud Security Certification
- **Google Cloud Security** - Professional Security Certification

### Community and Forums
- **OWASP Community** - https://owasp.org/
- **Stack Security Exchange** - https://security.stackexchange.com/
- **Reddit r/netsec** - Network Security Community
- **SANS Institute** - Security Training and Research
- **DEF CON** - Hacker Conference and Community

---

## Conclusion

API security is an ongoing process that requires continuous attention, regular updates, and a comprehensive approach to threat management. This guide provides a foundation for building secure APIs, but organizations must adapt these practices to their specific requirements, threat landscape, and compliance obligations.

Remember these key principles:

1. **Security by Design**: Implement security from the beginning, not as an afterthought
2. **Defense in Depth**: Use multiple layers of security controls
3. **Continuous Monitoring**: Security is not a one-time implementation but an ongoing process
4. **Regular Updates**: Keep dependencies, configurations, and knowledge current
5. **Incident Preparedness**: Assume breaches will occur and plan accordingly

By following the best practices outlined in this guide and maintaining a vigilant security posture, organizations can significantly reduce their risk profile and protect their APIs, data, and users from evolving threats.