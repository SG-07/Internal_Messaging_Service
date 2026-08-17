import supabaseAdmin from '../config/supabaseClient.js';

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
    const { data: newTeam, error } = await supabaseAdmin
      .from('teams')
      .insert({
        name,
        requested_by: requester_id,
        status: 'pending',
      })
      .select('id, name, status, requested_by, created_at')
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
export const getTeamConversation = async (req, res) => {
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