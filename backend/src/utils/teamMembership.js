// backend/src/utils/teamMembership.js
//
// Single source of truth for "attach a user to a team": team_members row,
// the team's conversation (creating it if needed), and
// conversation_participants. Used by teams.js (createTeam, addTeamMember),
// admin.js (createTeam, reviewTeamRequest, addUserToTeam), and manager.js
// (managerAddTeamMember) so all four stay in sync instead of each
// re-implementing this.
import supabaseAdmin from '../config/supabaseClient.js';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Ensure a team has a conversation, using teams.conversation_id as the
 * direct reference. Creates the conversation (with a literal "Team
 * Created" first message) and links it back on the team if one doesn't
 * exist yet. Idempotent — safe to call every time a team is touched.
 *
 * - conversation_type mirrors the team's own `type` column ('group' or
 *   'team') — conversations.conversation_type allows 'direct', 'group',
 *   and 'team'.
 * - is_group is always true for team/group conversations (multi-party),
 *   regardless of which of the two types it is.
 */
export async function ensureTeamConversation(teamId, createdBy) {
  const { data: team, error: teamFetchError } = await supabaseAdmin
    .from('teams')
    .select('id, name, type, conversation_id')
    .eq('id', teamId)
    .single();

  if (teamFetchError || !team) {
    return { data: null, error: teamFetchError || new Error('Team not found') };
  }

  if (team.conversation_id) {
    return { data: { id: team.conversation_id }, error: null };
  }

  const conversationType = team.type === 'team' ? 'team' : 'group';

  const { data: newConversation, error: createError } = await supabaseAdmin
    .from('conversations')
    .insert({
      subject: team.name,
      conversation_type: conversationType,
      is_group: true,
      group_id: teamId,
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (createError || !newConversation) {
    return { data: null, error: createError };
  }

  // Link it back on the team for direct lookup next time.
  const { error: linkError } = await supabaseAdmin
    .from('teams')
    .update({ conversation_id: newConversation.id, updated_at: new Date().toISOString() })
    .eq('id', teamId);

  if (linkError && isDev) {
    console.log('[ensureTeamConversation] Conversation created but failed to link on team:', linkError.message);
  }

  const { error: messageError } = await supabaseAdmin.from('messages').insert({
    conversation_id: newConversation.id,
    sender_id: createdBy,
    content: 'Team Created',
  });

  if (messageError && isDev) {
    console.log(
      '[ensureTeamConversation] Team conversation created but initial message failed:',
      messageError.message
    );
  }

  return { data: newConversation, error: null };
}

/**
 * Add a user as a participant in a conversation if they aren't one already.
 */
export async function addParticipantIfMissing(conversationId, userId) {
  const { data: existingParticipant, error: existingError } = await supabaseAdmin
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    return { error: existingError, alreadyExists: false };
  }

  if (existingParticipant) {
    return { error: null, alreadyExists: true };
  }

  const { error: insertError } = await supabaseAdmin.from('conversation_participants').insert({
    conversation_id: conversationId,
    user_id: userId,
  });

  return { error: insertError, alreadyExists: false };
}

/**
 * teams.type is 'team' or 'group', and each has its own separate
 * membership table with a differently-named foreign key column:
 *   - type 'team'  -> team_members.team_id
 *   - type 'group' -> group_members.group_id
 * Both tables otherwise share the same shape (user_id, added_by,
 * joined_at, left_at).
 */
function membershipTableFor(teamType) {
  return teamType === 'group' ? 'group_members' : 'team_members';
}

function membershipFkColumnFor(teamType) {
  return teamType === 'group' ? 'group_id' : 'team_id';
}

/**
 * Add a user to the correct membership table for this team's type
 * (team_members or group_members), or reactivate their row (clear
 * left_at) if they were a member before and left.
 */
export async function addOrReactivateTeamMember(teamId, userId, addedBy) {
  const { data: team, error: teamFetchError } = await supabaseAdmin
    .from('teams')
    .select('type')
    .eq('id', teamId)
    .single();

  if (teamFetchError || !team) {
    return { error: teamFetchError || new Error('Team not found') };
  }

  const table = membershipTableFor(team.type);
  const fkColumn = membershipFkColumnFor(team.type);

  const { data: existingMember, error: existingError } = await supabaseAdmin
    .from(table)
    .select('id, left_at')
    .eq(fkColumn, teamId)
    .eq('user_id', userId)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    return { error: existingError };
  }

  if (existingMember && !existingMember.left_at) {
    return { error: null, alreadyActive: true };
  }

  if (existingMember && existingMember.left_at) {
    const { error: reactivateError } = await supabaseAdmin
      .from(table)
      .update({ left_at: null })
      .eq('id', existingMember.id);

    return { error: reactivateError, reactivated: true };
  }

  const { error: insertError } = await supabaseAdmin.from(table).insert({
    [fkColumn]: teamId,
    user_id: userId,
    added_by: addedBy,
  });

  return { error: insertError, reactivated: false };
}

/**
 * The single entry point every "add/attach user to team" code path should
 * call. Ensures the team conversation exists, adds the user as a
 * participant, and adds/reactivates their team_members row.
 *
 * Returns { error } where error is null on full success, or an object with
 * per-step error details ({ conversation, participant, member }) if any
 * part failed — conversation errors are the only ones callers have
 * historically treated as fatal (e.g. teams.js's createTeam rolls back
 * team creation on a conversation failure); participant/member errors have
 * historically been logged and tolerated.
 */
export async function attachUserToTeam(teamId, userId, actorId) {
  const errors = {};

  const { data: conversation, error: conversationError } = await ensureTeamConversation(teamId, actorId);

  if (conversationError || !conversation) {
    errors.conversation = conversationError;
  } else {
    const { error: participantError } = await addParticipantIfMissing(conversation.id, userId);
    if (participantError) {
      errors.participant = participantError;
    }
  }

  const { error: memberError } = await addOrReactivateTeamMember(teamId, userId, actorId);
  if (memberError) {
    errors.member = memberError;
  }

  return { error: Object.keys(errors).length > 0 ? errors : null };
}