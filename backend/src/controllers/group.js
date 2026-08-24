// backend/src/controllers/group.js
import supabaseAdmin from '../config/supabaseClient.js';

const isDev = process.env.NODE_ENV === 'development';

// --- CREATE GROUP ---
export const createGroup = async (req, res) => {
  const { name, is_open, department, manager_id } = req.body;
  const user_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  // Validation: name is required
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Group name is required and must be a non-empty string.',
    });
  }

  // Validation: is_open is required (boolean)
  if (is_open === undefined || typeof is_open !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'is_open is required and must be a boolean (true/false).',
    });
  }

  try {
    // Fetch current user details (role and department)
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, department')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Determine group department and status
    let groupDepartment = null;
    let groupStatus = 'approved'; // Default: auto-approved for open groups
    let approvedBy = null;

    if (user.role === 'admin') {
      // ADMIN: Can create groups with or without department
      groupDepartment = department !== undefined ? department : null;
      groupStatus = 'approved'; // Admin groups are auto-approved
      approvedBy = user_id;
    } else if (user.role === 'manager') {
      // MANAGER: Can only create groups in their own department
      if (!user.department) {
        return res.status(400).json({
          success: false,
          message: 'Your account has no department assigned. Contact admin to assign one.',
        });
      }
      groupDepartment = user.department; // Manager's group belongs to their department only
      // Manager groups: closed groups require approval, open groups auto-approve
      groupStatus = is_open ? 'approved' : 'pending';
      approvedBy = is_open ? user_id : null;
    } else {
      // REGULAR USER: Can only create groups in their own department
      if (!user.department) {
        return res.status(400).json({
          success: false,
          message: 'Your account has no department assigned. Contact admin to assign one.',
        });
      }
      groupDepartment = user.department; // User's group belongs to their department only
      // User groups: closed groups require approval, open groups auto-approve
      groupStatus = is_open ? 'approved' : 'pending';
      approvedBy = is_open ? user_id : null;
    }

    if (isDev) {
      console.log(
        '[createGroup] user_id:',
        user_id,
        'role:',
        user.role,
        'department:',
        groupDepartment,
        'is_open:',
        is_open,
        'status:',
        groupStatus
      );
    }

    // Validate manager_id if provided
    let finalManagerId = manager_id || null;
    if (manager_id) {
      const { data: manager, error: managerError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', manager_id)
        .single();

      if (managerError || !manager) {
        return res.status(400).json({
          success: false,
          message: 'Specified manager not found.',
        });
      }
      finalManagerId = manager_id;
    }

    // Create the group
    const { data: newGroup, error: groupError } = await supabaseAdmin
      .from('teams')
      .insert({
        name: name.trim(),
        is_open,
        department: groupDepartment,
        manager_id: finalManagerId,
        status: groupStatus,
        requested_by: user_id,
        approved_by: approvedBy,
      })
      .select('id, name, is_open, department, manager_id, status, requested_by, approved_by, created_at, updated_at')
      .single();

    if (groupError) {
      console.error('[createGroup] Supabase insert error:', groupError);
      throw new Error('Failed to create group');
    }

    // Add creator as member (except if admin created it)
    if (user.role !== 'admin') {
      const { error: memberError } = await supabaseAdmin
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: user_id,
          added_by: user_id,
        });

      if (memberError) {
        console.error('[createGroup] Error adding creator as member:', memberError);
        // Don't fail the group creation if member add fails, but log it
      }

      if (isDev) {
        console.log('[createGroup] Creator added as member to group:', newGroup.id);
      }
    }

    if (isDev) {
      console.log('[createGroup] Group created:', newGroup.id, 'status:', newGroup.status);
    }

    res.status(201).json({
      success: true,
      message: `Group "${name}" created successfully.${groupStatus === 'pending' ? ' Awaiting approval.' : ''}`,
      data: newGroup,
    });
  } catch (err) {
    console.error('[createGroup] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to create group.',
    });
  }
};


/// --- LIST ALL GROUPS (UPDATED WITH MEMBERSHIP STATUS) ---
export const listGroups = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const { department, status, is_open } = req.query;
  const isDev = process.env.NODE_ENV === 'development';

  try {
    // Fetch current user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, department')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Build base query
    let query = supabaseAdmin
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
        created_at,
        updated_at,
        profiles!teams_manager_id_fkey(id, username, full_name, email)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // ADMIN: Can see all groups
    if (user.role === 'admin') {
      // No filters - see everything
    }
    // MANAGER & USER: Can see:
    // 1. Approved groups in their department
    // 2. Groups with no department (cross-dept)
    // 3. Groups they created (regardless of status)
    else {
      query = query.or(
        `and(status.eq.approved,or(department.eq.${user.department},department.is.null)),` +
        `requested_by.eq.${user_id}`
      );
    }

    // Apply optional filters
    if (department) {
      query = query.eq('department', department);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (is_open !== undefined) {
      const isOpenBool = is_open === 'true' || is_open === true;
      query = query.eq('is_open', isOpenBool);
    }

    const { data: groups, error, count } = await query;

    if (isDev) {
      console.log(
        '[listGroups] user_id:',
        user_id,
        'role:',
        user.role,
        'department:',
        user.department,
        'count:',
        count
      );
    }

    if (error) {
      console.error('[listGroups] Supabase error:', error);
      throw new Error('Failed to fetch groups');
    }

    // Fetch user's membership status for ALL groups at once (more efficient)
    const groupIds = groups.map((g) => g.id);
    let userMemberships = {};

    if (groupIds.length > 0) {
      const { data: memberships, error: membershipError } = await supabaseAdmin
        .from('group_members')
        .select('group_id, joined_at, left_at')
        .eq('user_id', user_id)
        .in('group_id', groupIds);

      if (!membershipError && memberships) {
        // Build a map of group_id -> membership info
        memberships.forEach((m) => {
          userMemberships[m.group_id] = {
            joined_at: m.joined_at,
            left_at: m.left_at,
          };
        });
      }
    }

    // Transform response - flatten manager details and add membership_status
    const transformedGroups = groups.map((group) => {
      let membership_status = 'not_member';

      // Determine membership status
      if (userMemberships[group.id]) {
        const membership = userMemberships[group.id];
        if (membership.left_at) {
          membership_status = 'left';  // User left the group
        } else {
          membership_status = 'member';  // User is an active member
        }
      }

      return {
        id: group.id,
        name: group.name,
        is_open: group.is_open,
        department: group.department,
        manager: group.profiles
          ? {
              id: group.profiles.id,
              username: group.profiles.username,
              full_name: group.profiles.full_name,
              email: group.profiles.email,
            }
          : null,
        status: group.status,
        requested_by: group.requested_by,
        approved_by: group.approved_by,
        created_at: group.created_at,
        updated_at: group.updated_at,
        membership_status: membership_status,  // NEW FIELD
        can_join: membership_status === 'not_member' && group.is_open && group.status === 'approved',  // NEW FIELD
      };
    });

    res.status(200).json({
      success: true,
      data: transformedGroups,
      pagination: {
        page,
        limit,
        total: count,
        has_more: offset + limit < count,
      },
    });
  } catch (err) {
    console.error('[listGroups] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch groups.',
    });
  }
};


/// --- JOIN GROUP ---
export const joinGroup = async (req, res) => {
  const { groupId } = req.params;
  const user_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!groupId) {
    return res.status(400).json({
      success: false,
      message: 'Group ID is required.',
    });
  }

  try {
    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('teams')
      .select('id, name, is_open, status, department')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Validate group is approved
    if (group.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot join unapproved groups.',
      });
    }

    // Fetch user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, department')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if user is already a member (active or left)
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from('group_members')
      .select('id, left_at')
      .eq('group_id', groupId)
      .eq('user_id', user_id)
      .maybeSingle();

    if (membershipCheckError) {
      console.error('[joinGroup] Error checking membership:', membershipCheckError);
      throw new Error('Failed to check group membership');
    }

    // If user is already an active member
    if (existingMembership && !existingMembership.left_at) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group.',
      });
    }

    // If user left before, allow rejoining
    if (existingMembership && existingMembership.left_at) {
      const { error: rejoinError } = await supabaseAdmin
        .from('group_members')
        .update({
          left_at: null,
          joined_at: new Date().toISOString(),
        })
        .eq('id', existingMembership.id);

      if (rejoinError) {
        console.error('[joinGroup] Error rejoining group:', rejoinError);
        throw new Error('Failed to rejoin group');
      }

      if (isDev) {
        console.log('[joinGroup] User rejoined group:', groupId, 'user_id:', user_id);
      }

      return res.status(200).json({
        success: true,
        message: `You have rejoined the group "${group.name}".`,
        data: {
          group_id: groupId,
          group_name: group.name,
          action: 'rejoined',
        },
      });
    }

    // NEW MEMBER FLOW
    // Case 1: OPEN GROUP - directly add to group_members
    if (group.is_open) {
      // Validate department eligibility for open groups in specific department
      if (group.department && group.department !== user.department) {
        return res.status(403).json({
          success: false,
          message: `This group is limited to the ${group.department} department. You are in the ${user.department} department.`,
        });
      }

      const { data: newMember, error: addMemberError } = await supabaseAdmin
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user_id,
          added_by: user_id, // User added themselves
        })
        .select('id, joined_at')
        .single();

      if (addMemberError) {
        console.error('[joinGroup] Error adding member:', addMemberError);
        throw new Error('Failed to join group');
      }

      if (isDev) {
        console.log('[joinGroup] User joined open group:', groupId, 'user_id:', user_id);
      }

      return res.status(201).json({
        success: true,
        message: `You have successfully joined the group "${group.name}".`,
        data: {
          group_id: groupId,
          group_name: group.name,
          action: 'joined',
          joined_at: newMember.joined_at,
        },
      });
    }

    // Case 2: CLOSED GROUP - create join request
    if (!group.is_open) {
      // Check if there's already a pending request
      const { data: existingRequest, error: requestCheckError } = await supabaseAdmin
        .from('group_join_requests')
        .select('id, status')
        .eq('group_id', groupId)
        .eq('user_id', user_id)
        .maybeSingle();

      if (requestCheckError) {
        console.error('[joinGroup] Error checking join request:', requestCheckError);
        throw new Error('Failed to check join request status');
      }

      // If there's already a pending or approved request
      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return res.status(400).json({
            success: false,
            message: 'You have already requested to join this group. Please wait for approval.',
          });
        }
        if (existingRequest.status === 'approved') {
          // This shouldn't happen, but handle it just in case
          return res.status(400).json({
            success: false,
            message: 'Your join request was already approved. You should be a member.',
          });
        }
      }

      // Create new join request
      const { data: joinRequest, error: requestError } = await supabaseAdmin
        .from('group_join_requests')
        .insert({
          group_id: groupId,
          user_id: user_id,
          status: 'pending',
        })
        .select('id, requested_at')
        .single();

      if (requestError) {
        console.error('[joinGroup] Error creating join request:', requestError);
        throw new Error('Failed to request group membership');
      }

      if (isDev) {
        console.log('[joinGroup] User requested to join closed group:', groupId, 'user_id:', user_id);
      }

      return res.status(201).json({
        success: true,
        message: `Your request to join the closed group "${group.name}" has been sent. Please wait for approval from an admin or manager.`,
        data: {
          group_id: groupId,
          group_name: group.name,
          action: 'request_sent',
          request_id: joinRequest.id,
          requested_at: joinRequest.requested_at,
        },
      });
    }
  } catch (err) {
    console.error('[joinGroup] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to join group.',
    });
  }
};

/// --- GET GROUP DETAILS ---
export const getGroup = async (req, res) => {
  const { groupId } = req.params;
  const user_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!groupId) {
    return res.status(400).json({
      success: false,
      message: 'Group ID is required.',
    });
  }

  try {
    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
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
        created_at,
        updated_at,
        profiles!teams_manager_id_fkey(id, username, full_name, email),
        requested_by_profile:profiles!teams_requested_by_fkey(id, username, full_name, email)
      `
      )
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Fetch current user details (role)
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, department')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Fetch group members (only active members, not left)
    const { data: members, error: membersError } = await supabaseAdmin
      .from('group_members')
      .select(
        `
        id,
        user_id,
        added_by,
        joined_at,
        profiles:user_id(id, username, full_name, email, department, role),
        added_by_profile:profiles!group_members_added_by_fkey(id, username, full_name)
      `
      )
      .eq('group_id', groupId)
      .is('left_at', null)
      .order('joined_at', { ascending: false });

    if (membersError) {
      console.error('[getGroup] Error fetching members:', membersError);
      throw new Error('Failed to fetch group members');
    }

    // Fetch user's membership status
    const { data: userMembership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('id, joined_at, left_at')
      .eq('group_id', groupId)
      .eq('user_id', user_id)
      .maybeSingle();

    let membership_status = 'not_member';
    if (userMembership) {
      if (userMembership.left_at) {
        membership_status = 'left';
      } else {
        membership_status = 'member';
      }
    }

    // Check for pending join request (if user is not a member)
    let pending_request = null;
    if (membership_status === 'not_member' && !group.is_open) {
      const { data: joinRequest, error: requestError } = await supabaseAdmin
        .from('group_join_requests')
        .select('id, status, requested_at')
        .eq('group_id', groupId)
        .eq('user_id', user_id)
        .maybeSingle();

      if (!requestError && joinRequest) {
        pending_request = {
          id: joinRequest.id,
          status: joinRequest.status,
          requested_at: joinRequest.requested_at,
        };
      }
    }

    // Fetch pending join requests (only if user is admin/manager/creator)
    let pending_join_requests = [];
    const isCreator = group.requested_by === user_id;
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager';

    if (isCreator || isAdmin || isManager) {
      const { data: requests, error: requestsError } = await supabaseAdmin
        .from('group_join_requests')
        .select(
          `
          id,
          user_id,
          status,
          requested_at,
          reviewed_at,
          reviewed_by,
          review_notes,
          profiles:user_id(id, username, full_name, email, department),
          reviewed_by_profile:profiles!group_join_requests_reviewed_by_fkey(id, username, full_name)
        `
        )
        .eq('group_id', groupId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

      if (!requestsError && requests) {
        pending_join_requests = requests.map((req) => ({
          id: req.id,
          user: req.profiles,
          requested_at: req.requested_at,
        }));
      }
    }

    // Transform response
    const transformedGroup = {
      id: group.id,
      name: group.name,
      is_open: group.is_open,
      department: group.department,
      manager: group.profiles
        ? {
            id: group.profiles.id,
            username: group.profiles.username,
            full_name: group.profiles.full_name,
            email: group.profiles.email,
          }
        : null,
      creator: {
        id: group.requested_by,
        username: group.requested_by_profile?.username,
        full_name: group.requested_by_profile?.full_name,
        email: group.requested_by_profile?.email,
      },
      status: group.status,
      created_at: group.created_at,
      updated_at: group.updated_at,
      total_members: members?.length || 0,
      members: members.map((m) => ({
        id: m.user_id,
        username: m.profiles.username,
        full_name: m.profiles.full_name,
        email: m.profiles.email,
        department: m.profiles.department,
        role: m.profiles.role,
        joined_at: m.joined_at,
        added_by: m.added_by_profile
          ? {
              id: m.added_by,
              username: m.added_by_profile.username,
              full_name: m.added_by_profile.full_name,
            }
          : null,
      })),
      user_membership_status: membership_status,
      user_pending_request: pending_request,
      pending_join_requests: pending_join_requests, // Only if user is creator/admin/manager
      can_manage: isCreator || isAdmin || isManager, // Can approve/reject requests
      can_join: membership_status === 'not_member' && group.is_open && group.status === 'approved',
      can_leave: membership_status === 'member',
    };

    if (isDev) {
      console.log('[getGroup] groupId:', groupId, 'user_id:', user_id, 'membership_status:', membership_status);
    }

    res.status(200).json({
      success: true,
      data: transformedGroup,
    });
  } catch (err) {
    console.error('[getGroup] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch group details.',
    });
  }
};

/// --- LEAVE GROUP ---
export const leaveGroup = async (req, res) => {
  const { groupId } = req.params;
  const user_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!groupId) {
    return res.status(400).json({
      success: false,
      message: 'Group ID is required.',
    });
  }

  try {
    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('teams')
      .select('id, name')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Check if user is an active member
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('id, left_at')
      .eq('group_id', groupId)
      .eq('user_id', user_id)
      .maybeSingle();

    if (membershipError) {
      console.error('[leaveGroup] Error checking membership:', membershipError);
      throw new Error('Failed to check group membership');
    }

    // User is not a member
    if (!membership) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group.',
      });
    }

    // User already left
    if (membership.left_at) {
      return res.status(400).json({
        success: false,
        message: 'You have already left this group.',
      });
    }

    // Mark user as left (soft delete)
    const { error: leaveError } = await supabaseAdmin
      .from('group_members')
      .update({
        left_at: new Date().toISOString(),
      })
      .eq('id', membership.id);

    if (leaveError) {
      console.error('[leaveGroup] Error leaving group:', leaveError);
      throw new Error('Failed to leave group');
    }

    if (isDev) {
      console.log('[leaveGroup] User left group:', groupId, 'user_id:', user_id);
    }

    res.status(200).json({
      success: true,
      message: `You have left the group "${group.name}".`,
      data: {
        group_id: groupId,
        group_name: group.name,
        left_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[leaveGroup] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to leave group.',
    });
  }
};


/// --- UPDATE GROUP ---
export const updateGroup = async (req, res) => {
  const { groupId } = req.params;
  const { name, is_open, manager_id } = req.body;
  const user_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!groupId) {
    return res.status(400).json({
      success: false,
      message: 'Group ID is required.',
    });
  }

  // Validate at least one field is provided for update
  if (name === undefined && is_open === undefined && manager_id === undefined) {
    return res.status(400).json({
      success: false,
      message: 'At least one field (name, is_open, manager_id) is required for update.',
    });
  }

  // Validate field types
  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return res.status(400).json({
      success: false,
      message: 'Group name must be a non-empty string.',
    });
  }

  if (is_open !== undefined && typeof is_open !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'is_open must be a boolean (true/false).',
    });
  }

  try {
    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('teams')
      .select('id, name, requested_by, department, status')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Fetch current user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check permissions: only creator, admin, or manager can update
    const isCreator = group.requested_by === user_id;
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager';

    if (!isCreator && !isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this group.',
      });
    }

    // Build update object
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (is_open !== undefined) {
      updateData.is_open = is_open;
    }

    if (manager_id !== undefined) {
      // Only admin can change manager
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only admins can change the group manager.',
        });
      }

      // Validate manager exists
      if (manager_id !== null) {
        const { data: manager, error: managerError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', manager_id)
          .single();

        if (managerError || !manager) {
          return res.status(400).json({
            success: false,
            message: 'Specified manager not found.',
          });
        }
      }

      updateData.manager_id = manager_id;
    }

    // Update group
    const { data: updatedGroup, error: updateError } = await supabaseAdmin
      .from('teams')
      .update(updateData)
      .eq('id', groupId)
      .select('id, name, is_open, department, manager_id, status, requested_by, approved_by, created_at, updated_at')
      .single();

    if (updateError) {
      console.error('[updateGroup] Supabase update error:', updateError);
      throw new Error('Failed to update group');
    }

    if (isDev) {
      console.log('[updateGroup] Group updated:', groupId, 'by user:', user_id, 'changes:', updateData);
    }

    res.status(200).json({
      success: true,
      message: 'Group updated successfully.',
      data: updatedGroup,
    });
  } catch (err) {
    console.error('[updateGroup] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to update group.',
    });
  }
};


/// --- DELETE GROUP ---
export const deleteGroup = async (req, res) => {
  const { groupId } = req.params;
  const user_id = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!groupId) {
    return res.status(400).json({
      success: false,
      message: 'Group ID is required.',
    });
  }

  try {
    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('teams')
      .select('id, name, requested_by, status')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Fetch current user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check permissions: only creator or admin can delete
    const isCreator = group.requested_by === user_id;
    const isAdmin = user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this group. Only the creator or an admin can delete.',
      });
    }

    // Delete group (cascades to group_members and group_join_requests)
    const { error: deleteError } = await supabaseAdmin
      .from('teams')
      .delete()
      .eq('id', groupId);

    if (deleteError) {
      console.error('[deleteGroup] Supabase delete error:', deleteError);
      throw new Error('Failed to delete group');
    }

    if (isDev) {
      console.log('[deleteGroup] Group deleted:', groupId, 'by user:', user_id);
    }

    res.status(200).json({
      success: true,
      message: `Group "${group.name}" has been deleted.`,
      data: {
        group_id: groupId,
        group_name: group.name,
        deleted_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[deleteGroup] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to delete group.',
    });
  }
};


/// --- LIST GROUP MEMBERS ---
export const listGroupMembers = async (req, res) => {
  const { groupId } = req.params;
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const isDev = process.env.NODE_ENV === 'development';

  if (!groupId) {
    return res.status(400).json({
      success: false,
      message: 'Group ID is required.',
    });
  }

  try {
    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('teams')
      .select('id, name')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Fetch group members (only active members, not left)
    const { data: members, error: membersError, count } = await supabaseAdmin
      .from('group_members')
      .select(
        `
        id,
        user_id,
        added_by,
        joined_at,
        profiles:user_id(id, username, full_name, email, department, role),
        added_by_profile:profiles!group_members_added_by_fkey(id, username, full_name)
      `,
        { count: 'exact' }
      )
      .eq('group_id', groupId)
      .is('left_at', null)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (membersError) {
      console.error('[listGroupMembers] Error fetching members:', membersError);
      throw new Error('Failed to fetch group members');
    }

    if (isDev) {
      console.log('[listGroupMembers] groupId:', groupId, 'user_id:', user_id, 'total members:', count);
    }

    // Transform response
    const transformedMembers = members.map((m) => ({
      id: m.user_id,
      username: m.profiles.username,
      full_name: m.profiles.full_name,
      email: m.profiles.email,
      department: m.profiles.department,
      role: m.profiles.role,
      joined_at: m.joined_at,
      added_by: m.added_by_profile
        ? {
            id: m.added_by,
            username: m.added_by_profile.username,
            full_name: m.added_by_profile.full_name,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      data: {
        group_id: groupId,
        group_name: group.name,
        members: transformedMembers,
      },
      pagination: {
        page,
        limit,
        total: count,
        has_more: offset + limit < count,
      },
    });
  } catch (err) {
    console.error('[listGroupMembers] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch group members.',
    });
  }
};


/// --- ADD MEMBER TO GROUP ---
export const addMember = async (req, res) => {
  const { groupId } = req.params;
  const { user_id: userToAdd } = req.body;
  const currentUserId = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!groupId) {
    return res.status(400).json({
      success: false,
      message: 'Group ID is required.',
    });
  }

  if (!userToAdd) {
    return res.status(400).json({
      success: false,
      message: 'User ID to add is required.',
    });
  }

  try {
    // Fetch current user details (must be admin or manager)
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', currentUserId)
      .single();

    if (currentUserError || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found.',
      });
    }

    // Check permissions: only admin or manager can add members
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can add members to groups.',
      });
    }

    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('teams')
      .select('id, name, status')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Validate group is approved
    if (group.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add members to unapproved groups.',
      });
    }

    // Fetch user to add
    const { data: userToAddProfile, error: userToAddError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email')
      .eq('id', userToAdd)
      .single();

    if (userToAddError || !userToAddProfile) {
      return res.status(404).json({
        success: false,
        message: 'User to add not found.',
      });
    }

    // Check if user is already a member (active or left)
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from('group_members')
      .select('id, left_at')
      .eq('group_id', groupId)
      .eq('user_id', userToAdd)
      .maybeSingle();

    if (membershipCheckError) {
      console.error('[addMember] Error checking membership:', membershipCheckError);
      throw new Error('Failed to check group membership');
    }

    // If user is already an active member
    if (existingMembership && !existingMembership.left_at) {
      return res.status(400).json({
        success: false,
        message: `${userToAddProfile.full_name} is already a member of this group.`,
      });
    }

    // If user left before, reactivate them
    if (existingMembership && existingMembership.left_at) {
      const { error: rejoinError } = await supabaseAdmin
        .from('group_members')
        .update({
          left_at: null,
          joined_at: new Date().toISOString(),
        })
        .eq('id', existingMembership.id);

      if (rejoinError) {
        console.error('[addMember] Error reactivating member:', rejoinError);
        throw new Error('Failed to add member to group');
      }

      if (isDev) {
        console.log('[addMember] Member reactivated:', groupId, 'user_id:', userToAdd, 'by:', currentUserId);
      }

      return res.status(200).json({
        success: true,
        message: `${userToAddProfile.full_name} has been added back to the group.`,
        data: {
          group_id: groupId,
          group_name: group.name,
          user: {
            id: userToAddProfile.id,
            username: userToAddProfile.username,
            full_name: userToAddProfile.full_name,
            email: userToAddProfile.email,
          },
          action: 'reactivated',
        },
      });
    }

    // Add new member
    const { data: newMember, error: addMemberError } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userToAdd,
        added_by: currentUserId,
      })
      .select('id, joined_at')
      .single();

    if (addMemberError) {
      console.error('[addMember] Error adding member:', addMemberError);
      throw new Error('Failed to add member to group');
    }

    if (isDev) {
      console.log('[addMember] Member added to group:', groupId, 'user_id:', userToAdd, 'by:', currentUserId);
    }

    res.status(201).json({
      success: true,
      message: `${userToAddProfile.full_name} has been added to the group.`,
      data: {
        group_id: groupId,
        group_name: group.name,
        user: {
          id: userToAddProfile.id,
          username: userToAddProfile.username,
          full_name: userToAddProfile.full_name,
          email: userToAddProfile.email,
        },
        joined_at: newMember.joined_at,
        action: 'added',
      },
    });
  } catch (err) {
    console.error('[addMember] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to add member to group.',
    });
  }
};


/// --- REMOVE MEMBER FROM GROUP ---
export const removeMember = async (req, res) => {
  const { groupId, userId } = req.params;
  const currentUserId = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!groupId) {
    return res.status(400).json({
      success: false,
      message: 'Group ID is required.',
    });
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required.',
    });
  }

  // Prevent self-removal
  if (userId === currentUserId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot remove yourself from the group. Use the leave endpoint instead.',
    });
  }

  try {
    // Fetch current user details (must be admin or manager)
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', currentUserId)
      .single();

    if (currentUserError || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found.',
      });
    }

    // Check permissions: only admin or manager can remove members
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can remove members from groups.',
      });
    }

    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('teams')
      .select('id, name')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Fetch user to remove
    const { data: userToRemove, error: userToRemoveError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email')
      .eq('id', userId)
      .single();

    if (userToRemoveError || !userToRemove) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if user is a member
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('id, left_at')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError) {
      console.error('[removeMember] Error checking membership:', membershipError);
      throw new Error('Failed to check group membership');
    }

    // User is not a member
    if (!membership) {
      return res.status(400).json({
        success: false,
        message: `${userToRemove.full_name} is not a member of this group.`,
      });
    }

    // User already left
    if (membership.left_at) {
      return res.status(400).json({
        success: false,
        message: `${userToRemove.full_name} has already left this group.`,
      });
    }

    // Remove member (soft delete)
    const { error: removeError } = await supabaseAdmin
      .from('group_members')
      .update({
        left_at: new Date().toISOString(),
      })
      .eq('id', membership.id);

    if (removeError) {
      console.error('[removeMember] Error removing member:', removeError);
      throw new Error('Failed to remove member from group');
    }

    if (isDev) {
      console.log('[removeMember] Member removed from group:', groupId, 'user_id:', userId, 'by:', currentUserId);
    }

    res.status(200).json({
      success: true,
      message: `${userToRemove.full_name} has been removed from the group.`,
      data: {
        group_id: groupId,
        group_name: group.name,
        user: {
          id: userToRemove.id,
          username: userToRemove.username,
          full_name: userToRemove.full_name,
          email: userToRemove.email,
        },
        removed_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[removeMember] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to remove member from group.',
    });
  }
};



/// --- LIST JOIN REQUESTS ---
export const listJoinRequests = async (req, res) => {
  const { groupId } = req.params;
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const { status } = req.query;
  const isDev = process.env.NODE_ENV === 'development';

  if (!groupId) {
    return res.status(400).json({
      success: false,
      message: 'Group ID is required.',
    });
  }

  try {
    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('teams')
      .select('id, name, requested_by')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Fetch current user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check permissions: only creator, admin, or manager can view requests
    const isCreator = group.requested_by === user_id;
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager';

    if (!isCreator && !isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view join requests for this group.',
      });
    }

    // Build query
    let query = supabaseAdmin
      .from('group_join_requests')
      .select(
        `
        id,
        user_id,
        status,
        requested_at,
        reviewed_at,
        reviewed_by,
        review_notes,
        profiles:user_id(id, username, full_name, email, department),
        reviewed_by_profile:profiles!group_join_requests_reviewed_by_fkey(id, username, full_name)
      `,
        { count: 'exact' }
      )
      .eq('group_id', groupId)
      .order('requested_at', { ascending: true })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status) {
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, approved, rejected.',
        });
      }
      query = query.eq('status', status);
    }

    const { data: requests, error, count } = await query;

    if (error) {
      console.error('[listJoinRequests] Error fetching requests:', error);
      throw new Error('Failed to fetch join requests');
    }

    if (isDev) {
      console.log('[listJoinRequests] groupId:', groupId, 'user_id:', user_id, 'total requests:', count);
    }

    // Transform response
    const transformedRequests = requests.map((req) => ({
      id: req.id,
      user: {
        id: req.user_id,
        username: req.profiles.username,
        full_name: req.profiles.full_name,
        email: req.profiles.email,
        department: req.profiles.department,
      },
      status: req.status,
      requested_at: req.requested_at,
      reviewed_at: req.reviewed_at,
      reviewed_by: req.reviewed_by_profile
        ? {
            id: req.reviewed_by,
            username: req.reviewed_by_profile.username,
            full_name: req.reviewed_by_profile.full_name,
          }
        : null,
      review_notes: req.review_notes,
    }));

    res.status(200).json({
      success: true,
      data: {
        group_id: groupId,
        group_name: group.name,
        requests: transformedRequests,
      },
      pagination: {
        page,
        limit,
        total: count,
        has_more: offset + limit < count,
      },
    });
  } catch (err) {
    console.error('[listJoinRequests] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch join requests.',
    });
  }
};

/// --- APPROVE JOIN REQUEST ---
export const approveJoinRequest = async (req, res) => {
  const { groupId, requestId } = req.params;
  const { review_notes } = req.body;
  const currentUserId = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!groupId || !requestId) {
    return res.status(400).json({
      success: false,
      message: 'Group ID and Request ID are required.',
    });
  }

  try {
    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('teams')
      .select('id, name, requested_by')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Fetch current user details
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', currentUserId)
      .single();

    if (currentUserError || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found.',
      });
    }

    // Check permissions
    const isCreator = group.requested_by === currentUserId;
    const isAdmin = currentUser.role === 'admin';
    const isManager = currentUser.role === 'manager';

    if (!isCreator && !isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to approve join requests for this group.',
      });
    }

    // Fetch join request
    const { data: joinRequest, error: requestError } = await supabaseAdmin
      .from('group_join_requests')
      .select('id, group_id, user_id, status')
      .eq('id', requestId)
      .eq('group_id', groupId)
      .single();

    if (requestError || !joinRequest) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found.',
      });
    }

    // Check if request is pending
    if (joinRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a ${joinRequest.status} request.`,
      });
    }

    // Fetch user details
    const { data: userToAdd, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email')
      .eq('id', joinRequest.user_id)
      .single();

    if (userError || !userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if user is already a member
    const { data: existingMembership, error: membershipCheckError } = await supabaseAdmin
      .from('group_members')
      .select('id, left_at')
      .eq('group_id', groupId)
      .eq('user_id', joinRequest.user_id)
      .maybeSingle();

    if (membershipCheckError) {
      console.error('[approveJoinRequest] Error checking membership:', membershipCheckError);
      throw new Error('Failed to check group membership');
    }

    // If user is already an active member, just update the request status
    if (existingMembership && !existingMembership.left_at) {
      const { error: updateRequestError } = await supabaseAdmin
        .from('group_join_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUserId,
          review_notes: review_notes || null,
        })
        .eq('id', requestId);

      if (updateRequestError) {
        console.error('[approveJoinRequest] Error updating request:', updateRequestError);
        throw new Error('Failed to approve request');
      }

      return res.status(200).json({
        success: true,
        message: `${userToAdd.full_name} is already a member. Request marked as approved.`,
        data: {
          group_id: groupId,
          group_name: group.name,
          user: {
            id: userToAdd.id,
            username: userToAdd.username,
            full_name: userToAdd.full_name,
            email: userToAdd.email,
          },
          action: 'already_member',
        },
      });
    }

    // If user left before, reactivate them
    if (existingMembership && existingMembership.left_at) {
      const { error: rejoinError } = await supabaseAdmin
        .from('group_members')
        .update({
          left_at: null,
          joined_at: new Date().toISOString(),
        })
        .eq('id', existingMembership.id);

      if (rejoinError) {
        console.error('[approveJoinRequest] Error reactivating member:', rejoinError);
        throw new Error('Failed to add member to group');
      }
    } else {
      // Add new member
      const { error: addMemberError } = await supabaseAdmin
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: joinRequest.user_id,
          added_by: currentUserId,
        });

      if (addMemberError) {
        console.error('[approveJoinRequest] Error adding member:', addMemberError);
        throw new Error('Failed to add member to group');
      }
    }

    // Update join request status
    const { error: updateRequestError } = await supabaseAdmin
      .from('group_join_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentUserId,
        review_notes: review_notes || null,
      })
      .eq('id', requestId);

    if (updateRequestError) {
      console.error('[approveJoinRequest] Error updating request:', updateRequestError);
      throw new Error('Failed to approve request');
    }

    if (isDev) {
      console.log('[approveJoinRequest] Request approved:', requestId, 'user_id:', joinRequest.user_id, 'by:', currentUserId);
    }

    res.status(200).json({
      success: true,
      message: `${userToAdd.full_name}'s request to join has been approved.`,
      data: {
        group_id: groupId,
        group_name: group.name,
        user: {
          id: userToAdd.id,
          username: userToAdd.username,
          full_name: userToAdd.full_name,
          email: userToAdd.email,
        },
        action: 'approved',
      },
    });
  } catch (err) {
    console.error('[approveJoinRequest] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to approve join request.',
    });
  }
};


/// --- REJECT JOIN REQUEST ---
export const rejectJoinRequest = async (req, res) => {
  const { groupId, requestId } = req.params;
  const { review_notes } = req.body;
  const currentUserId = req.user.id;
  const isDev = process.env.NODE_ENV === 'development';

  if (!groupId || !requestId) {
    return res.status(400).json({
      success: false,
      message: 'Group ID and Request ID are required.',
    });
  }

  try {
    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('teams')
      .select('id, name, requested_by')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Fetch current user details
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', currentUserId)
      .single();

    if (currentUserError || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found.',
      });
    }

    // Check permissions
    const isCreator = group.requested_by === currentUserId;
    const isAdmin = currentUser.role === 'admin';
    const isManager = currentUser.role === 'manager';

    if (!isCreator && !isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reject join requests for this group.',
      });
    }

    // Fetch join request
    const { data: joinRequest, error: requestError } = await supabaseAdmin
      .from('group_join_requests')
      .select('id, group_id, user_id, status')
      .eq('id', requestId)
      .eq('group_id', groupId)
      .single();

    if (requestError || !joinRequest) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found.',
      });
    }

    // Check if request is pending
    if (joinRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a ${joinRequest.status} request.`,
      });
    }

    // Fetch user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email')
      .eq('id', joinRequest.user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Update join request status to rejected
    const { error: updateRequestError } = await supabaseAdmin
      .from('group_join_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentUserId,
        review_notes: review_notes || null,
      })
      .eq('id', requestId);

    if (updateRequestError) {
      console.error('[rejectJoinRequest] Error rejecting request:', updateRequestError);
      throw new Error('Failed to reject request');
    }

    if (isDev) {
      console.log('[rejectJoinRequest] Request rejected:', requestId, 'user_id:', joinRequest.user_id, 'by:', currentUserId);
    }

    res.status(200).json({
      success: true,
      message: `${user.full_name}'s request to join has been rejected.`,
      data: {
        group_id: groupId,
        group_name: group.name,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
        },
        action: 'rejected',
      },
    });
  } catch (err) {
    console.error('[rejectJoinRequest] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to reject join request.',
    });
  }
};