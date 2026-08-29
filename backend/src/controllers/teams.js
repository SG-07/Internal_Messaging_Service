// backend/src/controllers/teams.js
import supabaseAdmin from '../config/supabaseClient.js';
import { ensureTeamConversation, attachUserToTeam } from '../utils/teamMembership.js';

const isDev = process.env.NODE_ENV === 'development';

// --- MANAGER: REQUEST A NEW TEAM (pending admin approval) ---
export const requestTeam = async (req, res) => {
  const { name } = req.body;
  const requester_id = req.user.id;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Team name is required.',
    });
  }

  try {
    // department/manager_id are never taken from the request body — same
    // rule as admin/manager team creation elsewhere. The requesting
    // manager becomes the team's manager once approved, in their own
    // department (fetched from their profile, not the payload).
    const { data: requester, error: requesterError } = await supabaseAdmin
      .from('profiles')
      .select('id, department')
      .eq('id', requester_id)
      .single();

    if (requesterError || !requester) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!requester.department) {
      return res.status(400).json({
        success: false,
        message: 'Your profile does not have a department assigned. Ask an admin to set your department before requesting a team.',
      });
    }

    const { data: newTeam, error } = await supabaseAdmin
      .from('teams')
      .insert({
        name,
        requested_by: requester_id,
        manager_id: requester_id,
        department: requester.department,
        type: 'team', // Without this it silently defaults to 'group' — same gap fixed in admin.js's createTeam
        status: 'pending',
      })
      .select('id, name, status, requested_by, manager_id, department, type, created_at')
      .single();

    if (isDev) {
      console.log('[requestTeam] requester_id:', requester_id, 'name:', name);
    }

    if (error) {
      console.error('[requestTeam] Supabase error:', error);
      throw new Error('Failed to submit team request');
    }

    res.status(201).json({
      success: true,
      message: 'Team request submitted. Awaiting admin approval.',
      data: newTeam,
    });
  } catch (err) {
    console.error('[requestTeam] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to submit team request.',
    });
  }
};

// --- MANAGER: VIEW OWN TEAM REQUESTS ---
export const getMyTeamRequests = async (req, res) => {
  const requester_id = req.user.id;

  try {
    const { data: teams, error } = await supabaseAdmin
      .from('teams')
      .select('id, name, status, created_at, updated_at')
      .eq('requested_by', requester_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch team requests');
    }

    res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (err) {
    console.error('[getMyTeamRequests] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch team requests.',
    });
  }
};

// --- MANAGER: LIST OWN TEAM'S MEMBERS ---
export const getMyTeamMembers = async (req, res) => {
  const manager_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name')
      .eq('manager_id', manager_id)
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        message: 'You are not currently managing a team.',
      });
    }

    const { data: members, error: membersError, count } = await supabaseAdmin
      .from('profiles')
      .select('id, username, email, department, team_status', { count: 'exact' })
      .eq('current_team_id', team.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (isDev) {
      console.log('[getMyTeamMembers] manager_id:', manager_id, 'team:', team.id, 'count:', count);
    }

    if (membersError) {
      throw new Error('Failed to fetch team members');
    }

    res.status(200).json({
      success: true,
      team,
      data: members,
      pagination: {
        page,
        limit,
        total: count,
        has_more: offset + limit < count,
      },
    });
  } catch (err) {
    console.error('[getMyTeamMembers] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch team members.',
    });
  }
};

// --- MANAGER: VIEW A TEAM MEMBER'S CONVERSATIONS (scoped to own team only) ---
export const getTeamMemberConversations = async (req, res) => {
  const { userId } = req.params;
  const manager_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, username, department, current_team_id')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!targetUser.current_team_id) {
      return res.status(403).json({
        success: false,
        message: 'This user is not on your team.',
      });
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('id', targetUser.current_team_id)
      .eq('manager_id', manager_id)
      .single();

    if (teamError || !team) {
      return res.status(403).json({
        success: false,
        message: 'This user is not on your team.',
      });
    }

    if (isDev) {
      console.log('[getTeamMemberConversations] manager_id:', manager_id, 'target user:', targetUser.id);
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
    console.error('[getTeamMemberConversations] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch conversations.',
    });
  }
};

// --- MANAGER: VIEW A SPECIFIC CONVERSATION (only if a team member is a participant) ---
export const getTeamMemberConversation = async (req, res) => {
  const { conversationId } = req.params;
  const manager_id = req.user.id;

  try {
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('manager_id', manager_id)
      .single();

    if (teamError || !team) {
      return res.status(403).json({
        success: false,
        message: 'You are not currently managing a team.',
      });
    }

    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('conversation_participants')
      .select('user_id, profiles(current_team_id)')
      .eq('conversation_id', conversationId);

    if (participantsError || !participants) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const hasTeamMember = participants.some(
      (p) => p.profiles?.current_team_id === team.id
    );

    if (!hasTeamMember) {
      return res.status(403).json({
        success: false,
        message: 'This conversation does not involve anyone on your team.',
      });
    }

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
      console.log('[getTeamConversation] manager_id:', manager_id, 'conversationId:', conversationId);
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
  } catch (err) {
    console.error('[getTeamConversation] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch conversation.',
    });
  }
};

/// --- CREATE TEAM (Admin/Manager only) ---
export const createTeam = async (req, res) => {
  const { name, managerId } = req.body;
  const creator_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  // Validation
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Team name is required.',
    });
  }

  try {
    // Fetch creator profile
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email, role, department')
      .eq('id', creator_id)
      .single();

    if (creatorError || !creator) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // ONLY ADMIN AND MANAGER can create teams
    const isAdmin = creator.role === 'admin';
    const isManager = creator.role === 'manager';

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can create teams.',
      });
    }

    // Department is never taken from the request body — it always comes
    // from the creator's own profile (role/department/id all live in the
    // JWT-backed session, not the payload), so a team can never be
    // created in a department the requester doesn't belong to.
    const department = creator.department;

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Your profile does not have a department assigned. Ask an admin to set your department before creating a team.',
      });
    }

    if (isDev) {
      console.log('[createTeam] Creator:', creator_id, 'role:', creator.role, 'dept:', department);
    }

    // Resolve who the team's manager should be.
    // - A manager creating a team always self-assigns (manager_id =
    //   creator_id) — the managerId field is ignored in that case.
    // - An admin creating a team can pass managerId (despite the name,
    //   this is an email — same convention as admin.js's createTeam) to
    //   assign someone else. If omitted, the team is created with no
    //   manager (manager_id: null), same as before.
    let resolvedManagerId = isManager ? creator_id : null;

    if (isAdmin && managerId) {
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

    // Determine team status
    // Admin/Manager creation: auto-approve (status: approved, approved_by: creator_id)
    const status = 'approved';
    const approvedBy = creator_id;

    // Create the team
    const { data: newTeam, error: teamError } = await supabaseAdmin
      .from('teams')
      .insert({
        name: name.trim(),
        is_open: false, // Teams are never open to self-join — open/joinable is what groups are for
        status: status,
        department: department,
        manager_id: resolvedManagerId,
        requested_by: creator_id,
        approved_by: approvedBy,
        type: 'team',  // Specify this is a team, not a group
      })
      .select('id, name, is_open, status, department, manager_id, requested_by, approved_by, created_at, updated_at, type')
      .single();

    if (teamError) {
      console.error('[createTeam] Error creating team:', teamError);
      throw new Error('Failed to create team');
    }

    const team_id = newTeam.id;

    if (isDev) {
      console.log('[createTeam] Team created:', team_id, 'by:', creator_id, 'status:', status, 'manager_id:', resolvedManagerId);
    }

    // ===== ATTACH CREATOR: team_members row, team conversation (with the
    // "Team Created" first message), and conversation_participants — all
    // handled by the shared helper so this stays consistent with every
    // other "add user to team" path in the codebase (admin.js, manager.js,
    // and this file's own addTeamMember). =====
    const { error: attachError } = await attachUserToTeam(team_id, creator_id, creator_id);

    // A failure to create the conversation itself is treated the same way
    // this endpoint always has: roll back the team rather than leave a
    // team with no conversation behind.
    if (attachError?.conversation) {
      console.error('[createTeam] Error setting up team conversation:', attachError.conversation);
      await supabaseAdmin.from('teams').delete().eq('id', team_id);
      throw new Error('Failed to create team conversation');
    }

    // team_members / conversation_participants failures are non-fatal —
    // the team and its conversation still exist, so continue anyway (same
    // tolerance this endpoint always had for those two steps).
    if (attachError?.member && isDev) {
      console.log('[createTeam] Error adding creator as team member:', attachError.member);
    }

    if (attachError?.participant && isDev) {
      console.log('[createTeam] Error adding creator to conversation:', attachError.participant);
    }

    // If a separate manager was assigned (admin-created team with
    // managerId), attach them too — same team_members/conversation
    // treatment as the creator, just non-fatal on any failure since the
    // team and its conversation already exist at this point regardless.
    if (resolvedManagerId && resolvedManagerId !== creator_id) {
      const { error: managerAttachError } = await attachUserToTeam(team_id, resolvedManagerId, creator_id);

      if (managerAttachError && isDev) {
        console.log('[createTeam] Failed to fully attach assigned manager to team:', managerAttachError);
      }
    }

    // Look up the conversation id to include in the response, same as before.
    const { data: teamWithConversation } = await supabaseAdmin
      .from('teams')
      .select('conversation_id')
      .eq('id', team_id)
      .single();

    const conversation_id = teamWithConversation?.conversation_id || null;

    if (isDev) {
      console.log('[createTeam] Conversation set up:', conversation_id, 'with initial message and creator as participant');
    }

    res.status(201).json({
      success: true,
      message: 'Team created successfully.',
      data: {
        id: newTeam.id,
        name: newTeam.name,
        is_open: newTeam.is_open,
        status: newTeam.status,
        department: newTeam.department,
        manager_id: newTeam.manager_id,
        requested_by: newTeam.requested_by,
        approved_by: newTeam.approved_by,
        created_by: creator_id,
        created_at: newTeam.created_at,
        updated_at: newTeam.updated_at,
        type: newTeam.type,
        conversation_id: conversation_id,
        auto_approved: true,  // Always auto-approved for admin/manager
      },
    });
  } catch (err) {
    console.error('[createTeam] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to create team.',
    });
  }
};


/// --- LIST USER'S TEAMS (Only joined teams) ---
export const listUserTeams = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const isDev = process.env.NODE_ENV === 'development';

  try {
    // Fetch current user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email, role, department')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (isDev) {
      console.log('[listUserTeams] user_id:', user_id, 'role:', user.role, 'department:', user.department);
    }

    // Get user's team memberships (only active members - left_at is null)
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('team_members')
      .select('team_id')
      .eq('user_id', user_id)
      .is('left_at', null);

    if (membershipError) {
      console.error('[listUserTeams] Error fetching memberships:', membershipError);
      throw new Error('Failed to fetch team memberships');
    }

    // If user is not a member of any team
    if (!memberships || memberships.length === 0) {
      if (isDev) {
        console.log('[listUserTeams] User has no team memberships');
      }

      return res.status(200).json({
        success: true,
        message: 'User is not a member of any team.',
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          has_more: false,
        },
      });
    }

    // Extract team IDs from memberships
    const teamIds = memberships.map(m => m.team_id);

    if (isDev) {
      console.log('[listUserTeams] User team count:', teamIds.length);
    }

    // Fetch teams with manager details
    const { data: teams, error: teamsError, count } = await supabaseAdmin
      .from('teams')
      .select(
        `
        id,
        name,
        is_open,
        department,
        manager_id,
        status,
        requested_by,
        approved_by,
        type,
        created_at,
        updated_at,
        conversation_id,
        profiles!teams_manager_id_fkey(id, username, full_name, email)
      `,
        { count: 'exact' }
      )
      .in('id', teamIds)
      .eq('type', 'team')  // Only teams, not groups
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (teamsError) {
      console.error('[listUserTeams] Error fetching teams:', teamsError);
      throw new Error('Failed to fetch teams');
    }

    if (isDev) {
      console.log('[listUserTeams] Fetched teams count:', teams.length);
    }

    // Transform response - flatten manager details and add member count
    const transformedTeams = await Promise.all(
      teams.map(async (team) => {
        // Get member count for each team
        const { count: memberCount, error: countError } = await supabaseAdmin
          .from('team_members')
          .select('id', { count: 'exact' })
          .eq('team_id', team.id)
          .is('left_at', null);

        return {
          id: team.id,
          name: team.name,
          is_open: team.is_open,
          department: team.department,
          manager: team.profiles
            ? {
                id: team.profiles.id,
                username: team.profiles.username,
                full_name: team.profiles.full_name,
                email: team.profiles.email,
              }
            : null,
          status: team.status,
          requested_by: team.requested_by,
          approved_by: team.approved_by,
          type: team.type,
          total_members: memberCount || 0,
          created_at: team.created_at,
          updated_at: team.updated_at,
          conversation_id: team.conversation_id,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'User teams retrieved successfully.',
      data: transformedTeams,
      pagination: {
        page,
        limit,
        total: count || teamIds.length,
        has_more: offset + limit < (count || teamIds.length),
      },
    });
  } catch (err) {
    console.error('[listUserTeams] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch user teams.',
    });
  }
};


/// --- ADD MEMBER TO TEAM (Admin/Manager only) ---
export const addTeamMember = async (req, res) => {
  const { teamId } = req.params;
  const { user_id: member_user_id } = req.body;
  const admin_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!teamId) {
    return res.status(400).json({
      success: false,
      message: 'Team ID is required.',
    });
  }

  if (!member_user_id) {
    return res.status(400).json({
      success: false,
      message: 'User ID to add is required.',
    });
  }

  try {
    // Fetch admin/manager profile
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email, role, department')
      .eq('id', admin_id)
      .single();

    if (adminError || !admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin/Manager not found.',
      });
    }

    // ONLY ADMIN AND MANAGER can add members
    const isAdmin = admin.role === 'admin';
    const isManager = admin.role === 'manager';

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can add team members.',
      });
    }

    // Fetch team details
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name, department, type')
      .eq('id', teamId)
      .eq('type', 'team')  // Only add to teams, not groups
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    if (isDev) {
      console.log('[addTeamMember] admin_id:', admin_id, 'role:', admin.role, 'team_id:', teamId);
    }

    // Manager can only add to teams in their own department
    if (isManager && admin.department !== team.department) {
      return res.status(403).json({
        success: false,
        message: 'Managers can only add members to teams in their own department.',
      });
    }

    // Fetch member to add
    const { data: member, error: memberError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email, role, department')
      .eq('id', member_user_id)
      .single();

    if (memberError || !member) {
      return res.status(404).json({
        success: false,
        message: 'User to add not found.',
      });
    }

    // CRITICAL: Only users in same department can be added to team
    if (member.department !== team.department) {
      return res.status(403).json({
        success: false,
        message: 'User can only be added to teams in their own department.',
      });
    }

    if (isDev) {
      console.log('[addTeamMember] Adding member:', member_user_id, 'dept:', member.department, 'team_dept:', team.department);
    }

    // Check if user is already a member (preserves the existing
    // "already a member" 400 response exactly as before).
    const { data: existingMember, error: existingError } = await supabaseAdmin
      .from('team_members')
      .select('id, left_at')
      .eq('team_id', teamId)
      .eq('user_id', member_user_id)
      .single();

    // Handle no results error (PGRST116)
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('[addTeamMember] Error checking membership:', existingError);
      throw new Error('Failed to check team membership');
    }

    // If already an active member
    if (existingMember && !existingMember.left_at) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this team.',
      });
    }

    // Fully attaches the member: team_members row (insert, or reactivate
    // if they'd left before), the team's conversation (creating it if
    // needed), and conversation_participants — shared with admin.js and
    // manager.js so every "add to team" path stays consistent.
    const { error: attachError } = await attachUserToTeam(teamId, member_user_id, admin_id);

    if (attachError && isDev) {
      console.log('[addTeamMember] Failed to fully attach member to team:', attachError);
    }

    res.status(201).json({
      success: true,
      message: `Successfully added ${member.full_name || member.username} to the team.`,
      data: {
        team_id: teamId,
        team_name: team.name,
        user_id: member_user_id,
        user_name: member.full_name || member.username,
        user_email: member.email,
        added_by: admin_id,
        added_by_name: admin.full_name || admin.username,
        added_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[addTeamMember] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to add team member.',
    });
  }
};

/// --- GET TEAM DETAILS  ---
export const getTeam = async (req, res) => {
  const { teamId } = req.params;
  const user_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!teamId) {
    return res.status(400).json({
      success: false,
      message: 'Team ID is required.',
    });
  }

  try {
    // Fetch team details
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name, is_open, status, department, manager_id, requested_by, approved_by, type, created_at, updated_at')
      .eq('id', teamId)
      .eq('type', 'team')
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    // IMPORTANT: User can ONLY view team if they're a member
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user_id)
      .is('left_at', null)
      .single();

    // Handle PGRST116 (no rows) vs real error
    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('[getTeam] Error checking membership:', membershipError);
      throw new Error('Failed to check team membership');
    }

    // User is not a member - deny access
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this team to view it.',
      });
    }

    if (isDev) {
      console.log('[getTeam] user_id:', user_id, 'team_id:', teamId);
    }

    // Fetch team manager details
    let manager = null;
    if (team.manager_id) {
      const { data: managerData } = await supabaseAdmin
        .from('profiles')
        .select('id, username, full_name, email')
        .eq('id', team.manager_id)
        .single();

      if (managerData) {
        manager = {
          id: managerData.id,
          username: managerData.username,
          full_name: managerData.full_name,
          email: managerData.email,
        };
      }
    }

    // Fetch all team members (active only)
    const { data: memberData, error: membersError } = await supabaseAdmin
      .from('team_members')
      .select('user_id, profiles:user_id(id, username, full_name, email, department, role)')
      .eq('team_id', teamId)
      .is('left_at', null);

    if (membersError) {
      console.error('[getTeam] Error fetching members:', membersError);
    }

    // Format members
    const members = (memberData || []).map(m => ({
      id: m.profiles.id,
      username: m.profiles.username,
      full_name: m.profiles.full_name,
      email: m.profiles.email,
      department: m.profiles.department,
      role: m.profiles.role,
    }));

    // Fetch team conversation (if exists)
    let conversationId = null;
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('group_id', teamId)
      .eq('conversation_type', 'team')
      .single();

    if (conversation) {
      conversationId = conversation.id;
    }

    if (isDev) {
      console.log('[getTeam] Team fetched:', teamId, 'members:', members.length);
    }

    res.status(200).json({
      success: true,
      message: 'Team details retrieved successfully.',
      data: {
        id: team.id,
        name: team.name,
        is_open: team.is_open,
        status: team.status,
        department: team.department,
        manager: manager,
        requested_by: team.requested_by,
        approved_by: team.approved_by,
        type: team.type,
        conversation_id: conversationId,
        total_members: members.length,
        members: members,
        user_membership_status: 'member',  // Always "member" since we checked above
        can_leave: true,  // Users can always leave
        can_manage: user_id === team.manager_id || false,  // Only manager/admin can manage
        created_at: team.created_at,
        updated_at: team.updated_at,
      },
    });
  } catch (err) {
    console.error('[getTeam] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch team details.',
    });
  }
};


/// --- LIST TEAM MEMBERS (Step 7) ---
export const listTeamMembers = async (req, res) => {
  const { teamId } = req.params;
  const user_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!teamId) {
    return res.status(400).json({
      success: false,
      message: 'Team ID is required.',
    });
  }

  try {
    // Check if user is a team member
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user_id)
      .is('left_at', null)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('[listTeamMembers] Error checking membership:', membershipError);
      throw new Error('Failed to check team membership');
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this team to view members.',
      });
    }

    // Fetch team
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name')
      .eq('id', teamId)
      .eq('type', 'team')
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    if (isDev) {
      console.log('[listTeamMembers] user_id:', user_id, 'team_id:', teamId);
    }

    // Fetch all team members (active only)
    const { data: memberData, error: membersError } = await supabaseAdmin
      .from('team_members')
      .select('user_id, joined_at, profiles:user_id(id, username, full_name, email, department, role)')
      .eq('team_id', teamId)
      .is('left_at', null)
      .order('joined_at', { ascending: true });

    if (membersError) {
      console.error('[listTeamMembers] Error fetching members:', membersError);
      throw new Error('Failed to fetch team members');
    }

    // Format members
    const members = (memberData || []).map(m => ({
      id: m.profiles.id,
      username: m.profiles.username,
      full_name: m.profiles.full_name,
      email: m.profiles.email,
      department: m.profiles.department,
      role: m.profiles.role,
      joined_at: m.joined_at,
    }));

    if (isDev) {
      console.log('[listTeamMembers] Fetched members:', members.length);
    }

    res.status(200).json({
      success: true,
      message: 'Team members retrieved successfully.',
      data: {
        team_id: teamId,
        team_name: team.name,
        total_members: members.length,
        members: members,
      },
    });
  } catch (err) {
    console.error('[listTeamMembers] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch team members.',
    });
  }
};

/// --- REMOVE TEAM MEMBER (Step 8 - Admin/Manager only) ---
export const removeTeamMember = async (req, res) => {
  const { teamId, userId } = req.params;
  const admin_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!teamId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Team ID and User ID are required.',
    });
  }

  try {
    // Fetch admin/manager profile
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email, role, department')
      .eq('id', admin_id)
      .single();

    if (adminError || !admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin/Manager not found.',
      });
    }

    // ONLY ADMIN AND MANAGER can remove members
    const isAdmin = admin.role === 'admin';
    const isManager = admin.role === 'manager';

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can remove team members.',
      });
    }

    // Fetch team details
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name, department, manager_id, type')
      .eq('id', teamId)
      .eq('type', 'team')
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    // Manager can only remove from teams they manage in their department
    if (isManager && admin.department !== team.department) {
      return res.status(403).json({
        success: false,
        message: 'Managers can only remove members from teams in their own department.',
      });
    }

    if (isDev) {
      console.log('[removeTeamMember] admin_id:', admin_id, 'role:', admin.role, 'team_id:', teamId, 'remove_user:', userId);
    }

    // Fetch member to remove
    const { data: member, error: memberError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email')
      .eq('id', userId)
      .single();

    if (memberError || !member) {
      return res.status(404).json({
        success: false,
        message: 'User to remove not found.',
      });
    }

    // Check if user is a team member
    const { data: teamMember, error: teamMemberError } = await supabaseAdmin
      .from('team_members')
      .select('id, left_at')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (teamMemberError && teamMemberError.code !== 'PGRST116') {
      console.error('[removeTeamMember] Error checking membership:', teamMemberError);
      throw new Error('Failed to check team membership');
    }

    // User is not a member
    if (!teamMember) {
      return res.status(400).json({
        success: false,
        message: 'User is not a member of this team.',
      });
    }

    // User already left
    if (teamMember.left_at) {
      return res.status(400).json({
        success: false,
        message: 'User has already left this team.',
      });
    }

    // Cannot remove yourself
    if (admin_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove yourself from the team. Use leave instead.',
      });
    }

    // Soft delete - set left_at timestamp
    const { error: updateError } = await supabaseAdmin
      .from('team_members')
      .update({ left_at: new Date().toISOString() })
      .eq('id', teamMember.id);

    if (updateError) {
      console.error('[removeTeamMember] Error removing member:', updateError);
      throw new Error('Failed to remove team member');
    }

    if (isDev) {
      console.log('[removeTeamMember] Member removed:', userId, 'from team:', teamId);
    }

    res.status(200).json({
      success: true,
      message: `Successfully removed ${member.full_name || member.username} from the team.`,
      data: {
        team_id: teamId,
        team_name: team.name,
        user_id: userId,
        user_name: member.full_name || member.username,
        user_email: member.email,
        removed_by: admin_id,
        removed_by_name: admin.full_name || admin.username,
        removed_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[removeTeamMember] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to remove team member.',
    });
  }
};

/// --- LEAVE TEAM (Step 9 - Any member) ---
export const leaveTeam = async (req, res) => {
  const { teamId } = req.params;
  const user_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!teamId) {
    return res.status(400).json({
      success: false,
      message: 'Team ID is required.',
    });
  }

  try {
    // Fetch user profile
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Fetch team
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name, type')
      .eq('id', teamId)
      .eq('type', 'team')
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    if (isDev) {
      console.log('[leaveTeam] user_id:', user_id, 'team_id:', teamId);
    }

    // Check if user is a team member
    const { data: teamMember, error: memberError } = await supabaseAdmin
      .from('team_members')
      .select('id, left_at')
      .eq('team_id', teamId)
      .eq('user_id', user_id)
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('[leaveTeam] Error checking membership:', memberError);
      throw new Error('Failed to check team membership');
    }

    // User is not a member
    if (!teamMember) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this team.',
      });
    }

    // User already left
    if (teamMember.left_at) {
      return res.status(400).json({
        success: false,
        message: 'You have already left this team.',
      });
    }

    // Soft delete - set left_at timestamp
    const { error: updateError } = await supabaseAdmin
      .from('team_members')
      .update({ left_at: new Date().toISOString() })
      .eq('id', teamMember.id);

    if (updateError) {
      console.error('[leaveTeam] Error leaving team:', updateError);
      throw new Error('Failed to leave team');
    }

    if (isDev) {
      console.log('[leaveTeam] User left team:', user_id, 'team:', teamId);
    }

    res.status(200).json({
      success: true,
      message: `Successfully left ${team.name}.`,
      data: {
        team_id: teamId,
        team_name: team.name,
        user_id: user_id,
        user_name: user.full_name || user.username,
        left_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[leaveTeam] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to leave team.',
    });
  }
};

/// --- GET TEAM CONVERSATION (Step 6) ---
export const getTeamConversation = async (req, res) => {
  const { teamId } = req.params;
  const user_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!teamId) {
    return res.status(400).json({
      success: false,
      message: 'Team ID is required.',
    });
  }

  try {
    // Check if user is a team member
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user_id)
      .is('left_at', null)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('[getTeamConversation] Error checking membership:', membershipError);
      throw new Error('Failed to check team membership');
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this team to access conversations.',
      });
    }

    // Fetch team
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name')
      .eq('id', teamId)
      .eq('type', 'team')
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    // Fetch team conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, subject, conversation_type, category, created_by, created_at, updated_at, is_group, group_id')
      .eq('group_id', teamId)
      .eq('conversation_type', 'team')
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Team conversation not found.',
      });
    }

    if (isDev) {
      console.log('[getTeamConversation] user_id:', user_id, 'team_id:', teamId, 'conversation_id:', conversation.id);
    }

    // Fetch messages
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select(
        `
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        updated_at,
        profiles:sender_id(id, username, full_name, email)
      `
      )
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[getTeamConversation] Error fetching messages:', messagesError);
    }

    // Fetch all participants
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('conversation_participants')
      .select(`user_id, profiles:user_id(id, username, full_name, email, department, role)`)
      .eq('conversation_id', conversation.id);

    if (participantsError) {
      console.error('[getTeamConversation] Error fetching participants:', participantsError);
    }

    // Format messages with sender details
    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      content: msg.content,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      sender: msg.profiles ? {
        id: msg.profiles.id,
        username: msg.profiles.username,
        full_name: msg.profiles.full_name,
        email: msg.profiles.email,
      } : null,
    }));

    // Format participants
    const formattedParticipants = (participants || []).map(p => ({
      id: p.profiles.id,
      username: p.profiles.username,
      full_name: p.profiles.full_name,
      email: p.profiles.email,
      department: p.profiles.department,
      role: p.profiles.role,
    }));

    if (isDev) {
      console.log('[getTeamConversation] Fetched conversation:', conversation.id, 'messages:', formattedMessages.length);
    }

    res.status(200).json({
      success: true,
      message: 'Team conversation retrieved.',
      data: {
        id: conversation.id,
        subject: conversation.subject,
        conversation_type: conversation.conversation_type,
        category: conversation.category,
        created_by: conversation.created_by,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        is_group: conversation.is_group,
        group_id: conversation.group_id,
        team_name: team.name,
        messages: formattedMessages,
        participants: formattedParticipants,
        total_messages: formattedMessages.length,
        total_participants: formattedParticipants.length,
      },
    });
  } catch (err) {
    console.error('[getTeamConversation] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch team conversation.',
    });
  }
};