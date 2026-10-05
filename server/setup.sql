-- GHRA Membership System — full database setup
-- Run this script once in SSMS against the APIDB database on a fresh install.
-- On existing databases the server auto-migrates via ensureSchema() on startup.
USE APIDB;
GO

-- ── Users ────────────────────────────────────────────────────────────────────
-- Members and employees. Role is 'member' or 'employee'.
CREATE TABLE Users (
  Id                 INT IDENTITY(1,1) PRIMARY KEY,
  Email              NVARCHAR(255) NOT NULL UNIQUE,        -- stored lowercase
  PasswordHash       NVARCHAR(255) NOT NULL,               -- bcrypt, 10 rounds
  Role               NVARCHAR(20)  NOT NULL DEFAULT 'member',
  MustChangePassword BIT           NOT NULL DEFAULT 0,     -- 1 = forced change on next login
  FirstName          NVARCHAR(100) NULL,
  LastName           NVARCHAR(100) NULL,
  CreatedAt          DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ── Applications ─────────────────────────────────────────────────────────────
-- Main GHRA membership application. One row per application.
-- FormData is a JSON blob; owner SSNs are stored as AES-256-GCM ciphertext (ssnEncrypted).
-- Status flow: draft → submitted → pending_signature → signed; or rejected at any point after submit.
CREATE TABLE Applications (
  Id                           INT IDENTITY(1,1) PRIMARY KEY,
  UserEmail                    NVARCHAR(255) NOT NULL,
  StoreName                    NVARCHAR(255) NULL,
  StoreAddress                 NVARCHAR(500) NULL,
  Status                       NVARCHAR(20)  NOT NULL DEFAULT 'draft',
  CurrentStep                  INT           NOT NULL DEFAULT 1,
  FormData                     NVARCHAR(MAX) NOT NULL,
  Notes                        NVARCHAR(MAX) NULL,
  CommentsHistory              NVARCHAR(MAX) NULL,          -- JSON array: { status, comment, reviewedBy, reviewedAt }[]
  ReviewedBy                   NVARCHAR(255) NULL,
  ReviewedAt                   DATETIME      NULL,

  -- Dropbox Sign — membership request
  SignatureRequestId           NVARCHAR(255) NULL,
  SignedAt                     DATETIME      NULL,

  -- Dropbox Sign — references request
  ReferencesSignatureRequestId NVARCHAR(255) NULL,
  ReferencesSignatureStatus    NVARCHAR(50)  NULL,          -- sent | signed
  ReferencesSignedAt           DATETIME      NULL,
  Ref1SignatureId              NVARCHAR(255) NULL,
  Ref2SignatureId              NVARCHAR(255) NULL,
  Ref1SignatureStatus          NVARCHAR(50)  NULL,
  Ref2SignatureStatus          NVARCHAR(50)  NULL,

  -- Board signers (set at approval time)
  BoardSignerVerificationFirstName NVARCHAR(100) NULL,
  BoardSignerVerificationLastName  NVARCHAR(100) NULL,
  BoardSignerVerificationEmail     NVARCHAR(255) NULL,
  VerificationSignatureId          NVARCHAR(255) NULL,
  VerificationSignatureStatus      NVARCHAR(50)  NULL,
  VerificationSignedAt             DATETIME      NULL,

  BoardSignerApprovedFirstName     NVARCHAR(100) NULL,
  BoardSignerApprovedLastName      NVARCHAR(100) NULL,
  BoardSignerApprovedEmail         NVARCHAR(255) NULL,
  ApprovedSignatureId              NVARCHAR(255) NULL,
  ApprovedSignatureStatus          NVARCHAR(50)  NULL,
  ApprovedSignedAt                 DATETIME      NULL,

  -- MembershipAdmin (4th DS signer)
  AdminSignerFirstName NVARCHAR(100) NULL,
  AdminSignerLastName  NVARCHAR(100) NULL,
  AdminSignerEmail     NVARCHAR(255) NULL,
  AdminSignatureId     NVARCHAR(255) NULL,
  AdminSignatureStatus NVARCHAR(50)  NULL,
  AdminSignedAt        DATETIME      NULL,

  -- GHRA membership number
  GhraNumber          NVARCHAR(50)  NULL,
  GhraNumberSource    NVARCHAR(20)  NULL,     -- 'manual' | 'ds'
  GhraNumberUpdatedBy NVARCHAR(255) NULL,
  GhraNumberUpdatedAt DATETIME      NULL,
  GhraNumberIssue     NVARCHAR(255) NULL,

  -- ACH
  AchAuthorizationDate DATETIME NULL,

  -- Archive
  IsArchived BIT          NOT NULL DEFAULT 0,
  ArchivedBy NVARCHAR(255) NULL,
  ArchivedAt DATETIME      NULL,

  -- Manager notifications
  ManagerNotificationsSent BIT NOT NULL DEFAULT 0,

  CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
  UpdatedAt DATETIME NULL,

  FOREIGN KEY (UserEmail) REFERENCES Users(Email)
);
GO

-- ── AchBatches ────────────────────────────────────────────────────────────────
-- Each generated ACH CSV file. FileContent is SENSITIVE — employee-only.
CREATE TABLE AchBatches (
  Id          INT IDENTITY(1,1) PRIMARY KEY,
  GeneratedAt DATETIME      NOT NULL DEFAULT GETDATE(),
  GeneratedBy NVARCHAR(255) NOT NULL,
  AppCount    INT           NOT NULL,
  FileContent NVARCHAR(MAX) NOT NULL   -- ⚠ sensitive: bank routing + account numbers
);
GO

-- ── DsEventLog ────────────────────────────────────────────────────────────────
-- Audit trail for every outbound Dropbox Sign SDK call and inbound webhook event.
CREATE TABLE DsEventLog (
  Id                 INT IDENTITY(1,1) PRIMARY KEY,
  ApplicationId      INT           NULL,
  Direction          NVARCHAR(20)  NOT NULL,   -- 'outbound' | 'inbound'
  Operation          NVARCHAR(100) NOT NULL,
  SignatureRequestId NVARCHAR(255) NULL,
  Success            BIT           NOT NULL DEFAULT 0,
  HttpStatus         INT           NULL,
  ErrorCode          NVARCHAR(100) NULL,
  ErrorMessage       NVARCHAR(MAX) NULL,
  RequestSummary     NVARCHAR(MAX) NULL,        -- masked JSON
  ResponseSummary    NVARCHAR(MAX) NULL,        -- masked JSON
  DurationMs         INT           NULL,
  PerformedBy        NVARCHAR(255) NULL,
  CreatedAt          DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ── ApplicationAuditLog ───────────────────────────────────────────────────────
-- Significant employee-initiated actions on applications. Retain 7 years minimum.
CREATE TABLE ApplicationAuditLog (
  Id              INT IDENTITY(1,1) PRIMARY KEY,
  ApplicationId   INT           NOT NULL,
  Action          NVARCHAR(50)  NOT NULL,
  PerformedBy     NVARCHAR(255) NOT NULL,
  PerformedByRole NVARCHAR(20)  NULL,
  Details         NVARCHAR(MAX) NULL,
  PreviousStatus  NVARCHAR(20)  NULL,
  NewStatus       NVARCHAR(20)  NULL,
  IpAddress       NVARCHAR(45)  NULL,
  CreatedAt       DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ── AppSettings ───────────────────────────────────────────────────────────────
-- Key/value store for app-level settings (SMTP config, etc.).
-- Sensitive values (SMTP password) are AES-256-GCM encrypted.
CREATE TABLE AppSettings (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  SettingKey   NVARCHAR(100) NOT NULL UNIQUE,
  SettingValue NVARCHAR(MAX) NULL,
  UpdatedBy    NVARCHAR(255) NULL,
  UpdatedAt    DATETIME      NULL
);
GO

-- ── EmailLog ──────────────────────────────────────────────────────────────────
-- Audit trail for every outbound email attempt.
CREATE TABLE EmailLog (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  Recipient    NVARCHAR(255) NOT NULL,
  Template     NVARCHAR(100) NULL,
  Subject      NVARCHAR(500) NULL,
  Success      BIT           NOT NULL DEFAULT 0,
  ErrorMessage NVARCHAR(MAX) NULL,
  SentBy       NVARCHAR(255) NULL,
  SentAt       DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ── Managers ──────────────────────────────────────────────────────────────────
-- Named contacts notified on GHRA# assignment.
-- ManagerType: 'store_reset' | 'fuels' | 'food_service'
CREATE TABLE Managers (
  Id          INT IDENTITY(1,1) PRIMARY KEY,
  ManagerType NVARCHAR(30)  NOT NULL,
  FirstName   NVARCHAR(100) NOT NULL,
  LastName    NVARCHAR(100) NOT NULL,
  Email       NVARCHAR(255) NOT NULL,
  IsActive    BIT           NOT NULL DEFAULT 1,
  CreatedBy   NVARCHAR(255) NULL,
  CreatedAt   DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- ── UserRoles ─────────────────────────────────────────────────────────────────
-- M:M table for additional employee roles.
-- Valid roles: 'ghra_admin' | 'fuels_admin' | 'warehouse_admin'
-- admin@ghraonline.com always has all roles (derived at login, not stored here).
CREATE TABLE UserRoles (
  Id         INT IDENTITY(1,1) PRIMARY KEY,
  UserId     INT           NOT NULL,
  Role       NVARCHAR(50)  NOT NULL,
  AssignedBy NVARCHAR(255) NULL,
  AssignedAt DATETIME      NOT NULL DEFAULT GETDATE(),
  CONSTRAINT UQ_UserRoles UNIQUE (UserId, Role),
  FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

-- ── WarehouseApplications ─────────────────────────────────────────────────────
-- Standalone GHRA Warehouse customer account applications (Phase 4).
-- FormData JSON: owner DL numbers stored as dlEncrypted (AES-256-GCM).
-- Status flow: draft → submitted → approved | rejected
CREATE TABLE WarehouseApplications (
  Id          INT IDENTITY(1,1) PRIMARY KEY,
  UserEmail   NVARCHAR(255) NOT NULL,
  Status      NVARCHAR(20)  NOT NULL DEFAULT 'draft',
  FormData    NVARCHAR(MAX) NULL,
  ReviewedBy  NVARCHAR(255) NULL,
  ReviewedAt  DATETIME      NULL,
  Notes       NVARCHAR(MAX) NULL,
  SubmittedAt DATETIME      NULL,
  CreatedAt   DATETIME      NOT NULL DEFAULT GETDATE(),
  UpdatedAt   DATETIME      NULL
);
GO

-- ── FuelsApplications ────────────────────────────────────────────────────────
-- GHRA Fuels LLC credit application package (Phase 5).
-- FormData JSON: principal SSNs stored as ssnEncrypted, DL numbers as dlEncrypted (AES-256-GCM).
-- DS/HelloSign signing integration is deferred — form saves to DB only for now.
-- Status flow: draft → submitted → approved | rejected
CREATE TABLE FuelsApplications (
  Id          INT IDENTITY(1,1) PRIMARY KEY,
  UserEmail   NVARCHAR(255) NOT NULL,
  Status      NVARCHAR(20)  NOT NULL DEFAULT 'draft',
  FormData    NVARCHAR(MAX) NULL,
  ReviewedBy  NVARCHAR(255) NULL,
  ReviewedAt  DATETIME      NULL,
  Notes       NVARCHAR(MAX) NULL,
  SubmittedAt DATETIME      NULL,
  CreatedAt   DATETIME      NOT NULL DEFAULT GETDATE(),
  UpdatedAt   DATETIME      NULL
);
GO

-- ── Seed: admin account ───────────────────────────────────────────────────────
-- Run separately after generating the hash with:
--   node -e "const b=require('bcryptjs');b.hash('YourPassword',10).then(h=>console.log(h))"
--
-- INSERT INTO Users (Email, PasswordHash, Role, FirstName, LastName)
-- VALUES ('admin@ghraonline.com', '<bcrypt-hash>', 'employee', 'Admin', 'GHRA');
-- GO

-- ── Password reset (ad hoc) ───────────────────────────────────────────────────
-- node -e "const b=require('bcryptjs');b.hash('NewPass123!',10).then(h=>console.log(h))"
-- UPDATE Users SET PasswordHash = '<hash>' WHERE Email = 'user@email.com';
-- GO
