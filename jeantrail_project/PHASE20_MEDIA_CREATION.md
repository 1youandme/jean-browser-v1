**Phase 20 – Media Creation & Quality Core**
- Quality is architectural
- Models are replaceable
- No visual artifacts by default

**Creation Types**
- `image`, `video`, `audio`
- Model-agnostic request with `intent`, `style`, `qualityProfileId`

**Quality Assurance Profile**
- Resolution rules with min/max and target aspect
- Artifact prevention flags
- Consistency constraints across media types

**Planning**
- Separate creation intent, quality validation, future rendering
- Symbolic `CreationPlan` and `QualityValidationResult`
- Prevent distortions by design via constraints and flags

**Constraints**
- Additive only
- No hardcoded AI models
- No execution in this phase
- Abstract quality control
