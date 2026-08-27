/// --- REPORTING CONTROLLER (Global) ---

const VALID_REASONS = [
  'inappropriate_language',
  'spam',
  'harassment',
  'violence',
  'hate_speech',
  'misinformation',
  'copyright_violation',
  'other'
];

const REPORTABLE_ENTITIES = ['conversation', 'group', 'team', 'message', 'user'];

export const createReport = async (req, res) => {
  const { entity_type, entity_id, reason, description } = req.body;
  const reported_by = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  // Validation
  if (!entity_type || !entity_id || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Entity type, entity ID, and reason are required.',
    });
  }

  if (!REPORTABLE_ENTITIES.includes(entity_type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid entity type. Must be one of: ${REPORTABLE_ENTITIES.join(', ')}`,
    });
  }

  if (!VALID_REASONS.includes(reason)) {
    return res.status(400).json({
      success: false,
      message: `Invalid reason. Must be one of: ${VALID_REASONS.join(', ')}`,
    });
  }

  if (description && description.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Description cannot exceed 1000 characters.',
    });
  }

  try {
    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', reported_by)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Verify entity exists based on type
    let entityExists = false;
    let entityName = null;

    switch (entity_type) {
      case 'conversation':
        const { data: conv } = await supabaseAdmin
          .from('conversations')
          .select('id, subject')
          .eq('id', entity_id)
          .single();
        entityExists = !!conv;
        entityName = conv?.subject || 'Conversation';
        break;

      case 'group':
        const { data: group } = await supabaseAdmin
          .from('teams')
          .select('id, name')
          .eq('id', entity_id)
          .eq('type', 'group')
          .single();
        entityExists = !!group;
        entityName = group?.name || 'Group';
        break;

      case 'team':
        const { data: team } = await supabaseAdmin
          .from('teams')
          .select('id, name')
          .eq('id', entity_id)
          .eq('type', 'team')
          .single();
        entityExists = !!team;
        entityName = team?.name || 'Team';
        break;

      case 'message':
        const { data: msg } = await supabaseAdmin
          .from('messages')
          .select('id, content')
          .eq('id', entity_id)
          .single();
        entityExists = !!msg;
        entityName = 'Message';
        break;

      case 'user':
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, username, full_name')
          .eq('id', entity_id)
          .single();
        entityExists = !!profile;
        entityName = profile?.full_name || profile?.username || 'User';
        break;
    }

    if (!entityExists) {
      return res.status(404).json({
        success: false,
        message: `${entity_type.charAt(0).toUpperCase() + entity_type.slice(1)} not found.`,
      });
    }

    // Check if already reported by this user
    const { data: existingReport } = await supabaseAdmin
      .from('conversation_reports')
      .select('id')
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .eq('reported_by', reported_by)
      .eq('status', 'pending')
      .single();

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this item. Please wait for review.',
      });
    }

    // For conversation entity type, also set conversation_id for backward compatibility
    let conversation_id = null;
    if (entity_type === 'conversation') {
      conversation_id = entity_id;
    }

    // Create report
    const { data: report, error: reportError } = await supabaseAdmin
      .from('conversation_reports')
      .insert({
        entity_type: entity_type,
        entity_id: entity_id,
        conversation_id: conversation_id,
        reported_by: reported_by,
        reason: reason,
        description: description || null,
        status: 'pending',
      })
      .select('id, entity_type, entity_id, reason, status, created_at')
      .single();

    if (reportError) {
      console.error('[createReport] Error creating report:', reportError);
      throw new Error('Failed to create report');
    }

    if (isDev) {
      console.log('[createReport] Report created:', report.id, 'entity_type:', entity_type, 'reported_by:', reported_by);
    }

    res.status(201).json({
      success: true,
      message: `Thank you for reporting this ${entity_type}. Our team will review it shortly.`,
      data: {
        report_id: report.id,
        entity_type: report.entity_type,
        entity_id: report.entity_id,
        reason: report.reason,
        status: report.status,
        created_at: report.created_at,
      },
    });
  } catch (err) {
    console.error('[createReport] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to create report.',
    });
  }
};

export const getUserReports = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const isDev = process.env.NODE_ENV === 'development';

  try {
    const { data: reports, error, count } = await supabaseAdmin
      .from('conversation_reports')
      .select(
        `
        id, entity_type, entity_id, reason, status, description,
        created_at, reviewed_at
      `,
        { count: 'exact' }
      )
      .eq('reported_by', user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    if (isDev) {
      console.log('[getUserReports] user_id:', user_id, 'count:', count);
    }

    const formatted = (reports || []).map(r => ({
      id: r.id,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      reason: r.reason,
      status: r.status,
      description: r.description,
      created_at: r.created_at,
      reviewed_at: r.reviewed_at,
    }));

    res.status(200).json({
      success: true,
      message: 'Your reports retrieved successfully.',
      data: formatted,
      pagination: {
        page,
        limit,
        total: count || 0,
        has_more: offset + limit < (count || 0),
      },
    });
  } catch (err) {
    console.error('[getUserReports] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch your reports.',
    });
  }
};

export const getReportDetails = async (req, res) => {
  const { reportId } = req.params;
  const user_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!reportId) {
    return res.status(400).json({
      success: false,
      message: 'Report ID is required.',
    });
  }

  try {
    const { data: report, error } = await supabaseAdmin
      .from('conversation_reports')
      .select(
        `
        id, entity_type, entity_id, reason, status, description,
        created_at, reviewed_at, resolution_notes, reported_by
      `
      )
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    // User can only see their own reports
    if (report.reported_by !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own reports.',
      });
    }

    if (isDev) {
      console.log('[getReportDetails] report_id:', reportId, 'user_id:', user_id);
    }

    res.status(200).json({
      success: true,
      message: 'Report retrieved successfully.',
      data: {
        id: report.id,
        entity_type: report.entity_type,
        entity_id: report.entity_id,
        reason: report.reason,
        status: report.status,
        description: report.description,
        created_at: report.created_at,
        reviewed_at: report.reviewed_at,
        resolution_notes: report.resolution_notes,
      },
    });
  } catch (err) {
    console.error('[getReportDetails] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch report details.',
    });
  }
};