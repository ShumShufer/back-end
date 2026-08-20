import { PrismaClient, Role, VerificationStatus, ApplicationMode, ApplicationStatus, ScheduleScope, TaskType, PaymentType, PaymentStatus, NotificationTopic } from '../generated/prisma/client.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { hashPassword } from '../src/helpers/password.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Clean existing data (reverse dependency order) ────────
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

  // ─── Schools ───────────────────────────────────────────────
  const schoolA = await prisma.school.create({
    data: {
      name: 'Addis Driving Academy',
      description: 'Premier driving school in Addis Ababa with modern vehicles and experienced instructors.',
      rating: 4.5,
      status: 'ACTIVE',
    },
  });

  const schoolB = await prisma.school.create({
    data: {
      name: 'Bole Driving School',
      description: 'Affordable and reliable driving education in Bole sub-city.',
      rating: 4.0,
      status: 'ACTIVE',
    },
  });

  console.log('  ✓ Created schools');

  // ─── Branches ──────────────────────────────────────────────
  await prisma.branch.createMany({
    data: [
      {
        schoolId: schoolA.id,
        name: 'Piassa Branch',
        address: 'Piassa, Addis Ababa',
        latitude: 9.0340,
        longitude: 38.7469,
      },
      {
        schoolId: schoolA.id,
        name: 'Mexico Branch',
        address: 'Mexico Square, Addis Ababa',
        latitude: 9.0105,
        longitude: 38.7468,
      },
      {
        schoolId: schoolB.id,
        name: 'Bole Main',
        address: 'Bole Road, Addis Ababa',
        latitude: 9.0054,
        longitude: 38.7636,
      },
    ],
  });

  console.log('  ✓ Created branches');

  // ─── Users ─────────────────────────────────────────────────
  // Password hash for "password123" — in real usage, generate with bcrypt/argon2
  const fakePasswordHash = await hashPassword("password123");

  await prisma.user.create({
    data: {
      email: 'superadmin@shumshufer.com',
      passwordHash: fakePasswordHash,
      firstName: 'Platform',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      verificationStatus: VerificationStatus.VERIFIED,
      dateOfBirth: new Date('1985-03-15'),
    },
  });

  const adminA = await prisma.user.create({
    data: {
      email: 'admin@addisdriving.com',
      phone: '+251911000001',
      passwordHash: fakePasswordHash,
      firstName: 'Abebe',
      lastName: 'Kebede',
      role: Role.ADMIN,
      verificationStatus: VerificationStatus.VERIFIED,
      dateOfBirth: new Date('1988-07-20'),
      schoolId: schoolA.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'edhead@addisdriving.com',
      phone: '+251911000002',
      passwordHash: fakePasswordHash,
      firstName: 'Tigist',
      lastName: 'Haile',
      role: Role.EDUCATION_HEAD,
      verificationStatus: VerificationStatus.VERIFIED,
      dateOfBirth: new Date('1990-01-10'),
      schoolId: schoolA.id,
    },
  });

  const mentor1 = await prisma.user.create({
    data: {
      email: 'mentor1@addisdriving.com',
      phone: '+251911000003',
      passwordHash: fakePasswordHash,
      firstName: 'Dawit',
      lastName: 'Mekonnen',
      role: Role.MENTOR,
      verificationStatus: VerificationStatus.VERIFIED,
      dateOfBirth: new Date('1992-05-22'),
      schoolId: schoolA.id,
    },
  });

  const mentor2 = await prisma.user.create({
    data: {
      email: 'mentor2@addisdriving.com',
      phone: '+251911000004',
      passwordHash: fakePasswordHash,
      firstName: 'Selam',
      lastName: 'Teshome',
      role: Role.MENTOR,
      verificationStatus: VerificationStatus.VERIFIED,
      dateOfBirth: new Date('1993-09-14'),
      schoolId: schoolA.id,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'student1@gmail.com',
      phone: '+251911000005',
      passwordHash: fakePasswordHash,
      firstName: 'Kidist',
      lastName: 'Alemu',
      role: Role.STUDENT,
      verificationStatus: VerificationStatus.VERIFIED,
      dateOfBirth: new Date('2000-11-30'),
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@gmail.com',
      phone: '+251911000006',
      passwordHash: fakePasswordHash,
      firstName: 'Yonas',
      lastName: 'Girma',
      role: Role.STUDENT,
      verificationStatus: VerificationStatus.VERIFIED,
      dateOfBirth: new Date('2001-04-18'),
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'student3@gmail.com',
      phone: '+251911000007',
      passwordHash: fakePasswordHash,
      firstName: 'Meron',
      lastName: 'Tadesse',
      role: Role.STUDENT,
      verificationStatus: VerificationStatus.PENDING,
      dateOfBirth: new Date('2002-08-05'),
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@boledriving.com',
      phone: '+251911000008',
      passwordHash: fakePasswordHash,
      firstName: 'Solomon',
      lastName: 'Worku',
      role: Role.ADMIN,
      verificationStatus: VerificationStatus.VERIFIED,
      dateOfBirth: new Date('1987-12-01'),
      schoolId: schoolB.id,
    },
  });

  console.log('  ✓ Created users');

  // ─── Classrooms ────────────────────────────────────────────
  const classroomA1 = await prisma.classroom.create({
    data: {
      schoolId: schoolA.id,
      name: 'Batch 2026 - Morning',
    },
  });

  const classroomA2 = await prisma.classroom.create({
    data: {
      schoolId: schoolA.id,
      name: 'Batch 2026 - Afternoon',
    },
  });

  console.log('  ✓ Created classrooms');

  // ─── Classroom Mentors ─────────────────────────────────────
  await prisma.classroomMentor.createMany({
    data: [
      { classroomId: classroomA1.id, mentorId: mentor1.id },
      { classroomId: classroomA1.id, mentorId: mentor2.id },
      { classroomId: classroomA2.id, mentorId: mentor2.id },
    ],
  });

  console.log('  ✓ Assigned mentors to classrooms');

  // ─── Courses ───────────────────────────────────────────────
  const courseTheory = await prisma.course.create({
    data: {
      schoolId: schoolA.id,
      title: 'Traffic Rules & Theory',
      description: 'Complete Ethiopian traffic law and road safety theory course.',
      price: 3500,
      isFree: false,
    },
  });

  const coursePractical = await prisma.course.create({
    data: {
      schoolId: schoolA.id,
      title: 'Practical Driving',
      description: 'Behind-the-wheel training covering city driving, parking, and highway.',
      price: 8000,
      isFree: false,
    },
  });

  await prisma.course.create({
    data: {
      title: 'Road Safety Awareness',
      description: 'Free course open to all — basic road safety tips for pedestrians and drivers.',
      price: 0,
      isFree: true,
    },
  });

  console.log('  ✓ Created courses');

  // ─── Topics ────────────────────────────────────────────────
  const topic1 = await prisma.topic.create({
    data: {
      courseId: courseTheory.id,
      title: 'Introduction to Traffic Law',
      order: 1,
      content: 'Overview of Ethiopian traffic regulations and the role of the Transport Authority.',
    },
  });

  const topic2 = await prisma.topic.create({
    data: {
      courseId: courseTheory.id,
      title: 'Road Signs & Markings',
      order: 2,
      content: 'Comprehensive guide to regulatory, warning, and informational road signs.',
    },
  });

  await prisma.topic.create({
    data: {
      courseId: courseTheory.id,
      title: 'Right of Way',
      order: 3,
      content: 'Rules governing right of way at intersections, roundabouts, and special zones.',
    },
  });

  const topic4 = await prisma.topic.create({
    data: {
      courseId: coursePractical.id,
      title: 'Vehicle Controls & Basics',
      order: 1,
      content: 'Familiarization with pedals, steering, mirrors, and dashboard controls.',
    },
  });

  console.log('  ✓ Created topics');

  // ─── Quizzes ───────────────────────────────────────────────
  await prisma.quiz.create({
    data: {
      topicId: topic1.id,
      title: 'Traffic Law Basics Quiz',
      passScore: 70,
      questions: [
        {
          question: 'What is the legal driving age in Ethiopia?',
          options: ['16', '17', '18', '21'],
          correctAnswer: '18',
          points: 10,
        },
        {
          question: 'Which authority issues driving licenses in Ethiopia?',
          options: ['Ministry of Education', 'Transport Authority', 'Federal Police', 'City Administration'],
          correctAnswer: 'Transport Authority',
          points: 10,
        },
      ],
    },
  });

  await prisma.quiz.create({
    data: {
      topicId: topic2.id,
      title: 'Road Signs Quiz',
      passScore: 80,
      questions: [
        {
          question: 'A red octagonal sign means?',
          options: ['Yield', 'Stop', 'No entry', 'Speed limit'],
          correctAnswer: 'Stop',
          points: 10,
        },
        {
          question: 'Yellow diamond signs are typically?',
          options: ['Regulatory', 'Warning', 'Informational', 'Construction'],
          correctAnswer: 'Warning',
          points: 10,
        },
        {
          question: 'A round blue sign indicates?',
          options: ['Prohibition', 'Mandatory action', 'Information', 'Warning'],
          correctAnswer: 'Mandatory action',
          points: 10,
        },
      ],
    },
  });

  console.log('  ✓ Created quizzes');

  // ─── Classroom Courses ─────────────────────────────────────
  await prisma.classroomCourse.createMany({
    data: [
      { classroomId: classroomA1.id, courseId: courseTheory.id, order: 1, mandatory: true },
      { classroomId: classroomA1.id, courseId: coursePractical.id, order: 2, mandatory: true },
      { classroomId: classroomA2.id, courseId: courseTheory.id, order: 1, mandatory: true },
    ],
  });

  console.log('  ✓ Linked courses to classrooms');

  // ─── Enrollments ───────────────────────────────────────────
  const enrollment1 = await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      schoolId: schoolA.id,
      classroomId: classroomA1.id,
      mode: ApplicationMode.ONLINE,
      status: ApplicationStatus.ACCEPTED,
      formResponses: { previousDrivingExperience: false, preferredSchedule: 'morning' },
      reviewedAt: new Date(),
      reviewedById: adminA.id,
    },
  });

  const enrollment2 = await prisma.enrollment.create({
    data: {
      studentId: student2.id,
      schoolId: schoolA.id,
      classroomId: classroomA1.id,
      mode: ApplicationMode.IN_PERSON,
      status: ApplicationStatus.ACCEPTED,
      formResponses: { previousDrivingExperience: true, preferredSchedule: 'morning' },
      reviewedAt: new Date(),
      reviewedById: adminA.id,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student3.id,
      schoolId: schoolA.id,
      mode: ApplicationMode.ONLINE,
      status: ApplicationStatus.PENDING,
      formResponses: { previousDrivingExperience: false, preferredSchedule: 'afternoon' },
    },
  });

  console.log('  ✓ Created enrollments');

  // ─── Application Form Template ─────────────────────────────
  await prisma.applicationFormTemplate.create({
    data: {
      schoolId: schoolA.id,
      fields: [
        { key: 'previousDrivingExperience', label: 'Do you have previous driving experience?', type: 'boolean', required: true },
        { key: 'preferredSchedule', label: 'Preferred schedule', type: 'select', options: ['morning', 'afternoon', 'weekend'], required: true },
        { key: 'medicalConditions', label: 'Any medical conditions?', type: 'text', required: false },
      ],
    },
  });

  console.log('  ✓ Created application form template');

  // ─── School Agreement ──────────────────────────────────────
  await prisma.schoolAgreement.create({
    data: {
      schoolAId: schoolA.id,
      schoolBId: schoolB.id,
      status: 'ACTIVE',
      feeSplit: { schoolA: 60, schoolB: 30, platform: 10 },
    },
  });

  console.log('  ✓ Created school agreement');

  // ─── Tasks ─────────────────────────────────────────────────
  const task1 = await prisma.task.create({
    data: {
      classroomId: classroomA1.id,
      createdById: mentor1.id,
      type: TaskType.ASSIGNMENT,
      title: 'Road Signs Identification',
      description: 'Identify and describe 20 road signs from the provided images.',
      attachments: [],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    },
  });

  await prisma.task.create({
    data: {
      classroomId: classroomA1.id,
      createdById: mentor1.id,
      type: TaskType.EXAM,
      title: 'Theory Mid-Term Exam',
      description: 'Covers chapters 1-3 of the traffic theory course.',
      attachments: [],
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    },
  });

  console.log('  ✓ Created tasks');

  // ─── Submissions ───────────────────────────────────────────
  await prisma.submission.create({
    data: {
      taskId: task1.id,
      studentId: student1.id,
      attachments: ['uploads/student1_road_signs.pdf'],
      grade: 85,
      feedback: 'Great identification, but missed two warning signs.',
      gradedAt: new Date(),
    },
  });

  await prisma.submission.create({
    data: {
      taskId: task1.id,
      studentId: student2.id,
      attachments: ['uploads/student2_road_signs.pdf'],
    },
  });

  console.log('  ✓ Created submissions');

  // ─── Course Results ────────────────────────────────────────
  await prisma.courseResult.create({
    data: {
      studentId: student1.id,
      courseId: courseTheory.id,
      classroomId: classroomA1.id,
      status: 'IN_PROGRESS',
    },
  });

  console.log('  ✓ Created course results');

  // ─── Resources ─────────────────────────────────────────────
  await prisma.resource.createMany({
    data: [
      {
        classroomId: classroomA1.id,
        title: 'Ethiopian Traffic Law PDF',
        type: 'PDF',
        url: 'resources/ethiopian_traffic_law.pdf',
        mandatory: true,
      },
      {
        topicId: topic2.id,
        title: 'Road Signs Reference Chart',
        type: 'PDF',
        url: 'resources/road_signs_chart.pdf',
        mandatory: true,
      },
      {
        topicId: topic4.id,
        title: 'Vehicle Controls Tutorial',
        type: 'VIDEO',
        url: 'https://example.com/videos/vehicle-controls.mp4',
        mandatory: false,
      },
    ],
  });

  console.log('  ✓ Created resources');

  // ─── Attendance ────────────────────────────────────────────
  const session = await prisma.attendanceSession.create({
    data: {
      classroomId: classroomA1.id,
      date: new Date(),
    },
  });

  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: session.id, studentId: student1.id, status: 'PRESENT' },
      { sessionId: session.id, studentId: student2.id, status: 'LATE' },
    ],
  });

  console.log('  ✓ Created attendance records');

  // ─── Schedule Events ───────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(tomorrowEnd.getHours() + 2);

  await prisma.scheduleEvent.create({
    data: {
      schoolId: schoolA.id,
      scope: ScheduleScope.SCHOOL,
      createdByRole: Role.ADMIN,
      title: 'School-wide Orientation',
      startTime: tomorrow,
      endTime: tomorrowEnd,
      location: 'Main Hall',
    },
  });

  await prisma.scheduleEvent.create({
    data: {
      classroomId: classroomA1.id,
      scope: ScheduleScope.CLASSROOM,
      createdByRole: Role.MENTOR,
      title: 'Theory Class - Traffic Law',
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      location: 'Room 101',
    },
  });

  console.log('  ✓ Created schedule events');

  // ─── Announcements ─────────────────────────────────────────
  await prisma.announcement.create({
    data: {
      schoolId: schoolA.id,
      authorId: adminA.id,
      title: 'Welcome to the New Term!',
      body: 'We are excited to start a new training batch. Please check your classroom schedules.',
      audience: 'ALL_STUDENTS',
    },
  });

  await prisma.announcement.create({
    data: {
      classroomId: classroomA1.id,
      authorId: mentor1.id,
      title: 'Assignment Deadline Reminder',
      body: 'Please submit the Road Signs Identification assignment by end of this week.',
      audience: 'ALL_STUDENTS',
    },
  });

  console.log('  ✓ Created announcements');

  // ─── Staff Application Posts ───────────────────────────────
  const staffPost = await prisma.staffApplicationPost.create({
    data: {
      schoolId: schoolA.id,
      role: Role.MENTOR,
      description: 'Looking for experienced driving instructors with at least 3 years of experience.',
      status: 'OPEN',
    },
  });

  await prisma.staffApplication.create({
    data: {
      postId: staffPost.id,
      applicantId: student2.id, // a user applying (in real life, would be a non-student)
      status: ApplicationStatus.PENDING,
      resumeUrl: 'uploads/resumes/applicant_resume.pdf',
    },
  });

  console.log('  ✓ Created staff application posts');

  // ─── Payments ──────────────────────────────────────────────
  await prisma.payment.create({
    data: {
      userId: student1.id,
      type: PaymentType.ENROLLMENT,
      amount: 3500,
      commission: 350,
      status: PaymentStatus.SUCCESS,
      chapaTxRef: 'CHAPA-TXN-001',
      relatedEntityId: enrollment1.id,
    },
  });

  await prisma.payment.create({
    data: {
      userId: student2.id,
      type: PaymentType.ENROLLMENT,
      amount: 3500,
      commission: 350,
      status: PaymentStatus.PENDING,
      chapaTxRef: 'CHAPA-TXN-002',
      relatedEntityId: enrollment2.id,
    },
  });

  console.log('  ✓ Created payments');

  // ─── Reviews ───────────────────────────────────────────────
  await prisma.review.create({
    data: {
      schoolId: schoolA.id,
      studentId: student1.id,
      rating: 5,
      comment: 'Excellent instructors and well-maintained vehicles!',
    },
  });

  console.log('  ✓ Created reviews');

  // ─── Notifications ─────────────────────────────────────────
  const notification = await prisma.notification.create({
    data: {
      topic: NotificationTopic.SCHOOL_ANNOUNCEMENT,
      title: 'Welcome to the New Term!',
      body: 'Check your classroom schedules for the new training batch.',
    },
  });

  await prisma.notificationRecipient.createMany({
    data: [
      { notificationId: notification.id, userId: student1.id, read: false },
      { notificationId: notification.id, userId: student2.id, read: false },
    ],
  });

  console.log('  ✓ Created notifications');

  // ─── Student Reports ───────────────────────────────────────
  await prisma.studentReport.create({
    data: {
      classroomId: classroomA1.id,
      reportedById: mentor1.id,
      reportedStudentId: student2.id,
      note: 'Arrived late to three consecutive practical sessions.',
    },
  });

  console.log('  ✓ Created student reports');

  // ─── Practice Elsewhere Request ────────────────────────────
  await prisma.practiceElsewhereRequest.create({
    data: {
      studentId: student1.id,
      homeSchoolId: schoolA.id,
      hostSchoolId: schoolB.id,
      status: 'APPROVED',
      fee: 1500,
    },
  });

  console.log('  ✓ Created practice elsewhere request');

  console.log('\✓ Seed completed successfully!');
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
