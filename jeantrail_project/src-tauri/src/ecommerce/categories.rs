use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};

use crate::commands::{CommandResult, DatabasePool};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub parent_id: Option<Uuid>,
    pub level: i32,
    pub sort_order: i32,
    pub image_url: Option<String>,
    pub is_active: bool,
    pub external_mappings: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Subcategory {
    pub id: Uuid,
    pub category_id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub sort_order: i32,
    pub image_url: Option<String>,
    pub is_active: bool,
    pub external_mappings: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryCreateRequest {
    pub name: String,
    pub slug: Option<String>,
    pub description: Option<String>,
    pub parent_id: Option<Uuid>,
    pub sort_order: Option<i32>,
    pub image_url: Option<String>,
    pub external_mappings: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubcategoryCreateRequest {
    pub category_id: Uuid,
    pub name: String,
    pub slug: Option<String>,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
    pub image_url: Option<String>,
    pub external_mappings: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryMapping {
    pub platform: String, // alibaba, 1688, amazon, etc.
    pub external_id: String,
    pub external_name: String,
    pub external_path: String,
    pub internal_category_id: Uuid,
    pub internal_subcategory_id: Option<Uuid>,
    pub confidence_score: f64,
    pub mapping_type: String, // auto, manual, ai_suggested
    pub is_active: bool,
}

pub struct CategoryService {
    pool: PgPool,
}

impl CategoryService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create new category
    pub async fn create_category(
        &self,
        request: CategoryCreateRequest,
    ) -> CommandResult<Category> {
        let category_id = Uuid::new_v4();
        let slug = request.slug.unwrap_or_else(|| self.generate_slug(&request.name));
        let level = if request.parent_id.is_some() { 2 } else { 1 };
        let now = Utc::now();

        sqlx::query!(
            r#"
            INSERT INTO categories (
                id, name, slug, description, parent_id, level, sort_order,
                image_url, is_active, external_mappings, metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
            "#,
            category_id,
            request.name,
            slug,
            request.description,
            request.parent_id,
            level,
            request.sort_order.unwrap_or(0),
            request.image_url,
            true, // is_active
            request.external_mappings,
            request.metadata,
            now,
            now
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to create category: {}", e))
    }

    /// Create new subcategory
    pub async fn create_subcategory(
        &self,
        request: SubcategoryCreateRequest,
    ) -> CommandResult<Subcategory> {
        let subcategory_id = Uuid::new_v4();
        let slug = request.slug.unwrap_or_else(|| self.generate_slug(&request.name));
        let now = Utc::now();

        sqlx::query!(
            r#"
            INSERT INTO subcategories (
                id, category_id, name, slug, description, sort_order,
                image_url, is_active, external_mappings, metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
            "#,
            subcategory_id,
            request.category_id,
            request.name,
            slug,
            request.description,
            request.sort_order.unwrap_or(0),
            request.image_url,
            true, // is_active
            request.external_mappings,
            request.metadata,
            now,
            now
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to create subcategory: {}", e))
    }

    /// Get all categories with their subcategories
    pub async fn get_categories_with_subcategories(&self) -> CommandResult<Vec<(Category, Vec<Subcategory>)>> {
        let mut conn = self.pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Get all active categories
        let categories = sqlx::query_as!(
            Category,
            r#"
            SELECT * FROM categories 
            WHERE is_active = true 
            ORDER BY level ASC, sort_order ASC, name ASC
            "#
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get categories: {}", e))?;

        // Get subcategories for each category
        let mut result = Vec::new();
        for category in categories {
            let subcategories = sqlx::query_as!(
                Subcategory,
                r#"
                SELECT * FROM subcategories 
                WHERE category_id = $1 AND is_active = true 
                ORDER BY sort_order ASC, name ASC
                "#,
                category.id
            )
            .fetch_all(&mut *conn)
            .await
            .map_err(|e| format!("Failed to get subcategories: {}", e))?;

            result.push((category, subcategories));
        }

        Ok(result)
    }

    /// Get category by slug
    pub async fn get_category_by_slug(&self, slug: &str) -> CommandResult<Category> {
        sqlx::query_as!(
            Category,
            "SELECT * FROM categories WHERE slug = $1 AND is_active = true",
            slug
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to get category: {}", e))
    }

    /// Get subcategory by slug with category
    pub async fn get_subcategory_by_slug(&self, slug: &str) -> CommandResult<(Subcategory, Category)> {
        let mut conn = self.pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        let subcategory = sqlx::query_as!(
            Subcategory,
            r#"
            SELECT sc.* FROM subcategories sc
            WHERE sc.slug = $1 AND sc.is_active = true
            "#,
            slug
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get subcategory: {}", e))?;

        let category = sqlx::query_as!(
            Category,
            "SELECT * FROM categories WHERE id = $1 AND is_active = true",
            subcategory.category_id
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get category: {}", e))?;

        Ok((subcategory, category))
    }

    /// Auto-categorize product based on raw category path
    pub async fn categorize_product(
        &self,
        raw_category_path: Option<&str>,
    ) -> CommandResult<(Option<Uuid>, Option<Uuid>)> {
        if let Some(raw_path) = raw_category_path {
            let keywords: Vec<&str> = raw_path.split('>').collect();
            
            for keyword in keywords {
                let keyword = keyword.trim().to_lowercase();
                
                // Search for category with matching external mapping or keywords
                if let Some((category_id, subcategory_id)) = self.find_category_by_keyword(&keyword).await? {
                    return Ok((Some(category_id), subcategory_id));
                }
            }
        }

        Ok((None, None))
    }

    /// Find category by keyword matching
    async fn find_category_by_keyword(
        &self,
        keyword: &str,
    ) -> CommandResult<Option<(Uuid, Option<Uuid>)>> {
        let mut conn = self.pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Search categories
        let category = sqlx::query!(
            r#"
            SELECT id, name FROM categories 
            WHERE is_active = true 
                AND (
                    external_mappings::text ILIKE $1 
                    OR name ILIKE $1
                    OR LOWER(name) LIKE $2
                )
            LIMIT 1
            "#,
            format!("%{}%", keyword),
            format!("%{}%", keyword)
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to find category: {}", e))?;

        if let Some(cat) = category {
            // Search subcategories for this category
            let subcategory = sqlx::query!(
                r#"
                SELECT id FROM subcategories 
                WHERE category_id = $1 AND is_active = true
                    AND (
                        external_mappings::text ILIKE $2 
                        OR name ILIKE $2
                        OR LOWER(name) LIKE $3
                    )
                LIMIT 1
                "#,
                cat.id,
                format!("%{}%", keyword),
                format!("%{}%", keyword)
            )
            .fetch_optional(&mut *conn)
            .await
            .map_err(|e| format!("Failed to find subcategory: {}", e))?;

            return Ok(Some((cat.id, subcategory.map(|s| s.id))));
        }

        Ok(None)
    }

    /// Import Google Product Taxonomy
    pub async fn import_google_taxonomy(&self, taxonomy_data: Vec<TaxonomyImport>) -> CommandResult<usize> {
        let mut imported_count = 0;

        for item in taxonomy_data {
            // Create or update category
            let category_id = match self.find_or_create_category(&item.category_name, &item.category_id).await? {
                Ok(id) => id,
                Err(_) => continue,
            };

            // Create or update subcategory
            if !item.subcategory_name.is_empty() {
                if let Ok(_) = self.find_or_create_subcategory(
                    category_id,
                    &item.subcategory_name,
                    &item.subcategory_id
                ).await {
                    imported_count += 1;
                }
            }
        }

        Ok(imported_count)
    }

    /// Find or create category by external ID
    async fn find_or_create_category(
        &self,
        name: &str,
        external_id: &str,
    ) -> CommandResult<Uuid> {
        let mut conn = self.pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Try to find existing category
        if let Some(existing) = sqlx::query!(
            r#"
            SELECT id FROM categories 
            WHERE external_mappings::text LIKE $1
            LIMIT 1
            "#,
            format!("%&quot;google_taxonomy_id&quot;:&quot;{}&quot;%", external_id)
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to find existing category: {}", e))? {
            return Ok(existing.id);
        }

        // Create new category
        let category_id = Uuid::new_v4();
        let slug = self.generate_slug(name);

        sqlx::query!(
            r#"
            INSERT INTO categories (
                id, name, slug, level, is_active, external_mappings, created_at, updated_at
            ) VALUES ($1, $2, $3, 1, $4, $5, $6, $7)
            "#,
            category_id,
            name,
            slug,
            true,
            serde_json::json!({"google_taxonomy_id": external_id}),
            Utc::now(),
            Utc::now()
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to create category: {}", e))?;

        Ok(category_id)
    }

    /// Find or create subcategory by external ID
    async fn find_or_create_subcategory(
        &self,
        category_id: Uuid,
        name: &str,
        external_id: &str,
    ) -> CommandResult<Uuid> {
        let mut conn = self.pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Try to find existing subcategory
        if let Some(existing) = sqlx::query!(
            r#"
            SELECT id FROM subcategories 
            WHERE category_id = $1 AND external_mappings::text LIKE $2
            LIMIT 1
            "#,
            category_id,
            format!("%&quot;google_taxonomy_id&quot;:&quot;{}&quot;%", external_id)
        )
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| format!("Failed to find existing subcategory: {}", e))? {
            return Ok(existing.id);
        }

        // Create new subcategory
        let subcategory_id = Uuid::new_v4();
        let slug = self.generate_slug(name);

        sqlx::query!(
            r#"
            INSERT INTO subcategories (
                id, category_id, name, slug, is_active, external_mappings, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
            subcategory_id,
            category_id,
            name,
            slug,
            true,
            serde_json::json!({"google_taxonomy_id": external_id}),
            Utc::now(),
            Utc::now()
        )
        .execute(&mut *conn)
        .await
        .map_err(|e| format!("Failed to create subcategory: {}", e))?;

        Ok(subcategory_id)
    }

    /// Generate URL-friendly slug
    fn generate_slug(&self, name: &str) -> String {
        name.to_lowercase()
            .chars()
            .map(|c| match c {
                'a'..='z' | '0'..='9' => c,
                _ => '-',
            })
            .collect::<String>()
            .split('-')
            .filter(|s| !s.is_empty())
            .collect::<Vec<&str>>()
            .join("-")
    }

    /// Get category statistics
    pub async fn get_category_stats(&self) -> CommandResult<serde_json::Value> {
        let mut conn = self.pool.acquire().await
            .map_err(|e| format!("Failed to get connection: {}", e))?;

        // Total categories and subcategories
        let total_categories = sqlx::query_scalar!(
            "SELECT COUNT(*) FROM categories WHERE is_active = true",
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get category count: {}", e))?
        .unwrap_or(0);

        let total_subcategories = sqlx::query_scalar!(
            "SELECT COUNT(*) FROM subcategories WHERE is_active = true",
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get subcategory count: {}", e))?
        .unwrap_or(0);

        // Categories with product counts
        let categories_with_products = sqlx::query!(
            r#"
            SELECT 
                c.id, c.name, c.slug,
                COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.is_visible = true
            WHERE c.is_active = true
            GROUP BY c.id, c.name, c.slug
            ORDER BY product_count DESC, c.name ASC
            "#
        )
        .fetch_all(&mut *conn)
        .await
        .map_err(|e| format!("Failed to get category product counts: {}", e))?;

        let stats = serde_json::json!({
            "total_categories": total_categories,
            "total_subcategories": total_subcategories,
            "categories": categories_with_products.into_iter().map(|r| serde_json::json!({
                "id": r.id,
                "name": r.name,
                "slug": r.slug,
                "product_count": r.product_count.unwrap_or(0)
            })).collect::<Vec<_>>()
        });

        Ok(stats)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaxonomyImport {
    pub category_id: String,
    pub category_name: String,
    pub subcategory_id: String,
    pub subcategory_name: String,
}

pub struct SubcategoryService {
    pool: PgPool,
}

impl SubcategoryService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Get subcategories for a category
    pub async fn get_subcategories_for_category(
        &self,
        category_id: Uuid,
    ) -> CommandResult<Vec<Subcategory>> {
        sqlx::query_as!(
            Subcategory,
            r#"
            SELECT * FROM subcategories 
            WHERE category_id = $1 AND is_active = true 
            ORDER BY sort_order ASC, name ASC
            "#,
            category_id
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get subcategories: {}", e))
    }
}