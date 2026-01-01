// Common utility types used across Jean modules
// Enum types for common values
export var Status;
(function (Status) {
    Status["ACTIVE"] = "active";
    Status["INACTIVE"] = "inactive";
    Status["PENDING"] = "pending";
    Status["ARCHIVED"] = "archived";
    Status["DELETED"] = "deleted";
})(Status || (Status = {}));
export var Priority;
(function (Priority) {
    Priority["LOW"] = "low";
    Priority["MEDIUM"] = "medium";
    Priority["HIGH"] = "high";
    Priority["CRITICAL"] = "critical";
})(Priority || (Priority = {}));
export var AccessLevel;
(function (AccessLevel) {
    AccessLevel["PUBLIC"] = "public";
    AccessLevel["PRIVATE"] = "private";
    AccessLevel["RESTRICTED"] = "restricted";
})(AccessLevel || (AccessLevel = {}));
