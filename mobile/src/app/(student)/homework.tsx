import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AgendaCalendar,
  type AgendaCategory,
  type AgendaItem,
} from '@/components/calendar/agenda-calendar';

const HOMEWORK_CATEGORIES: AgendaCategory[] = [
  {
    id: 'science',
    label: 'Science',
    shortLabel: 'Sci',
    iconColor: '#16a34a',
    badgeClassName: 'bg-green-600',
  },
  {
    id: 'english',
    label: 'English',
    shortLabel: 'Eng',
    iconColor: '#ba1a1a',
    badgeClassName: 'bg-error',
  },
  {
    id: 'mathematics',
    label: 'Mathematics',
    shortLabel: 'Math',
    iconColor: '#000000',
    badgeClassName: 'bg-primary',
  },
  {
    id: 'art',
    label: 'Art',
    shortLabel: 'Art',
    iconColor: '#ad2274',
    badgeClassName: 'bg-tertiary',
  },
  {
    id: 'social-studies',
    label: 'Social Studies',
    shortLabel: 'SS',
    iconColor: '#7c3aed',
    badgeClassName: 'bg-violet-600',
  },
  {
    id: 'environmental-studies',
    label: 'Environmental Studies',
    shortLabel: 'EVS',
    iconColor: '#0f766e',
    badgeClassName: 'bg-teal-700',
  },
  {
    id: 'hindi',
    label: 'Hindi',
    shortLabel: 'Hin',
    iconColor: '#b45309',
    badgeClassName: 'bg-amber-700',
  },
  {
    id: 'biology',
    label: 'Biology',
    shortLabel: 'Bio',
    iconColor: '#15803d',
    badgeClassName: 'bg-green-700',
  },
  {
    id: 'physical-education',
    label: 'Physical Education',
    shortLabel: 'PE',
    iconColor: '#c2410c',
    badgeClassName: 'bg-orange-600',
  },
];

const HOMEWORK_ITEMS: AgendaItem[] = [
  {
    id: '2026-07-12-science',
    date: '2026-07-12',
    time: '09:00 AM',
    categoryId: 'science',
    title: 'Cell Mitosis Worksheet',
    description:
      'Label the stages of mitosis and answer the short response questions. Use colored pencils for the chromosome diagrams.',
    owner: 'Dr. Ramesh Kumar',
  },
  {
    id: '2026-07-12-english',
    date: '2026-07-12',
    time: '09:15 AM',
    categoryId: 'english',
    title: 'Essay Draft 2',
    description:
      'Revise the introduction and conclusion of your essay. Bring one printed copy for peer review and upload the digital draft before class.',
    owner: 'Mrs. Roberts',
    attachments: [{ id: 'essay-rubric', kind: 'file', label: 'Essay rubric.pdf' }],
  },
  {
    id: '2026-07-12-math',
    date: '2026-07-12',
    time: '09:30 AM',
    categoryId: 'mathematics',
    title: 'Trigonometric Identities',
    description:
      'Complete the review exercises for trigonometric identities. Show each proof step clearly and mark the formulas used beside the solution.',
    owner: 'Mr. Kapoor',
    attachments: [{ id: 'math-formula-sheet', kind: 'file', label: 'Formula sheet.pdf' }],
  },
  {
    id: '2026-07-12-art',
    date: '2026-07-12',
    time: '09:45 AM',
    categoryId: 'art',
    title: 'Color Theory Assignment',
    description:
      'Create a six-panel color harmony study using complementary, analogous, and triadic combinations.',
    owner: 'Mr. Jenkins',
    attachments: [{ id: 'palette-guide', kind: 'link', label: 'Digital palette guide' }],
  },
  {
    id: '2026-07-12-social-studies',
    date: '2026-07-12',
    time: '10:00 AM',
    categoryId: 'social-studies',
    title: 'Map Skills Worksheet',
    description:
      'Complete the map-reading worksheet and mark the requested rivers, plateaus, and neighboring states clearly.',
    owner: 'Ms. Iyer',
  },
  {
    id: '2026-07-12-evs',
    date: '2026-07-12',
    time: '10:15 AM',
    categoryId: 'environmental-studies',
    title: 'Water Conservation Notes',
    description:
      'Write five points on water conservation and paste one local newspaper clipping related to the topic.',
    owner: 'Mrs. Menon',
  },
  {
    id: '2026-07-12-hindi',
    date: '2026-07-12',
    time: '10:30 AM',
    categoryId: 'hindi',
    title: 'Poem Recitation Prep',
    description:
      'Practice the assigned poem and write the meanings of the highlighted words in your notebook.',
    owner: 'Mrs. Sharma',
  },
  {
    id: '2026-07-12-biology',
    date: '2026-07-12',
    time: '10:45 AM',
    categoryId: 'biology',
    title: 'Plant Tissue Diagram',
    description:
      'Draw and label the plant tissue diagram, then answer the two short questions below it.',
    owner: 'Dr. Ramesh Kumar',
  },
  {
    id: '2026-07-15-science',
    date: '2026-07-15',
    time: '09:45 AM',
    categoryId: 'science',
    title: 'Lab Observation Notes',
    description:
      'Write the observations from the osmosis experiment and include one conclusion paragraph.',
    owner: 'Dr. Ramesh Kumar',
  },
  {
    id: '2026-07-15-english',
    date: '2026-07-15',
    time: '12:20 PM',
    categoryId: 'english',
    title: 'Reading Journal',
    description:
      'Read chapters 5-7 and write three journal entries with evidence from the text.',
    owner: 'Mrs. Roberts',
  },
  {
    id: '2026-07-17-math',
    date: '2026-07-17',
    time: '09:15 AM',
    categoryId: 'mathematics',
    title: 'Complete Algebra Chapter 4 Review Exercises',
    description:
      'Finish the chapter review exercises and show all working steps. Mark any difficult questions for discussion in the next class.',
    owner: 'Mr. Kapoor',
    attachments: [{ id: 'algebra-review', kind: 'file', label: 'Chapter 4 review worksheet.pdf' }],
  },
  {
    id: '2026-07-17-english',
    date: '2026-07-17',
    time: '10:30 AM',
    categoryId: 'english',
    title: 'Read chapters 5-7',
    description:
      'Read chapters 5-7 of To Kill a Mockingbird and write five vocabulary notes with page references.',
    owner: 'Mrs. Roberts',
  },
  {
    id: '2026-07-17-science',
    date: '2026-07-17',
    time: '11:45 AM',
    categoryId: 'science',
    title: 'Lab report on chemical reactions',
    description:
      'Complete the lab report conclusion and attach your observation table. Include one safety note from the experiment.',
    owner: 'Dr. Ramesh Kumar',
    attachments: [{ id: 'lab-template', kind: 'file', label: 'Lab report template.docx' }],
  },
  {
    id: '2026-07-17-pe',
    date: '2026-07-17',
    time: '01:00 PM',
    categoryId: 'physical-education',
    title: 'Bring proper athletic gear for track practice',
    description:
      'Carry running shoes, water bottle, and the signed practice checklist. Relay teams will be finalized during class.',
    owner: 'Coach Davis',
  },
  {
    id: '2026-07-18-math',
    date: '2026-07-18',
    time: '08:50 AM',
    categoryId: 'mathematics',
    title: 'Algebra Review Set',
    description:
      'Solve the mixed algebra review set. Circle any questions you want reviewed in class.',
    owner: 'Mr. Kapoor',
  },
  {
    id: '2026-07-21-art',
    date: '2026-07-21',
    time: '01:30 PM',
    categoryId: 'art',
    title: 'Sketchbook Check',
    description:
      'Submit five observational sketches from daily objects. Focus on shadow and proportion.',
    owner: 'Mr. Jenkins',
  },
  {
    id: '2026-07-24-pe',
    date: '2026-07-24',
    time: '10:00 AM',
    categoryId: 'physical-education',
    title: 'Fitness Log',
    description:
      'Update your weekly fitness log and add one reflection about endurance improvement.',
    owner: 'Coach Davis',
  },
];

export default function HomeworkScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9ff' }} edges={['top']}>
      <AgendaCalendar
        title="Homework"
        initialDate="2026-07-12"
        categories={HOMEWORK_CATEGORIES}
        items={HOMEWORK_ITEMS}
      />
    </SafeAreaView>
  );
}
