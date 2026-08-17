import supabaseAdmin from '../config/supabaseClient.js';

const isDev = process.env.NODE_ENV === 'development';

// --- LIST ALL USERS (PAGINATED, WITH DEPARTMENT FILTER) ---
export const listUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const { department } = req.query; // optional filter

  try {
    let query = supabaseAdmin
      .from('profiles')
      .select('id, username, email, department, role, is_active', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (department) {
      query = query.eq('department', department);
    }

    const { data: users, error, count } = await query;

    if (isDev) {
      console.log('[listUsers] page:', page, 'department filter:', department || 'none', 'count:', count);
    }

    if (error) {
      console.error('[listUsers] Supabase error:', error);
      throw new Error('Failed to fetch users');
    }

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: count,
        has_more: offset + limit < count,
      },
    });
  } catch (err) {
    console.error('[listUsers] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch users.',
    });
  }
};

// --- UPDATE USER ROLE (promote/demote) ---
export const updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  const allowedRoles = ['user', 'manager', 'admin'];

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Role must be one of: ${allowedRoles.join(', ')}`,
    });
  }

  try {
    const { data: updatedUser, error } = await supabaseAdmin
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, role')
      .single();

    if (isDev) {
      console.log('[updateUserRole] userId:', userId, 'new role:', role);
    }

    if (error || !updatedUser) {
      throw new Error('Failed to update role');
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully.',
      data: updatedUser,
    });
  } catch (err) {
    console.error('[updateUserRole] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to update user role.',
    });
  }
};

// --- ASSIGN MANAGER TO USER ---
export const assignManager = async (req, res) => {
  const { userId } = req.params;
  const { managerId } = req.body;

  try {
    if (managerId) {
      const { data: managerProfile, error: managerError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', managerId)
        .single();

      if (managerError || !managerProfile) {
        return res.status(404).json({
          success: false,
          message: 'Manager not found.',
        });
      }

      if (managerProfile.role !== 'manager' && managerProfile.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Assigned user must have the manager role.',
        });
      }
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('profiles')
      .update({ manager_id: managerId || null, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, manager_id')
      .single();

    if (isDev) {
      console.log('[assignManager] userId:', userId, 'managerId:', managerId);
    }

    if (error || !updatedUser) {
      throw new Error('Failed to assign manager');
    }

    res.status(200).json({
      success: true,
      message: 'Manager assigned successfully.',
      data: updatedUser,
    });
  } catch (err) {
    console.error('[assignManager] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to assign manager.',
    });
  }
};

// --- DEACTIVATE / REACTIVATE USER ACCOUNT ---
export const setUserActiveStatus = async (req, res) => {
  const { userId } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive must be true or false.',
    });
  }

  try {
    const { data: updatedUser, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, is_active')
      .single();

    if (isDev) {
      console.log('[setUserActiveStatus] userId:', userId, 'isActive:', isActive);
    }

    if (error || !updatedUser) {
      throw new Error('Failed to update user status');
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: updatedUser,
    });
  } catch (err) {
    console.error('[setUserActiveStatus] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to update user status.',
    });
  }
};

// --- LIST ALL TEAMS (PAGINATED) ---
export const listTeams = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const { data: teams, error, count } = await supabaseAdmin
      .from('teams')
      .select(
        `
        id, name, status, manager_id, requested_by, approved_by, created_at, updated_at,
        manager:profiles!teams_manager_id_fkey(id, username, full_name),
        requester:profiles!teams_requested_by_fkey(id, username, full_name)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (isDev) {
      console.log('[listTeams] page:', page, 'count:', count);
    }

    if (error) {
      console.error('[listTeams] Supabase error:', error);
      throw new Error('Failed to fetch teams');
    }

    res.status(200).json({
      success: true,
      data: teams,
      pagination: {
        page,
        limit,
        total: count,
        has_more: offset + limit < count,
      },
    });
  } catch (err) {
    console.error('[listTeams] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch teams.',
    });
  }
};

// --- CREATE TEAM DIRECTLY (admin only, auto-approved) ---
export const createTeam = async (req, res) => {
  const { name, managerId } = req.body;
  const admin_id = req.user.id;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Team name is required.',
    });
  }

  try {
    const { data: newTeam, error } = await supabaseAdmin
      .from('teams')
      .insert({
        name,
        manager_id: managerId || null,
        status: 'approved',
        requested_by: admin_id,
        approved_by: admin_id,
      })
      .select('id, name, status, manager_id')
      .single();

    if (isDev) {
      console.log('[createTeam] name:', name, 'managerId:', managerId);
    }

    if (error) {
      console.error('[createTeam] Supabase error:', error);
      throw new Error('Failed to create team');
    }

    res.status(201).json({
      success: true,
      message: 'Team created successfully.',
      data: newTeam,
    });
  } catch (err) {
    console.error('[createTeam] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to create team.',
    });
  }
};

// --- APPROVE / REJECT PENDING TEAM REQUEST ---
export const reviewTeamRequest = async (req, res) => {
  const { teamId } = req.params;
  const { decision } = req.body; // 'approved' or 'rejected'
  const admin_id = req.user.id;

  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "Decision must be 'approved' or 'rejected'.",
    });
  }

  try {
    const { data: updatedTeam, error } = await supabaseAdmin
      .from('teams')
      .update({
        status: decision,
        approved_by: admin_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', teamId)
      .eq('status', 'pending') // only allow reviewing pending requests
      .select('id, name, status')
      .single();

    if (isDev) {
      console.log('[reviewTeamRequest] teamId:', teamId, 'decision:', decision);
    }

    if (error || !updatedTeam) {
      return res.status(404).json({
        success: false,
        message: 'Pending team request not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Team ${decision} successfully.`,
      data: updatedTeam,
    });
  } catch (err) {
    console.error('[reviewTeamRequest] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to review team request.',
    });
  }
};

// --- DELETE TEAM ---
export const deleteTeam = async (req, res) => {
  const { teamId } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (isDev) {
      console.log('[deleteTeam] teamId:', teamId);
    }

    if (error) {
      throw new Error('Failed to delete team');
    }

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully.',
    });
  } catch (err) {
    console.error('[deleteTeam] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to delete team.',
    });
  }
};

// --- ADD USER TO TEAM ---
export const addUserToTeam = async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.body;
  const admin_id = req.user.id;

  try {
    // Verify team exists and is approved
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, status')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    if (team.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add users to a team that is not approved.',
      });
    }

    // Get user's current team to move it to previous_team_id
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('current_team_id')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        previous_team_id: userProfile.current_team_id,
        current_team_id: teamId,
        team_status: 'active',
        team_status_changed_by: admin_id,
        team_status_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, current_team_id, previous_team_id, team_status')
      .single();

    if (isDev) {
      console.log('[addUserToTeam] teamId:', teamId, 'userId:', userId);
    }

    if (updateError || !updatedUser) {
      throw new Error('Failed to add user to team');
    }

    res.status(200).json({
      success: true,
      message: 'User added to team successfully.',
      data: updatedUser,
    });
  } catch (err) {
    console.error('[addUserToTeam] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to add user to team.',
    });
  }
};

// --- REMOVE USER FROM TEAM (or put on hold) ---
export const updateUserTeamStatus = async (req, res) => {
  const { userId } = req.params;
  const { teamStatus } = req.body; // 'on_hold' or 'removed'
  const admin_id = req.user.id;

  if (!['on_hold', 'removed'].includes(teamStatus)) {
    return res.status(400).json({
      success: false,
      message: "teamStatus must be 'on_hold' or 'removed'.",
    });
  }

  try {
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('current_team_id')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const updateData = {
      team_status: teamStatus,
      team_status_changed_by: admin_id,
      team_status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Full removal clears current_team_id and moves it to previous_team_id
    if (teamStatus === 'removed') {
      updateData.previous_team_id = userProfile.current_team_id;
      updateData.current_team_id = null;
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id, current_team_id, previous_team_id, team_status')
      .single();

    if (isDev) {
      console.log('[updateUserTeamStatus] userId:', userId, 'teamStatus:', teamStatus);
    }

    if (updateError || !updatedUser) {
      throw new Error('Failed to update team status');
    }

    res.status(200).json({
      success: true,
      message: `User team status updated to ${teamStatus}.`,
      data: updatedUser,
    });
  } catch (err) {
    console.error('[updateUserTeamStatus] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to update user team status.',
    });
  }
};

// --- ADMIN: GET A USER'S CONVERSATIONS BY ID ---
export const getUserConversations = async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required.',
    });
  }

  try {
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, username, department')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (isDev) {
      console.log('[getUserConversations] Resolved target user:', targetUser.id, targetUser.email);
    }

    const {
      data: conversationLinks,
      error: convError,
      count,
    } = await supabaseAdmin
      .from('conversation_participants')
      .select(
        `
        conversation_id,
        hidden_at,
        conversations(
          id, subject, conversation_type, category, created_by, created_at, updated_at
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', targetUser.id)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (convError) {
      console.error('[getUserConversations] Supabase error:', convError);
      throw new Error('Failed to fetch conversations');
    }

    const formattedConversations = conversationLinks.map((cp) => ({
      id: cp.conversations.id,
      subject: cp.conversations.subject,
      type: cp.conversations.conversation_type,
      category: cp.conversations.category,
      created_by: cp.conversations.created_by,
      created_at: cp.conversations.created_at,
      updated_at: cp.conversations.updated_at,
      hidden_by_user: cp.hidden_at !== null,
    }));

    if (isDev) {
      console.log('[getUserConversations] Found', formattedConversations.length, 'conversations');
    }

    res.status(200).json({
      success: true,
      user: targetUser,
      data: formattedConversations,
      pagination: {
        page,
        limit,
        total: count,
        has_more: offset + limit < count,
      },
    });
  } catch (err) {
    console.error('[getUserConversations] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch user conversations.',
    });
  }
};

// --- ADMIN: GET ANY CONVERSATION'S FULL DETAILS + MESSAGES (bypasses participant check) ---
export const getAnyConversation = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select(`
        id, subject, conversation_type, category, created_by, created_at, updated_at,
        conversation_participants(
          user_id, hidden_at,
          profiles(id, username, full_name, email)
        )
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select(`
        id, content, created_at, sender_id,
        profiles:sender_id(id, username, full_name)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error('Failed to fetch messages');
    }

    if (isDev) {
      console.log('[getAnyConversation] conversationId:', conversationId, 'messageCount:', messages.length);
    }

    const { conversation_participants, ...conversationData } = conversation;

    res.status(200).json({
      success: true,
      data: {
        ...conversationData,
        participants: conversation_participants.map(p => ({
          ...p.profiles,
          hidden_at: p.hidden_at,
        })),
        messages: messages.map(m => ({
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          sender_id: m.sender_id,
          sender_name: m.profiles?.full_name || m.profiles?.username || null,
        })),
      },
    });
  } catch (err) {
    console.error('[getAnyConversation] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch conversation.',
    });
  }
};