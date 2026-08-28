// backend/src/controller/auth.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import supabaseAdmin from '../config/supabaseClient.js';


// --- SIGNUP ---
export const signup = async (req, res) => {
  const { email, password, fullName, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ 
      error: 'Email, password, and username are required' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate password strength (at least 6 characters)
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if username already exists
    const { data: existingUsername, error: usernameError } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    if (usernameError && usernameError.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to check username availability' });
    }

    // Check if email already exists
    const { data: existingEmail, error: emailError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (emailError && emailError.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to check email availability' });
    }

    // Hash the password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user in profiles table
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        email,
        username,
        full_name: fullName || null,
        password_hash: passwordHash,
        role: 'user',
      })
      .select('id, email, username, full_name, role')
      .single();

    if (createError) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '60m' }
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      { id: newUser.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    };

    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000, // 60 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'Signup successful.',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        full_name: newUser.full_name,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- LOGIN ---
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Fetch user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, username, full_name, password_hash, role, department')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password with hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate access token (short-lived: 60 minutes)
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        username: user.username,
        role: user.role,
        department: user.department,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '60m' }
    );

    // Generate refresh token (long-lived: 7 days)
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: true, 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    };

    // Set access token in httpOnly cookie
    console.log('Setting cookie for user:', user.id);
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000, // 60 minutes
    });

    // Set refresh token in httpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- REFRESH ACCESS TOKEN ---
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Fetch fresh user data
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, username, full_name, role, department')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        username: user.username,
        role: user.role,
        department: user.department,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '60m' }
    );

    // Set new access token cookie
    res.cookie('access_token', newAccessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000, // 60 minutes
    });

    res.status(200).json({ message: 'Access token refreshed' });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// --- LOGOUT ---
export const logout = async (req, res) => {
  const cookieOptions = { path: '/' };

  res.clearCookie('access_token', cookieOptions);
  res.clearCookie('refresh_token', cookieOptions);
  res.status(200).json({ message: 'Logged out successfully' });
};

// --- GET CURRENT USER ---
export const getCurrentUser = async (req, res) => {
  // req.user is set by the requireAuth middleware
  try {
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, username, full_name, role')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- CHANGE PASSWORD ---
export const newPassword = async (req, res) => {
  const { password, newPassword } = req.body; // no email needed
  const userId = req.user.id; // from requireAuth middleware

  if (!password || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, password_hash')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ password_hash: newHashedPassword, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    res.status(200).json({ message: 'Password updated successfully. Please log in again.' });
  } catch (err) {
    console.error('New password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};