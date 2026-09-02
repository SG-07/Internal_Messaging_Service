// backend/scripts/seedTestConversations.js
//
// Seeds 10 direct conversations for testing the AI endpoints
// (summarize / importance / digest / draft-reply). gangwar.satyam01@gmail.com
// is used as sender on some threads and receiver on others, mixed
// deliberately. Spread across the last several days (not all in the last
// 24h) so the digest endpoint has to correctly filter to only what's
// recent, not just return everything.
//
// Run with: node scripts/seedTestConversations.js
// (from the backend/ directory, or anywhere — .env path is resolved
// relative to this script, not your cwd)

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { default: supabaseAdmin } = await import('../src/config/supabaseClient.js');

const SATYAM_ID = '13ead7a9-7959-4521-8102-fd854e864977'; // gangwar.satyam01@gmail.com

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const hoursAfter = (date, h) => new Date(date.getTime() + h * 60 * 60 * 1000);

// Each spec: who creates it (creator), who the other participant is
// (otherUserId), category/workflow fields, and the message thread as
// [{ from: 'creator' | 'other', text }]. Timestamps are computed from
// `daysOld` + per-message hour offsets.
const CONVERSATIONS = [
  {
    label: 'ACTION (urgent) — Satyam sends',
    creator: SATYAM_ID,
    other: '5ec22965-7c4f-43d6-8f55-7c6408f46a8b', // manager_it@company.com, Rajesh Kumar
    subject: 'Production server needs restart today',
    category: 'action_required',
    workflowStatus: 'PENDING',
    daysOld: 6,
    thread: [
      { from: 'creator', text: 'Rajesh, the checkout service on prod-3 is throwing intermittent 500s. Can you restart it before EOD? This is blocking the payment team.' },
      { from: 'other', text: 'Looking into it now. Do we know what changed recently?' },
      { from: 'creator', text: 'Last deploy was yesterday around 6pm. Might be related to the connection pool config.' },
      { from: 'other', text: 'Got it, checking the logs. Will restart once I confirm it is safe.' },
      { from: 'creator', text: 'Thanks — please ping me the moment it is back up, payments team is waiting on this.' },
    ],
  },
  {
    label: 'ACTION (routine, resolved) — HR sends',
    creator: '7b168182-38f3-467b-9bc3-ea750710e073', // user_hr2@company.com, Sandeep Kumar
    other: SATYAM_ID,
    subject: 'Please update your emergency contact info',
    category: 'action_required',
    workflowStatus: 'DONE',
    daysOld: 4,
    thread: [
      { from: 'creator', text: 'Hi Satyam, HR records show your emergency contact info is outdated. Could you update it in the portal whenever convenient? No urgency.' },
      { from: 'other', text: 'Sure, will do this week.' },
      { from: 'creator', text: 'No rush at all, thanks!' },
      { from: 'other', text: 'Just updated it now actually.' },
      { from: 'creator', text: 'Perfect, confirmed on our end. Thanks Satyam.' },
    ],
  },
  {
    label: 'ACTION (routine, pending) — Satyam sends',
    creator: SATYAM_ID,
    other: '85057899-fc85-4283-a491-b4cd07716fb0', // user_sales1@company.com, Rohan Gupta
    subject: 'Q3 deal summary whenever you get a chance',
    category: 'action_required',
    workflowStatus: 'PENDING',
    daysOld: 2,
    thread: [
      { from: 'creator', text: 'Hey Rohan, whenever you have a moment, could you send over the Q3 deal summary? Not urgent, just want it for my records.' },
      { from: 'other', text: 'Sure thing, I have most of it compiled already.' },
      { from: 'creator', text: 'No rush, end of the month is totally fine.' },
      { from: 'other', text: 'Will have it to you by then.' },
    ],
  },
  {
    label: 'APPROVAL (urgent, financial) — Sales manager sends',
    creator: '74751b64-620b-424d-9907-aec754365e7e', // manager_sales2@company.com, Sneha Kapoor
    other: SATYAM_ID,
    subject: 'Approval needed: $45k marketing spend',
    category: 'approval_required',
    workflowStatus: 'PENDING',
    daysOld: 1,
    thread: [
      { from: 'creator', text: 'Satyam, I need your approval on a $45k marketing spend for the Q4 campaign. The client is waiting on confirmation and we need to lock this in by Friday.' },
      { from: 'other', text: 'Can you send the breakdown of where the $45k is going?' },
      { from: 'creator', text: 'Attached in the shared doc — mostly ad spend and the agency retainer. This is time-sensitive, the vendor is holding the rate until Friday only.' },
      { from: 'other', text: 'Reviewing it now, will get back to you today.' },
      { from: 'creator', text: 'Appreciate it — really need this locked in before Friday or we lose the rate.' },
    ],
  },
  {
    label: 'APPROVAL (urgent, blocking) — Satyam sends',
    creator: SATYAM_ID,
    other: '80c901da-a00a-430d-b9da-b60998f09eb5', // admin2@company.com, Admin Two
    subject: 'Emergency budget reallocation — blocking payroll',
    category: 'approval_required',
    workflowStatus: 'PENDING',
    daysOld: 3,
    thread: [
      { from: 'creator', text: 'Need your approval on an emergency budget reallocation — this is currently blocking the payroll run scheduled for tomorrow morning.' },
      { from: 'other', text: 'What is the reallocation amount and source?' },
      { from: 'creator', text: 'Moving 12k from the training budget to cover a shortfall. Payroll cannot process until this is approved.' },
      { from: 'other', text: 'Understood, escalating this now given the deadline.' },
      { from: 'creator', text: 'Thank you — please let me know as soon as it clears.' },
    ],
  },
  {
    label: 'APPROVAL (routine, resolved) — IT user sends',
    creator: 'd2d12450-b2a0-4330-9511-5d44a9e4c758', // user_it1@company.com, Amit Patel
    other: SATYAM_ID,
    subject: 'Approval to order a new monitor',
    category: 'approval_required',
    workflowStatus: 'APPROVED',
    daysOld: 5,
    thread: [
      { from: 'creator', text: 'Hi Satyam, requesting approval to order a second monitor for my desk, around $180. My current setup is slowing me down on the dashboard work.' },
      { from: 'other', text: 'Sounds reasonable, go ahead.' },
      { from: 'creator', text: 'Great, thank you! Ordering it today.' },
      { from: 'other', text: 'No problem, approved.' },
    ],
  },
  {
    label: 'DISCUSSION — IT manager starts',
    creator: '5ec22965-7c4f-43d6-8f55-7c6408f46a8b', // manager_it@company.com, Rajesh Kumar
    other: SATYAM_ID,
    subject: 'IT team offsite ideas',
    category: 'discussion',
    workflowStatus: null,
    daysOld: 2,
    thread: [
      { from: 'creator', text: 'Been thinking about doing a team offsite next quarter — any thoughts on location or format?' },
      { from: 'other', text: 'I like the idea. Maybe something half work, half team-building rather than a pure retreat?' },
      { from: 'creator', text: 'Agreed. Could do a morning planning session and then something fun in the afternoon.' },
      { from: 'other', text: 'What about a coastal spot, easy to get to for most of the team?' },
      { from: 'creator', text: 'That could work well. Let me check a few venues and get back to you with options.' },
      { from: 'other', text: 'Sounds good, keep me posted.' },
    ],
  },
  {
    label: 'DISCUSSION — Satyam starts',
    creator: SATYAM_ID,
    other: '2818d413-1816-44d4-949a-d735435c6c52', // user_marketing1@company.com, Isha Nair
    subject: 'New campaign tagline ideas',
    category: 'discussion',
    workflowStatus: null,
    daysOld: 6,
    thread: [
      { from: 'creator', text: 'Been brainstorming taglines for the new campaign — curious what you think of "Built for how you actually work."' },
      { from: 'other', text: 'I like that direction. Feels more honest than the usual buzzword-heavy stuff.' },
      { from: 'creator', text: 'Right, that was the goal. Thinking we lean into a plainer, more direct tone across the whole campaign.' },
      { from: 'other', text: 'Agreed. Could also test a shorter variant, something like "Work, actually."' },
      { from: 'creator', text: 'Ha, that is punchy. Let us mock up both and see how they look in context.' },
    ],
  },
  {
    label: 'INFORMATION — HR manager sends',
    creator: '50bb7619-f152-4082-b11d-cf047ce91419', // manager_hr1@company.com, Bhavna Rao
    other: SATYAM_ID,
    subject: 'New HR policy rollout — FYI',
    category: 'information',
    workflowStatus: null,
    daysOld: 3,
    thread: [
      { from: 'creator', text: 'FYI — we are rolling out an updated leave policy starting next month. No action needed on your end, just wanted you looped in ahead of the announcement.' },
      { from: 'other', text: 'Thanks for the heads up, appreciate it.' },
      { from: 'creator', text: 'Of course. Full details will go out company-wide next week.' },
    ],
  },
  {
    label: 'INFORMATION — Satyam sends',
    creator: SATYAM_ID,
    other: '72a5bced-f8e0-4c21-a2dc-6d8d0fb55dd6', // manager_marketing1@company.com, Divya Joshi
    subject: 'Product launch date finalized',
    category: 'information',
    workflowStatus: null,
    daysOld: 1,
    thread: [
      { from: 'creator', text: 'Just wanted to share that the launch date is finalized for the 15th. No action needed from marketing right now, just keeping everyone in sync.' },
      { from: 'other', text: 'Good to know, thanks for the update.' },
      { from: 'creator', text: 'Will send the full rollout timeline once ops confirms the last few details.' },
    ],
  },
];

async function seed() {
  console.log(`Seeding ${CONVERSATIONS.length} test conversations...\n`);

  for (const spec of CONVERSATIONS) {
    const conversationCreatedAt = daysAgo(spec.daysOld);
    const lastMessageAt = hoursAfter(conversationCreatedAt, (spec.thread.length - 1) * 1.5);

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
      created_at: hoursAfter(conversationCreatedAt, i * 1.5).toISOString(),
    }));

    const { error: messagesError } = await supabaseAdmin.from('messages').insert(messageRows);

    if (messagesError) {
      console.error(`FAILED (messages) [${spec.label}]:`, messagesError.message);
      continue;
    }

    console.log(`OK  [${spec.category.padEnd(17)}] ${spec.label} — conversation ${conversation.id}`);
  }

  console.log('\nDone.');
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});