-- Run this script in SSMS against the APIDB database
USE APIDB;
GO

-- Users table (members + employees)
CREATE TABLE Users (
  Id                  INT IDENTITY(1,1) PRIMARY KEY,
  Email               NVARCHAR(255)  NOT NULL UNIQUE,
  PasswordHash        NVARCHAR(255)  NOT NULL,
  Role                NVARCHAR(20)   NOT NULL DEFAULT 'member',  -- 'member' or 'employee'
  MustChangePassword  BIT            NOT NULL DEFAULT 0,          -- 1 = forced change on next login
  CreatedAt           DATETIME       NOT NULL DEFAULT GETDATE()
);
GO

-- Applications table (one row per application, updated on every Next press)
CREATE TABLE Applications (
  Id            INT IDENTITY(1,1) PRIMARY KEY,
  UserEmail     NVARCHAR(255)  NOT NULL,
  StoreName     NVARCHAR(255)  NULL,
  StoreAddress  NVARCHAR(500)  NULL,
  Status        NVARCHAR(20)   NOT NULL DEFAULT 'draft',   -- draft | submitted | approved | rejected
  CurrentStep   INT            NOT NULL DEFAULT 1,
  FormData      NVARCHAR(MAX)  NOT NULL,                   -- full JSON blob
  Notes         NVARCHAR(MAX)  NULL,
  ReviewedBy    NVARCHAR(255)  NULL,
  ReviewedAt    DATETIME       NULL,
  CreatedAt     DATETIME       NOT NULL DEFAULT GETDATE(),
  UpdatedAt     DATETIME       NULL,
  FOREIGN KEY (UserEmail) REFERENCES Users(Email)
);
GO
