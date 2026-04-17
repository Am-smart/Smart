-- New function: approve_password_reset
CREATE OR REPLACE FUNCTION approve_password_reset(p_user_id UUID, p_temp_password TEXT)
RETURNS JSONB AS $$
DECLARE
  v_hashed TEXT;
BEGIN
  v_hashed := crypt(p_temp_password, gen_salt('bf', 10));

  UPDATE users
  SET
    password = v_hashed,
    reset_request = jsonb_set(
        jsonb_set(reset_request, '{status}', '"approved"'),
        '{temp_password}', to_jsonb(p_temp_password)
    ) || jsonb_build_object('approved_at', NOW(), 'expires_at', NOW() + INTERVAL '24 hours'),
    failed_attempts = 0,
    locked_until = NULL
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New function: deny_password_reset
CREATE OR REPLACE FUNCTION deny_password_reset(p_user_id UUID, p_reason TEXT)
RETURNS JSONB AS $$
BEGIN
  UPDATE users
  SET
    reset_request = jsonb_set(
        jsonb_set(reset_request, '{status}', '"denied"'),
        '{denial_reason}', to_jsonb(p_reason)
    )
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced request_password_reset
CREATE OR REPLACE FUNCTION request_password_reset(p_email VARCHAR, p_reason TEXT, p_risk_level TEXT DEFAULT 'medium')
RETURNS JSONB AS $$
DECLARE
  v_user users;
BEGIN
  SELECT * INTO v_user FROM users WHERE email = p_email;
  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No account found with this email.');
  END IF;

  IF v_user.reset_request IS NOT NULL THEN
     IF v_user.reset_request->>'status' = 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'A request is already under review for this account.');
     ELSIF v_user.reset_request->>'status' = 'approved' THEN
        IF (v_user.reset_request->>'expires_at')::timestamp with time zone > NOW() THEN
           RETURN jsonb_build_object('success', false, 'error', 'Reset approved. Temp Password: ' || (v_user.reset_request->>'temp_password'));
        END IF;
     END IF;
  END IF;

  UPDATE users
  SET
    reset_request = jsonb_build_object(
      'requested_at', NOW(),
      'status', 'pending',
      'reason', p_reason,
      'risk_level', p_risk_level
    ),
    flagged = CASE WHEN p_risk_level = 'high' THEN TRUE ELSE flagged END
  WHERE id = v_user.id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modified register_user to check reset status
CREATE OR REPLACE FUNCTION register_user(p_full_name VARCHAR, p_email VARCHAR, p_password VARCHAR, p_phone VARCHAR, p_role VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_user users;
  v_session_id UUID;
  v_count INTEGER;
  v_caller_role TEXT;
  v_hashed_password TEXT;
BEGIN
  v_caller_role := COALESCE(current_app_role(), 'public');

  SELECT * INTO v_user FROM users WHERE email = p_email;
  IF v_user.id IS NOT NULL THEN
    IF v_user.reset_request IS NOT NULL THEN
       IF v_user.reset_request->>'status' = 'pending' THEN
          RETURN jsonb_build_object('success', false, 'error', 'This email is registered. A password reset request is under review.');
       ELSIF v_user.reset_request->>'status' = 'approved' THEN
          RETURN jsonb_build_object('success', false, 'error', 'This email is registered. Password reset approved. Temp Pass: ' || (v_user.reset_request->>'temp_password'));
       ELSIF v_user.reset_request->>'status' = 'denied' THEN
          RETURN jsonb_build_object('success', false, 'error', 'This email is registered. Previous reset request denied: ' || (v_user.reset_request->>'denial_reason'));
       END IF;
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'An account with this email already exists.');
  END IF;

  v_hashed_password := crypt(p_password, gen_salt('bf', 10));

  IF v_caller_role != 'admin' THEN
    IF p_role IN ('teacher', 'admin') THEN
      SELECT COUNT(*) INTO v_count FROM users WHERE role IN ('teacher', 'admin');
      IF v_count >= 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Public creation of teachers and admins is restricted.');
      END IF;
    END IF;
  END IF;

  INSERT INTO users (full_name, email, password, phone, role, active)
  VALUES (p_full_name, p_email, v_hashed_password, p_phone, p_role, TRUE)
  RETURNING * INTO v_user;

  INSERT INTO sessions (user_id, expires_at)
  VALUES (v_user.id, NOW() + INTERVAL '7 days')
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object('success', true, 'user', (to_jsonb(v_user) - 'password'), 'session_id', v_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modified authenticate_user to return reset info ONLY on failure
CREATE OR REPLACE FUNCTION authenticate_user(p_email VARCHAR, p_password VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_user users;
  v_session_id UUID;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  SELECT * INTO v_user FROM users WHERE email = p_email;

  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email or password');
  END IF;

  IF v_user.active = FALSE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account is deactivated');
  END IF;

  IF v_user.flagged = TRUE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account is flagged. Please contact support.');
  END IF;

  IF v_user.locked_until IS NOT NULL AND v_user.locked_until > v_now THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account locked until ' || to_char(v_user.locked_until, 'HH24:MI:SS'));
  END IF;

  -- Verify password
  IF v_user.password IS NULL OR crypt(p_password, v_user.password) != v_user.password THEN
    -- PASSWORD FAILED: Check if there is reset info to show
    IF v_user.reset_request IS NOT NULL THEN
       IF v_user.reset_request->>'status' = 'pending' THEN
          RETURN jsonb_build_object('success', false, 'error', 'Your password reset request is under review.');
       ELSIF v_user.reset_request->>'status' = 'approved' THEN
          IF (v_user.reset_request->>'expires_at')::timestamp with time zone > v_now THEN
             RETURN jsonb_build_object('success', false, 'error', 'Reset approved. Your temp password is: ' || (v_user.reset_request->>'temp_password'));
          END IF;
       ELSIF v_user.reset_request->>'status' = 'denied' THEN
          RETURN jsonb_build_object('success', false, 'error', 'Reset denied: ' || (v_user.reset_request->>'denial_reason'));
       END IF;
    END IF;

    UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = v_user.id;
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email or password');
  END IF;

  -- Successful login
  UPDATE users SET last_login = v_now, failed_attempts = 0, locked_until = NULL WHERE id = v_user.id;
  INSERT INTO sessions (user_id, expires_at) VALUES (v_user.id, v_now + INTERVAL '7 days') RETURNING id INTO v_session_id;

  RETURN jsonb_build_object('success', true, 'user', (to_jsonb(v_user) - 'password'), 'session_id', v_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
