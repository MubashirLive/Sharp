# SHARP - Messenger

> Last updated: 2026-06-17
> Status: Not Built (MVP-1). Messenger feature implemented in `src/pages/Messenger.tsx` (647 LOC).
> Messenger defaults and configurable settings are defined in `MESSENGER_SETTING.md` (settings UI not yet built).

## Rough Notes 
In messenger there are two key features broadcast and the automatic message . These features works in this way that it sends the message automatically to bulk user for example if an homework is assigned by a teacher then all the students will receive the message related to homework automatically in their chat and  the chat box which is shared by the student and that particular teacher will be used similarly the task which is assigned to the staff or  holidays declared or any event is declared all can be communicated through the Messenger and its features broadcast and automatic message will be used. Along with it has the link to lend on the section of the app where it is shown. It will integrate with the Calendar

Messenger must not include unnecessary Whatsapp features such as calls, status, communities, payments, Updates, or public social sharing. We are taking only Chat, Group and Broadcast from the Whatsapp with our own modification

### Messages Permission 
Student can send the message to their assigned Subject Teacher, Class Teacher, Admin (if permitted), Master Admin(if permitted), Departmental Head (if permitted) and Principal (if permitted) . 
Can never see the other student in the app therefore can never send the message to the other students. 


## Build vs spec

| Spec area | Status | Notes |
|---|---|---|
| DM (1:1) | Not Built | Roles + permissions enforced by RLS |
| Teacher-formed groups | Not Built | Students can send, not create |
| Broadcasts (one-way) | Not Built | Class + section / class + subject auto-broadcasts |
| Image + PDF media | Not Built | Stored in Supabase Storage with RLS |
| Read receipts | Not Built | |
| 2-min delete window | Not Built | Server-side enforcement |
| Auto class+section / class+subject broadcasts | Not Built | |
| Chat archive | Not Built | Per-user archive view |
| Student / Parent scope | Not Built | Assigned teacher + designated admin only |
| Visibility rules (PERMISSION_MATRIX) | Not Built | Enforced by RLS policies |
| Settings UI (MESSENGER_SETTING) | ❌ Not built | Spec exists, no settings page yet |
| Realtime delivery | Not Built | Supabase Realtime channel |
| Search | Not Built | DM and group search |

---

## SECTION 1 - MODULE OVERVIEW

Messenger is the official communication system inside SHARP.

It replaces informal WhatsApp-style school communication with a controlled, role-based, school-owned messaging system.

Messenger is not only a chat feature. It is also the communication layer used by:

- Calendar
- Task Management
- Homework
- Attendance 
- Future modules that need school communication

**Core rule:** Messenger must respect school hierarchy, role permissions, class assignments, subject assignments, department assignments, wing assignments, and student privacy.

---

## SECTION 2 - DESIGN PRINCIPLES

- Messenger should feel familiar and simple, inspired by common whatsapp chat app.
- Communication must be role-gated.
- Students cannot freely search or message other students.
- Student-to-student visibility is allowed only inside approved groups.
- Staff visibility depends on role, permission, department, wing, class, and subject mapping.
- System-generated messages from other modules must be clear, trusted, and non-editable.
- Every message belongs to one school only.
- Chat history should be preserved for safety, accountability, and audit.

---

## SECTION 3 - USER TYPES

Messenger will be used by:

- Principal
- Master Admin
- Admin
- Departmental Incharge
- Coordinator
- Teacher
- Class Teacher
- Department Member
- Student 

Super Admin has no Messenger access inside any school's internal communication.

Student follows the existing app rule: one enrollment equals one app user. The app does not separately track whether the student or parent is using it at home.

---

## SECTION 4 - CONVERSATION TYPES

Messenger has three practical communication types.

### Direct Chat

Direct chat is a one-to-one chatbox between two allowed users.

The sender's chat with the recipient and the recipient's chat with the sender are the same chatbox.

Examples:

- Principal and Teacher
- Admin and Student / Parent
- Teacher and Student / Parent of an allowed class
- Task assigner and task assignee

### Group Chat

Group chat is a shared chatbox with multiple members.

Examples:

- Class group
- Class + subject group
- Department group
- Wing group
- Staff group

Students cannot create groups, but they can be added to approved groups.

Student message sending in groups is disabled by default unless the Group Head grants permission.

### Broadcast

Broadcast means one sender sends the same message to multiple recipients at the same time.

In SHARP, broadcast does not require a separate broadcast-only chatbox.

For individual recipients:

- The message is dropped into each recipient's existing direct chatbox with the sender.
- If no direct chatbox exists yet, the system creates or opens that direct chatbox.
- The sender is the same person in all recipient chatboxes.

For group recipients:

- The message is dropped into the selected group chatbox.

Broadcast is used by Calendar, school announcements, important notices, and module-generated notifications.

---

## SECTION 5 - INTEGRATION MAP

Messenger is the communication layer for other modules.

### Calendar Integration

When a Calendar item is created, Messenger can automatically send a broadcast message to the selected recipients.

Calendar items may include:

- School event
- Holiday
- Exam
- Test
- Homework-related date
- Task
- Staff meeting

Calendar must have a recipient field or recipient selector.

The recipient selector decides who receives the Messenger message.

Examples:

- Whole school
- Staff only
- Students / Parents only
- Wing
- Class
- Section
- Department
- Selected individuals
- Selected group

Calendar must also have a send-message checkbox.

If the checkbox is checked:

- Messenger sends the broadcast message.

If the checkbox is unchecked:

- The Calendar item is created, but no Messenger broadcast is sent.

Calendar may also allow scheduled messaging.

If scheduled time is empty:

- The Messenger message is sent immediately.

If scheduled time is set:

- The Messenger message is sent to the selected recipients at the scheduled time.

Calendar message content:

- Calendar title becomes the Messenger message heading.
- Calendar description becomes the Messenger message body.
- The message includes an in-app link or button to open the Calendar item.
1.	Integration with Calendar : When an event(school event, holiday, exam, test, homework, task) is created by the person then it will be automatically declared through broadcast. There is the coloumn named Recipient in the calendar. Which will automatically send the event message to the recipient marked in that or the scheduled messeged is sent to the receipient on the sechduled time. Here broadcast means such message which dropped/received  at multiple chatbox at the same time where the sender in all is the same person. And the chatbox is used is the same between sender and recipient. Also there is the check box on the calendar page to decide if it is checked then only the broadcast message is sent.
What content is actually sent : When a new calendar event is made its title become the heading and description become the body of the message and it is send automatically to all the selected recipient along with the in app link to calendar page to see that event on calendar.


### Task Management Integration

When a task is assigned, Messenger sends a system-generated task message.

Task discussion happens in Messenger.

Task status, submission, verification, completion, reassignment, and records happen in Task Management.

Individual task assignment:

- Message appears in the direct chatbox between assigner and assignee.

Selected individual task assignment:

- Each selected assignee receives the task message in their direct chatbox with the assigner.

Group task assignment:

- The task message appears in the selected department or wing group chatbox.
- Every assigned group member still receives their own task record and completion status in Task Management.

Task message content:

- Task title
- Due date
- Task description
- In-app link or button to open the task page

Task messages are system-generated and cannot be edited like normal messages.

### Homework Integration

Homework uses Messenger for student communication .

Messenger notify students when, Homework is assigned
- Homework due date is near, if reminders are enabled later
- Homework message content should include:
- Homework title or subject
- Class/section
- Description
- In-app link or button to open homework


### Attendance Integration

Attendance uses Messenger for alerts, not routine attendance marking.

Messenger may notify:

- Student / Parent account for attendance warnings
- Class Teacher for class-specific attendance concerns
- Admin / Principal / Master Admin for repeated absences or serious attendance flags

Examples:

- Three consecutive absences
- Attendance below required percentage
- Leave-related alert, if added later

Normal daily attendance submission should not create a Messenger message.

---

## SECTION 6 - PERMISSION MATRIX

| Feature | Principal | Master Admin | Admin | Teacher | Non-Teaching Staff | Student / Parent |
|---|---|---|---|---|---|---|
| Access Messenger | Yes | Yes | Yes | Yes | Configurable | Yes |
| Individual chat | Yes | Yes | Yes | Configurable | Configurable | Assigned subject teachers, Class Teacher, and Departmental Incharge IDs only |
| Create group | Yes | Yes | Configurable | No by default | No | No |
| Send in group | Yes | Yes | Yes | Yes | Configurable | Only if allowed by Group Head |
| Create broadcast | Yes | Yes | Configurable | No by default | No | No |
| Receive broadcast | Yes | Yes | Yes | Yes | Yes | Yes |
| Delete own message within 2 minutes | Yes | Yes | Yes | Yes | Yes | Yes |
| Delete any message | Yes | Yes | Configurable | No | No | No |
| View archived chats | Yes | Yes | Configurable | No | No | No |
| Search messages | Yes | Yes | Yes | Yes | Configurable | Own accessible chats only |
| Share image/PDF | Yes | Yes | Yes | Yes | Configurable | Yes, if allowed |
| Share voice note | Yes | Yes | Yes | Configurable | Configurable | Configurable |
| View read receipts | Yes | Yes | Yes | Yes | Yes | Yes |

Departmental Incharge and Coordinator follow their assigned responsibility boundaries:

- Departmental Incharge: own department.
- Coordinator: own wing.

Their exact Messenger rights should be configured as role extensions, not treated as unrelated standalone roles.

---

## SECTION 7 - STUDENT CHAT RULES

Once a Student ID is created and the student form is complete, the Student / Parent account is ready for Messenger.

By default, a student can see only:

- Their assigned subject teachers
- Their Class Teacher, if assigned
- Departmental Incharge IDs only

Student / Parent can use normal direct chat only with these approved contacts.

Student / Parent cannot:

- Search all students
- See all students
- Directly message another student
- Create a group
- Create a broadcast
- Add members to a group

The only way a student can see another student inside Messenger is through an approved group where both students are members.

Even inside groups, student sending is disabled by default until allowed by the Group Head.

---

## SECTION 8 - TEACHER CHAT RULES

Academic staff chat access with students is controlled from Messenger Settings.

Default rule:

- Teacher can see and chat only with students of classes where the teacher is assigned a subject or is assigned as Class Teacher.
- Smart Search shows only those permitted students.
- Subject Teacher allocation is managed from the Subject tab of My School or through Role Manager.
- Class Teacher allocation is managed from the Subject tab of My School or through Role Manager.
- Both gateways edit the same shared assignment state; Messenger consumes the saved result only.

Configurable options are defined in `MESSENGER_SETTING.md`:

- Whole school
- Wing
- Allotted classes/students
- None

If a teacher has no class, subject, section, wing, or role mapping, their Messenger access should not be fully activated for student communication.

One staff-student pair always has one direct chatbox. If the staff member has multiple roles for the same student, those roles affect the heading/context, not the number of chatboxes.

---

## SECTION 9 - STAFF CHAT PERMISSION SETTINGS

Principal / Master Admin can customize Messenger visibility and chat permissions for individual staff.

By default, staff chat permission checkboxes are enabled unless the school changes them.

Possible staff settings:

- Can send message to Staff.
- Can send message to Student / Parent.
- Can send message to Principal and Master Admin.

If a permission is disabled:

- The blocked category becomes unavailable in Messenger search for starting new conversations.
- The staff member cannot start new chats with that category.
- Existing chatboxes remain visible.
- The write message field disappears or becomes disabled.
- A line appears: "You don't have permission to write messages here."

Example:

If Staff X had a chat with Staff Y and later Staff X loses permission to chat with staff, that previous chatbox remains visible, but Staff X cannot write messages there until permission is granted again.

This is a visibility and access rule, not a deletion rule. The chat history should not be deleted.

---

## SECTION 10 - GROUP RULES

### Group Head

Every group has a Group Head.

Group Head is the same concept as Group Admin in common chat apps.

Principal and Master Admin always become Group Head by default, no matter who creates the group.

This is automatic and dynamic.

If a staff ID is assigned as Master Admin later, that ID automatically becomes Group Head in relevant groups.

If a staff ID loses Master Admin status later, that ID automatically loses Master Admin-based Group Head rights.

### Student Group Rules

Students cannot create groups.

Students can be added to groups by authorized staff.

Students are not allowed to send messages in a group by default.

Student sending can be enabled by the Group Head.

Group is the only Messenger area where a student may see another student.

### Group Visibility Rules

Normal direct-chat restrictions do not automatically block existing group visibility.

Example:

If a teacher normally cannot see a teacher from another wing in Messenger search, both may still see each other inside a group if both were validly added to that group.

This does not mean groups ignore all security. Group creation and member addition must still be controlled by permissions.

### Group Moderation

Group Head can:

- Add or remove members, if allowed.
- Enable or disable student sending.
- Moderate messages according to school rules.
- Rename group, if allowed.
- Archive or close group, if allowed.

---

## SECTION 11 - AUTOMATIC GROUP CREATION

Some groups should be created automatically from school setup data.

### Department Group

When a department is created, Messenger should automatically create a department group.

Members:

- Departmental Incharge
- Department members
- Principal
- Master Admin

Group Head:

- Principal
- Master Admin
- Departmental Incharge, if permitted

### Wing Staff Group

When a wing is created, Messenger should automatically create a wing staff group.

Members:

- Coordinator of that wing
- Teachers assigned to that wing
- Principal
- Master Admin

Group Head:

- Principal
- Master Admin
- Coordinator, if permitted

### Future Auto-Groups

Possible future automatic groups:

- Class + section group
- Class + subject group
- All staff group
- Admin group

These should be finalized after class, subject, section, and role mapping rules are stable.

---

## SECTION 12 - AUTOMATIC CHATBOX GENERATION

Direct chatboxes should be generated automatically when a valid communication path exists and a message is sent.

Examples:

- Calendar broadcast to selected staff creates or opens direct chatboxes with the sender.
- Task assignment creates or opens the direct chatbox between assigner and assignee.
- Student sends first message to assigned subject teacher and the direct chatbox is created.
- Admin sends direct notice to a parent/student and the direct chatbox is created.

Direct chatboxes do not need to be pre-created for every possible allowed pair.

The chatbox should appear in the chat list when:

- A message exists.
- A system-generated message exists.
- The user has pinned or opened that contact, if this behavior is added later.

---

## SECTION 13 - MESSENGER ID AND ACTIVATION RULES

Messenger access depends on whether the user has enough profile and assignment data to safely determine communication permissions.

### Principal

When Super Admin creates the Principal ID, it does not automatically mean the Principal's Messenger identity is fully ready for internal school communication.

The Principal account must be connected to the school's staff/person profile used by Messenger.

This connection may be completed through My Staff or another staff-profile completion step.

### Staff

Staff App ID alone is not enough to fully activate Messenger.

Even after the Staff Form is completed, Messenger access may remain limited until required role and assignment mappings are configured.

Required mappings may include:

- Role
- Department
- Wing
- Class
- Section
- Subject
- Staff tag
- Permission toggles

Reason:

Staff communication depends on who they are allowed to see and message. Without mappings, the system cannot safely decide their contact list.

### Student / Parent

Student App ID becomes ready for Messenger after the Student Form is completely filled.

Reason:

Student form includes class and section assignment, which is enough to determine default student contacts such as Class Teacher, subject teachers, and visible department staff.

---

## SECTION 14 - TAGS

Messenger should show a tag below each user's name to help identify people quickly.

### Student Tags

Student tags are auto-generated from class and section.

Example:

- `9th A Student`
- `Class 6 B Student`

The tag should be fetched from the student's class and section assignment.

### Staff Tags

Staff tags are assigned by Principal / Master Admin.

Rules:

- Each staff member can have only one Messenger tag.
- Tags can be selected from available tags or custom-created.
- If no tag is assigned, the tag area remains empty.
- Tag assignment is managed from Messenger settings.

Examples:

- Accounts
- Transport
- Librarian
- Sports
- Coordinator
- Department Incharge
- Counselor

Tags are for identification. Tags should not replace role permissions.

---

## SECTION 15 - BROADCAST RULES

Broadcast is a mass-send action.

It sends the same message from one sender to multiple recipients at the same time.

Broadcast can be created manually by authorized users or automatically by modules such as Calendar.

Broadcast sender remains the same in all delivered chatboxes.

Broadcast to individuals:

- Appears in each recipient's direct chatbox with the sender.

Broadcast to group:

- Appears in the selected group chatbox.

Broadcast content may include:

- Heading
- Body
- Attachment, if allowed
- In-app link or button
- Source module label, if system-generated

Broadcast replies:

- If the broadcast appears in a direct chatbox, reply continues in that direct chatbox.
- If the broadcast appears in a group, reply behavior follows group permissions.

---

## SECTION 16 - MESSAGE TYPES AND MEDIA

Messenger supports:

- Text messages
- Images
- PDFs
- Voice notes
- System-generated Calendar messages
- System-generated Task messages
- System-generated Homework messages
- System-generated Attendance alerts
- Broadcast messages

Unsupported for now:

- Direct video upload
- Voice calls
- Video calls
- Status/story posts
- Communities
- Payments
- Public student directory
- Linked devices
- External social sharing

Allowed file size limits should be finalized before build.

Voice note sending is allowed for Principal and staff by default.

Student voice note sending is not enabled by default unless the school explicitly allows it later.

---

## SECTION 17 - MESSAGE DELETION, EDITING, AND AUDIT

Users can delete their own normal message only within the allowed time window.

Current rule:

- Own message deletion allowed within 2 minutes.
- After 2 minutes, normal messages are permanent for users.
- Deleted messages should remain in audit records.

Principal and Master Admin can delete or moderate any message according to school safety rules.

Admin moderation is configurable.

System-generated messages should not be editable by users.

If a source module changes, the system should send a new update message or mark the old system message obsolete, rather than manually editing the original message.

---

## SECTION 18 - READ RECEIPTS, DELIVERY, AND LAST SEEN

Messenger should support:

- Sent status
- Delivered status
- Read status
- Unread count
- Last seen or online indicator, if enabled

Last seen visibility should be controlled by a Principal / Master Admin setting.

Read receipts are important for accountability in staff communication, task assignment, and school notices.

---

## SECTION 19 - SEARCH RULES

Messenger search must respect visibility permissions.

Users can search:

- Contacts they are allowed to see
- Groups they are members of
- Message text inside accessible chats
- System messages inside accessible chats

Student search must never expose unrelated students.

Staff search must respect the staff member's permission toggles and assignment boundaries.

Search should not expose hidden previous chats when a permission has been disabled.

---

## SECTION 20 - NOTIFICATIONS

Messenger supports in-app and push notification behavior.

Notification examples:

- New direct message
- New group message
- Calendar broadcast
- Task assigned
- Task reassigned
- Homework assigned
- Homework reviewed
- Attendance warning

Notifications should respect:

- User role
- Conversation mute settings
- Module-level importance
- School-level notification settings
- Calendar send-message checkbox
- Calendar scheduled message time

Critical system alerts may ignore mute settings if the school decides so.

---

## SECTION 21 - ARCHIVE, SAFETY, AND MODERATION

Messenger must support school safety and accountability.

Audit expectations:

- Chat history should be preserved.
- Deleted messages should remain in audit records.
- System-generated messages should remain traceable to their source module.
- Principal and Master Admin can access archive/audit views.
- Admin archive/audit access is configurable.
- Super Admin cannot access school Messenger content.

Moderation expectations:

- Principal and Master Admin can moderate school chats.
- Admin moderation is configurable.
- Group Head can moderate the group according to granted permissions.
- Students cannot moderate chats.

---

## SECTION 22 - UI EXPECTATIONS

Messenger should include:

- Chat list
- Direct chat view
- Group chat view
- Broadcast sending screen
- Search
- Attachment picker
- Voice note control
- Read receipts
- Unread count
- Mute/archive options
- Messenger settings
- Tag management for staff
- Permission settings for staff chat visibility
- System message cards for Calendar, Task, Homework, and Attendance

System message cards should look different from normal chat bubbles so users understand they came from SHARP.

### Staff-Student Chat Heading

For Staff side, the chat heading should show:

- Student profile picture
- Student name
- Father's name
- Class
- Section

For Student side, the chat heading should show:

- Staff name
- Messenger tag
- Applicable context such as Class-Subject, Class Teacher, Coordinator, or Department name

If a staff member has multiple roles for the same student, there is still only one chatbox between them.

---

## SECTION 23 - SETTINGS FILE

Messenger defaults and configurable permissions are maintained in:

- `MESSENGER_SETTING.md`

That file owns:

- Default student visibility
- Default teacher visibility
- Academic staff chat with students setting
- Staff chat permission toggles
- Group defaults
- Voice note defaults
- Chatbox behavior after permission changes
- Messenger tag settings
- Staff-student chat heading rules

---

## SECTION 24 - OPEN ITEMS

### Calendar Integration

Calendar still needs deeper planning.

Pending Calendar details:

- Exact Calendar recipient field behavior
- Whether recipient controls visibility, notification, or both
- Scheduled Messenger message behavior
- Calendar broadcast behavior for mixed recipients and groups

### Homework Integration

Homework Messenger rules are still light and will be planned later.

Pending Homework details:

- Should homework assignment appear in class group, direct student chats, or both?
- Should homework review messages be direct only?
- Should homework reminders be automatic?

---

## SECTION 25 - OPEN QUESTIONS

- What is the maximum allowed file size for images, PDFs, and voice notes?
- Should Principal be able to disable student replies in all groups at school level?
- Should Group Head be able to delete student messages?
- Should Calendar broadcast use direct chatboxes only, group chatboxes only, or both depending on recipient type?
- Should critical Calendar broadcasts ignore muted chats?
- Should users be able to edit normal text messages within a time limit, or only delete?
- Should staff Messenger activation be blocked until all required mappings are complete?
