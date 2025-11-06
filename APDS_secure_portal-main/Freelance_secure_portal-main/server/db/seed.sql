
USE apds_app;

INSERT IGNORE INTO users
(email, password_hash, full_name, sa_id_enc, acct_num_enc, acct_last4, role_id, is_verified)
VALUES
('employee@bank.local', '$2b$10$eNhSAfNqTvV.k9ww/Wk4ReCbUAMPVVfchO1OblzM4i/n/e0LnyuOm', 'Emma Verifier', X'01', X'01', '0000', 3, 1),
('customer@test.local', '$2b$10$CnhFqK.CXVYx0M5VvPyzkejVuBKmDm86r9OiVeCnJXDg/112/l/0a', 'Carlos Customer', X'01', X'01', '0000', 4, 1);
