CREATE DATABASE IF NOT EXISTS apds_app
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE apds_app;

CREATE TABLE IF NOT EXISTS roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  sa_id_enc VARBINARY(256) NOT NULL,
  acct_num_enc VARBINARY(256) NOT NULL,
  acct_last4 CHAR(4) NOT NULL,
  role_id INT NOT NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS beneficiaries (
  beneficiary_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  name VARCHAR(150) NOT NULL,
  bank_name VARCHAR(150) NOT NULL,
  acct_enc VARBINARY(256) NOT NULL,
  acct_last4 CHAR(4) NOT NULL,
  swift_enc VARBINARY(256) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_benef_user FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_benef_user ON beneficiaries(user_id);

CREATE TABLE IF NOT EXISTS payments (
  payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  beneficiary_id BIGINT NULL,
  amount_cents INT NOT NULL,
  currency CHAR(3) NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'SWIFT',
  swift_enc VARBINARY(256) NOT NULL,
  acct_to_enc VARBINARY(256) NOT NULL,
  purpose_text VARCHAR(255) NULL,
  status ENUM('PENDING','VERIFIED','SUBMITTED','PAID','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_by BIGINT NULL,
  verified_at DATETIME NULL,
  submit_by BIGINT NULL,
  submit_at DATETIME NULL,
  swift_ref VARCHAR(128) NULL,
  provider_meta JSON NULL,
  CONSTRAINT fk_pay_cust FOREIGN KEY (customer_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pay_benef FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(beneficiary_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_pay_verified_by FOREIGN KEY (verified_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_pay_submit_by FOREIGN KEY (submit_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_pay_customer ON payments(customer_id);
CREATE INDEX idx_pay_status ON payments(status);
CREATE INDEX idx_pay_created ON payments(created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_user BIGINT NULL,
  event_type VARCHAR(64) NOT NULL,
  entity VARCHAR(32) NOT NULL,
  entity_id BIGINT NOT NULL,
  ip_hash CHAR(64) NULL,
  ua_hash CHAR(64) NULL,
  meta_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_event (event_type, created_at)
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (role_id, role_name, description) VALUES
  (1,'admin','Platform administrator'),
  (2,'manager','Manager role'),
  (3,'employee','Bank employee'),
  (4,'customer','Retail customer');
