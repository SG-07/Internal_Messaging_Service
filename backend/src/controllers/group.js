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