use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::security::{License, SubscriptionTier};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Sponsorship {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub image_url: String,
    pub link_url: String,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub is_active: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub enum PaidFeature {
    EncryptedCloudSync,
    AdvancedAnalytics,
    PrioritySupport,
    MultiUser,
    CustomBranding,
    PolicyEngine,
    AuditLogs,
}

pub struct MonetizationManager {
    sponsorships: Vec<Sponsorship>,
}

impl MonetizationManager {
    pub fn new() -> Self {
        Self {
            sponsorships: Self::load_static_sponsorships(),
        }
    }

    fn load_static_sponsorships() -> Vec<Sponsorship> {
        // In a real app, this might come from a signed config file downloaded periodically.
        // For "Monetization Without Surveillance", these are static, transparent, and don't track users.
        vec![
            Sponsorship {
                id: Uuid::new_v4(),
                name: "Ethical Hosting Provider".to_string(),
                description: "Private, secure VPS hosting for your Jean instance.".to_string(),
                image_url: "https://example.com/assets/sponsors/ethical-host.png".to_string(),
                link_url: "https://example.com/sponsors/ethical-host".to_string(),
                start_date: Utc::now() - chrono::Duration::days(1),
                end_date: Utc::now() + chrono::Duration::days(30),
                is_active: true,
            },
            Sponsorship {
                id: Uuid::new_v4(),
                name: "Open Source Hardware Co".to_string(),
                description: "Laptops designed for privacy and repairability.".to_string(),
                image_url: "https://example.com/assets/sponsors/osh-co.png".to_string(),
                link_url: "https://example.com/sponsors/osh-co".to_string(),
                start_date: Utc::now() - chrono::Duration::days(5),
                end_date: Utc::now() + chrono::Duration::days(25),
                is_active: true,
            }
        ]
    }

    pub fn get_active_sponsorships(&self) -> Vec<Sponsorship> {
        let now = Utc::now();
        self.sponsorships.iter()
            .filter(|s| s.is_active && s.start_date <= now && s.end_date >= now)
            .cloned()
            .collect()
    }

    pub fn check_feature_access(&self, license: Option<&License>, feature: PaidFeature) -> bool {
        // Default to Free tier if no license
        let tier = license.map(|l| &l.tier).unwrap_or(&SubscriptionTier::Free);

        match feature {
            // Pro features (also available in Enterprise)
            PaidFeature::EncryptedCloudSync | PaidFeature::AdvancedAnalytics | PaidFeature::PrioritySupport => {
                matches!(tier, SubscriptionTier::Pro | SubscriptionTier::Enterprise)
            },

            // Enterprise features
            PaidFeature::MultiUser | PaidFeature::CustomBranding | PaidFeature::PolicyEngine | PaidFeature::AuditLogs => {
                matches!(tier, SubscriptionTier::Enterprise)
            }
        }
    }
}
