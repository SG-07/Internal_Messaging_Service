// backend/src/controllers/manager.js
import supabaseAdmin from '../config/supabaseClient.js';

/// --- MANAGER CONTROLLER ---

// ===== TEAM MANAGEMENT =====

export const managerGetTeams = async (req, res) => {
  const manager_id = req.user.id;
  const manager_dept = req.user.department;
  const isDev = process.env.NODE_ENV === 'development';

  try {
    if (!manager_dept) {
      return res.status(400).json({
        success: false,
        message: 'Department not assigned to your account.',
      });
    }

    const { data: teams, error, count } = await supabaseAdmin
      .from('teams')
      .select(
        `
        id, name, is_open, status, department, manager_id, 
        profiles!teams_manager_id_fkey(id, username, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('manager_id', manager_id)
      .eq('department', manager_dept)
      .eq('type', 'team')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (isDev) {
      console.log('[managerGetTeams] manager_id:', manager_id, 'dept:', manager_dept, 'count:', count);
    }

    const formatted = (teams || []).map(t => ({
      id: t.id,
      name: t.name,
      is_open: t.is_open,
      status: t.status,
      department: t.department,
      manager: t.profiles ? {
        id: t.profiles.id,
        username: t.profiles.username,
        full_name: t.profiles.full_name,
        email: t.profiles.email,
      } : null,
    }));

    res.status(200).json({
      success: true,
      message: 'Teams retrieved successfully.',
      data: formatted,
      pagination: {
        total: count || 0,
      },
    });
  } catch (err) {
    console.error('[managerGetTeams] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch teams.',
    });
  }
};

export const managerGetTeam = async (req, res) => {
  const { teamId } = req.params;
  const manager_id = req.user.id;
  const manager_dept = req.user.department;
  const isDev = process.env.NODE_ENV === 'development';

  if (!teamId) {
    return res.status(400).json({
      success: false,
      message: 'Team ID is required.',
    });
  }

  try {
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name, is_open, status, department, manager_id')
      .eq('id', teamId)
      .eq('type', 'team')
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    // Verify manager can only access their own department
    if (team.manager_id !== manager_id || team.department !== manager_dept) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage teams in your department.',
      });
    }

    if (isDev) {
      console.log('[managerGetTeam] manager_id:', manager_id, 'team_id:', teamId);
    }

    res.status(200).json({
      success: true,
      message: 'Team retrieved successfully.',
      data: team,
    });
  } catch (err) {
    console.error('[managerGetTeam] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch team.',
    });
  }
};

export const managerListTeamMembers = async (req, res) => {
  const { teamId } = req.params;
  const manager_id = req.user.id;
  const manager_dept = req.user.department;
  const isDev = process.env.NODE_ENV === 'development';

  if (!teamId) {
    return res.status(400).json({
      success: false,
      message: 'Team ID is required.',
    });
  }

  try {
    // Verify team belongs to manager
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, manager_id, department')
      .eq('id', teamId)
      .eq('type', 'team')
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    if (team.manager_id !== manager_id || team.department !== manager_dept) {
      return res.status(403).json({
        success: false,
        message: 'You can only view members of your own teams.',
      });
    }

    const { data: members, error: membersError } = await supabaseAdmin
      .from('team_members')
      .select('user_id, joined_at, profiles:user_id(id, username, full_name, email, department, role)')
      .eq('team_id', teamId)
      .is('left_at', null)
      .order('joined_at', { ascending: true });

    if (membersError) throw membersError;

    if (isDev) {
      console.log('[managerListTeamMembers] team_id:', teamId, 'members:', members.length);
    }

    const formatted = (members || []).map(m => ({
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
      message: 'Team members retrieved successfully.',
      data: formatted,
    });
  } catch (err) {
    console.error('[managerListTeamMembers] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch team members.',
    });
  }
};

export const managerAddTeamMember = async (req, res) => {
  const { teamId } = req.params;
  const { user_id: member_user_id } = req.body;
  const manager_id = req.user.id;
  const manager_dept = req.user.department;
  const isDev = process.env.NODE_ENV === 'development';

  if (!teamId || !member_user_id) {
    return res.status(400).json({
      success: false,
      message: 'Team ID and User ID are required.',
    });
  }

  try {
    // Verify team belongs to manager
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name, manager_id, department')
      .eq('id', teamId)
      .eq('type', 'team')
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    if (team.manager_id !== manager_id || team.department !== manager_dept) {
      return res.status(403).json({
        success: false,
        message: 'You can only add members to your own teams.',
      });
    }

    // Verify user exists and is in same department
    const { data: member, error: memberError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email, department')
      .eq('id', member_user_id)
      .single();

    if (memberError || !member) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (member.department !== team.department) {
      return res.status(403).json({
        success: false,
        message: 'User must be from your department to add to team.',
      });
    }

    // Check if already member
    const { data: existingMember, error: existingError } = await supabaseAdmin
      .from('team_members')
      .select('id, left_at')
      .eq('team_id', teamId)
      .eq('user_id', member_user_id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingMember && !existingMember.left_at) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this team.',
      });
    }

    // Reactivate if previously left
    if (existingMember && existingMember.left_at) {
      await supabaseAdmin
        .from('team_members')
        .update({ left_at: null })
        .eq('id', existingMember.id);
    } else {
      // Add new member
      const { error: insertError } = await supabaseAdmin
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: member_user_id,
          added_by: manager_id,
        });

      if (insertError) throw insertError;
    }

    // Add to conversation if exists
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('group_id', teamId)
      .eq('conversation_type', 'team')
      .single();

    if (conversation) {
      const { data: existingParticipant } = await supabaseAdmin
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversation.id)
        .eq('user_id', member_user_id)
        .single();

      if (!existingParticipant) {
        await supabaseAdmin
          .from('conversation_participants')
          .insert({
            conversation_id: conversation.id,
            user_id: member_user_id,
          });
      }
    }

    if (isDev) {
      console.log('[managerAddTeamMember] Added member:', member_user_id, 'to team:', teamId);
    }

    res.status(201).json({
      success: true,
      message: `Successfully added ${member.full_name || member.username} to the team.`,
      data: {
        team_id: teamId,
        team_name: team.name,
        user_id: member_user_id,
        user_name: member.full_name || member.username,
      },
    });
  } catch (err) {
    console.error('[managerAddTeamMember] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to add team member.',
    });
  }
};

export const managerRemoveTeamMember = async (req, res) => {
  const { teamId, userId } = req.params;
  const manager_id = req.user.id;
  const manager_dept = req.user.department;
  const isDev = process.env.NODE_ENV === 'development';

  if (!teamId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Team ID and User ID are required.',
    });
  }

  try {
    // Verify team belongs to manager
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name, manager_id, department')
      .eq('id', teamId)
      .eq('type', 'team')
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    if (team.manager_id !== manager_id || team.department !== manager_dept) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove members from your own teams.',
      });
    }

    // Verify user exists
    const { data: member, error: memberError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email')
      .eq('id', userId)
      .single();

    if (memberError || !member) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if member exists
    const { data: teamMember, error: memberCheckError } = await supabaseAdmin
      .from('team_members')
      .select('id, left_at')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      throw memberCheckError;
    }

    if (!teamMember || teamMember.left_at) {
      return res.status(400).json({
        success: false,
        message: 'User is not an active member of this team.',
      });
    }

    // Cannot remove self
    if (manager_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove yourself from the team.',
      });
    }

    // Soft delete
    const { error: updateError } = await supabaseAdmin
      .from('team_members')
      .update({ left_at: new Date().toISOString() })
      .eq('id', teamMember.id);

    if (updateError) throw updateError;

    if (isDev) {
      console.log('[managerRemoveTeamMember] Removed member:', userId, 'from team:', teamId);
    }

    res.status(200).json({
      success: true,
      message: `Successfully removed ${member.full_name || member.username} from the team.`,
      data: {
        team_id: teamId,
        team_name: team.name,
        user_id: userId,
        user_name: member.full_name || member.username,
      },
    });
  } catch (err) {
    console.error('[managerRemoveTeamMember] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to remove team member.',
    });
  }
};

// ===== DEPARTMENT USERS =====

export const managerGetDepartmentUsers = async (req, res) => {
  const manager_id = req.user.id;
  const manager_dept = req.user.department;
  const isDev = process.env.NODE_ENV === 'development';

  try {
    if (!manager_dept) {
      return res.status(400).json({
        success: false,
        message: 'Department not assigned to your account.',
      });
    }

    const { data: users, error, count } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email, role, department, is_active', { count: 'exact' })
      .eq('department', manager_dept)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) throw error;

    if (isDev) {
      console.log('[managerGetDepartmentUsers] dept:', manager_dept, 'count:', count);
    }

    res.status(200).json({
      success: true,
      message: 'Department users retrieved successfully.',
      data: users || [],
      pagination: {
        total: count || 0,
      },
    });
  } catch (err) {
    console.error('[managerGetDepartmentUsers] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch department users.',
    });
  }
};

export const managerGetDepartmentUser = async (req, res) => {
  const { userId } = req.params;
  const manager_dept = req.user.department;
  const isDev = process.env.NODE_ENV === 'development';

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required.',
    });
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email, role, department, is_active')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Verify user is in manager's department
    if (user.department !== manager_dept) {
      return res.status(403).json({
        success: false,
        message: 'You can only view users in your department.',
      });
    }

    if (isDev) {
      console.log('[managerGetDepartmentUser] user_id:', userId, 'manager_dept:', manager_dept);
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully.',
      data: user,
    });
  } catch (err) {
    console.error('[managerGetDepartmentUser] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch user.',
    });
  }
};

// ===== REPORTED CONVERSATIONS (Manager Oversight - ONLY REPORTED) =====

export const managerListReportedConversations = async (req, res) => {
  const manager_dept = req.user.department;
  const isDev = process.env.NODE_ENV === 'development';

  try {
    if (!manager_dept) {
      return res.status(400).json({
        success: false,
        message: 'Department not assigned to your account.',
      });
    }

    // Get reported conversations where reporter is in manager's department
    const { data: reports, error: reportsError, count } = await supabaseAdmin
      .from('conversation_reports')
      .select(
        `
        id, conversation_id, reported_by, reason, status, created_at,
        conversations(id, subject, conversation_type, created_by),
        profiles!conversation_reports_reported_by_fkey(id, username, full_name, email, department)
      `,
        { count: 'exact' }
      )
      .eq('profiles.department', manager_dept)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (reportsError) throw reportsError;

    if (isDev) {
      console.log('[managerListReportedConversations] dept:', manager_dept, 'count:', count);
    }

    const formatted = (reports || []).map(r => ({
      id: r.id,
      conversation_id: r.conversation_id,
      conversation_type: r.conversations?.conversation_type,
      reported_by: r.profiles ? {
        id: r.profiles.id,
        username: r.profiles.username,
        full_name: r.profiles.full_name,
        email: r.profiles.email,
      } : null,
      reason: r.reason,
      status: r.status,
      created_at: r.created_at,
    }));

    res.status(200).json({
      success: true,
      message: 'Reported conversations retrieved successfully.',
      data: formatted,
      pagination: {
        total: count || 0,
      },
    });
  } catch (err) {
    console.error('[managerListReportedConversations] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch reported conversations.',
    });
  }
};

export const managerGetReportedConversation = async (req, res) => {
  const { conversationId } = req.params;
  const manager_dept = req.user.department;
  const isDev = process.env.NODE_ENV === 'development';

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      message: 'Conversation ID is required.',
    });
  }

  try {
    // Get report for this conversation
    const { data: report, error: reportError } = await supabaseAdmin
      .from('conversation_reports')
      .select(
        `
        id, conversation_id, reported_by, reason, status, created_at,
        profiles!conversation_reports_reported_by_fkey(id, username, full_name, email, department)
      `
      )
      .eq('conversation_id', conversationId)
      .eq('status', 'pending')
      .single();

    if (reportError || !report) {
      return res.status(404).json({
        success: false,
        message: 'Reported conversation not found.',
      });
    }

    // Verify reporter is in manager's department
    if (report.profiles.department !== manager_dept) {
      return res.status(403).json({
        success: false,
        message: 'You can only view reports from your department.',
      });
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select(
        `
        id, subject, conversation_type, category, created_by, created_at, updated_at,
        messages(id, content, created_at, sender_id, profiles:sender_id(id, username, full_name))
      `
      )
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    if (isDev) {
      console.log('[managerGetReportedConversation] conversation_id:', conversationId, 'manager_dept:', manager_dept);
    }

    res.status(200).json({
      success: true,
      message: 'Reported conversation retrieved successfully.',
      data: {
        report: {
          id: report.id,
          reason: report.reason,
          status: report.status,
          reported_by: {
            id: report.profiles.id,
            username: report.profiles.username,
            full_name: report.profiles.full_name,
          },
          reported_at: report.created_at,
        },
        conversation: {
          id: conversation.id,
          subject: conversation.subject,
          conversation_type: conversation.conversation_type,
          created_by: conversation.created_by,
          messages: (conversation.messages || []).map(m => ({
            id: m.id,
            content: m.content,
            sender: m.profiles ? {
              id: m.profiles.id,
              username: m.profiles.username,
              full_name: m.profiles.full_name,
            } : null,
            created_at: m.created_at,
          })),
        },
      },
    });
  } catch (err) {
    console.error('[managerGetReportedConversation] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch reported conversation.',
    });
  }
};

// ===== REPORTS MANAGEMENT =====

export const managerListReports = async (req, res) => {
  const manager_dept = req.user.department;
  const isDev = process.env.NODE_ENV === 'development';

  try {
    if (!manager_dept) {
      return res.status(400).json({
        success: false,
        message: 'Department not assigned to your account.',
      });
    }

    const { data: reports, error, count } = await supabaseAdmin
      .from('conversation_reports')
      .select(
        `
        id, conversation_id, reported_by, reason, status, created_at,
        profiles!conversation_reports_reported_by_fkey(id, username, full_name, email, department)
      `,
        { count: 'exact' }
      )
      .eq('profiles.department', manager_dept)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (isDev) {
      console.log('[managerListReports] dept:', manager_dept, 'count:', count);
    }

    const formatted = (reports || []).map(r => ({
      id: r.id,
      conversation_id: r.conversation_id,
      reported_by: r.profiles ? {
        id: r.profiles.id,
        username: r.profiles.username,
        full_name: r.profiles.full_name,
      } : null,
      reason: r.reason,
      status: r.status,
      created_at: r.created_at,
    }));

    res.status(200).json({
      success: true,
      message: 'Reports retrieved successfully.',
      data: formatted,
      pagination: {
        total: count || 0,
      },
    });
  } catch (err) {
    console.error('[managerListReports] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch reports.',
    });
  }
};

export const managerReviewReport = async (req, res) => {
  const { reportId } = req.params;
  const { status, review_notes } = req.body;
  const manager_id = req.user.id;
  const manager_dept = req.user.department;
  const isDev = process.env.NODE_ENV === 'development';

  if (!reportId || !status) {
    return res.status(400).json({
      success: false,
      message: 'Report ID and status are required.',
    });
  }

  if (!['reviewed', 'dismissed', 'resolved'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be: reviewed, dismissed, or resolved.',
    });
  }

  try {
    // Get report
    const { data: report, error: reportError } = await supabaseAdmin
      .from('conversation_reports')
      .select('id, reported_by, profiles!conversation_reports_reported_by_fkey(department)')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    // Verify reporter is in manager's department
    if (report.profiles.department !== manager_dept) {
      return res.status(403).json({
        success: false,
        message: 'You can only review reports from your department.',
      });
    }

    // Update report
    const { error: updateError } = await supabaseAdmin
      .from('conversation_reports')
      .update({
        status: status,
        reviewed_by: manager_id,
        reviewed_at: new Date().toISOString(),
        resolution_notes: review_notes || null,
      })
      .eq('id', reportId);

    if (updateError) throw updateError;

    if (isDev) {
      console.log('[managerReviewReport] report_id:', reportId, 'status:', status, 'manager_id:', manager_id);
    }

    res.status(200).json({
      success: true,
      message: `Report marked as ${status}.`,
      data: {
        report_id: reportId,
        status: status,
        reviewed_by: manager_id,
        reviewed_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[managerReviewReport] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to review report.',
    });
  }
};