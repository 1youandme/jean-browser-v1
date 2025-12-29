pub mod products;
pub mod pricing;
pub mod categories;
pub mod promotions;
pub mod orders;
pub mod suppliers;
pub mod scraper_integration;

pub use products::*;
pub use pricing::*;
pub use categories::*;
pub use promotions::*;
pub use orders::*;
pub use suppliers::*;
pub use scraper_integration::*;

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EcommerceConfig {
    pub default_margin_percent: f64,
    pub minimum_margin_percent: f64,
    pub competitor_threshold_percent: f64,
    pub promo_duration_hours: i32,
    pub auto_pricing_enabled: bool,
    pub categorization_enabled: bool,
}

impl Default for EcommerceConfig {
    fn default() -> Self {
        Self {
            default_margin_percent: 40.0,
            minimum_margin_percent: 10.0,
            competitor_threshold_percent: 15.0,
            promo_duration_hours: 24,
            auto_pricing_enabled: true,
            categorization_enabled: true,
        }
    }
}