ALTER TABLE password_reset_tokens
    ADD COLUMN used_at TIMESTAMP NULL;
