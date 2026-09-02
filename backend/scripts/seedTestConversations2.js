// backend/scripts/seedTestConversations2.js
//
// Second batch — 10 more conversations, this time ALL within the last 24
// hours (unlike the first batch, which was deliberately spread across
// several days) and with longer threads (6-12 messages each) to better
// exercise summarize/draft-reply on richer back-and-forth. Same category
// split as the first batch: 3 action, 3 approval, 2 discussion,
// 2 information. gangwar.satyam01@gmail.com is mixed as creator/other
// across the 10, same as before.
//
// Run with: node scripts/seedTestConversations2.js
// (.env path is resolved relative to this script, not your cwd)

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { default: supabaseAdmin } = await import('../src/config/supabaseClient.js');

const SATYAM_ID = '13ead7a9-7959-4521-8102-fd854e864977'; // gangwar.satyam01@gmail.com

const hoursAgo = (n) => new Date(Date.now() - n * 60 * 60 * 1000);
const minutesAfter = (date, m) => new Date(date.getTime() + m * 60 * 1000);

// Message spacing is 15 minutes per step, so even the 12-message thread
// only spans 2h45m — each conversation's `hoursAgo` start time is chosen
// with enough headroom that its last message still lands comfortably in
// the past, never in the future.
const MESSAGE_STEP_MINUTES = 15;

const CONVERSATIONS = [
  {
    label: 'ACTION (urgent) — Satyam sends',
    creator: SATYAM_ID,
    other: '6e8813e4-eca8-4694-b5e9-55a7e85a016b', // manager_sales1@company.com, Arjun Verma
    subject: 'CRM sync failing, blocking sales reports',
    category: 'action_required',
    workflowStatus: 'PENDING',
    hoursOld: 6,
    thread: [
      { from: 'creator', text: 'Arjun, the CRM sync job has been failing since this morning — sales dashboards are showing stale data. Can you take a look ASAP? Reports are due to leadership by 5pm.' },
      { from: 'other', text: 'On it. Is this affecting all pipelines or just the enterprise segment?' },
      { from: 'creator', text: 'Looks like all of them, dashboard hasn\'t updated since 6am.' },
      { from: 'other', text: 'Ok, checking the integration logs now.' },
      { from: 'creator', text: 'Any luck? Leadership meeting is in two hours.' },
      { from: 'other', text: 'Found it — the API token expired overnight. Regenerating now.' },
      { from: 'creator', text: 'Great, how long until sync catches up?' },
      { from: 'other', text: 'Should backfill within 15-20 minutes once the new token is live.' },
    ],
  },
  {
    label: 'ACTION (routine, resolved) — IT user sends',
    creator: 'df9ab9b9-d41b-43e8-879f-9a124b98253d', // user_it3@company.com, Vikram Desai
    other: SATYAM_ID,
    subject: 'PR review whenever you get a chance',
    category: 'action_required',
    workflowStatus: 'DONE',
    hoursOld: 18,
    thread: [
      { from: 'creator', text: 'Hey Satyam, whenever you get a chance could you review my PR for the logging refactor? No rush.' },
      { from: 'other', text: 'Sure, send me the link.' },
      { from: 'creator', text: 'Just shared it in the channel, PR #482.' },
      { from: 'other', text: 'Took a look, looks solid, left two small comments.' },
      { from: 'creator', text: 'Thanks, addressing those now.' },
      { from: 'other', text: 'Sounds good, approving once those are in.' },
    ],
  },
  {
    label: 'ACTION (urgent) — HR manager sends',
    creator: '7bcc445d-a65e-4d19-9833-b3b145c01838', // manager_hr2@company.com, Varun Iyer
    other: SATYAM_ID,
    subject: 'Signed offer letter needed today',
    category: 'action_required',
    workflowStatus: 'PENDING',
    hoursOld: 3,
    thread: [
      { from: 'creator', text: 'Satyam, we need the signed offer letter for the new hire sent out today — the candidate has a competing offer expiring tonight.' },
      { from: 'other', text: 'Let me pull it up, one sec.' },
      { from: 'creator', text: 'Appreciate it, HR is on standby to send as soon as it\'s ready.' },
      { from: 'other', text: 'Reviewing the terms now, salary band looks correct.' },
      { from: 'creator', text: 'Yes, confirmed with finance yesterday.' },
      { from: 'other', text: 'Ok, signing now.' },
      { from: 'creator', text: 'Thank you, how long do you need?' },
      { from: 'other', text: 'Should have it back to you within the hour.' },
      { from: 'creator', text: 'Perfect, candidate is expecting it by end of day.' },
      { from: 'other', text: 'Understood, prioritizing this now.' },
    ],
  },
  {
    label: 'APPROVAL (urgent, financial) — Satyam sends',
    creator: SATYAM_ID,
    other: '516b50f3-de9e-4acb-8823-3d30842a3453', // admin1@company.com, Admin One
    subject: 'Vendor contract renewal expires tonight',
    category: 'approval_required',
    workflowStatus: 'PENDING',
    hoursOld: 5,
    thread: [
      { from: 'creator', text: 'Need your approval on the vendor contract renewal — it expires tonight at midnight and we lose the current pricing if it lapses.' },
      { from: 'other', text: 'What\'s the renewal term and cost?' },
      { from: 'creator', text: '12-month renewal, same rate as last year, $28k total.' },
      { from: 'other', text: 'Any changes to the terms otherwise?' },
      { from: 'creator', text: 'No changes, straight renewal, legal already reviewed it.' },
      { from: 'other', text: 'Ok let me pull up the contract.' },
      { from: 'creator', text: 'It\'s in the shared drive under vendor renewals.' },
      { from: 'other', text: 'Found it, reviewing now.' },
      { from: 'creator', text: 'This is time sensitive, really need this locked in before midnight.' },
      { from: 'other', text: 'Understood, reading through the final page now.' },
      { from: 'creator', text: 'Let me know if you need anything else from me.' },
      { from: 'other', text: 'All good, approving now.' },
    ],
  },
  {
    label: 'APPROVAL (routine, resolved) — Sales user sends',
    creator: '6c12202d-2d9a-4d7e-b392-d299f8d256fd', // user_sales2@company.com, Anaya Reddy
    other: SATYAM_ID,
    subject: 'Travel expense reimbursement approval',
    category: 'approval_required',
    workflowStatus: 'APPROVED',
    hoursOld: 20,
    thread: [
      { from: 'creator', text: 'Hi Satyam, requesting approval for my travel expense reimbursement from the client visit last week, total is $340.' },
      { from: 'other', text: 'Sure, can you share the itemized receipts?' },
      { from: 'creator', text: 'Attached in the expense portal.' },
      { from: 'other', text: 'Looks good, approving now.' },
      { from: 'creator', text: 'Thank you!' },
      { from: 'other', text: 'No problem, approved.' },
    ],
  },
  {
    label: 'APPROVAL (urgent) — Marketing manager sends',
    creator: '13a8d1f5-6c57-4f5c-b376-93a7afd7f740', // manager_marketing2@company.com, Karan Singh
    other: SATYAM_ID,
    subject: 'Ad spend increase for tonight\'s campaign launch',
    category: 'approval_required',
    workflowStatus: 'PENDING',
    hoursOld: 4,
    thread: [
      { from: 'creator', text: 'Satyam, need your approval to increase ad spend by $8k for tonight\'s campaign launch — we\'re seeing strong early engagement and want to capitalize before the window closes.' },
      { from: 'other', text: 'What\'s driving the increase, just scaling the existing campaign?' },
      { from: 'creator', text: 'Yes, same campaign, just raising the daily cap to capture more reach while performance is strong.' },
      { from: 'other', text: 'What\'s the current ROAS looking like?' },
      { from: 'creator', text: '3.2x so far today, well above target.' },
      { from: 'other', text: 'That\'s solid. What time does the window close?' },
      { from: 'creator', text: 'Midnight tonight, after that the promotional pricing from the platform goes away.' },
      { from: 'other', text: 'Ok, approving the increase.' },
      { from: 'creator', text: 'Thank you, scaling it up now.' },
    ],
  },
  {
    label: 'DISCUSSION — Satyam starts',
    creator: SATYAM_ID,
    other: 'a9f0d6fa-3f6f-4229-b4d3-159f3c03c8ce', // user_hr1@company.com, Meera Kapadia
    subject: 'Onboarding process friction points',
    category: 'discussion',
    workflowStatus: null,
    hoursOld: 15,
    thread: [
      { from: 'creator', text: 'Been thinking about our onboarding process — curious if you\'ve seen any friction points from new hires recently?' },
      { from: 'other', text: 'A few people have mentioned the paperwork feels scattered across too many systems.' },
      { from: 'creator', text: 'That matches what I\'ve heard too. Might be worth consolidating into one portal.' },
      { from: 'other', text: 'Agreed, could also help with tracking completion status.' },
      { from: 'creator', text: 'Do you know if IT has bandwidth to look into this soon?' },
      { from: 'other', text: 'Not sure, I can check with them this week.' },
      { from: 'creator', text: 'That\'d be great, let\'s regroup once you hear back.' },
    ],
  },
  {
    label: 'DISCUSSION — IT user starts',
    creator: '1c70b93d-5bdb-438b-b938-aa9a8add0ac7', // user_it2@company.com, Neha Sharma
    other: SATYAM_ID,
    subject: 'New code review tool',
    category: 'discussion',
    workflowStatus: null,
    hoursOld: 10,
    thread: [
      { from: 'creator', text: 'Curious what you think about us trying out a new code review tool — a few teams have been asking for something with better diff visualization.' },
      { from: 'other', text: 'Open to it, what are you considering?' },
      { from: 'creator', text: 'A couple options, one is more lightweight, the other has deeper CI integration.' },
      { from: 'other', text: 'What\'s the team\'s actual pain point right now?' },
      { from: 'creator', text: 'Mostly slow review turnaround and missed context in large diffs.' },
      { from: 'other', text: 'Then the CI-integrated one might solve more of that directly.' },
      { from: 'creator', text: 'That\'s my read too. I\'ll put together a quick comparison.' },
      { from: 'other', text: 'Sounds good, happy to look it over once it\'s ready.' },
    ],
  },
  {
    label: 'INFORMATION — Satyam sends',
    creator: SATYAM_ID,
    other: '6a04a79b-7f36-4a01-833b-244c45f2d41c', // user_marketing2@company.com, Aditya Bhat
    subject: 'Analytics dashboard update — FYI',
    category: 'information',
    workflowStatus: null,
    hoursOld: 22,
    thread: [
      { from: 'creator', text: 'Just wanted to let you know the analytics dashboard got an update today — a few new attribution metrics are now available.' },
      { from: 'other', text: 'Nice, anything we should be aware of before using them?' },
      { from: 'creator', text: 'Just that the historical data before this week won\'t have the new metrics populated.' },
      { from: 'other', text: 'Good to know, thanks for the heads up.' },
      { from: 'creator', text: 'No problem, let me know if anything looks off.' },
      { from: 'other', text: 'Will do.' },
    ],
  },
  {
    label: 'INFORMATION — IT manager sends',
    creator: 'a119b65c-0039-41c1-bb83-64da22c12575', // manager_it2@company.com, Priya Singh
    other: SATYAM_ID,
    subject: 'Scheduled maintenance window tonight',
    category: 'information',
    workflowStatus: null,
    hoursOld: 2,
    thread: [
      { from: 'creator', text: 'FYI, we have a scheduled maintenance window tonight from 11pm to 1am for the database cluster upgrade.' },
      { from: 'other', text: 'Thanks for the heads up, any expected downtime?' },
      { from: 'creator', text: 'Brief read-only mode for about 10 minutes during the failover, otherwise should be seamless.' },
      { from: 'other', text: 'Good to know, will flag it to the team just in case.' },
      { from: 'creator', text: 'Appreciate it, we\'ll send a reminder an hour before it starts.' },
      { from: 'other', text: 'Sounds good.' },
      { from: 'creator', text: 'Will confirm once it\'s complete.' },
    ],
  },
];

async function seed() {
  console.log(`Seeding ${CONVERSATIONS.length} test conversations (batch 2, last 24h)...\n`);

  for (const spec of CONVERSATIONS) {
    const conversationCreatedAt = hoursAgo(spec.hoursOld);
    const lastMessageAt = minutesAfter(conversationCreatedAt, (spec.thread.length - 1) * MESSAGE_STEP_MINUTES);

    const isResolved = ['DONE', 'APPROVED', 'REJECTED'].includes(spec.workflowStatus);

    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .insert({
        subject: spec.subject,
        conversation_type: 'direct',
        created_by: spec.creator,
        category: spec.category,
        status: 'OPEN',
        workflow_status: spec.workflowStatus,
        workflow_comment: null,
        workflow_updated_by: isResolved ? spec.other : null,
        workflow_updated_at: isResolved ? lastMessageAt.toISOString() : null,
        is_group: false,
        group_id: null,
        is_reported: false,
        created_at: conversationCreatedAt.toISOString(),
        updated_at: lastMessageAt.toISOString(),
      })
      .select('id')
      .single();

    if (convError || !conversation) {
      console.error(`FAILED [${spec.label}]:`, convError?.message);
      continue;
    }

    const { error: participantsError } = await supabaseAdmin.from('conversation_participants').insert([
      { conversation_id: conversation.id, user_id: spec.creator, joined_at: conversationCreatedAt.toISOString() },
      { conversation_id: conversation.id, user_id: spec.other, joined_at: conversationCreatedAt.toISOString() },
    ]);

    if (participantsError) {
      console.error(`FAILED (participants) [${spec.label}]:`, participantsError.message);
      continue;
    }

    const messageRows = spec.thread.map((m, i) => ({
      conversation_id: conversation.id,
      sender_id: m.from === 'creator' ? spec.creator : spec.other,
      content: m.text,
      created_at: minutesAfter(conversationCreatedAt, i * MESSAGE_STEP_MINUTES).toISOString(),
    }));

    const { error: messagesError } = await supabaseAdmin.from('messages').insert(messageRows);

    if (messagesError) {
      console.error(`FAILED (messages) [${spec.label}]:`, messagesError.message);
      continue;
    }

    console.log(`OK  [${spec.category.padEnd(17)}] ${spec.thread.length} msgs — ${spec.label} — conversation ${conversation.id}`);
  }

  console.log('\nDone.');
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});