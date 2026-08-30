// backend/src/controllers/group.js
import supabaseAdmin from '../config/supabaseClient.js';
import { attachUserToTeam } from '../utils/teamMembership.js';

const isDev = process.env.NODE_ENV === 'development';

// --- CREATE GROUP (Updated - Auto-approve for admins) ---
export const createGroup = async (req, res) => {
  const { name, is_open, department, managerId } = req.body;
  const creator_id = req.user.id;
 
  // Validation
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Group name is required.',
    });
  }
 
  if (typeof is_open !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'is_open must be true or false.',
    });
  }
 
  const isClosed = is_open === false;
 
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
 
    const isAdmin = creator.role === 'admin';
 
    // Department:
    // - Non-admins: never taken from the body — always their own profile
    //   department. If their profile has none set, they can't create a
    //   group at all (matches the requestTeam/createTeam rule).
    // - Admins: keep their existing flexibility — an explicit department
    //   from the body, or none at all (department-less group).
    let resolvedDepartment;
 
    if (isAdmin) {
      resolvedDepartment = department || null;
    } else {
      if (!creator.department) {
        return res.status(400).json({
          success: false,
          message: 'Your profile does not have a department assigned. Ask an admin to set your department before creating a group.',
        });
      }
 
      resolvedDepartment = creator.department;
    }
 
    // Manager assignment (admin-created groups only):
    // - Closed group (is_open: false): a manager/user MUST be assigned —
    //   someone has to be able to manage join requests for a group that
    //   isn't freely joinable.
    // - Open group: managerId is optional, defaults to null.
    // - Non-admins: unaffected — they're always their own group's
    //   manager_id, same as before; managerId in the body is ignored for
    //   them.
    let resolvedManagerId = isAdmin ? null : creator_id;
 
    if (isAdmin) {
      if (isClosed && !managerId) {
        return res.status(400).json({
          success: false,
          message: 'Closed groups require a manager or user to be assigned.',
        });
      }
 
      if (managerId) {
        const { data: assigneeProfile, error: assigneeLookupError } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('email', managerId)
          .single();
 
        if (assigneeLookupError || !assigneeProfile) {
          return res.status(404).json({
            success: false,
            message: 'No user found with that email to assign to the group.',
          });
        }
 
        resolvedManagerId = assigneeProfile.id;
      }
    }
 
    // Determine group status
    // Admins: auto-approve (status: approved, approved_by: creator_id)
    // Non-admins: pending approval (status: pending, approved_by: null)
    const status = isAdmin ? 'approved' : 'pending';
    const approvedBy = isAdmin ? creator_id : null;
 
    // Create the group
    const { data: newGroup, error: groupError } = await supabaseAdmin
      .from('teams')
      .insert({
        name: name.trim(),
        is_open: is_open,
        status: status,
        department: resolvedDepartment,
        manager_id: resolvedManagerId,
        requested_by: creator_id,  // Always set to creator
        approved_by: approvedBy,   // Set to creator if admin, null if non-admin
        type: 'group',             // Specify this is a group
      })
      .select('id, name, is_open, status, department, manager_id, requested_by, approved_by, created_at, updated_at, type')
      .single();
 
    if (groupError) {
      console.error('[createGroup] Error creating group:', groupError);
      throw new Error('Failed to create group');
    }
 
    const group_id = newGroup.id;
 
    if (isDev) {
      console.log('[createGroup] Group created:', group_id, 'by:', creator_id, 'status:', status, 'isAdmin:', isAdmin, 'department:', resolvedDepartment, 'manager_id:', resolvedManagerId);
    }
 
    // ===== ATTACH CREATOR: group_members row, the group's conversation
    // (created via teams.conversation_id — the same direct-reference
    // pattern every other entity type uses now — with the "Team Created"
    // first message), and conversation_participants. attachUserToTeam
    // dispatches to group_members automatically since this row's
    // type is 'group'. =====
    const { error: attachError } = await attachUserToTeam(group_id, creator_id, creator_id);
 
    // A failure to create the conversation itself is fatal — roll back
    // the group rather than leave one with no conversation behind (same
    // strictness this endpoint always had for that specific step).
    if (attachError?.conversation) {
      console.error('[createGroup] Error setting up group conversation:', attachError.conversation);
      await supabaseAdmin.from('teams').delete().eq('id', group_id);
      throw new Error('Failed to create group conversation');
    }
 
    // group_members / conversation_participants failures are non-fatal —
    // the group and its conversation still exist either way (same
    // tolerance this endpoint always had for those two steps).
    if (attachError?.member && isDev) {
      console.log('[createGroup] Error adding creator as group member:', attachError.member);
    }
 
    if (attachError?.participant && isDev) {
      console.log('[createGroup] Error adding creator to conversation:', attachError.participant);
    }
 
    // If an admin assigned a separate manager/user, attach them too —
    // both the admin and the assignee end up as members/participants.
    if (isAdmin && resolvedManagerId && resolvedManagerId !== creator_id) {
      const { error: assigneeAttachError } = await attachUserToTeam(group_id, resolvedManagerId, creator_id);
 
      if (assigneeAttachError && isDev) {
        console.log('[createGroup] Failed to fully attach assigned manager to group:', assigneeAttachError);
      }
    }
 
    // Look up the conversation id to include in the response.
    const { data: groupWithConversation } = await supabaseAdmin
      .from('teams')
      .select('conversation_id')
      .eq('id', group_id)
      .single();
 
    const conversation_id = groupWithConversation?.conversation_id || null;
 
    if (isDev) {
      console.log('[createGroup] Conversation set up:', conversation_id, 'with initial message and creator as participant');
    }
 
    res.status(201).json({
      success: true,
      message: 'Group created successfully.',
      data: {
        id: newGroup.id,
        name: newGroup.name,
        is_open: newGroup.is_open,
        status: newGroup.status,
        department: newGroup.department,
        manager_id: newGroup.manager_id,
        requested_by: newGroup.requested_by,
        approved_by: newGroup.approved_by,
        created_by: creator_id,
        created_at: newGroup.created_at,
        updated_at: newGroup.updated_at,
        type: newGroup.type,
        conversation_id: conversation_id,
        auto_approved: isAdmin,  // Indicate if auto-approved by admin
      },
    });
  } catch (err) {
    console.error('[createGroup] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to create group.',
    });
  }
};
 


/// --- LIST ALL GROUPS (Updated - filter by type) ---
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
        type,
        created_at,
        updated_at,
        profiles!teams_manager_id_fkey(id, username, full_name, email)
      `,
        { count: 'exact' }
      )
      .eq('type', 'group')  // IMPORTANT: Only fetch groups, not teams
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

    // Transform response - flatten manager details
    const transformedGroups = groups.map((group) => ({
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
      type: group.type,
      created_at: group.created_at,
      updated_at: group.updated_at,
    }));

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


/// --- JOIN GROUP (Fixed - proper error handling) ---
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
      .eq('type', 'group')  // Only join groups, not teams
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

    // Validate department rules
    if (group.department && user.department !== group.department) {
      return res.status(403).json({
        success: false,
        message: 'You can only join groups in your own department.',
      });
    }

    // Check if user is already a member
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('id, left_at')
      .eq('group_id', groupId)
      .eq('user_id', user_id)
      .single();

    // PGRST116 = no rows returned (user not a member - this is expected)
    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('[joinGroup] Error checking membership:', membershipError);
      throw new Error('Failed to check group membership');
    }

    let action = 'joined';

    // If user already is an active member, return error
    if (membership && !membership.left_at) {
      return res.status(403).json({
        success: false,
        message: 'You are already a member of this group.',
      });
    }

    // If user previously left, reactivate membership
    if (membership && membership.left_at) {
      const { error: updateError } = await supabaseAdmin
        .from('group_members')
        .update({ left_at: null })
        .eq('id', membership.id);

      if (updateError) {
        console.error('[joinGroup] Error reactivating membership:', updateError);
        throw new Error('Failed to rejoin group');
      }

      action = 'rejoined';

      if (isDev) {
        console.log('[joinGroup] User rejoined group:', groupId, 'user:', user_id);
      }
    } else {
      // New membership - insert into group_members
      const { error: insertError } = await supabaseAdmin
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user_id,
          added_by: user_id,  // User added themselves
        });

      if (insertError) {
        console.error('[joinGroup] Error adding member:', insertError);
        throw new Error('Failed to join group');
      }

      if (isDev) {
        console.log('[joinGroup] User joined group:', groupId, 'user:', user_id);
      }
    }

    // Add user to conversation participants (if group conversation exists)
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('group_id', groupId)
      .eq('is_group', true)
      .single();

    if (!convError && conversation) {
      // Check if already a participant
      const { data: existingParticipant } = await supabaseAdmin
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversation.id)
        .eq('user_id', user_id)
        .single();

      // Only add if not already a participant
      if (!existingParticipant) {
        const { error: participantError } = await supabaseAdmin
          .from('conversation_participants')
          .insert({
            conversation_id: conversation.id,
            user_id: user_id,
          });

        if (participantError) {
          console.error('[joinGroup] Error adding conversation participant:', participantError);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully ${action} the group.`,
      data: {
        group_id: groupId,
        user_id: user_id,
        action: action,  // 'joined' or 'rejoined'
        group_name: group.name,
      },
    });
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

/// --- LIST POTENTIAL MEMBERS ---
export const listPotentialMembers = async (req, res) => {
  const { groupId } = req.params;
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const { email } = req.query;
  const isDev = process.env.NODE_ENV === 'development';

  // Validate groupId
  if (!groupId || groupId.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Group ID is required.',
    });
  }

  try {
    // Fetch group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('teams')
      .select('id, name, department, requested_by, status')
      .eq('id', groupId)
      .single();

    if (groupError) {
      if (groupError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Group not found.',
        });
      }
      console.error('[listPotentialMembers] Supabase group error:', groupError);
      throw new Error('Failed to fetch group');
    }

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Validate group is approved
    if (group.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot view members for unapproved groups.',
      });
    }

    // Fetch current user details
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user_id)
      .single();

    if (currentUserError) {
      console.error('[listPotentialMembers] Supabase user error:', currentUserError);
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check permissions: only creator, admin, or manager can view
    const isCreator = group.requested_by === user_id;
    const isAdmin = currentUser.role === 'admin';
    const isManager = currentUser.role === 'manager';

    if (!isCreator && !isAdmin && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view potential members for this group.',
      });
    }

    if (isDev) {
      console.log(
        '[listPotentialMembers] groupId:',
        groupId,
        'user_id:',
        user_id,
        'isCreator:',
        isCreator,
        'isAdmin:',
        isAdmin,
        'isManager:',
        isManager
      );
    }

    // Build base query for potential members
    let query = supabaseAdmin
      .from('profiles')
      .select('id, email, username, full_name, department, is_active', { count: 'exact' })
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    // Department filtering
    if (group.department) {
      // Group is department-specific: only show users from that department
      query = query.eq('department', group.department);
      if (isDev) {
        console.log('[listPotentialMembers] Filtering by department:', group.department);
      }
    } else {
      // Group is cross-department: show all active users
      if (isDev) {
        console.log('[listPotentialMembers] Cross-department group - showing all users');
      }
    }

    // Email search filter (if provided)
    if (email && email.trim() !== '') {
      const searchEmail = email.trim().toLowerCase();
      query = query.ilike('email', `%${searchEmail}%`);
      if (isDev) {
        console.log('[listPotentialMembers] Email search filter:', searchEmail);
      }
    }

    // Execute query
    const { data: potentialUsers, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('[listPotentialMembers] Error fetching users:', error);
      throw new Error('Failed to fetch potential members');
    }

    if (!potentialUsers) {
      return res.status(200).json({
        success: true,
        data: {
          group_id: groupId,
          group_name: group.name,
          group_department: group.department,
          addable_users: [],
        },
        pagination: {
          page,
          limit,
          total: 0,
          has_more: false,
        },
      });
    }

    if (isDev) {
      console.log('[listPotentialMembers] Found users:', potentialUsers.length, 'total count:', count);
    }

    // Fetch users already in group (active members only)
    const { data: existingMembers, error: membersError } = await supabaseAdmin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .is('left_at', null);

    if (membersError) {
      console.error('[listPotentialMembers] Error fetching members:', membersError);
      throw new Error('Failed to fetch group members');
    }

    const existingMemberIds = new Set(existingMembers?.map(m => m.user_id) || []);

    if (isDev) {
      console.log('[listPotentialMembers] Existing members:', existingMemberIds.size);
    }

    // Transform and filter response
    const addableUsers = potentialUsers
      .filter(user => !existingMemberIds.has(user.id))
      .map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        department: user.department,
      }));

    if (isDev) {
      console.log('[listPotentialMembers] Addable users after filtering:', addableUsers.length);
    }

    res.status(200).json({
      success: true,
      data: {
        group_id: groupId,
        group_name: group.name,
        group_department: group.department,
        addable_users: addableUsers,
      },
      pagination: {
        page,
        limit,
        total: addableUsers.length,
        has_more: offset + limit < count,
      },
    });
  } catch (err) {
    console.error('[listPotentialMembers] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch potential members.',
    });
  }
};


/// --- LIST USER'S JOINED GROUPS ---
export const listUserGroups = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const { status, sort_by } = req.query;
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

    if (isDev) {
      console.log('[listUserGroups] user_id:', user_id, 'role:', user.role, 'department:', user.department);
    }

    // Build query to get groups where user is a member (not left)
    let query = supabaseAdmin
      .from('group_members')
      .select(
        `
        group_id,
        joined_at,
        teams!group_id(
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
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user_id)
      .is('left_at', null) // Only active members (not left)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: groupMemberships, error, count } = await query;

    if (error) {
      console.error('[listUserGroups] Error fetching groups:', error);
      throw new Error('Failed to fetch user groups');
    }

    if (!groupMemberships) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          has_more: false,
        },
      });
    }

    if (isDev) {
      console.log('[listUserGroups] Found groups:', groupMemberships.length, 'total count:', count);
    }

    // Transform response
    let transformedGroups = groupMemberships.map(membership => ({
      id: membership.teams.id,
      name: membership.teams.name,
      is_open: membership.teams.is_open,
      department: membership.teams.department,
      manager: membership.teams.profiles
        ? {
            id: membership.teams.profiles.id,
            username: membership.teams.profiles.username,
            full_name: membership.teams.profiles.full_name,
            email: membership.teams.profiles.email,
          }
        : null,
      status: membership.teams.status,
      created_by: membership.teams.requested_by,
      user_joined_at: membership.joined_at,
      group_created_at: membership.teams.created_at,
      updated_at: membership.teams.updated_at,
    }));

    // Apply status filter if provided
    if (status) {
      const validStatuses = ['open', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: open, closed.',
        });
      }
      const isOpenFilter = status === 'open';
      transformedGroups = transformedGroups.filter(g => g.is_open === isOpenFilter);
      if (isDev) {
        console.log('[listUserGroups] Filtered by status:', status, 'remaining:', transformedGroups.length);
      }
    }

    // Apply sort
    if (sort_by === 'oldest') {
      transformedGroups.sort((a, b) => new Date(a.user_joined_at) - new Date(b.user_joined_at));
    } else {
      // Default: newest first (already sorted by query)
      transformedGroups.sort((a, b) => new Date(b.user_joined_at) - new Date(a.user_joined_at));
    }

    res.status(200).json({
      success: true,
      data: transformedGroups,
      pagination: {
        page,
        limit,
        total: transformedGroups.length,
        has_more: offset + limit < count,
      },
    });
  } catch (err) {
    console.error('[listUserGroups] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch user groups.',
    });
  }
};

// --- CREATE GROUP CONVERSATION  ---
export const createGroupConversation = async (req, res) => {
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
        message: 'Cannot create conversations in unapproved groups.',
      });
    }

    // Check if user is an active member of the group
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user_id)
      .is('left_at', null)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({
        success: false,
        message: 'You must be an active member of the group to create conversations.',
      });
    }

    // Fetch all active group members (user_id only first)
    const { data: groupMemberIds, error: membersError } = await supabaseAdmin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .is('left_at', null);

    if (membersError || !groupMemberIds || groupMemberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Group has no active members.',
      });
    }

    if (isDev) {
      console.log('[createGroupConversation] Found member IDs:', groupMemberIds.map(m => m.user_id));
    }

    // Fetch profiles for each member
    const userIds = groupMemberIds.map(m => m.user_id);
    const { data: memberProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email')
      .in('id', userIds);

    if (profilesError || !memberProfiles || memberProfiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch member profiles.',
      });
    }

    if (isDev) {
      console.log('[createGroupConversation] groupId:', groupId, 'creator:', user_id, 'members:', memberProfiles.length);
    }

    // Create group conversation (NO subject needed)
    const { data: newConversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .insert({
        subject: null, // No subject for group conversations
        conversation_type: 'group',
        category: 'discussion', // Default category for group conversations
        created_by: user_id,
        is_group: true,
        group_id: groupId,
      })
      .select('id, subject, conversation_type, category, created_by, created_at, updated_at, is_group, group_id')
      .single();

    if (conversationError) {
      console.error('[createGroupConversation] Error creating conversation:', conversationError);
      throw new Error('Failed to create group conversation');
    }

    const conversation_id = newConversation.id;

    // Auto-add all active group members as participants
    const participantsToAdd = memberProfiles.map(profile => ({
      conversation_id,
      user_id: profile.id,
    }));

    const { error: participantError } = await supabaseAdmin
      .from('conversation_participants')
      .insert(participantsToAdd);

    if (participantError) {
      console.error('[createGroupConversation] Error adding participants:', participantError);
      // Delete the conversation if adding participants fails
      await supabaseAdmin.from('conversations').delete().eq('id', conversation_id);
      throw new Error('Failed to add participants to conversation');
    }

    if (isDev) {
      console.log('[createGroupConversation] Conversation created:', conversation_id, 'participants added:', participantsToAdd.length);
    }

    // Fetch creator profile
    const { data: creatorProfile, error: creatorError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email')
      .eq('id', user_id)
      .single();

    if (creatorError) {
      console.error('[createGroupConversation] Error fetching creator profile:', creatorError);
    }

    // Format participants for response
    const formattedParticipants = memberProfiles.map(profile => ({
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      email: profile.email,
    }));

    res.status(201).json({
      success: true,
      message: `Group conversation created successfully.`,
      data: {
        id: newConversation.id,
        conversation_type: newConversation.conversation_type,
        category: newConversation.category,
        created_by: newConversation.created_by,
        created_by_name: creatorProfile?.full_name || creatorProfile?.username || null,
        is_group: newConversation.is_group,
        group_id: newConversation.group_id,
        group_name: group.name,
        total_participants: formattedParticipants.length,
        participants: formattedParticipants,
        created_at: newConversation.created_at,
        updated_at: newConversation.updated_at,
      },
    });
  } catch (err) {
    console.error('[createGroupConversation] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to create group conversation.',
    });
  }
};

/// --- GET GROUP CONVERSATION (Simplified) ---
export const getGroupConversation = async (req, res) => {
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
      .select('id, name, status')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
      });
    }

    // Check if user is an active member of the group
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user_id)
      .is('left_at', null)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({
        success: false,
        message: 'You must be an active member of the group.',
      });
    }

    // Fetch the group conversation (always exists, created when group was created)
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, subject, conversation_type, category, created_by, created_at, updated_at, is_group, group_id')
      .eq('group_id', groupId)
      .eq('is_group', true)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found.',
      });
    }

    if (isDev) {
      console.log('[getGroupConversation] Fetching conversation for group:', groupId, 'user:', user_id);
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
      console.error('[getGroupConversation] Error fetching messages:', messagesError);
    }

    // Fetch all participants
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('conversation_participants')
      .select(`user_id, profiles:user_id(id, username, full_name, email, department, role)`)
      .eq('conversation_id', conversation.id);

    if (participantsError) {
      console.error('[getGroupConversation] Error fetching participants:', participantsError);
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
      console.log('[getGroupConversation] Conversation found:', conversation.id, 'messages:', formattedMessages.length);
    }

    res.status(200).json({
      success: true,
      message: 'Group conversation retrieved.',
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
        group_name: group.name,
        messages: formattedMessages,
        participants: formattedParticipants,
        total_messages: formattedMessages.length,
        total_participants: formattedParticipants.length,
      },
    });
  } catch (err) {
    console.error('[getGroupConversation] error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch group conversation.',
    });
  }
};
