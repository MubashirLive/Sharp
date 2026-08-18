# SHARP - Messenger Settings

> Last updated: 2026-06-17
> Status: 📝 Spec only. This file defines Messenger defaults, configurable settings, and permission behavior. Settings UI is not yet built — defaults are currently hardcoded in `src/pages/Messenger.tsx` and enforced by RLS.

---
## Rough Notes
Permission to allow the students to send the messages to -: Principal, Master Admin, Admin, Departmental Incharge.

## SECTION 1 - PURPOSE

Messenger Settings controls who can see, search, chat, send, and participate inside Messenger.

`MESSENGER.md` defines the Messenger feature. This file defines the default settings and configurable rules behind it.

---

## SECTION 2 - DEFAULT STUDENT VISIBILITY

By default, Student / Parent can see only:

- Assigned Subject Teachers
- Assigned Class Teacher
- Departmental Incharge IDs visible to students

Student / Parent cannot see:

- Other students in direct search
- All teachers
- All staff
- Department members
- Non-incharge department staff

Students can see one another only inside approved groups where they are both members.

---

## SECTION 3 - DEFAULT ACADEMIC STAFF VISIBILITY

By default, Teacher / Academic Staff can see and chat only with students of classes where the staff member is:

- Assigned as Subject Teacher
- Assigned as Class Teacher

Smart Search must show only permitted students.

Subject Teacher allocation comes from:

- Subject tab of My School
- Role Manager, where applicable

Class Teacher allocation comes from:

- Subject tab of My School
- Role Manager

Both gateways edit the same shared assignment state; Messenger Settings consumes the saved result only.

If the staff member has no subject, class, section, or class-teacher mapping, student chat visibility should remain empty until mapping is completed.

---

## SECTION 4 - ACADEMIC STAFF CHAT WITH STUDENTS SETTING

Principal / Master Admin can configure Academic Staff chat visibility with students.

Options:

### Whole School

Academic Staff can see and chat with all students in the school.

This is the broadest option.

### Wing

Academic Staff can see and chat with students in their assigned wing.

This depends on wing assignment from My School / Wing tab / Role Manager.

### Allocated Classes / Students

Academic Staff can see and chat only with students from:

- Assigned subject class-section combinations
- Assigned Class Teacher class-section

This is the default.

### None

Academic Staff cannot see or chat with students.

Existing staff-student chatboxes remain visible if history exists, but the write message field is disabled.

---

## SECTION 5 - STUDENT-VISIBLE DEPARTMENT CONTACTS

Students can see only Departmental Incharge IDs in Messenger.

Examples:

- Transport Incharge
- Fees Incharge
- Library Incharge
- Support Incharge
- Counselor Incharge, if used by the school

Students cannot see department members unless that member is assigned as the Departmental Incharge or is otherwise explicitly exposed later by a confirmed rule.

---

## SECTION 6 - STAFF CHAT PERMISSION TOGGLES

Principal / Master Admin can customize Messenger permissions for individual staff.

Default: all checkboxes are enabled unless changed.

Staff toggles:

- Can send message to Staff.
- Can send message to Student / Parent.
- Can send message to Principal and Master Admin.

If a permission is disabled:

- The user cannot start new chats in that category.
- Smart Search does not show new contacts from that category.
- Existing chatboxes remain visible if there is chat history.
- The write message field disappears or becomes disabled.
- The chatbox shows: "You don't have permission to write messages here."

Chat history is not deleted.

If permission is restored, the chatbox becomes writable again.

---

## SECTION 7 - BROADCAST SETTINGS

Broadcast means bulk sending the same message to multiple recipients.

Broadcast does not mean a separate broadcast channel.

Broadcast to individual recipients:

- Uses the same direct chatbox between sender and recipient.
- The sender is the same person in all recipient chatboxes.

Broadcast to group recipients:

- Uses the selected group chatbox.

Manual broadcast creation:

- Principal: allowed.
- Master Admin: allowed.
- Admin: configurable.
- Teacher: disabled by default.
- Non-Teaching Staff: disabled by default.
- Student / Parent: not allowed.

Calendar broadcast:

- Controlled by Calendar recipient selection.
- Controlled by the Calendar send-message checkbox.
- May send immediately or at scheduled time.

---

## SECTION 8 - GROUP DEFAULTS

Principal and Master Admin automatically become Group Head by default.

This is dynamic:

- When a staff ID becomes Master Admin, that ID automatically gains Master Admin-based Group Head rights.
- When Master Admin status is removed, those Group Head rights are removed automatically.

Student group sending:

- Disabled by default.
- Can be enabled by Group Head.

Students can see other students only inside groups where both are members.

Direct-chat visibility restrictions do not prevent valid group members from seeing each other inside that group.

Group creation and member addition must still follow permissions.

---

## SECTION 9 - AUTO-GROUP SETTINGS

Messenger creates some groups automatically from school setup.

### Department Group

Created when a department is created.

Default members:

- Departmental Incharge
- Department members
- Principal
- Master Admin

### Wing Staff Group

Created when a wing is created.

Default members:

- Coordinator of that wing
- Teachers assigned to that wing
- Principal
- Master Admin

Future auto-groups may include:

- Class + section group
- Class + subject group
- All staff group
- Admin group

---

## SECTION 10 - MESSENGER TAG SETTINGS

Messenger tag appears below or near the user's name to identify them quickly.

### Student Tag

Student tag is auto-generated from class and section.

Example:

- `9th A Student`
- `Class 6 B Student`

### Staff Tag

Staff tag is assigned by Principal / Master Admin.

Rules:

- Each staff member can have only one Messenger tag.
- Tag can be selected from available tags or custom-written.
- If no tag is assigned, the tag area remains empty.
- Staff tag is managed from Messenger Settings or Role Manager, depending on final UI placement.

Messenger tag is only an identity label. It does not grant permission by itself.

---

## SECTION 11 - STAFF-STUDENT CHATBOX HEADING

There is always one chatbox between one staff member and one permitted student.

If the staff member has multiple roles connected to the same student, the roles appear as context in the same chatbox. They do not create multiple chatboxes.

### Staff Side Heading

When staff opens a student chatbox, the heading should show:

- Student profile picture
- Student name
- Father's name
- Class
- Section

### Student Side Heading

When Student / Parent opens a staff chatbox, the heading should show:

- Staff name
- Messenger tag
- Applicable context such as:
  - Class-Subject
  - Class Teacher
  - Coordinator
  - Department name

Show only the context that applies to that staff-student relationship.

---

## SECTION 12 - VOICE NOTE DEFAULT

Principal and all staff can send voice notes by default.

Student / Parent voice note sending is not enabled by default.

Student / Parent voice note sending can be planned later if the school wants it.

---

## SECTION 13 - LAST SEEN AND READ RECEIPTS

Last seen visibility should be controlled by Principal / Master Admin.

Read receipts are enabled by default because they support accountability in:

- Task assignment
- Staff communication
- Notices
- Student/parent communication

Possible future setting:

- Hide last seen for students
- Hide last seen for all users
- Show last seen only to direct chat participants

---

## SECTION 14 - SETTINGS ACCESS

Who can manage Messenger Settings:

- Principal: full access.
- Master Admin: full access unless Principal reserves a setting.
- Admin: configurable.
- Teacher: no settings access by default.
- Non-Teaching Staff: no settings access by default.
- Student / Parent: no settings access except personal mute/notification preferences if added later.

---

## SECTION 15 - OPEN QUESTIONS

- Should Messenger tag be edited only from Messenger Settings, only from Role Manager, or both?
- Should staff voice notes have a maximum duration?
- Should student voice notes remain permanently disabled or become configurable?
- Should blocked chatboxes show previous messages fully or only a restricted notice?
- Should read receipts ever be disabled for student/parent conversations?
- Should Group Head be able to delete student messages?
- Should Calendar broadcast allow separate visibility and recipient settings?
