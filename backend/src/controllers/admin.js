 // backend/src/controllers/admin.js
import supabaseAdmin from '../config/supabaseClient.js';
import bcrypt from 'bcrypt';
import { ensureTeamConversation, attachUserToTeam } from '../utils/teamMembership.js';

const isDev = process.env.NODE_ENV === 'development';

const VALID_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'];
const VALID_ENTITY_TYPES = ['conversation', 'group', 'team', 'message', 'user'];

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

const getProfileById = (id, columns = 'id') =>
  supabaseAdmin.from('profiles').select(columns).eq('id', id).single();

const updateProfileById = (id, updates, columns) =>
  supabaseAdmin.from('profiles').update(updates).eq('id', id).select(columns).single();

// --- LIST ALL USERS (PAGINATED, WITH DEPARTMENT FILTER) ---
export const listUsers = asyncHandler('listUsers', 'Unable to fetch users.', async (req, res) => {
  const pagination = getPagination(req);
  const { page, limit, offset } = pagination;
  const { department } = req.query;

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

  if (departments.length === 0) {
    const { data: users, error, count } = await baseQuery();

    if (error) {
      console.error('[listUsers] Supabase error:', error);
      throw new Error('Failed to fetch users');
    }

    return sendPaginated(res, users, pagination, count);
  }

  const realDepartments = departments.filter((d) => d !== '__NO_DEPARTMENT__');
  const includeNoDepartment = departments.includes('__NO_DEPARTMENT__');

  if (isDev) {
    console.log('[listUsers] realDepartments:', realDepartments, 'includeNoDepartment:', includeNoDepartment);
  }

  if (realDepartments.length === 0 && includeNoDepartment) {
    const { data: users, error, count } = await baseQuery().is('department', null);

    if (error) {
      console.error('[listUsers] Supabase error:', error);
      throw new Error('Failed to fetch users');
    }

    return sendPaginated(res, users, pagination, count);
  }

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
      id, name, status, department, type, manager_id, requested_by, approved_by, created_at, updated_at,
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

  // Member count lives in team_members for type 'team', group_members for
  // type 'group' — same table split teamMembership.js already dispatches
  // on. Computed per row since listTeams returns both types mixed.
  const teamsWithMemberCounts = await Promise.all(
    (teams || []).map(async (team) => {
      const membershipTable = team.type === 'group' ? 'group_members' : 'team_members';
      const fkColumn = team.type === 'group' ? 'group_id' : 'team_id';

      const { count: memberCount, error: memberCountError } = await supabaseAdmin
        .from(membershipTable)
        .select('id', { count: 'exact', head: true })
        .eq(fkColumn, team.id)
        .is('left_at', null);

      if (memberCountError && isDev) {
        console.log('[listTeams] Failed to count members for team:', team.id, memberCountError.message);
      }

      return {
        ...team,
        total_members: memberCount || 0,
      };
    })
  );

  sendPaginated(res, teamsWithMemberCounts, pagination, count);
});

// --- CREATE TEAM DIRECTLY (admin only, auto-approved) ---
export const createTeam = asyncHandler('createTeam', 'Unable to create team.', async (req, res) => {
  const { name, managerId, department } = req.body;
  const admin_id = req.user.id;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Team name is required.',
    });
  }

  if (!department || typeof department !== 'string' || department.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Department is required for teams.',
    });
  }

  let resolvedManagerId = null;

  if (managerId) {
    const { data: managerProfile, error: managerLookupError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', managerId)
      .single();

    if (managerLookupError || !managerProfile) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email to assign as manager.',
      });
    }

    resolvedManagerId = managerProfile.id;
  }

  const { data: newTeam, error } = await supabaseAdmin
    .from('teams')
    .insert({
      name,
      manager_id: resolvedManagerId,
      status: 'approved',
      requested_by: admin_id,
      approved_by: admin_id,
      type: 'team',
      department: department.trim(),
    })
    .select('id, name, status, manager_id, type, department')
    .single();

  if (error || !newTeam) {
    console.error('[createTeam] Supabase error:', error);
    throw new Error('Failed to create team');
  }

  if (resolvedManagerId) {
    const { error: attachError } = await attachUserToTeam(newTeam.id, resolvedManagerId, admin_id);

    if (attachError) {
      console.error('[createTeam] Failed to fully attach manager to team:', JSON.stringify(attachError));
    }
  } else {
    const { error: conversationError } = await ensureTeamConversation(newTeam.id, admin_id);

    if (conversationError && isDev) {
      console.log('[createTeam] Failed to create team conversation:', conversationError.message);
    }
  }

  if (isDev) {
    console.log('[createTeam] name:', name, 'managerId:', resolvedManagerId);
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
    const { decision } = req.body;
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
      .eq('status', 'pending')
      .select('id, name, status, manager_id')
      .single();

    if (error || !updatedTeam) {
      return res.status(404).json({
        success: false,
        message: 'Pending team request not found.',
      });
    }

    if (decision === 'approved') {
      if (updatedTeam.manager_id) {
        const { error: attachError } = await attachUserToTeam(updatedTeam.id, updatedTeam.manager_id, admin_id);

        if (attachError && isDev) {
          console.log('[reviewTeamRequest] Failed to fully attach manager to team:', attachError);
        }
      } else {
        const { error: conversationError } = await ensureTeamConversation(updatedTeam.id, admin_id);

        if (conversationError && isDev) {
          console.log('[reviewTeamRequest] Failed to create team conversation:', conversationError.message);
        }
      }
    }

    if (isDev) {
      console.log('[reviewTeamRequest] teamId:', teamId, 'decision:', decision);
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

  const { data: team, error: teamError } = await supabaseAdmin
    .from('teams')
    .select('id, name, status')
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

  if (updateError || !updatedUser) {
    throw new Error('Failed to add user to team');
  }

  const { error: attachError } = await attachUserToTeam(teamId, userId, admin_id);

  if (attachError && isDev) {
    console.log('[addUserToTeam] Failed to fully attach user to team:', attachError);
  }

  if (isDev) {
    console.log('[addUserToTeam] teamId:', teamId, 'userId:', userId);
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
    const { teamStatus } = req.body;
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
    .select(
      `
      id, name, is_open, status, department, type, manager_id, requested_by, approved_by,
      conversation_id, created_at, updated_at,
      manager:profiles!teams_manager_id_fkey(id, username, full_name, email, department),
      requester:profiles!teams_requested_by_fkey(id, username, full_name, email),
      approver:profiles!teams_approved_by_fkey(id, username, full_name, email)
    `
    )
    .eq('id', teamId)
    .single();

  if (error || !team) {
    return res.status(404).json({
      success: false,
      message: 'Team not found.',
    });
  }

  // Membership lives in team_members for type 'team', group_members for
  // type 'group' — same dispatch used in listTeams/teamMembership.js.
  const membershipTable = team.type === 'group' ? 'group_members' : 'team_members';
  const fkColumn = team.type === 'group' ? 'group_id' : 'team_id';

  const { data: memberRows, error: membersError } = await supabaseAdmin
    .from(membershipTable)
    .select(
      `user_id, joined_at, profiles:user_id(id, username, full_name, email, department, role)`
    )
    .eq(fkColumn, teamId)
    .is('left_at', null)
    .order('joined_at', { ascending: true });

  if (membersError && isDev) {
    console.error('[getTeamById] Failed to fetch members:', membersError.message);
  }

  const members = (memberRows || []).map((m) => ({
    id: m.profiles.id,
    username: m.profiles.username,
    full_name: m.profiles.full_name,
    email: m.profiles.email,
    department: m.profiles.department,
    role: m.profiles.role,
    joined_at: m.joined_at,
  }));

  res.status(200).json({
    success: true,
    data: {
      ...team,
      members,
      total_members: members.length,
    },
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

    if (department === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Department is required. Pass null to unassign department.',
      });
    }

    if (department !== null && typeof department !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Department must be a string or null.',
      });
    }

    if (typeof department === 'string' && department.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Department cannot be empty. Pass null to unassign department.',
      });
    }

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

// ===== REPORTED ITEMS OVERSIGHT (global) =====
 
export const adminListReportedItems = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const { status, entity_type, department, from, to } = req.query;
  const isDev = process.env.NODE_ENV === 'development';
 
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }
 
  if (entity_type && !VALID_ENTITY_TYPES.includes(entity_type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid entity_type filter. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
    });
  }
 
  try {
    const profilesEmbed = department
      ? 'profiles!conversation_reports_reported_by_fkey!inner(id, username, full_name, email, department)'
      : 'profiles!conversation_reports_reported_by_fkey(id, username, full_name, email, department)';
 
    let query = supabaseAdmin
      .from('conversation_reports')
      .select(
        `
        id, entity_type, entity_id, reason, status, description, created_at,
        ${profilesEmbed}
      `,
        { count: 'exact' }
      );
 
    if (status) {
      query = query.eq('status', status);
    } else if (req.query.status !== 'all') {
      query = query.eq('status', 'pending');
    }
 
    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }
 
    if (department) {
      query = query.eq('profiles.department', department);
    }
 
    if (from) {
      query = query.gte('created_at', from);
    }
 
    if (to) {
      query = query.lte('created_at', to);
    }
 
    const { data: reports, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
 
    if (error) throw error;
 
    if (isDev) {
      console.log('[adminListReportedItems] filters:', { status, entity_type, department, from, to }, 'count:', count);
    }
 
    const formatted = (reports || []).map(r => ({
      id: r.id,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      reason: r.reason,
      status: r.status,
      description: r.description,
      reported_by: r.profiles ? {
        id: r.profiles.id,
        username: r.profiles.username,
        full_name: r.profiles.full_name,
        email: r.profiles.email,
        department: r.profiles.department,
      } : null,
      created_at: r.created_at,
    }));
 
    res.status(200).json({
      success: true,
      message: 'Reported items retrieved successfully.',
      data: formatted,
      pagination: {
        page,
        limit,
        total: count || 0,
        has_more: offset + limit < (count || 0),
      },
    });
  } catch (err) {
    console.error('[adminListReportedItems] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch reported items.',
    });
  }
};
 
export const adminGetReportedItem = async (req, res) => {
  const { reportId } = req.params;
  const isDev = process.env.NODE_ENV === 'development';
 
  if (!reportId) {
    return res.status(400).json({
      success: false,
      message: 'Report ID is required.',
    });
  }
 
  try {
    const { data: report, error: reportError } = await supabaseAdmin
      .from('conversation_reports')
      .select(
        `
        id, entity_type, entity_id, reason, status, description, created_at,
        reviewed_by, reviewed_at, resolution_notes,
        profiles!conversation_reports_reported_by_fkey(id, username, full_name, email, department)
      `
      )
      .eq('id', reportId)
      .single();
 
    if (reportError || !report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }
 
    let entityDetails = null;
 
    switch (report.entity_type) {
      case 'conversation':
        const { data: conv } = await supabaseAdmin
          .from('conversations')
          .select(
            `
            id, subject, conversation_type, created_at,
            messages(id, content, created_at, sender_id, profiles:sender_id(id, username, full_name))
          `
          )
          .eq('id', report.entity_id)
          .single();
 
        if (conv) {
          entityDetails = {
            type: 'conversation',
            id: conv.id,
            subject: conv.subject,
            conversation_type: conv.conversation_type,
            created_at: conv.created_at,
            messages: (conv.messages || []).map(m => ({
              id: m.id,
              content: m.content,
              sender: m.profiles ? {
                id: m.profiles.id,
                username: m.profiles.username,
                full_name: m.profiles.full_name,
              } : null,
              created_at: m.created_at,
            })),
          };
        }
        break;
 
      case 'group':
        const { data: group } = await supabaseAdmin
          .from('teams')
          .select('id, name, department')
          .eq('id', report.entity_id)
          .eq('type', 'group')
          .single();
 
        if (group) {
          entityDetails = {
            type: 'group',
            id: group.id,
            name: group.name,
            department: group.department,
          };
        }
        break;
 
      case 'team':
        const { data: team } = await supabaseAdmin
          .from('teams')
          .select('id, name, department')
          .eq('id', report.entity_id)
          .eq('type', 'team')
          .single();
 
        if (team) {
          entityDetails = {
            type: 'team',
            id: team.id,
            name: team.name,
            department: team.department,
          };
        }
        break;
 
      case 'message':
        const { data: msg } = await supabaseAdmin
          .from('messages')
          .select('id, content, created_at, sender_id, profiles:sender_id(id, username, full_name)')
          .eq('id', report.entity_id)
          .single();
 
        if (msg) {
          entityDetails = {
            type: 'message',
            id: msg.id,
            content: msg.content,
            sender: msg.profiles ? {
              id: msg.profiles.id,
              username: msg.profiles.username,
              full_name: msg.profiles.full_name,
            } : null,
            created_at: msg.created_at,
          };
        }
        break;
 
      case 'user':
        const { data: user } = await supabaseAdmin
          .from('profiles')
          .select('id, username, full_name, email, department')
          .eq('id', report.entity_id)
          .single();
 
        if (user) {
          entityDetails = {
            type: 'user',
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            department: user.department,
          };
        }
        break;
    }
 
    if (isDev) {
      console.log('[adminGetReportedItem] report_id:', reportId);
    }
 
    res.status(200).json({
      success: true,
      message: 'Report retrieved successfully.',
      data: {
        report: {
          id: report.id,
          reason: report.reason,
          status: report.status,
          description: report.description,
          reported_by: {
            id: report.profiles.id,
            username: report.profiles.username,
            full_name: report.profiles.full_name,
          },
          reported_at: report.created_at,
          reviewed_by: report.reviewed_by,
          reviewed_at: report.reviewed_at,
          resolution_notes: report.resolution_notes,
        },
        entity: entityDetails,
      },
    });
  } catch (err) {
    console.error('[adminGetReportedItem] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch report details.',
    });
  }
};
 
// ===== FULL REPORTS AUDIT (global, all statuses) =====
 
export const adminListReports = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const { status, entity_type, department, from, to } = req.query;
  const isDev = process.env.NODE_ENV === 'development';
 
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }
 
  if (entity_type && !VALID_ENTITY_TYPES.includes(entity_type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid entity_type filter. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
    });
  }
 
  try {
    const profilesEmbed = department
      ? 'profiles!conversation_reports_reported_by_fkey!inner(id, username, full_name, email, department)'
      : 'profiles!conversation_reports_reported_by_fkey(id, username, full_name, email, department)';
 
    let query = supabaseAdmin
      .from('conversation_reports')
      .select(
        `
        id, entity_type, entity_id, reason, status, created_at, reviewed_at, reviewed_by,
        ${profilesEmbed}
      `,
        { count: 'exact' }
      );
 
    if (status) query = query.eq('status', status);
    if (entity_type) query = query.eq('entity_type', entity_type);
    if (department) query = query.eq('profiles.department', department);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
 
    const { data: reports, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
 
    if (error) throw error;
 
    if (isDev) {
      console.log('[adminListReports] filters:', { status, entity_type, department, from, to }, 'count:', count);
    }
 
    const formatted = (reports || []).map(r => ({
      id: r.id,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      reason: r.reason,
      status: r.status,
      reported_by: r.profiles ? {
        id: r.profiles.id,
        username: r.profiles.username,
        full_name: r.profiles.full_name,
        department: r.profiles.department,
      } : null,
      created_at: r.created_at,
      reviewed_at: r.reviewed_at,
      reviewed_by: r.reviewed_by,
    }));
 
    res.status(200).json({
      success: true,
      message: 'Reports retrieved successfully.',
      data: formatted,
      pagination: {
        page,
        limit,
        total: count || 0,
        has_more: offset + limit < (count || 0),
      },
    });
  } catch (err) {
    console.error('[adminListReports] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch reports.',
    });
  }
};
 
export const adminReviewReport = async (req, res) => {
  const { reportId } = req.params;
  const { status, resolution_notes } = req.body;
  const admin_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';
 
  if (!reportId || !status) {
    return res.status(400).json({
      success: false,
      message: 'Report ID and status are required.',
    });
  }
 
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }
 
  try {
    const { data: report, error: reportError } = await supabaseAdmin
      .from('conversation_reports')
      .select('id, status')
      .eq('id', reportId)
      .single();
 
    if (reportError || !report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }
 
    const { error: updateError } = await supabaseAdmin
      .from('conversation_reports')
      .update({
        status: status,
        reviewed_by: admin_id,
        reviewed_at: new Date().toISOString(),
        resolution_notes: resolution_notes || null,
      })
      .eq('id', reportId);
 
    if (updateError) throw updateError;
 
    if (isDev) {
      console.log('[adminReviewReport] report_id:', reportId, 'status:', status, 'admin_id:', admin_id);
    }
 
    res.status(200).json({
      success: true,
      message: `Report marked as ${status}.`,
      data: {
        report_id: reportId,
        status: status,
        reviewed_by: admin_id,
        reviewed_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[adminReviewReport] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to review report.',
    });
  }
};
 
// ===== USER PASSWORD MANAGEMENT =====
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 10;
 
export const adminUpdateUserPassword = async (req, res) => {
  const { email, new_password } = req.body;
  const admin_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';
 
  if (!email || !new_password) {
    return res.status(400).json({
      success: false,
      message: 'Email and new password are required.',
    });
  }
 
  if (typeof new_password !== 'string' || new_password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    });
  }
 
  try {
    const { data: targetUser, error: lookupError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email')
      .eq('email', email)
      .single();
 
    if (lookupError || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email.',
      });
    }
 
    const password_hash = await bcrypt.hash(new_password, BCRYPT_SALT_ROUNDS);
 
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        password_hash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUser.id);
 
    if (updateError) throw updateError;
 
    console.log('[adminUpdateUserPassword] admin_id:', admin_id, 'target_user_id:', targetUser.id, 'target_email:', email, 'at:', new Date().toISOString());
 
    if (isDev) {
      console.log('[adminUpdateUserPassword] password reset completed for:', targetUser.username || targetUser.email);
    }
 
    res.status(200).json({
      success: true,
      message: `Password updated successfully for ${targetUser.full_name || targetUser.username || email}.`,
      data: {
        user_id: targetUser.id,
        email: targetUser.email,
      },
    });
  } catch (err) {
    console.error('[adminUpdateUserPassword] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to update password.',
    });
  }
};