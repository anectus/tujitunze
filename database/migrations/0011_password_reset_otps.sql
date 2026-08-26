CREATE TABLE password_reset_otps (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(64) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX password_reset_otps_user_id_idx
    ON password_reset_otps(user_id);

CREATE INDEX password_reset_otps_phone_number_idx
    ON password_reset_otps(phone_number);
