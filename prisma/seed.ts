import { PrismaClient, Role, VerificationStatus, ApplicationStatus, ScheduleScope, NotificationTopic } from '../generated/prisma/client.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { hashPassword } from '../src/shared/helpers/password.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PASSWORD = 'password123';
const PLATFORM_COMMISSION_RATE = 0.1;

function daysFromNow(days: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

let phoneCounter = 1;
function phone() {
  return `+251911${String(phoneCounter++).padStart(6, '0')}`;
}

interface PersonSeed {
  email: string;
  firstName: string;
  lastName: string;
  birth: string;
}

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Clean existing data (reverse dependency order) ────────
  await prisma.passwordResetToken.deleteMany();
  await prisma.notificationRecipient.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.staffApplication.deleteMany();
  await prisma.staffApplicationPost.deleteMany();
  await prisma.applicationFormTemplate.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.scheduleEvent.deleteMany();
  await prisma.studentReport.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.courseResult.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.task.deleteMany();
  await prisma.classroomCourse.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.course.deleteMany();
  await prisma.classroomMentor.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.practiceElsewhereRequest.deleteMany();
  await prisma.schoolAgreement.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  console.log('  ✓ Cleaned existing data');

  const passwordHash = await hashPassword(PASSWORD);

  interface UserRow {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    schoolId: string | null;
  }

  async function createUser(
    person: PersonSeed,
    role: Role,
    schoolId: string | null,
    verificationStatus: VerificationStatus = VerificationStatus.VERIFIED,
  ): Promise<UserRow> {
    const user = await prisma.user.create({
      data: {
        email: person.email,
        phone: phone(),
        passwordHash,
        firstName: person.firstName,
        lastName: person.lastName,
        role,
        verificationStatus,
        dateOfBirth: new Date(person.birth),
        schoolId,
      },
    });
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role,
      schoolId,
    };
  }

  // ─── Schools ───────────────────────────────────────────────
  const schoolA = await prisma.school.create({
    data: {
      name: 'Addis Driving Academy',
      description:
        'Premier driving school in Addis Ababa with modern vehicles and experienced instructors.',
      rating: 0,
      status: 'ACTIVE',
    },
  });
  const schoolB = await prisma.school.create({
    data: {
      name: 'Bole Driving School',
      description:
        'Affordable and reliable driving education in Bole sub-city.',
      rating: 0,
      status: 'ACTIVE',
    },
  });
  const schoolC = await prisma.school.create({
    data: {
      name: 'Megenagna Traffic & Driving Institute',
      description:
        'Certified training center near Megenagna with motorcycle and light-vehicle programs.',
      rating: 0,
      status: 'ACTIVE',
    },
  });
  const schoolD = await prisma.school.create({
    data: {
      name: 'Ayat Driving Center',
      description:
        'New driving center serving Ayat and surrounding neighborhoods. Awaiting final platform approval.',
      rating: 0,
      status: 'PENDING_APPROVAL',
    },
  });

  const schools = { A: schoolA, B: schoolB, C: schoolC, D: schoolD };
  console.log('  ✓ Created 4 schools');

  // ─── Branches ──────────────────────────────────────────────
  await prisma.branch.createMany({
    data: [
      { schoolId: schoolA.id, name: 'Piassa Branch', address: 'Piassa, Addis Ababa', latitude: 9.034, longitude: 38.7469 },
      { schoolId: schoolA.id, name: 'Mexico Branch', address: 'Mexico Square, Addis Ababa', latitude: 9.0105, longitude: 38.7468 },
      { schoolId: schoolA.id, name: 'Kality Branch', address: 'Kality Total, Addis Ababa', latitude: 8.9936, longitude: 38.7872 },
      { schoolId: schoolB.id, name: 'Bole Main', address: 'Bole Road, Addis Ababa', latitude: 9.0054, longitude: 38.7636 },
      { schoolId: schoolB.id, name: 'Gerji Branch', address: 'Gerji Mebrat Hail, Addis Ababa', latitude: 8.9956, longitude: 38.7893 },
      { schoolId: schoolC.id, name: 'Megenagna Main', address: 'Megenagna 24, Addis Ababa', latitude: 9.025, longitude: 38.8016 },
      { schoolId: schoolC.id, name: 'Kotebe Branch', address: 'Kotebe, Addis Ababa', latitude: 9.0525, longitude: 38.8213 },
      { schoolId: schoolD.id, name: 'Ayat Main', address: 'Ayat Avenue, Addis Ababa', latitude: 9.0113, longitude: 38.8513 },
    ],
  });
  console.log('  ✓ Created branches');

  // ─── Platform super admin (no school — platform-wide) ──────
  const superAdmin = await createUser(
    { email: 'superadmin@shumshufer.com', firstName: 'Platform', lastName: 'Admin', birth: '1985-03-15' },
    Role.SUPER_ADMIN,
    null,
  );

  // ─── Per-school staff: every school gets admin + ed head ───
  const staffSpec: Array<{
    key: 'A' | 'B' | 'C' | 'D';
    school: string;
    admins: PersonSeed[];
    edheads: PersonSeed[];
    mentors: PersonSeed[];
  }> = [
    {
      key: 'A',
      school: schoolA.id,
      admins: [{ email: 'admin@addisdriving.com', firstName: 'Abebe', lastName: 'Kebede', birth: '1988-07-20' }],
      edheads: [{ email: 'edhead@addisdriving.com', firstName: 'Tigist', lastName: 'Haile', birth: '1990-01-10' }],
      mentors: [
        { email: 'mentor1@addisdriving.com', firstName: 'Dawit', lastName: 'Mekonnen', birth: '1992-05-22' },
        { email: 'mentor2@addisdriving.com', firstName: 'Selam', lastName: 'Teshome', birth: '1993-09-14' },
        { email: 'mentor3@addisdriving.com', firstName: 'Yohannes', lastName: 'Bekele', birth: '1991-02-03' },
      ],
    },
    {
      key: 'B',
      school: schoolB.id,
      admins: [{ email: 'admin@boledriving.com', firstName: 'Solomon', lastName: 'Worku', birth: '1987-12-01' }],
      edheads: [{ email: 'edhead@boledriving.com', firstName: 'Hanna', lastName: 'Gebre', birth: '1989-06-11' }],
      mentors: [
        { email: 'mentor1@boledriving.com', firstName: 'Mulugeta', lastName: 'Assefa', birth: '1990-08-19' },
        { email: 'mentor2@boledriving.com', firstName: 'Bethlehem', lastName: 'Negash', birth: '1994-04-27' },
        { email: 'mentor3@boledriving.com', firstName: 'Kalkidan', lastName: 'Alemayehu', birth: '1993-11-05' },
      ],
    },
    {
      key: 'C',
      school: schoolC.id,
      admins: [{ email: 'admin@megenegnadriving.com', firstName: 'Getachew', lastName: 'Fikru', birth: '1986-02-14' }],
      edheads: [{ email: 'edhead@megenegnadriving.com', firstName: 'Rahel', lastName: 'Tadesse', birth: '1991-10-30' }],
      mentors: [
        { email: 'mentor1@megenegnadriving.com', firstName: 'Tesfaye', lastName: 'Girma', birth: '1989-12-09' },
        { email: 'mentor2@megenegnadriving.com', firstName: 'Liya', lastName: 'Kebede', birth: '1995-03-23' },
      ],
    },
    {
      key: 'D',
      school: schoolD.id,
      admins: [{ email: 'admin@ayatdriving.com', firstName: 'Nahom', lastName: 'Zeleke', birth: '1990-05-17' }],
      edheads: [{ email: 'edhead@ayatdriving.com', firstName: 'Mahlet', lastName: 'Abera', birth: '1992-07-08' }],
      mentors: [
        { email: 'mentor1@ayatdriving.com', firstName: 'Biruk', lastName: 'Hailu', birth: '1993-01-26' },
      ],
    },
  ];

  type StaffKey = 'A' | 'B' | 'C' | 'D';

  type SchoolStaff = {
    schoolId: string;
    key: StaffKey;
    admin: UserRow;
    edhead: UserRow;
    // Seeded mentor counts per school cover every index accessed below.
    mentors: [UserRow, UserRow, UserRow, ...UserRow[]];
  };

  const staff = {} as Record<StaffKey, SchoolStaff>;
  for (const spec of staffSpec) {
    const admins = await Promise.all(
      spec.admins.map((p) => createUser(p, Role.ADMIN, spec.school)),
    );
    const heads = await Promise.all(
      spec.edheads.map((p) => createUser(p, Role.EDUCATION_HEAD, spec.school)),
    );
    const createdMentors = await Promise.all(
      spec.mentors.map((p) => createUser(p, Role.MENTOR, spec.school)),
    );
    const admin = admins[0];
    const edhead = heads[0];
    if (!admin || !edhead) throw new Error(`School ${spec.key} needs an admin and an education head`);
    staff[spec.key] = {
      schoolId: spec.school,
      key: spec.key,
      admin,
      edhead,
      mentors: createdMentors as [UserRow, UserRow, UserRow, ...UserRow[]],
    };
  }
  console.log('  ✓ Created staff (every school has admin + education head + mentors)');

  // ─── Students ──────────────────────────────────────────────
  const studentNames: Array<[string, string, string]> = [
    ['student1@gmail.com', 'Kidist', 'Alemu'],
    ['student2@gmail.com', 'Yonas', 'Girma'],
    ['student3@gmail.com', 'Meron', 'Tadesse'],
    ['student4@gmail.com', 'Nathan', 'Wolde'],
    ['student5@gmail.com', 'Sara', 'Bekele'],
    ['student6@gmail.com', 'Abel', 'Mengistu'],
    ['student7@gmail.com', 'Hiwot', 'Assefa'],
    ['student8@gmail.com', 'Robel', 'Tsegaye'],
    ['student9@gmail.com', 'Lidya', 'Fekadu'],
    ['student10@gmail.com', 'Samuel', 'Desta'],
    ['student11@gmail.com', 'Genet', 'Haile'],
    ['student12@gmail.com', 'Eyob', 'Kassa'],
    ['student13@gmail.com', 'Tsehay', 'Belay'],
    ['student14@gmail.com', 'Fikir', 'Tefera'],
    ['student15@gmail.com', 'Dagim', 'Solomon'],
    ['student16@gmail.com', 'Betty', 'Girmay'],
    ['student17@gmail.com', 'Naod', 'Endale'],
    ['student18@gmail.com', 'Rahel', 'Shiferaw'],
    ['student19@gmail.com', 'Kenenisa', 'Bikila'],
    ['student20@gmail.com', 'Meseret', 'Defar'],
    ['student21@gmail.com', 'Chala', 'Bekele'],
    ['student22@gmail.com', 'Amira', 'Hussein'],
    ['student23@gmail.com', 'Bereket', 'Simon'],
    ['student24@gmail.com', 'Eden', 'Mekuria'],
  ];

  const studentRows = [] as Array<{ id: string; email: string; index: number }>;
  for (const [i, entry] of studentNames.entries()) {
    const [email, firstName, lastName] = entry;
    const year = 1999 + (i % 6);
    const user = await createUser(
      { email, firstName, lastName, birth: `${year}-0${(i % 9) + 1}-1${i % 9}` },
      Role.STUDENT,
      null,
      i === 22 ? VerificationStatus.PENDING : VerificationStatus.VERIFIED,
    );
    studentRows.push({ id: user.id, email, index: i + 1 });
  }

  const sid = (n: number) => {
    const row = studentRows[n - 1];
    if (!row) throw new Error(`No seeded student #${n}`);
    return row.id;
  };
  console.log('  ✓ Created 24 students');

  // ─── Classrooms (each with mentors from its own school) ────
  const classroomA1 = await prisma.classroom.create({ data: { schoolId: schoolA.id, name: 'Batch 2026 - Morning' } });
  const classroomA2 = await prisma.classroom.create({ data: { schoolId: schoolA.id, name: 'Batch 2026 - Afternoon' } });
  const classroomB1 = await prisma.classroom.create({ data: { schoolId: schoolB.id, name: 'Evening Batch 1' } });
  const classroomB2 = await prisma.classroom.create({ data: { schoolId: schoolB.id, name: 'Weekend Intensive' } });
  const classroomC1 = await prisma.classroom.create({ data: { schoolId: schoolC.id, name: 'Light Vehicle - Morning' } });
  const classroomC2 = await prisma.classroom.create({ data: { schoolId: schoolC.id, name: 'Motorcycle Batch 1' } });
  const classroomD1 = await prisma.classroom.create({ data: { schoolId: schoolD.id, name: 'Founders Batch' } });

  await prisma.classroomMentor.createMany({
    data: [
      { classroomId: classroomA1.id, mentorId: staff.A.mentors[0].id },
      { classroomId: classroomA1.id, mentorId: staff.A.mentors[1].id },
      { classroomId: classroomA2.id, mentorId: staff.A.mentors[1].id },
      { classroomId: classroomA2.id, mentorId: staff.A.mentors[2].id },
      { classroomId: classroomB1.id, mentorId: staff.B.mentors[0].id },
      { classroomId: classroomB1.id, mentorId: staff.B.mentors[2].id },
      { classroomId: classroomB2.id, mentorId: staff.B.mentors[1].id },
      { classroomId: classroomC1.id, mentorId: staff.C.mentors[0].id },
      { classroomId: classroomC2.id, mentorId: staff.C.mentors[1].id },
      { classroomId: classroomD1.id, mentorId: staff.D.mentors[0].id },
    ],
  });
  console.log('  ✓ Created 7 classrooms with assigned mentors');

  // ─── Courses (every course belongs to a school) ────────────
  interface TopicSeed {
    title: string;
    content: string;
    quiz?: {
      title: string;
      passScore: number;
      questions: Array<{
        question: string;
        options: string[];
        correctOptionIndex: number;
        points: number;
      }>;
    };
  }

  async function createCourse(
    schoolId: string,
    title: string,
    description: string,
    price: number,
    topics: TopicSeed[],
    isFree = false,
  ) {
    const course = await prisma.course.create({
      data: { schoolId, title, description, price, isFree },
    });
    for (const [i, t] of topics.entries()) {
      const topic = await prisma.topic.create({
        data: { courseId: course.id, title: t.title, order: i + 1, content: t.content },
      });
      if (t.quiz) {
        await prisma.quiz.create({
          data: {
            topicId: topic.id,
            title: t.quiz.title,
            passScore: t.quiz.passScore,
            questions: t.quiz.questions,
          },
        });
      }
    }
    return course;
  }

  const q = (
    question: string,
    options: string[],
    correctOptionIndex: number,
    points = 10,
  ) => ({ question, options, correctOptionIndex, points });

  const courseATh = await createCourse(schoolA.id, 'Traffic Rules & Theory', 'Complete Ethiopian traffic law and road safety theory course.', 3500, [
    { title: 'Introduction to Traffic Law', content: 'Overview of Ethiopian traffic regulations and the role of the Transport Authority.', quiz: { title: 'Traffic Law Basics Quiz', passScore: 70, questions: [q('What is the legal minimum driving age for a private car in Ethiopia?', ['16', '17', '18', '21'], 2), q('Which authority issues driving licenses in Ethiopia?', ['Ministry of Education', 'Transport Authority', 'Federal Police', 'City Administration'], 1)] } },
    { title: 'Road Signs & Markings', content: 'Comprehensive guide to regulatory, warning, and informational road signs.', quiz: { title: 'Road Signs Quiz', passScore: 80, questions: [q('A red octagonal sign means?', ['Yield', 'Stop', 'No entry', 'Speed limit'], 1), q('Yellow diamond signs are typically?', ['Regulatory', 'Warning', 'Informational', 'Construction'], 1), q('A round blue sign indicates?', ['Prohibition', 'Mandatory action', 'Information', 'Warning'], 1)] } },
    { title: 'Right of Way', content: 'Rules governing right of way at intersections, roundabouts, and special zones.' },
    { title: 'Driving Under Adverse Conditions', content: 'Rain, fog, night driving, and unpaved roads around Addis Ababa.' },
  ]);

  const courseAPr = await createCourse(schoolA.id, 'Practical Driving', 'Behind-the-wheel training covering city driving, parking, and highway.', 8000, [
    { title: 'Vehicle Controls & Basics', content: 'Familiarization with pedals, steering, mirrors, and dashboard controls.' },
    { title: 'City Driving Maneuvers', content: 'Lane discipline, turns, U-turns, and negotiating busy intersections.' },
    { title: 'Parking & Low-Speed Control', content: 'Angle parking, parallel parking, hill starts, and three-point turns.' },
  ]);

  const courseADef = await createCourse(schoolA.id, 'Defensive Driving', 'Anticipating hazards and managing risk on Ethiopian roads.', 5500, [
    { title: 'Hazard Perception', content: 'Scanning techniques and following distance management.' },
    { title: 'Crash Avoidance Techniques', content: 'Emergency braking, skid control, and evasive steering.' },
  ]);

  await createCourse(schoolA.id, 'Road Safety Awareness', 'Free open course — basic road safety tips for pedestrians and drivers.', 0, [
    { title: 'Pedestrian Safety', content: 'Crossing rules, zebra crossings, and school-zone awareness.' },
    { title: 'Sharing the Road', content: 'Minibuses, motorcycles, livestock, and vulnerable road users.' },
  ], true);

  const courseBTh = await createCourse(schoolB.id, 'Bole Theory Program', 'Structured theory program aligned with the national exam.', 3000, [
    { title: 'Traffic Law Essentials', content: 'Core legal provisions every driver must know.', quiz: { title: 'Essentials Check Quiz', passScore: 70, questions: [q('Driving while using a handheld phone is…', ['Allowed in traffic jams', 'Always prohibited', 'Allowed on highways', 'Allowed with both hands'], 1)] } },
    { title: 'Vehicle Documents', content: 'Insurance, license classes, and inspection requirements.' },
    { title: 'Alcohol & Fatigue', content: 'Legal limits and impairment awareness.' },
  ]);

  const courseBPr = await createCourse(schoolB.id, 'Bole Practical Program', 'Route-based practical training around Bole and Gerji.', 7000, [
    { title: 'Basic Manuevers', content: 'Starting, stopping, steering, and gear work.' },
    { title: 'Test Route Practice', content: 'Mock exams on official testing routes.' },
  ]);

  const courseCTh = await createCourse(schoolC.id, 'Megenagna Theory Course', 'Light-vehicle theory with weekly mock examinations.', 3200, [
    { title: 'Signs & Signals', content: 'Traffic lights, officer signals, and signage systems.' },
    { title: 'Eco Driving', content: 'Fuel-efficient driving habits.' },
    { title: 'First Aid Basics', content: 'Responding to road accidents safely.' },
  ]);

  const courseCMo = await createCourse(schoolC.id, 'Motorcycle Riding Program', 'Two-wheeler control, gear work, and protective equipment.', 4500, [
    { title: 'Riding Gear & Safety', content: 'Helmets, visibility, and protective clothing.' },
    { title: 'Low-Speed Balance', content: 'Clutch control and balance drills.' },
  ]);

  const courseDTh = await createCourse(schoolD.id, 'Ayat Foundation Theory', 'Starter theory program for the founding batch.', 3500, [
    { title: 'Getting Started', content: 'License categories and the licensing journey.' },
    { title: 'Basic Traffic Rules', content: 'Fundamental rules of the road.' },
  ]);
  console.log('  ✓ Created 9 courses with topics & quizzes');

  // ─── Classroom ↔ Course links (ordered) ────────────────────
  await prisma.classroomCourse.createMany({
    data: [
      { classroomId: classroomA1.id, courseId: courseATh.id, order: 1, mandatory: true },
      { classroomId: classroomA1.id, courseId: courseAPr.id, order: 2, mandatory: true },
      { classroomId: classroomA2.id, courseId: courseATh.id, order: 1, mandatory: true },
      { classroomId: classroomA2.id, courseId: courseADef.id, order: 2, mandatory: false },
      { classroomId: classroomB1.id, courseId: courseBTh.id, order: 1, mandatory: true },
      { classroomId: classroomB1.id, courseId: courseBPr.id, order: 2, mandatory: true },
      { classroomId: classroomB2.id, courseId: courseBTh.id, order: 1, mandatory: true },
      { classroomId: classroomC1.id, courseId: courseCTh.id, order: 1, mandatory: true },
      { classroomId: classroomC2.id, courseId: courseCMo.id, order: 1, mandatory: true },
      { classroomId: classroomD1.id, courseId: courseDTh.id, order: 1, mandatory: true },
    ],
  });
  console.log('  ✓ Linked courses to classrooms');

  // ─── Enrollments (coherent: ACCEPTED ⇒ classroom + school binding) ───
  interface EnrollmentSeed {
    studentId: string;
    schoolId: string;
    classroomId: string | null;
    mode: 'ONLINE' | 'IN_PERSON';
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
    reviewer?: string | null;
    responses?: Record<string, string | boolean>;
    fee: number;
  }

  const feeBySchool: Record<string, number> = {
    [schoolA.id]: 3500,
    [schoolB.id]: 3000,
    [schoolC.id]: 3200,
    [schoolD.id]: 3500,
  };

  const enrollmentSeeds: EnrollmentSeed[] = [
    // School A — classroom A1 (morning)
    ...[1, 2, 3, 4].map((n, i): EnrollmentSeed => ({
      studentId: sid(n),
      schoolId: schoolA.id,
      classroomId: classroomA1.id,
      mode: i % 2 ? 'ONLINE' : 'IN_PERSON',
      status: 'ACCEPTED',
      reviewer: staff.A.admin.id,
      responses: { previousDrivingExperience: n % 2 === 0, preferredSchedule: 'morning', medicalConditions: '' },
      fee: 3500,
    })),
    // School A — classroom A2 (afternoon)
    ...[5, 6, 7, 8].map((n, i): EnrollmentSeed => ({
      studentId: sid(n),
      schoolId: schoolA.id,
      classroomId: classroomA2.id,
      mode: i % 2 ? 'ONLINE' : 'IN_PERSON',
      status: 'ACCEPTED',
      reviewer: staff.A.admin.id,
      responses: { previousDrivingExperience: false, preferredSchedule: 'afternoon', medicalConditions: '' },
      fee: 3500,
    })),
    // School A — pending / rejected / withdrawn
    { studentId: sid(9), schoolId: schoolA.id, classroomId: null, mode: 'ONLINE', status: 'PENDING', responses: { previousDrivingExperience: false, preferredSchedule: 'weekend' }, fee: 3500 },
    { studentId: sid(10), schoolId: schoolA.id, classroomId: null, mode: 'IN_PERSON', status: 'PENDING', responses: { previousDrivingExperience: true, preferredSchedule: 'evening' }, fee: 3500 },
    { studentId: sid(11), schoolId: schoolA.id, classroomId: null, mode: 'ONLINE', status: 'REJECTED', reviewer: staff.A.admin.id, responses: { previousDrivingExperience: false, preferredSchedule: 'morning' }, fee: 3500 },
    // School B
    ...[12, 13, 14, 15].map((n, i): EnrollmentSeed => ({
      studentId: sid(n),
      schoolId: schoolB.id,
      classroomId: classroomB1.id,
      mode: i % 2 ? 'ONLINE' : 'IN_PERSON',
      status: 'ACCEPTED',
      reviewer: staff.B.admin.id,
      responses: { previousDrivingExperience: n % 3 === 0, preferredSchedule: 'evening' },
      fee: 3000,
    })),
    ...[16, 17].map((n): EnrollmentSeed => ({
      studentId: sid(n),
      schoolId: schoolB.id,
      classroomId: classroomB2.id,
      mode: 'IN_PERSON',
      status: 'ACCEPTED',
      reviewer: staff.B.admin.id,
      responses: { previousDrivingExperience: false, preferredSchedule: 'weekend' },
      fee: 3000,
    })),
    { studentId: sid(18), schoolId: schoolB.id, classroomId: null, mode: 'ONLINE', status: 'PENDING', responses: { previousDrivingExperience: false, preferredSchedule: 'evening' }, fee: 3000 },
    // School C
    ...[19, 20, 21, 22].map((n, i): EnrollmentSeed => ({
      studentId: sid(n),
      schoolId: schoolC.id,
      classroomId: classroomC1.id,
      mode: i % 2 ? 'ONLINE' : 'IN_PERSON',
      status: 'ACCEPTED',
      reviewer: staff.C.admin.id,
      responses: { previousDrivingExperience: false, preferredSchedule: 'morning' },
      fee: 3200,
    })),
    // School D — awaiting approval so applications stay PENDING
    { studentId: sid(23), schoolId: schoolD.id, classroomId: null, mode: 'ONLINE', status: 'PENDING', responses: { previousDrivingExperience: false, preferredSchedule: 'morning' }, fee: 3500 },
    { studentId: sid(24), schoolId: schoolD.id, classroomId: null, mode: 'IN_PERSON', status: 'WITHDRAWN', responses: { previousDrivingExperience: false, preferredSchedule: 'weekend' }, fee: 3500 },
  ];

  const enrollments: Array<{ id: string; studentId: string; schoolId: string; classroomId: string | null; status: string }> = [];
  for (const e of enrollmentSeeds) {
    const created = await prisma.enrollment.create({
      data: {
        studentId: e.studentId,
        schoolId: e.schoolId,
        ...(e.classroomId ? { classroomId: e.classroomId } : {}),
        mode: e.mode,
        status: e.status,
        formResponses: e.responses ?? {},
        reviewedAt: e.reviewer && e.status !== 'PENDING' ? daysFromNow(-21) : null,
        reviewedById: e.status === 'PENDING' ? null : e.reviewer ?? null,
      },
    });
    enrollments.push({
      id: created.id,
      studentId: e.studentId,
      schoolId: e.schoolId,
      classroomId: e.classroomId,
      status: e.status,
    });
  }

  // Bind accepted students to their school (mirrors acceptApplication)
  const acceptedEnrollments = enrollments.filter((e) => e.status === 'ACCEPTED');
  for (const e of acceptedEnrollments) {
    await prisma.user.update({ where: { id: e.studentId }, data: { schoolId: e.schoolId } });
  }
  console.log(`  ✓ Created ${enrollments.length} enrollments (${acceptedEnrollments.length} accepted)`);

  const studentsIn = (classroomId: string) =>
    acceptedEnrollments.filter((e) => e.classroomId === classroomId).map((e) => e.studentId);

  // ─── Application form templates ────────────────────────────
  await prisma.applicationFormTemplate.createMany({
    data: [schoolA, schoolB, schoolC, schoolD].map((school) => ({
      schoolId: school.id,
      fields: [
        { key: 'previousDrivingExperience', label: 'Do you have previous driving experience?', type: 'boolean', required: true },
        { key: 'preferredSchedule', label: 'Preferred schedule', type: 'select', options: ['morning', 'afternoon', 'evening', 'weekend'], required: true },
        { key: 'medicalConditions', label: 'Any medical conditions we should know about?', type: 'text', required: false },
      ],
    })),
  });
  console.log('  ✓ Created application form templates');

  // ─── Agreements & practice elsewhere ───────────────────────
  await prisma.schoolAgreement.createMany({
    data: [
      { schoolAId: schoolA.id, schoolBId: schoolB.id, status: 'ACCEPTED', feeSplit: { homeSchoolPercent: 60, hostSchoolPercent: 40 } },
      { schoolAId: schoolA.id, schoolBId: schoolC.id, status: 'PENDING', feeSplit: { homeSchoolPercent: 55, hostSchoolPercent: 45 } },
      { schoolAId: schoolB.id, schoolBId: schoolC.id, status: 'REJECTED', feeSplit: { homeSchoolPercent: 50, hostSchoolPercent: 50 } },
    ],
  });

  const practiceAccepted = await prisma.practiceElsewhereRequest.create({
    data: { studentId: sid(1), homeSchoolId: schoolA.id, hostSchoolId: schoolB.id, status: 'ACCEPTED', fee: 1500 },
  });
  const practicePending = await prisma.practiceElsewhereRequest.create({
    data: { studentId: sid(12), homeSchoolId: schoolB.id, hostSchoolId: schoolA.id, status: 'PENDING', fee: 1800 },
  });
  await prisma.practiceElsewhereRequest.create({
    data: { studentId: sid(19), homeSchoolId: schoolC.id, hostSchoolId: schoolA.id, status: 'REJECTED', fee: 2000 },
  });
  console.log('  ✓ Created agreements & practice-elsewhere requests');

  // ─── Tasks (created by mentors assigned to the classroom) ──
  interface TaskSeed {
    classroomId: string;
    createdById: string;
    type: 'ASSIGNMENT' | 'QUIZ' | 'EXAM';
    title: string;
    description: string;
    deadlineDays: number; // negative = past
    attachments?: string[];
  }

  const taskSeeds: TaskSeed[] = [
    { classroomId: classroomA1.id, createdById: staff.A.mentors[0].id, type: 'ASSIGNMENT', title: 'Road Signs Identification', description: 'Identify and describe 20 road signs from the provided image sheet.', deadlineDays: 7 },
    { classroomId: classroomA1.id, createdById: staff.A.mentors[0].id, type: 'EXAM', title: 'Theory Mid-Term Exam', description: 'Covers traffic law, signs, and right-of-way chapters.', deadlineDays: 14 },
    { classroomId: classroomA1.id, createdById: staff.A.mentors[1].id, type: 'QUIZ', title: 'Controls Warm-up Quiz', description: 'Short in-class quiz on vehicle controls.', deadlineDays: -5, attachments: ['uploads/tasks/controls_warmup.pdf'] },
    { classroomId: classroomA2.id, createdById: staff.A.mentors[2].id, type: 'ASSIGNMENT', title: 'Hazard Perception Worksheet', description: 'Mark hazards on ten provided intersection photos.', deadlineDays: 10, attachments: ['uploads/tasks/hazard_photos.pdf'] },
    { classroomId: classroomB1.id, createdById: staff.B.mentors[0].id, type: 'ASSIGNMENT', title: 'Night Driving Report', description: 'Write a half-page reflection after the evening drive session.', deadlineDays: -3 },
    { classroomId: classroomB1.id, createdById: staff.B.mentors[2].id, type: 'EXAM', title: 'Final Theory Exam', description: 'Full-length mock of the national theory exam.', deadlineDays: 21 },
    { classroomId: classroomC1.id, createdById: staff.C.mentors[0].id, type: 'ASSIGNMENT', title: 'City Route Planning', description: 'Plan a route from Megenagna to Kality avoiding restricted turns.', deadlineDays: 5 },
    { classroomId: classroomC2.id, createdById: staff.C.mentors[1].id, type: 'QUIZ', title: 'Riding Gear Check', description: 'Quick quiz on protective equipment standards.', deadlineDays: 4 },
    { classroomId: classroomD1.id, createdById: staff.D.mentors[0].id, type: 'ASSIGNMENT', title: 'Welcome Assignment', description: 'Introduce yourself and your driving goals (one page).', deadlineDays: 12 },
  ];

  const tasks = [] as Array<{ id: string; classroomId: string; deadlineDays: number; title: string }>;
  for (const t of taskSeeds) {
    const created = await prisma.task.create({
      data: {
        classroomId: t.classroomId,
        createdById: t.createdById,
        type: t.type,
        title: t.title,
        description: t.description,
        attachments: t.attachments ?? [],
        deadline: daysFromNow(t.deadlineDays, 23, 59),
      },
    });
    tasks.push({ id: created.id, classroomId: t.classroomId, deadlineDays: t.deadlineDays, title: t.title });
  }
  console.log(`  ✓ Created ${tasks.length} tasks`);

  // ─── Submissions (only by students actually in the class) ──
  let submissionCount = 0;
  const gradeFeedback: Array<{ grade: number; feedback: string }> = [
    { grade: 92, feedback: 'Excellent detail — all signs correctly identified.' },
    { grade: 84, feedback: 'Good work; review regulatory vs warning signs.' },
    { grade: 75, feedback: 'Solid effort. Watch out for merged sign questions.' },
    { grade: 68, feedback: 'Several misses on roundabout rules — please revise chapter 3.' },
    { grade: 55, feedback: 'Needs improvement; retake opportunity will be scheduled.' },
  ];
  let gfIndex = 0;

  for (const task of tasks) {
    const roster = studentsIn(task.classroomId);
    if (!roster.length) continue;

    const isPast = task.deadlineDays < 0;
    const submitters = isPast ? roster : roster.slice(0, Math.max(1, Math.floor(roster.length / 2)));

    for (let i = 0; i < submitters.length; i++) {
      const studentId = submitters[i];
      const fb = gradeFeedback[gfIndex % gradeFeedback.length];
      gfIndex += 1;
      if (!studentId || !fb) continue;
      const graded = isPast || i % 3 === 0;
      await prisma.submission.create({
        data: {
          taskId: task.id,
          studentId,
          attachments: [`uploads/${studentId.slice(0, 8)}_${task.title.toLowerCase().replaceAll(' ', '_')}.pdf`],
          ...(graded
            ? {
                grade: fb.grade,
                feedback: fb.feedback,
                gradedAt: daysFromNow(Math.max(task.deadlineDays + 1, -1), 14, 30),
              }
            : {}),
        },
      });
      submissionCount++;
    }
  }
  console.log(`  ✓ Created ${submissionCount} submissions`);

  // ─── Course results (only for linked course/classroom pairs) ──
  const linkRows = await prisma.classroomCourse.findMany();
  const coursesOfClass = (classroomId: string) =>
    linkRows.filter((l) => l.classroomId === classroomId);

  let resultCount = 0;
  for (const e of acceptedEnrollments) {
    if (!e.classroomId) continue;
    const links = coursesOfClass(e.classroomId);
    for (const [idx, link] of links.entries()) {
      // Vary outcomes deterministically per student/course pair
      const roll = (Number(e.studentId.slice(-1).charCodeAt(0)) + idx) % 10;
      const status =
        roll <= 3 ? 'PASSED' : roll <= 6 ? 'IN_PROGRESS' : roll <= 8 ? 'RETAKE_REQUIRED' : 'FAILED';
      const score = status === 'PASSED' ? 78 + (roll * 2) : status === 'RETAKE_REQUIRED' ? 55 : status === 'FAILED' ? 42 : null;
      await prisma.courseResult.create({
        data: {
          studentId: e.studentId,
          courseId: link.courseId,
          classroomId: e.classroomId!,
          status,
          ...(score !== null ? { finalExamScore: score } : {}),
          ...(status === 'PASSED' ? { publishedAt: daysFromNow(-2, 10) } : {}),
        },
      });
      resultCount++;
    }
  }
  console.log(`  ✓ Created ${resultCount} course results`);

  // ─── Resources ─────────────────────────────────────────────
  await prisma.resource.createMany({
    data: [
      { classroomId: classroomA1.id, title: 'Ethiopian Traffic Proclamation PDF', type: 'PDF', url: 'https://cdn.shumshufer.et/resources/traffic_proclamation.pdf', mandatory: true },
      { classroomId: classroomA1.id, title: 'Term Schedule', type: 'PDF', url: 'https://cdn.shumshufer.et/resources/a1_schedule.pdf', mandatory: false },
      { classroomId: classroomA2.id, title: 'Hazard Perception Slide Deck', type: 'PPT', url: 'https://cdn.shumshufer.et/resources/hazard_perception.pptx', mandatory: true },
      { classroomId: classroomB1.id, title: 'Night Driving Checklist', type: 'PDF', url: 'https://cdn.shumshufer.et/resources/night_checklist.pdf', mandatory: true },
      { classroomId: classroomB2.id, title: 'Weekend Plan', type: 'LINK', url: 'https://shumshufer.et/plans/bole-weekend', mandatory: false },
      { classroomId: classroomC1.id, title: 'City Map Pack', type: 'PDF', url: 'https://cdn.shumshufer.et/resources/addis_city_map.pdf', mandatory: true },
      { classroomId: classroomC2.id, title: 'Riding Drills Video', type: 'VIDEO', url: 'https://cdn.shumshufer.et/videos/riding_drills.mp4', mandatory: true },
      { classroomId: classroomD1.id, title: 'Welcome Guide', type: 'PDF', url: 'https://cdn.shumshufer.et/resources/ayat_welcome.pdf', mandatory: false },
      { topicId: (await prisma.topic.findFirstOrThrow({ where: { courseId: courseATh.id, order: 2 } })).id, title: 'Road Signs Reference Chart', type: 'PDF', url: 'https://cdn.shumshufer.et/resources/road_signs_chart.pdf', mandatory: true },
      { topicId: (await prisma.topic.findFirstOrThrow({ where: { courseId: courseAPr.id, order: 1 } })).id, title: 'Vehicle Controls Tutorial', type: 'VIDEO', url: 'https://cdn.shumshufer.et/videos/vehicle_controls.mp4', mandatory: false },
      { topicId: (await prisma.topic.findFirstOrThrow({ where: { courseId: courseBTh.id, order: 2 } })).id, title: 'Document Checklist', type: 'PDF', url: 'https://cdn.shumshufer.et/resources/documents.pdf', mandatory: true },
      { topicId: (await prisma.topic.findFirstOrThrow({ where: { courseId: courseCMo.id, order: 1 } })).id, title: 'Helmet Standards', type: 'LINK', url: 'https://shumshufer.et/links/helmet_standards', mandatory: true },
    ],
  });
  console.log('  ✓ Created resources');

  // ─── Attendance (past sessions; rosters only) ──────────────
  let sessionCount = 0;
  let recordCount = 0;
  const attendancePlans: Array<{ classroomId: string; days: number[] }> = [
    { classroomId: classroomA1.id, days: [-14, -10, -6] },
    { classroomId: classroomA2.id, days: [-13, -9] },
    { classroomId: classroomB1.id, days: [-12, -8] },
    { classroomId: classroomC1.id, days: [-11] },
  ];
  const attendanceStatuses = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as const;
  for (const plan of attendancePlans) {
    for (const day of plan.days) {
      const session = await prisma.attendanceSession.create({
        data: { classroomId: plan.classroomId, date: daysFromNow(day, 8, 30) },
      });
      sessionCount++;
      await prisma.attendanceRecord.createMany({
        data: studentsIn(plan.classroomId).map((studentId, i) => ({
          sessionId: session.id,
          studentId,
          status: attendanceStatuses[(i + Math.abs(day)) % attendanceStatuses.length] ?? 'PRESENT',
        })),
      });
      recordCount += studentsIn(plan.classroomId).length;
    }
  }
  console.log(`  ✓ Created ${sessionCount} attendance sessions / ${recordCount} records`);

  // ─── Schedule events ───────────────────────────────────────
  await prisma.scheduleEvent.createMany({
    data: [
      { schoolId: schoolA.id, scope: ScheduleScope.SCHOOL, createdByRole: Role.ADMIN, title: 'New Term Orientation', startTime: daysFromNow(1, 10), endTime: daysFromNow(1, 12), location: 'Main Hall, Piassa' },
      { schoolId: schoolA.id, scope: ScheduleScope.SCHOOL, createdByRole: Role.ADMIN, title: 'Vehicle Maintenance Day', startTime: daysFromNow(9, 8), endTime: daysFromNow(9, 17), location: 'Garage' },
      { schoolId: schoolB.id, scope: ScheduleScope.SCHOOL, createdByRole: Role.ADMIN, title: 'Parent Open Day', startTime: daysFromNow(5, 14), endTime: daysFromNow(5, 16), location: 'Bole Main Hall' },
      { schoolId: schoolC.id, scope: ScheduleScope.SCHOOL, createdByRole: Role.ADMIN, title: 'Mock Exam Week Briefing', startTime: daysFromNow(3, 9), endTime: daysFromNow(3, 10, 30), location: 'Megenagna Campus' },
      { schoolId: schoolD.id, scope: ScheduleScope.SCHOOL, createdByRole: Role.ADMIN, title: 'Launch Readiness Meeting', startTime: daysFromNow(6, 11), endTime: daysFromNow(6, 12, 30), location: 'Ayat Main Office' },

      { classroomId: classroomA1.id, schoolId: schoolA.id, scope: ScheduleScope.CLASSROOM, createdByRole: Role.MENTOR, title: 'Theory Class — Traffic Law', startTime: daysFromNow(2, 8, 30), endTime: daysFromNow(2, 10), location: 'Room 101' },
      { classroomId: classroomA1.id, schoolId: schoolA.id, scope: ScheduleScope.CLASSROOM, createdByRole: Role.MENTOR, title: 'Practical Session — Parking', startTime: daysFromNow(4, 8, 30), endTime: daysFromNow(4, 10, 30), location: 'Practice Yard' },
      { classroomId: classroomA2.id, schoolId: schoolA.id, scope: ScheduleScope.CLASSROOM, createdByRole: Role.MENTOR, title: 'Theory Class — Right of Way', startTime: daysFromNow(2, 14), endTime: daysFromNow(2, 15, 30), location: 'Room 102' },
      { classroomId: classroomA2.id, schoolId: schoolA.id, scope: ScheduleScope.CLASSROOM, createdByRole: Role.MENTOR, title: 'Defensive Driving Workshop', startTime: daysFromNow(7, 14), endTime: daysFromNow(7, 16), location: 'Room 102' },
      { classroomId: classroomB1.id, schoolId: schoolB.id, scope: ScheduleScope.CLASSROOM, createdByRole: Role.MENTOR, title: 'Evening Drive Briefing', startTime: daysFromNow(3, 18), endTime: daysFromNow(3, 19, 30), location: 'Bole Yard' },
      { classroomId: classroomB2.id, schoolId: schoolB.id, scope: ScheduleScope.CLASSROOM, createdByRole: Role.MENTOR, title: 'Weekend Practical', startTime: daysFromNow(6, 9), endTime: daysFromNow(6, 12), location: 'Gerji Yard' },
      { classroomId: classroomC1.id, schoolId: schoolC.id, scope: ScheduleScope.CLASSROOM, createdByRole: Role.MENTOR, title: 'Mock Theory Exam', startTime: daysFromNow(5, 8, 30), endTime: daysFromNow(5, 10), location: 'Hall 1' },
      { classroomId: classroomC2.id, schoolId: schoolC.id, scope: ScheduleScope.CLASSROOM, createdByRole: Role.MENTOR, title: 'Balance Drills', startTime: daysFromNow(4, 13), endTime: daysFromNow(4, 14, 30), location: 'Riding Pad' },
      { classroomId: classroomD1.id, schoolId: schoolD.id, scope: ScheduleScope.CLASSROOM, createdByRole: Role.MENTOR, title: 'Introductory Theory Lesson', startTime: daysFromNow(8, 9), endTime: daysFromNow(8, 10, 30), location: 'Ayat Room 1' },
    ],
  });
  console.log('  ✓ Created schedule events');

  // ─── Announcements (platform / school / classroom) ─────────
  await prisma.announcement.createMany({
    data: [
      { authorId: superAdmin.id, title: 'Welcome to ShumShufer', body: 'Ethiopia\u2019s unified driving-school platform is live. Browse verified academies, learn theory online, and pay securely.', audience: 'PUBLIC' },
      { authorId: superAdmin.id, title: 'Scheduled Maintenance', body: 'The platform will be briefly unavailable this Sunday between 2:00 and 3:00 AM for maintenance.', audience: 'PUBLIC' },
      { authorId: superAdmin.id, title: 'New Partner Schools', body: 'Megenagna Traffic & Driving Institute has joined the platform. Give them a look!', audience: 'PUBLIC' },
      { schoolId: schoolA.id, authorId: staff.A.admin.id, title: 'Welcome to the New Term!', body: 'We are excited to start the new training batch. Please check your classroom schedules.', audience: 'ALL_STUDENTS' },
      { schoolId: schoolA.id, authorId: staff.A.edhead.id, title: 'Exam Week Guidelines', body: 'Mid-term exams run next week. Bring your student ID and arrive 15 minutes early.', audience: 'ALL_STUDENTS' },
      { schoolId: schoolB.id, authorId: staff.B.admin.id, title: 'Evening Batch Update', body: 'Evening drives now start at 6:00 PM sharp due to traffic conditions.', audience: 'ALL_STUDENTS' },
      { schoolId: schoolC.id, authorId: staff.C.admin.id, title: 'Motorcycle Gear Requirement', body: 'All motorcycle students must wear full gear during practical sessions.', audience: 'ALL_STUDENTS' },
      { classroomId: classroomA1.id, schoolId: schoolA.id, authorId: staff.A.mentors[0].id, title: 'Assignment Deadline Reminder', body: 'Submit the Road Signs Identification assignment before the deadline listed on the tasks page.', audience: 'CLASSROOM' },
      { classroomId: classroomA1.id, schoolId: schoolA.id, authorId: staff.A.mentors[1].id, title: 'Parking Practice Groups', body: 'Check the posted groups for Thursday\u2019s parking practical.', audience: 'CLASSROOM' },
      { classroomId: classroomB1.id, schoolId: schoolB.id, authorId: staff.B.mentors[0].id, title: 'Night Drive Debrief', body: 'Great session last night — notes are uploaded under resources.', audience: 'CLASSROOM' },
    ],
  });
  console.log('  ✓ Created announcements');

  // ─── Staff posts & applications ────────────────────────────
  const postAMentor = await prisma.staffApplicationPost.create({
    data: { schoolId: schoolA.id, role: Role.MENTOR, description: 'Looking for experienced driving instructors with at least 3 years of experience.', status: 'OPEN' },
  });
  const postBMentor = await prisma.staffApplicationPost.create({
    data: { schoolId: schoolB.id, role: Role.MENTOR, description: 'Evening-shift instructors wanted for our Gerji branch.', status: 'OPEN' },
  });
  const postCEdHead = await prisma.staffApplicationPost.create({
    data: { schoolId: schoolC.id, role: Role.EDUCATION_HEAD, description: 'Seeking a licensed education head to lead curriculum delivery.', status: 'OPEN' },
  });
  await prisma.staffApplicationPost.create({
    data: { schoolId: schoolA.id, role: Role.EDUCATION_HEAD, description: 'Curriculum lead position (filled).', status: 'CLOSED' },
  });

  // Applicants — two get hired (promoted coherently into MENTOR of that school)
  const applicantHiredA = await createUser(
    { email: 'yohannes.applicant@gmail.com', firstName: 'Yohannes', lastName: 'Bekele', birth: '1991-02-03' },
    Role.STUDENT,
    null,
  );
  const applicantHiredB = await createUser(
    { email: 'kalkidan.applicant@gmail.com', firstName: 'Kalkidan', lastName: 'Alemayehu', birth: '1993-11-05' },
    Role.STUDENT,
    null,
  );
  const applicantWaiting = await createUser(
    { email: 'daniel.applicant@gmail.com', firstName: 'Daniel', lastName: 'Wondimu', birth: '1996-06-14' },
    Role.STUDENT,
    null,
  );
  const applicantDeclined = await createUser(
    { email: 'helen.applicant@gmail.com', firstName: 'Helen', lastName: 'Asrat', birth: '1997-09-02' },
    Role.STUDENT,
    null,
  );

  await prisma.staffApplication.createMany({
    data: [
      { postId: postAMentor.id, applicantId: applicantHiredA.id, status: ApplicationStatus.ACCEPTED, resumeUrl: 'uploads/resumes/yohannes_bekele.pdf' },
      { postId: postBMentor.id, applicantId: applicantHiredB.id, status: ApplicationStatus.ACCEPTED, resumeUrl: 'uploads/resumes/kalkidan_alemayehu.pdf' },
      { postId: postAMentor.id, applicantId: applicantWaiting.id, status: ApplicationStatus.PENDING, resumeUrl: 'uploads/resumes/daniel_wondimu.pdf' },
      { postId: postCEdHead.id, applicantId: applicantDeclined.id, status: ApplicationStatus.REJECTED, resumeUrl: 'uploads/resumes/helen_asrat.pdf' },
    ],
  });

  // Hiring outcome: accepted applicants become mentors of that school
  await prisma.user.update({ where: { id: applicantHiredA.id }, data: { role: Role.MENTOR, schoolId: schoolA.id } });
  await prisma.user.update({ where: { id: applicantHiredB.id }, data: { role: Role.MENTOR, schoolId: schoolB.id } });
  console.log('  ✓ Created staff posts & applications (2 hires promoted to mentors)');

  // ─── Payments (consistent amounts + 10% commission) ────────
  const commissionOf = (fee: number) => Number((fee * PLATFORM_COMMISSION_RATE).toFixed(2));
  let txn = 0;
  const nextTxn = () => `CHAPA-SEED-${String(++txn).padStart(3, '0')}`;

  const paymentData: Array<{
    userId: string;
    type: 'ENROLLMENT' | 'COURSE_PURCHASE' | 'PRACTICE_ELSEWHERE_FEE';
    amount: number;
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    relatedEntityId: string;
  }> = [];

  for (const e of enrollments) {
    if (e.status === 'REJECTED' || e.status === 'WITHDRAWN') continue;
    const paid = e.status === 'ACCEPTED' ? 'SUCCESS' : 'PENDING';
    paymentData.push({
      userId: e.studentId,
      type: 'ENROLLMENT',
      amount: feeBySchool[e.schoolId] ?? 3500,
      status: paid,
      relatedEntityId: e.id,
    });
  }

  // A couple of standalone course purchases by enrolled students
  paymentData.push(
    { userId: sid(1), type: 'COURSE_PURCHASE', amount: 5500, status: 'SUCCESS', relatedEntityId: courseADef.id },
    { userId: sid(12), type: 'COURSE_PURCHASE', amount: 7000, status: 'SUCCESS', relatedEntityId: courseBPr.id },
    { userId: sid(19), type: 'COURSE_PURCHASE', amount: 4500, status: 'FAILED', relatedEntityId: courseCMo.id },
  );

  // Practice-elsewhere fee follows the accepted request
  paymentData.push(
    { userId: sid(1), type: 'PRACTICE_ELSEWHERE_FEE', amount: 1500, status: 'SUCCESS', relatedEntityId: practiceAccepted.id },
    { userId: sid(12), type: 'PRACTICE_ELSEWHERE_FEE', amount: 1800, status: 'PENDING', relatedEntityId: practicePending.id },
  );

  for (const p of paymentData) {
    await prisma.payment.create({
      data: {
        userId: p.userId,
        type: p.type,
        amount: p.amount,
        commission: commissionOf(p.amount),
        status: p.status,
        chapaTxRef: nextTxn(),
        relatedEntityId: p.relatedEntityId,
      },
    });
  }
  console.log(`  ✓ Created ${paymentData.length} payments`);

  // ─── Reviews (only from enrolled students) + honest ratings ──
  const reviewSeeds: Array<{ schoolId: string; studentId: string; rating: number; comment: string }> = [
    { schoolId: schoolA.id, studentId: sid(1), rating: 5, comment: 'Excellent instructors and well-maintained vehicles!' },
    { schoolId: schoolA.id, studentId: sid(2), rating: 4, comment: 'Great theory classes; practical slots fill up fast.' },
    { schoolId: schoolA.id, studentId: sid(3), rating: 5, comment: 'Very structured program, I passed my exam first try.' },
    { schoolId: schoolA.id, studentId: sid(5), rating: 4, comment: 'Supportive mentors and clear materials.' },
    { schoolId: schoolA.id, studentId: sid(6), rating: 3, comment: 'Good overall but scheduling could be smoother.' },
    { schoolId: schoolA.id, studentId: sid(7), rating: 5, comment: 'The defensive driving module is a gem.' },
    { schoolId: schoolA.id, studentId: sid(8), rating: 4, comment: 'Modern cars and patient instructors.' },
    { schoolId: schoolB.id, studentId: sid(12), rating: 4, comment: 'Flexible evening batches work great with my job.' },
    { schoolId: schoolB.id, studentId: sid(13), rating: 5, comment: 'Instructors genuinely care about progress.' },
    { schoolId: schoolB.id, studentId: sid(14), rating: 4, comment: 'Good value for money.' },
    { schoolId: schoolB.id, studentId: sid(16), rating: 4, comment: 'Weekend intensive is intense but effective.' },
    { schoolId: schoolC.id, studentId: sid(19), rating: 5, comment: 'Best motorcycle program in the city.' },
    { schoolId: schoolC.id, studentId: sid(20), rating: 4, comment: 'Knowledgeable staff and tidy facility.' },
    { schoolId: schoolC.id, studentId: sid(21), rating: 4, comment: 'Weekly mock exams really help.' },
  ];

  for (const r of reviewSeeds) {
    await prisma.review.create({ data: r });
  }

  // Recompute school ratings from actual reviews (coherent averages)
  for (const school of Object.values(schools)) {
    const agg = await prisma.review.aggregate({
      where: { schoolId: school.id },
      _avg: { rating: true },
    });
    await prisma.school.update({
      where: { id: school.id },
      data: { rating: agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : 0 },
    });
  }
  console.log(`  ✓ Created ${reviewSeeds.length} reviews & recomputed school ratings`);

  // ─── Notifications (topic-coherent fan-outs) ───────────────
  async function notify(
    topic: NotificationTopic,
    title: string,
    body: string,
    userIds: string[],
    relatedEntityId?: string,
    readFirst = false,
  ) {
    const notification = await prisma.notification.create({
      data: {
        topic,
        title,
        body,
        ...(relatedEntityId ? { relatedEntityId } : {}),
      },
    });
    await prisma.notificationRecipient.createMany({
      data: userIds.map((userId, i) => ({
        notificationId: notification.id,
        userId,
        read: readFirst && i === 0,
      })),
    });
  }

  const a1Students = studentsIn(classroomA1.id);
  const b1Students = studentsIn(classroomB1.id);

  await notify(NotificationTopic.APPLICATION, 'Application Accepted', 'Your application has been accepted. Welcome aboard!', a1Students.slice(0, 2), undefined, true);
  await notify(NotificationTopic.TASK, 'New assignment posted', 'Road Signs Identification is now open for submissions in your classroom.', a1Students);
  await notify(NotificationTopic.RESULT, 'Result published', 'Your Traffic Rules & Theory result has been published. Congratulations!', [sid(1)]);
  await notify(NotificationTopic.PAYMENT, 'Payment received', 'We received your enrollment payment. Thank you!', [sid(2)]);
  await notify(NotificationTopic.PAYMENT, 'Payment pending', 'Your enrollment payment is still pending. Please complete it to secure your seat.', [sid(9)]);
  await notify(NotificationTopic.SCHOOL_ANNOUNCEMENT, 'New term announcement', 'Welcome to the New Term — check your schedules.', [...a1Students, ...studentsIn(classroomA2.id)]);
  await notify(NotificationTopic.CLASSROOM, 'Evening batch schedule change', 'Evening drives now start at 6:00 PM sharp.', b1Students);
  await notify(NotificationTopic.STAFF_POST, 'Application update', 'Your staff application status changed. Check the board for details.', [applicantWaiting.id]);
  await notify(NotificationTopic.SYSTEM, 'Verify your account', 'Please complete Fayda verification to unlock all features.', [sid(23), applicantWaiting.id]);
  console.log('  ✓ Created notifications');

  // ─── Student reports (mentors reporting their own students) ──
  await prisma.studentReport.createMany({
    data: [
      { classroomId: classroomA1.id, reportedById: staff.A.mentors[1].id, reportedStudentId: sid(2), note: 'Arrived late to three consecutive practical sessions.' },
      { classroomId: classroomA2.id, reportedById: staff.A.mentors[2].id, reportedStudentId: sid(6), note: 'Consistently unprepared for the defensive-driving workshop.' },
      { classroomId: classroomB1.id, reportedById: staff.B.mentors[0].id, reportedStudentId: sid(13), note: 'Missed the night-drive debrief without notice.' },
      { classroomId: classroomC1.id, reportedById: staff.C.mentors[0].id, reportedStudentId: sid(20), note: 'Excellent participation — recommend for early exam slot.' },
    ],
  });
  console.log('  ✓ Created student reports');

  // ─── Sanity checks (fail loudly on incoherence) ────────────
  const [
    schoolsWithoutAdmin,
    adminsWithoutSchool,
    edHeadsWithoutSchool,
    mentorsWithoutSchool,
    classroomsWithoutMentor,
    acceptedWithoutClassroom,
    acceptedWithoutBinding,
    orphanTasks,
    orphanResults,
    badQuizShape,
    agreementSplitErrors,
    practiceStatusDrift,
  ] = await Promise.all([
    prisma.school.count({ where: { users: { none: { role: Role.ADMIN } } } }),
    prisma.user.count({ where: { role: Role.ADMIN, schoolId: null } }),
    prisma.user.count({ where: { role: Role.EDUCATION_HEAD, schoolId: null } }),
    prisma.user.count({ where: { role: Role.MENTOR, schoolId: null } }),
    prisma.classroom.count({ where: { mentors: { none: {} } } }),
    prisma.enrollment.count({ where: { status: ApplicationStatus.ACCEPTED, classroomId: null } }),
    prisma.enrollment.count({ where: { status: ApplicationStatus.ACCEPTED, student: { schoolId: null } } }),
    prisma.$queryRaw<Array<{ c: bigint }>>`SELECT count(*) AS c FROM tasks t JOIN users u ON u.id = t."createdById" WHERE u.role <> 'MENTOR'`,
    prisma.$queryRaw<Array<{ c: bigint }>>`SELECT count(*) AS c FROM course_results cr WHERE NOT EXISTS (SELECT 1 FROM classroom_courses cc WHERE cc."classroomId" = cr."classroomId" AND cc."courseId" = cr."courseId") OR NOT EXISTS (SELECT 1 FROM enrollments e WHERE e."studentId" = cr."studentId" AND e."classroomId" = cr."classroomId" AND e.status = 'ACCEPTED')`,
    prisma.$queryRaw<Array<{ c: bigint }>>`SELECT count(*) AS c FROM quizzes WHERE jsonb_path_exists(questions, '$[*].correctAnswer')`,
    prisma.$queryRaw<Array<{ c: bigint }>>`SELECT count(*) AS c FROM school_agreements WHERE ("feeSplit"->>'homeSchoolPercent')::numeric + ("feeSplit"->>'hostSchoolPercent')::numeric <> 100`,
    prisma.practiceElsewhereRequest.count({ where: { status: { notIn: ['PENDING', 'ACCEPTED', 'REJECTED'] } } }),
  ]);

  const problems: string[] = [];
  if (schoolsWithoutAdmin) problems.push(`${schoolsWithoutAdmin} school(s) without an admin`);
  if (adminsWithoutSchool) problems.push(`${adminsWithoutSchool} admin(s) without a school`);
  if (edHeadsWithoutSchool) problems.push(`${edHeadsWithoutSchool} education head(s) without a school`);
  if (mentorsWithoutSchool) problems.push(`${mentorsWithoutSchool} mentor(s) without a school`);
  if (classroomsWithoutMentor) problems.push(`${classroomsWithoutMentor} classroom(s) without a mentor`);
  if (acceptedWithoutClassroom) problems.push(`${acceptedWithoutClassroom} accepted enrollment(s) without a classroom`);
  if (acceptedWithoutBinding) problems.push(`${acceptedWithoutBinding} accepted student(s) not bound to their school`);
  const orphanTaskCount = Number(orphanTasks[0]?.c ?? 0);
  const orphanResultCount = Number(orphanResults[0]?.c ?? 0);
  if (orphanTaskCount) problems.push(`${orphanTaskCount} task(s) not created by a mentor`);
  if (orphanResultCount) problems.push(`${orphanResultCount} course result(s) without a taught course or enrolled student`);
  const legacyQuizCount = Number(badQuizShape[0]?.c ?? 0);
  const agreementSplitErrorCount = Number(agreementSplitErrors[0]?.c ?? 0);
  const schoolsWithoutBranch = await prisma.school.count({ where: { branches: { none: {} } } });
  if (legacyQuizCount) problems.push(`${legacyQuizCount} quiz(es) using legacy correctAnswer shape`);
  if (agreementSplitErrorCount) problems.push(`${agreementSplitErrorCount} agreement(s) whose fee split ≠ 100%`);
  if (schoolsWithoutBranch) problems.push(`${schoolsWithoutBranch} school(s) without at least one branch`);
  if (practiceStatusDrift) problems.push(`${practiceStatusDrift} practice request(s) with invalid status`);

  if (problems.length) {
    throw new Error('Seed coherence check failed:\n  - ' + problems.join('\n  - '));
  }

  console.log('\n✅ Seed completed successfully — data is coherent.');
}

main()
  .catch((e) => {
    console.error('[!] Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
