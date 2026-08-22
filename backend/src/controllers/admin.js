import supabaseAdmin from '../config/supabaseClient.js';

const isDev = process.env.NODE_ENV === 'development';

const PROFILE_LIST_COLUMNS = 'id, username, email, full_name, department, role, is_active';

const PROFILE_FULL_COLUMNS = `
  id,
  email,
  username,
  full_name,
  role,
  created_at,
  updated_at,
  department,
  manager_id,
  current_team_id,
  previous_team_id,
  team_status,
  team_status_changed_by,
  team_status_changed_at,
  is_active
`;

// --- HELPERS ---

// Wraps a handler in try/catch, logs with the given tag, and sends a uniform 500 on error.
const asyncHandler = (tag, message, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(`[${tag}] error:`, err);
    res.status(500).json({
      success: false,
      message,
    });
  }
};

// Parses page/limit/offset from the request query the same way every list endpoint did.
const getPagination = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildPaginationMeta = ({ page, limit, offset }, total) => ({
  page,
  limit,
  total,
  has_more: offset + limit < total,
});

const sendPaginated = (res, data, pagination, total) => {
  res.status(200).json({
    success: true,
    data,
    pagination: buildPaginationMeta(pagination, total),
  });
};

// Shared "fetch one profile by id" used by every endpoint that looks up a user.
const getProfileById = (id, columns = 'id') =>
  supabaseAdmin.from('profiles').select(columns).eq('id', id).single();

// Shared "update one profile by id" used by every endpoint that mutates a user.
const updateProfileById = (id, updates, columns) =>
  supabaseAdmin.from('profiles').update(updates).eq('id', id).select(columns).single();

// --- LIST ALL USERS (PAGINATED, WITH DEPARTMENT FILTER) ---
export const listUsers = asyncHandler('listUsers', 'Unable to fetch users.', async (req, res) => {
  const pagination = getPagination(req);
  const { page, limit, offset } = pagination;
  const { department } = req.query;

  // Normalize department to array
  let departments = [];
  if (department) {
    departments = Array.isArray(department)
      ? department
      : department.split(',').map((d) => d.trim()).filter(Boolean);
  }

  if (isDev) {
    console.log('[listUsers] page:', page, 'departments:', departments.length > 0 ? departments : 'none');
  }

  const baseQuery = () =>
    supabaseAdmin
      .from('profiles')
      .select(PROFILE_LIST_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

  // If no department filter, fetch all users
  if (departments.length === 0) {
    const { data: users, error, count } = await baseQuery();

    if (error) {
      console.error('[listUsers] Supabase error:', error);
      throw new Error('Failed to fetch users');
    }

    return sendPaginated(res, users, pagination, count);
  }

  // Split departments into two groups: real departments and null filter
  const realDepartments = departments.filter((d) => d !== '__NO_DEPARTMENT__');
  const includeNoDepartment = departments.includes('__NO_DEPARTMENT__');

  if (isDev) {
    console.log('[listUsers] realDepartments:', realDepartments, 'includeNoDepartment:', includeNoDepartment);
  }

  // Case 1: Only "__NO_DEPARTMENT__" selected
  if (realDepartments.length === 0 && includeNoDepartment) {
    const { data: users, error, count } = await baseQuery().is('department', null);

    if (error) {
      console.error('[listUsers] Supabase error:', error);
      throw new Error('Failed to fetch users');
    }

    return sendPaginated(res, users, pagination, count);
  }

  // Case 2: Only real departments selected (no "__NO_DEPARTMENT__")
  if (realDepartments.length > 0 && !includeNoDepartment) {
    const query =
      realDepartments.length === 1
        ? baseQuery().eq('department', realDepartments[0])
        : baseQuery().in('department', realDepartments);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('[listUsers] Supabase error:', error);
      throw new Error('Failed to fetch users');
    }

    return sendPaginated(res, users, pagination, count);
  }

  // Case 3: Mix of real departments + "__NO_DEPARTMENT__"
  // We need to fetch both groups and combine them (Supabase doesn't support OR with null easily)
  const { data: usersWithDept, error: error1 } = await supabaseAdmin
    .from('profiles')
    .select(PROFILE_LIST_COLUMNS)
    .in('department', realDepartments)
    .order('created_at', { ascending: false });

  const { data: usersNoDept, error: error2 } = await supabaseAdmin
    .from('profiles')
    .select(PROFILE_LIST_COLUMNS)
    .is('department', null)
    .order('created_at', { ascending: false });

  if (error1 || error2) {
    console.error('[listUsers] Supabase error:', error1 || error2);
    throw new Error('Failed to fetch users');
  }

  // Combine and remove duplicates
  const allUsers = [...(usersWithDept || []), ...(usersNoDept || [])];
  const uniqueUsers = Array.from(new Map(allUsers.map((u) => [u.id, u])).values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const total = uniqueUsers.length;
  const paginatedUsers = uniqueUsers.slice(offset, offset + limit);

  if (isDev) {
    console.log('[listUsers] total matched:', total, 'returning:', paginatedUsers.length);
  }

  sendPaginated(res, paginatedUsers, pagination, total);
});

// --- UPDATE USER ROLE (promote/demote) ---
export const updateUserRole = asyncHandler('updateUserRole', 'Unable to update user role.', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  const allowedRoles = ['user', 'manager', 'admin'];

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Role must be one of: ${allowedRoles.join(', ')}`,
    });
  }

  const { data: updatedUser, error } = await updateProfileById(
    userId,
    { role, updated_at: new Date().toISOString() },
    'id, role'
  );

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
});

// --- ASSIGN MANAGER TO USER ---
export const assignManager = asyncHandler('assignManager', 'Unable to assign manager.', async (req, res) => {
  const { userId } = req.params;
  const { managerId } = req.body;

  if (managerId) {
    const { data: managerProfile, error: managerError } = await getProfileById(managerId, 'role');

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

  const { data: updatedUser, error } = await updateProfileById(
    userId,
    { manager_id: managerId || null, updated_at: new Date().toISOString() },
    'id, manager_id'
  );

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
});

// --- DEACTIVATE / REACTIVATE USER ACCOUNT ---
export const setUserActiveStatus = asyncHandler(
  'setUserActiveStatus',
  'Unable to update user status.',
  async (req, res) => {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be true or false.',
      });
    }

    const { data: updatedUser, error } = await updateProfileById(
      userId,
      { is_active: isActive, updated_at: new Date().toISOString() },
      'id, is_active'
    );

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
  }
);

// --- LIST ALL TEAMS (PAGINATED) ---
export const listTeams = asyncHandler('listTeams', 'Unable to fetch teams.', async (req, res) => {
  const pagination = getPagination(req);
  const { page, limit, offset } = pagination;

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

  sendPaginated(res, teams, pagination, count);
});

// --- CREATE TEAM DIRECTLY (admin only, auto-approved) ---
export const createTeam = asyncHandler('createTeam', 'Unable to create team.', async (req, res) => {
  const { name, managerId } = req.body;
  const admin_id = req.user.id;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Team name is required.',
    });
  }

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
});

// --- APPROVE / REJECT PENDING TEAM REQUEST ---
export const reviewTeamRequest = asyncHandler(
  'reviewTeamRequest',
  'Unable to review team request.',
  async (req, res) => {
    const { teamId } = req.params;
    const { decision } = req.body; // 'approved' or 'rejected'
    const admin_id = req.user.id;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be 'approved' or 'rejected'.",
      });
    }

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
  }
);

// --- DELETE TEAM ---
export const deleteTeam = asyncHandler('deleteTeam', 'Unable to delete team.', async (req, res) => {
  const { teamId } = req.params;

  const { error } = await supabaseAdmin.from('teams').delete().eq('id', teamId);

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
});

// --- GET USER PROFILE BY ID ---
export const getUserProfile = asyncHandler(
  'getUserProfile',
  'Unable to fetch user profile.',
  async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      });
    }

    const { data: user, error } = await getProfileById(userId, PROFILE_FULL_COLUMNS);

    if (isDev) {
      console.log('[getUserProfile] userId:', userId);
    }

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
      console.error('[getUserProfile] Supabase error:', error);
      throw new Error('Failed to fetch user');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

// --- ADD USER TO TEAM ---
export const addUserToTeam = asyncHandler('addUserToTeam', 'Unable to add user to team.', async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.body;
  const admin_id = req.user.id;

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
  const { data: userProfile, error: userError } = await getProfileById(userId, 'current_team_id');

  if (userError || !userProfile) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
    });
  }

  const { data: updatedUser, error: updateError } = await updateProfileById(
    userId,
    {
      previous_team_id: userProfile.current_team_id,
      current_team_id: teamId,
      team_status: 'active',
      team_status_changed_by: admin_id,
      team_status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    'id, current_team_id, previous_team_id, team_status'
  );

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
});

// --- REMOVE USER FROM TEAM (or put on hold) ---
export const updateUserTeamStatus = asyncHandler(
  'updateUserTeamStatus',
  'Unable to update user team status.',
  async (req, res) => {
    const { userId } = req.params;
    const { teamStatus } = req.body; // 'on_hold' or 'removed'
    const admin_id = req.user.id;

    if (!['on_hold', 'removed'].includes(teamStatus)) {
      return res.status(400).json({
        success: false,
        message: "teamStatus must be 'on_hold' or 'removed'.",
      });
    }

    const { data: userProfile, error: userError } = await getProfileById(userId, 'current_team_id');

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

    const { data: updatedUser, error: updateError } = await updateProfileById(
      userId,
      updateData,
      'id, current_team_id, previous_team_id, team_status'
    );

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
  }
);

// --- ADMIN: GET A USER'S CONVERSATIONS BY ID ---
export const getUserConversations = asyncHandler(
  'getUserConversations',
  'Unable to fetch user conversations.',
  async (req, res) => {
    const { userId } = req.params;
    const pagination = getPagination(req);
    const { limit, offset } = pagination;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      });
    }

    const { data: targetUser, error: userError } = await getProfileById(
      userId,
      'id, email, username, department'
    );

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
      pagination: buildPaginationMeta(pagination, count),
    });
  }
);

// --- ADMIN: GET ANY CONVERSATION'S FULL DETAILS + MESSAGES (bypasses participant check) ---
export const getAnyConversation = asyncHandler(
  'getAnyConversation',
  'Unable to fetch conversation.',
  async (req, res) => {
    const { conversationId } = req.params;

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
        participants: conversation_participants.map((p) => ({
          ...p.profiles,
          hidden_at: p.hidden_at,
        })),
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          sender_id: m.sender_id,
          sender_name: m.profiles?.full_name || m.profiles?.username || null,
        })),
      },
    });
  }
);

// --- GET TEAM BY ID (used in Admin/Manager panel for team management) ---
export const getTeamById = asyncHandler('getTeamById', 'Unable to fetch team information.', async (req, res) => {
  const { teamId } = req.params;

  const { data: team, error } = await supabaseAdmin
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single();

  if (error || !team) {
    return res.status(404).json({
      success: false,
      message: 'Team not found.',
    });
  }

  res.status(200).json({
    success: true,
    data: team,
  });
});

// --- UPDATE USER DEPARTMENT ---
export const updateUserDepartment = asyncHandler(
  'updateUserDepartment',
  'Unable to update user department.',
  async (req, res) => {
    const { userId } = req.params;
    const { department } = req.body;
    const currentUserId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      });
    }

    // Department can be a string or null (to unassign)
    if (department === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Department is required. Pass null to unassign department.',
      });
    }

    // Validate department is a string or null
    if (department !== null && typeof department !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Department must be a string or null.',
      });
    }

    // Validate department is not empty string
    if (typeof department === 'string' && department.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Department cannot be empty. Pass null to unassign department.',
      });
    }

    // Check if user exists
    const { data: user, error: userError } = await getProfileById(userId, 'id, department, updated_at');

    if (userError || !user) {
      if (userError?.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
      console.error('[updateUserDepartment] Supabase error:', userError);
      throw new Error('Failed to fetch user');
    }

    if (isDev) {
      console.log(
        '[updateUserDepartment] userId:',
        userId,
        'currentUserId:',
        currentUserId,
        'newDepartment:',
        department || 'null'
      );
    }

    // Update department
    const { data: updatedUser, error: updateError } = await updateProfileById(
      userId,
      {
        department: department ? department.trim() : null,
        updated_at: new Date().toISOString(),
      },
      PROFILE_FULL_COLUMNS
    );

    if (updateError) {
      console.error('[updateUserDepartment] Supabase update error:', updateError);
      throw new Error('Failed to update user department');
    }

    if (isDev) {
      console.log(
        '[updateUserDepartment] Success - userId:',
        userId,
        'old department:',
        user.department,
        'new department:',
        department || 'null'
      );
    }

    res.status(200).json({
      success: true,
      message: `User department updated to ${department ? `"${department}"` : 'unassigned'}.`,
      data: updatedUser,
    });
  }
);