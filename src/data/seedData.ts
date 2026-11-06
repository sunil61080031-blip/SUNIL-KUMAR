import {
  NoticeItem,
  BatchItem,
  FeePlan,
  InstituteConfig,
  StaffMember,
  StudentRecord,
  FeeDiscountType
} from '../types';

export const DISCOUNT_OPTIONS: { label: FeeDiscountType; percent: number; description: string; isCharity?: boolean }[] = [
  { label: 'None', percent: 0, description: 'Standard class-wise tuition fee' },
  { label: 'Sibling (10%)', percent: 10, description: 'Sibling concession when two or more siblings study together' },
  { label: 'Merit Scholarship (20%)', percent: 20, description: '20% scholarship for students scoring 80%+ in school/board exams' },
  { label: 'EWS / Financial Aid (30%)', percent: 30, description: '30% fee reduction for economically weaker families' },
  { label: 'Partial Charity Aid (50%)', percent: 50, description: '50% tuition covered by Institute Student Welfare & Charity Fund', isCharity: true },
  { label: 'Full Charity / Free Education (100%)', percent: 100, description: '100% free education under Charity Quota for orphan / extremely needy students', isCharity: true }
];

export const INITIAL_INSTITUTE_CONFIG: InstituteConfig = {
  name: 'Coaching Student Data Management System',
  hindiName: 'कोचिंग छात्र डेटा प्रबंधन प्रणाली — शिक्षा निकेतन',
  founder: 'Sunil Kumar',
  role: 'Director & Chief Academic Mentor',
  phone: '+919650952919',
  phoneDisplay: '+91 9650952919',
  email: 'sntc.csdms@gmail.com',
  address: 'Ward No. 08, Gadhiya, Bhaptiyahi, Supaul, Bihar - 852109',
  landmark: 'Near Gadhiya Middle School, Bhaptiyahi Block',
  timings: 'Morning: 05:30 AM – 10:00 AM | Evening: 03:00 PM – 06:30 PM | Night Class: 06:30 PM – 09:00 PM',
  established: '2016',
  heroImage: '/src/assets/images/hero_tuition_classroom_1793865164763.jpg',
  directorImage: '/src/assets/images/director_sunil_sir_1793865165634.jpg',
  maxStudentCapacity: 600,
  studyCentres: [
    {
      id: 'centre-1',
      centreCode: 'CTR-GAD-01',
      name: 'Main Campus — Gadhiya (Ward No. 08)',
      location: 'Ward No. 08, Gadhiya, Near Middle School, Bhaptiyahi, Supaul - 852109',
      phone: '+91 9650952919',
      inCharge: 'Sunil Kumar (Director)',
      maxCapacity: 250,
      image: '/src/assets/images/hero_tuition_classroom_1793865164763.jpg'
    },
    {
      id: 'centre-2',
      centreCode: 'CTR-BHP-02',
      name: 'Study Centre 2 — Bhaptiyahi Bazar Branch',
      location: 'Main Market Road, Near NH-57 Crossing, Bhaptiyahi Bazar, Supaul',
      phone: '+91 9650952919',
      inCharge: 'Rajesh Kumar Verma (Branch Coordinator)',
      maxCapacity: 150,
      image: '/src/assets/images/student_study_group_1793865166007.jpg'
    },
    {
      id: 'centre-3',
      centreCode: 'CTR-SRG-03',
      name: 'Study Centre 3 — Saraigarh Station Road',
      location: 'Station Road, Saraigarh-Bhaptiyahi Block, Supaul, Bihar',
      phone: '+91 9650952919',
      inCharge: 'Anita Devi (Junior & Primary Wing Head)',
      maxCapacity: 100,
      image: '/src/assets/images/hero_tuition_classroom_1793865164763.jpg'
    }
  ]
};

// Keep backwards-compatible export for any static fallback
export const INSTITUTE_CONTACT = INITIAL_INSTITUTE_CONFIG;

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'stf-1',
    staffCode: 'STF-001',
    name: 'Sunil Kumar',
    role: 'Director & Chief Mentor (Maths & Science)',
    responsibility: 'Overall Institute Administration, Class 9th–12th Mathematics & Physics, Night Revision Classes & Doubt Clinic',
    qualification: 'M.Sc. (Mathematics), B.Ed. — 10+ Yrs Exp.',
    phone: '+91 9650952919',
    assignedCentreId: 'centre-1',
    assignedBatchIds: ['BATCH-M12', 'BATCH-M10', 'BATCH-N10', 'BATCH-E09'],
    shift: 'Morning, Evening & Night'
  },
  {
    id: 'stf-2',
    staffCode: 'STF-002',
    name: 'Rajesh Kumar Verma',
    role: 'Senior Science & Biology Faculty (I.Sc & Matric)',
    responsibility: 'Class 11th & 12th Chemistry/Biology Lectures, Sunday OMR Test Evaluation & Centre-2 Coordination',
    qualification: 'M.Sc. (Chemistry), B.Ed.',
    phone: '+91 9431088211',
    assignedCentreId: 'centre-2',
    assignedBatchIds: ['BATCH-M12', 'BATCH-M11', 'BATCH-N12'],
    shift: 'Morning & Night Class'
  },
  {
    id: 'stf-3',
    staffCode: 'STF-003',
    name: 'Pramod Kumar Jha',
    role: 'Humanities, SST & Language Mentor',
    responsibility: 'Class 6th–12th Social Science, Arts (History, Pol. Science, Geography), Hindi & Sanskrit Grammar',
    qualification: 'M.A. (History & Hindi), NET Qualified',
    phone: '+91 9934210987',
    assignedCentreId: 'centre-1',
    assignedBatchIds: ['BATCH-M11', 'BATCH-M08', 'BATCH-E67'],
    shift: 'Morning & Evening'
  },
  {
    id: 'stf-4',
    staffCode: 'STF-004',
    name: 'Anita Kumari',
    role: 'Pre-Primary & Primary Wing In-Charge',
    responsibility: 'Nursery, LKG, UKG & Class 1st–5th Phonics, Handwriting, Navodaya Prep & Daily Homework Supervision',
    qualification: 'B.A., D.El.Ed. (Early Childhood Specialist)',
    phone: '+91 9122456701',
    assignedCentreId: 'centre-3',
    assignedBatchIds: ['BATCH-M00', 'BATCH-A15'],
    shift: 'Morning & Afternoon'
  },
  {
    id: 'stf-5',
    staffCode: 'STF-005',
    name: 'Suresh Mandal',
    role: 'Office Administrator, Fee & Charity Desk Coordinator',
    responsibility: 'Student Enrollment/Disenrollment Register, Fee Receipts, Charity Verification & Parent Attendance Alerts',
    qualification: 'B.Com., DCA Computer Accounting',
    phone: '+91 9801554321',
    assignedCentreId: 'centre-1',
    assignedBatchIds: ['ALL-BATCHES'],
    shift: 'Full Day Office'
  }
];

export const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'n-1',
    refNo: 'SNTC/2026/N-104',
    title: 'Special Night Class & Pre-Board OMR Mock Test for Class 10th & 12th',
    hindiTitle: 'कक्षा 10वीं एवं 12वीं के लिए विशेष रात्रि कक्षा (Night Batch) एवं OMR प्री-बोर्ड टेस्ट',
    date: '03 Nov 2026',
    category: 'Exam',
    isUrgent: true,
    isPinned: true,
    applicableClasses: 'Class 9th to 12th (BSEB / CBSE)',
    issuedBy: 'Sunil Kumar (Director)',
    content: 'Special Night Revision Batch (BATCH-N10 & BATCH-N12) runs daily from 06:30 PM to 09:00 PM for board aspirants. Full syllabus 100-mark OMR examination will be held this Sunday at 06:30 AM across all study centres.',
    hindiContent: 'बोर्ड परीक्षार्थियों के लिए विशेष रात्रि बैच (शाम 6:30 से रात 9:00 बजे तक) संचालित है। इस रविवार प्रातः 06:30 बजे से 100 अंकों का OMR टेस्ट आयोजित होगा।'
  },
  {
    id: 'n-2',
    refNo: 'SNTC/2026/N-103',
    title: 'Admissions & Re-Enrollments Open (Nursery to 12th) — 500 Seat Capacity & Charity Quota',
    hindiTitle: 'नर्सरी से 12वीं तक नया नामांकन एवं पुनः नामांकन प्रारंभ — चैरिटी एवं छात्रवृत्ति छूट उपलब्ध',
    date: '01 Nov 2026',
    category: 'Batch',
    isUrgent: true,
    isPinned: true,
    applicableClasses: 'Nursery, LKG, UKG & Class 1st to 12th',
    issuedBy: 'Sunil Kumar (Director)',
    content: 'Enrollments and re-enrollments are open across our study centres (total capacity up to 500 students). Morning, Afternoon, Evening, and Night batches available. Special Charity Free Education (100% Waiver) and Sibling/Merit discounts available on the admission form.',
    hindiContent: 'नर्सरी से कक्षा 12वीं तक सुबह, दोपहर, शाम एवं रात्रि बैचों में नामांकन जारी है। अनाथ एवं अत्यंत निर्धन मेधावी छात्रों के लिए चैरिटी कोटा के अंतर्गत निःशुल्क शिक्षा की सुविधा उपलब्ध है।'
  },
  {
    id: 'n-3',
    refNo: 'SNTC/2026/N-102',
    title: 'Festival Holiday Schedule & Daily Practice Problem (DPP) Distribution',
    hindiTitle: 'पर्व अवकाश एवं दैनिक अभ्यास प्रश्न (DPP) वितरण सूचना',
    date: '28 Oct 2026',
    category: 'Holiday',
    isUrgent: false,
    isPinned: false,
    applicableClasses: 'All Batches (Nursery to Class 12th)',
    issuedBy: 'Sunil Kumar (Director)',
    content: 'Printed holiday homework for Nursery–5th and Daily Practice Problems (DPP) booklets for Class 6th–12th have been distributed to all students across all study centres.',
    hindiContent: 'सभी अध्ययन केंद्रों के विद्यार्थियों को अभ्यास कार्यपुस्तिकाएं वितरित कर दी गई हैं, जिन्हें अवकाश उपरांत जमा करना अनिवार्य है।'
  }
];

export const INITIAL_BATCHES: BatchItem[] = [
  {
    id: 'b-12-m',
    batchCode: 'BATCH-M12',
    classNum: 12,
    classLevel: 'Class 12th (Intermediate Board)',
    hindiSubtitle: 'इंटरमीडिएट बोर्ड परीक्षा प्रातः बैच (I.Sc / I.A / I.Com)',
    badge: 'BSEB & CBSE 12th',
    timing: '05:30 AM – 08:00 AM',
    shift: 'Morning Batch',
    centreId: 'centre-1',
    assignedStaffName: 'Sunil Kumar & Rajesh Verma',
    subjects: ['Physics, Chemistry, Mathematics & Biology (I.Sc)', 'History, Pol. Science, Geography & Economics (I.A)', 'English & Hindi 100 Marks'],
    focusPillars: ['NCERT + Board Question Bank Mastery', '50% Objective OMR Speed Drills', 'Weekly Full-Length Test Series'],
    mentor: 'Sunil Kumar',
    totalSeats: 60,
    enrolledCount: 48,
    medium: 'Hindi & English Medium'
  },
  {
    id: 'b-12-n',
    batchCode: 'BATCH-N12',
    classNum: 12,
    classLevel: 'Class 12th (Night Target Batch)',
    hindiSubtitle: 'कक्षा 12वीं रात्रि टारगेट एवं डाउट क्लीनिक बैच',
    badge: 'Night Special',
    timing: '06:45 PM – 09:00 PM',
    shift: 'Night Class',
    centreId: 'centre-1',
    assignedStaffName: 'Sunil Kumar & Rajesh Verma',
    subjects: ['Intensive Numericals & Derivations (Physics/Maths)', 'Organic Chemistry Reactions', '10-Year PYQ Paper Solving'],
    focusPillars: ['Dedicated Night Study Supervision', 'Board Topper Answer Writing Practice', '1-on-1 Weak Topic Recovery'],
    mentor: 'Sunil Kumar',
    totalSeats: 50,
    enrolledCount: 39,
    medium: 'Hindi & English Medium'
  },
  {
    id: 'b-11-m',
    batchCode: 'BATCH-M11',
    classNum: 11,
    classLevel: 'Class 11th (Intermediate Foundation)',
    hindiSubtitle: 'कक्षा 11वीं इंटरमीडिएट आधारशिला बैच (Science & Arts)',
    badge: 'Stream Foundation',
    timing: '08:00 AM – 10:00 AM',
    shift: 'Morning Batch',
    centreId: 'centre-2',
    assignedStaffName: 'Rajesh Kumar Verma & Pramod Jha',
    subjects: ['Physics, Chemistry, Maths / Biology', 'Humanities / Arts Core Subjects', 'English Communication & Grammar'],
    focusPillars: ['Smooth bridge from Class 10th to 11th', 'In-depth numerical & derivation practice', 'Chapter-wise printed study modules'],
    mentor: 'Rajesh Kumar Verma',
    totalSeats: 60,
    enrolledCount: 42,
    medium: 'Hindi & English Medium'
  },
  {
    id: 'b-10-m',
    batchCode: 'BATCH-M10',
    classNum: 10,
    classLevel: 'Class 10th (Matric Morning Batch)',
    hindiSubtitle: 'मैट्रिक बोर्ड परीक्षा प्रातः विशेष बैच',
    badge: 'BSEB & CBSE 10th',
    timing: '06:00 AM – 08:30 AM',
    shift: 'Morning Batch',
    centreId: 'centre-1',
    assignedStaffName: 'Sunil Kumar',
    subjects: ['Science (Physics, Chemistry, Biology)', 'Mathematics (NCERT + K.C. Sinha)', 'Social Science', 'Sanskrit & Hindi Grammar'],
    focusPillars: ['Line-by-line NCERT decoding', '10 Years BSEB Model Paper Solving', 'Weekly OMR Objective Test'],
    mentor: 'Sunil Kumar',
    totalSeats: 70,
    enrolledCount: 62,
    medium: 'Hindi & English Medium'
  },
  {
    id: 'b-10-n',
    batchCode: 'BATCH-N10',
    classNum: 10,
    classLevel: 'Class 10th (Matric Night Class)',
    hindiSubtitle: 'मैट्रिक बोर्ड रात्रि विशेष रिवीजन एवं टेस्ट बैच',
    badge: 'Night Board Prep',
    timing: '06:30 PM – 08:45 PM',
    shift: 'Night Class',
    centreId: 'centre-1',
    assignedStaffName: 'Sunil Kumar',
    subjects: ['Mathematics High-Weightage Theorems & Trigonometry', 'Science Numericals & Diagrams', 'Daily 50-Q OMR Rapid Fire'],
    focusPillars: ['Supervised Night Study Hall', 'Daily Doubt Resolution', 'Target 450+ Marks in BSEB Matric'],
    mentor: 'Sunil Kumar',
    totalSeats: 60,
    enrolledCount: 51,
    medium: 'Hindi & English Medium'
  },
  {
    id: 'b-9-e',
    batchCode: 'BATCH-E09',
    classNum: 9,
    classLevel: 'Class 9th (Pre-Board Evening Batch)',
    hindiSubtitle: 'कक्षा 9वीं संध्याकालीन आधारशिला बैच',
    badge: 'Concept Builder',
    timing: '03:45 PM – 06:00 PM',
    shift: 'Evening Batch',
    centreId: 'centre-1',
    assignedStaffName: 'Sunil Kumar',
    subjects: ['Mathematics (Geometry & Algebra Focus)', 'General Science with Practical Understanding', 'Social Studies (History & Geography)'],
    focusPillars: ['Numerical practice for Physics', 'Theorem proving methodology', 'Chapter-wise revision sheets'],
    mentor: 'Sunil Kumar',
    totalSeats: 60,
    enrolledCount: 46,
    medium: 'Hindi & English Medium'
  },
  {
    id: 'b-8-m',
    batchCode: 'BATCH-M08',
    classNum: 8,
    classLevel: 'Class 8th (Middle School Batch)',
    hindiSubtitle: 'कक्षा 8वीं बुनियादी ज्ञान प्रातः बैच',
    badge: 'Middle School',
    timing: '07:00 AM – 08:45 AM',
    shift: 'Morning Batch',
    centreId: 'centre-2',
    assignedStaffName: 'Pramod Kumar Jha',
    subjects: ['Mathematics', 'Science', 'English Grammar & Hindi'],
    focusPillars: ['Strong basic calculations', 'Scientific concepts through daily examples', 'Regular mental math drills'],
    mentor: 'Pramod Kumar Jha',
    totalSeats: 50,
    enrolledCount: 38,
    medium: 'Hindi & English Medium'
  },
  {
    id: 'b-6-7-e',
    batchCode: 'BATCH-E67',
    classNum: 7,
    classLevel: 'Class 6th & 7th (Upper Primary)',
    hindiSubtitle: 'कक्षा 6ठी एवं 7वीं संध्याकालीन तैयारी बैच',
    badge: 'Core Skills',
    timing: '04:00 PM – 05:45 PM',
    shift: 'Evening Batch',
    centreId: 'centre-2',
    assignedStaffName: 'Pramod Kumar Jha',
    subjects: ['Basic Mathematics & Geometry', 'Integrated General Science', 'English & Hindi Grammar Essentials'],
    focusPillars: ['Daily homework supervision', 'Step-by-step mathematical reasoning', 'Doubt clearing sessions'],
    mentor: 'Pramod Kumar Jha',
    totalSeats: 45,
    enrolledCount: 34,
    medium: 'Hindi & English Medium'
  },
  {
    id: 'b-1-5-a',
    batchCode: 'BATCH-A15',
    classNum: 5,
    classLevel: 'Class 1st to 5th (Primary & Navodaya)',
    hindiSubtitle: 'कक्षा 1 से 5वीं दोपहर प्राथमिक एवं नवोदय बैच',
    badge: 'Primary & JNV Prep',
    timing: '01:30 PM – 03:30 PM',
    shift: 'Afternoon Batch',
    centreId: 'centre-3',
    assignedStaffName: 'Anita Kumari',
    subjects: ['Mathematics (Tables, Fractions & Word Problems)', 'English Reading, Spelling & Handwriting', 'EVS / General Knowledge & Hindi'],
    focusPillars: ['Complete school homework guidance', 'Neat cursive & Hindi writing practice', 'JNV / Sainik School foundation skills'],
    mentor: 'Anita Kumari',
    totalSeats: 45,
    enrolledCount: 35,
    medium: 'Hindi & English Medium'
  },
  {
    id: 'b-nursery-m',
    batchCode: 'BATCH-M00',
    classNum: 0,
    classLevel: 'Nursery, LKG & UKG (Pre-Primary)',
    hindiSubtitle: 'नर्सरी, एलकेजी एवं यूकेजी — खेल-खेल में प्रारंभिक शिक्षा',
    badge: 'Early Learners',
    timing: '08:30 AM – 10:30 AM',
    shift: 'Morning Batch',
    centreId: 'centre-3',
    assignedStaffName: 'Anita Kumari',
    subjects: ['English Alphabets, Phonics & Rhymes', 'Hindi Varnamala (स्वर एवं व्यंजन)', 'Counting, Shapes, Colors & Good Habits'],
    focusPillars: ['Caring & joyful learning environment', 'Pencil grip & slate/notebook writing', 'Spoken confidence & poem recitation'],
    mentor: 'Anita Kumari',
    totalSeats: 40,
    enrolledCount: 28,
    medium: 'Bilingual (Hindi & English)'
  }
];

export const FEE_PLANS: FeePlan[] = [
  {
    classLevel: 'Class 12th (Intermediate Board)',
    classNum: 12,
    monthlyFee: 850,
    quarterlyFee: 2350,
    registrationFee: 250,
    features: [
      'Complete Intermediate Stream coverage (I.Sc / I.A / I.Com)',
      'Morning Batch + Free Access to Night Doubt & Revision Class',
      'Weekly OMR + Subjective Board Pattern Test Series',
      '10-Year BSEB & CBSE Intermediate Question Bank'
    ]
  },
  {
    classLevel: 'Class 11th (Intermediate)',
    classNum: 11,
    monthlyFee: 750,
    quarterlyFee: 2100,
    registrationFee: 250,
    features: [
      'Foundation for Physics, Chemistry, Maths/Bio or Humanities',
      'Chapter-wise printed study notes and numerical workbooks',
      'Bi-weekly objective & subjective assessments',
      'English & Hindi 100-Marks grammar foundation'
    ]
  },
  {
    classLevel: 'Class 10th (Matric Target)',
    classNum: 10,
    monthlyFee: 600,
    quarterlyFee: 1650,
    registrationFee: 200,
    features: [
      'All subjects: Maths, Science, SST, Hindi/Sanskrit',
      'Morning / Evening Batch + Night Revision Class option',
      'Weekly Sunday OMR mock tests with rank analysis',
      'Free printed formula booklets & PYQs (10-year bank)'
    ]
  },
  {
    classLevel: 'Class 9th (Pre-Board)',
    classNum: 9,
    monthlyFee: 550,
    quarterlyFee: 1500,
    registrationFee: 200,
    features: [
      'Mathematics, Science & Social Science complete syllabus',
      'Daily 2 hours intensive classroom coaching',
      'Chapter-wise objective & subjective evaluation',
      'Detailed NCERT problem-solving notes'
    ]
  },
  {
    classLevel: 'Class 6th to 8th (Middle)',
    classNum: 8,
    monthlyFee: 450,
    quarterlyFee: 1250,
    registrationFee: 150,
    features: [
      'Maths, Science, SST & English Grammar fundamentals',
      'Daily homework check & conceptual clarity',
      'Mental arithmetic and speed-building drills',
      'Monthly written tests and prizes for top scorers'
    ]
  },
  {
    classLevel: 'Class 1st to 5th (Primary)',
    classNum: 5,
    monthlyFee: 350,
    quarterlyFee: 950,
    registrationFee: 100,
    features: [
      'All school subjects covered + daily homework completion',
      'English & Hindi reading, dictation, and neat handwriting',
      'Multiplication tables, basic maths & Navodaya foundation',
      'Caring supervision and regular parent feedback'
    ]
  },
  {
    classLevel: 'Nursery, LKG & UKG',
    classNum: 0,
    monthlyFee: 250,
    quarterlyFee: 700,
    registrationFee: 100,
    features: [
      'Play-way learning for Alphabets (A-Z), Phonics & Varnamala',
      'Counting (1-100), basic tables, colors, and shapes',
      'Pencil holding, tracing, and neat notebook writing',
      'Safe, affectionate environment for young children'
    ]
  }
];

export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'stu-1',
    studentIdCode: 'STU-2026-001',
    studentName: 'Aman Kumar Yadav',
    parentName: 'Rajeshwar Yadav',
    phone: '9801234501',
    classLevel: 'Class 10th (Matric Target)',
    classNum: 10,
    batchId: 'b-10-m',
    batchCode: 'BATCH-M10',
    shift: 'Morning Batch',
    centreId: 'centre-1',
    board: 'BSEB (Bihar Board)',
    village: 'Ward No. 08, Gadhiya',
    enrollmentDate: '2026-07-01',
    enrollmentStatus: 'Enrolled',
    baseMonthlyFee: 600,
    discountType: 'Merit Scholarship (20%)',
    discountPercent: 20,
    isCharitySeat: false,
    netMonthlyFee: 480,
    paidAmount: 1640,
    feePayments: [
      { id: 'fp-1', receiptNo: 'REC-2026-101', date: '2026-07-02', monthLabel: 'Registration + July 2026', amount: 680, mode: 'Cash' },
      { id: 'fp-2', receiptNo: 'REC-2026-148', date: '2026-08-05', monthLabel: 'August 2026', amount: 480, mode: 'UPI / Online' },
      { id: 'fp-3', receiptNo: 'REC-2026-192', date: '2026-09-04', monthLabel: 'September 2026', amount: 480, mode: 'Cash' }
    ],
    attendanceRecords: [
      { id: 'att-101', date: '2026-11-05', status: 'Present', subjectTopic: 'Mathematics — Trigonometry Heights & Distances', shift: 'Morning Batch', markedBy: 'Sunil Kumar', remarks: 'Solved all 10 board questions in class' },
      { id: 'att-102', date: '2026-11-04', status: 'Present', subjectTopic: 'Science (Physics) — Magnetic Effects of Electric Current', shift: 'Morning Batch', markedBy: 'Sunil Kumar', remarks: 'Full homework completed' },
      { id: 'att-103', date: '2026-11-03', status: 'Present', subjectTopic: 'Sunday OMR Board Mock Test #14', shift: 'Morning Batch', markedBy: 'Sunil Kumar', remarks: 'Scored 94/100 (Rank 1 in Batch)' },
      { id: 'att-104', date: '2026-11-02', status: 'Present', subjectTopic: 'Chemistry — Carbon & Its Compounds Nomenclature', shift: 'Morning Batch', markedBy: 'Sunil Kumar' },
      { id: 'att-105', date: '2026-10-31', status: 'Late', subjectTopic: 'Mathematics — Arithmetic Progressions PYQs', shift: 'Morning Batch', markedBy: 'Sunil Kumar', remarks: 'Arrived 10 mins late due to fog' },
      { id: 'att-106', date: '2026-10-30', status: 'Present', subjectTopic: 'English Grammar & Bihar Board Objective Practice', shift: 'Morning Batch', markedBy: 'Vikash Kumar Jha' },
      { id: 'att-107', date: '2026-10-29', status: 'Present', subjectTopic: 'Biology — Life Processes & Diagram Practice', shift: 'Morning Batch', markedBy: 'Sunil Kumar' },
      { id: 'att-108', date: '2026-10-28', status: 'Authorized Leave', subjectTopic: 'Social Studies — Nationalism in India', shift: 'Morning Batch', markedBy: 'Vikash Kumar Jha', remarks: 'Prior medical leave approved by guardian' }
    ],
    notes: 'School topper in Class 9th; attending Morning + Night test series.'
  },
  {
    id: 'stu-2',
    studentIdCode: 'STU-2026-002',
    studentName: 'Priya Kumari',
    parentName: 'Manoj Kumar Sah',
    phone: '9431209876',
    classLevel: 'Class 12th (Intermediate Board)',
    classNum: 12,
    batchId: 'b-12-n',
    batchCode: 'BATCH-N12',
    shift: 'Night Class',
    centreId: 'centre-1',
    board: 'BSEB (Bihar Board)',
    village: 'Bhaptiyahi Bazar',
    enrollmentDate: '2026-08-01',
    enrollmentStatus: 'Enrolled',
    baseMonthlyFee: 850,
    discountType: 'Sibling (10%)',
    discountPercent: 10,
    isCharitySeat: false,
    netMonthlyFee: 765,
    paidAmount: 1780,
    feePayments: [
      { id: 'fp-4', receiptNo: 'REC-2026-205', date: '2026-08-03', monthLabel: 'Registration + August 2026', amount: 1015, mode: 'UPI / Online' },
      { id: 'fp-5', receiptNo: 'REC-2026-260', date: '2026-09-06', monthLabel: 'September 2026', amount: 765, mode: 'Cash' }
    ],
    attendanceRecords: [
      { id: 'att-201', date: '2026-11-05', status: 'Present', subjectTopic: 'Calculus — Definite Integration & Properties', shift: 'Night Class', markedBy: 'Rakesh Ranjan Verma', remarks: 'Active participation in numericals' },
      { id: 'att-202', date: '2026-11-04', status: 'Present', subjectTopic: 'Physics — Ray Optics & Lens Maker Formula', shift: 'Night Class', markedBy: 'Rakesh Ranjan Verma' },
      { id: 'att-203', date: '2026-11-03', status: 'Present', subjectTopic: 'Intermediate OMR Objective Test (70 Marks)', shift: 'Night Class', markedBy: 'Rakesh Ranjan Verma', remarks: 'Scored 64/70' },
      { id: 'att-204', date: '2026-11-02', status: 'Absent', subjectTopic: 'Physical Chemistry — Electrochemistry Nernst Eq.', shift: 'Night Class', markedBy: 'Rakesh Ranjan Verma', remarks: 'Collect backup notes from faculty desk' },
      { id: 'att-205', date: '2026-10-31', status: 'Present', subjectTopic: 'Mathematics — Differential Equations', shift: 'Night Class', markedBy: 'Rakesh Ranjan Verma' },
      { id: 'att-206', date: '2026-10-30', status: 'Present', subjectTopic: 'English 100 Marks — Rainbow Prose & Summary', shift: 'Night Class', markedBy: 'Vikash Kumar Jha' }
    ],
    notes: 'I.Sc (PCM) stream; brother also enrolled in Class 8th.'
  },
  {
    id: 'stu-3',
    studentIdCode: 'STU-2026-003',
    studentName: 'Suraj Kumar Mandal',
    parentName: 'Late Hardev Mandal (Guardian: Sita Devi)',
    phone: '9122334455',
    classLevel: 'Class 10th (Matric Target)',
    classNum: 10,
    batchId: 'b-10-n',
    batchCode: 'BATCH-N10',
    shift: 'Night Class',
    centreId: 'centre-1',
    board: 'BSEB (Bihar Board)',
    village: 'Gadhiya Ward No. 03',
    enrollmentDate: '2026-07-10',
    enrollmentStatus: 'Enrolled',
    baseMonthlyFee: 600,
    discountType: 'Full Charity / Free Education (100%)',
    discountPercent: 100,
    isCharitySeat: true,
    charityNote: 'Approved by Director Sunil Kumar under 100% Free Charity Quota.',
    netMonthlyFee: 0,
    paidAmount: 0,
    feePayments: [
      { id: 'fp-6', receiptNo: 'CHR-2026-001', date: '2026-07-10', monthLabel: 'Full Session 100% Charity Waiver', amount: 0, mode: 'Charity Waiver' }
    ],
    attendanceRecords: [
      { id: 'att-301', date: '2026-11-05', status: 'Present', subjectTopic: 'BSEB Matric Model Paper Set-04 Solution', shift: 'Night Class', markedBy: 'Sunil Kumar', remarks: '100% attendance streak this month' },
      { id: 'att-302', date: '2026-11-04', status: 'Present', subjectTopic: 'Mathematics — Coordinate Geometry & Mensuration', shift: 'Night Class', markedBy: 'Sunil Kumar' },
      { id: 'att-303', date: '2026-11-03', status: 'Present', subjectTopic: 'Sunday OMR Board Mock Test #14', shift: 'Night Class', markedBy: 'Sunil Kumar', remarks: 'Scored 91/100' },
      { id: 'att-304', date: '2026-11-02', status: 'Present', subjectTopic: 'Science — Light Reflection & Refraction Numericals', shift: 'Night Class', markedBy: 'Sunil Kumar' },
      { id: 'att-305', date: '2026-10-31', status: 'Present', subjectTopic: 'Sanskrit Vyakaran & Patra Lekhan', shift: 'Night Class', markedBy: 'Vikash Kumar Jha' }
    ],
    notes: '100% Free Charity Seat + Free Printed Study Material.'
  },
  {
    id: 'stu-4',
    studentIdCode: 'STU-2026-004',
    studentName: 'Rohan Kumar',
    parentName: 'Dinesh Prasad',
    phone: '9934567890',
    classLevel: 'Class 8th (Middle School Batch)',
    classNum: 8,
    batchId: 'b-8-m',
    batchCode: 'BATCH-M08',
    shift: 'Morning Batch',
    centreId: 'centre-2',
    board: 'BSEB (Bihar Board)',
    village: 'Saraigarh Road',
    enrollmentDate: '2026-06-12',
    disenrollmentDate: '2026-08-20',
    reEnrollmentDate: '2026-10-05',
    enrollmentStatus: 'Re-enrolled',
    baseMonthlyFee: 450,
    discountType: 'None',
    discountPercent: 0,
    isCharitySeat: false,
    netMonthlyFee: 450,
    paidAmount: 1500,
    feePayments: [
      { id: 'fp-7', receiptNo: 'REC-2026-088', date: '2026-06-12', monthLabel: 'Reg + June & July 2026', amount: 1050, mode: 'Cash' },
      { id: 'fp-8', receiptNo: 'REC-2026-310', date: '2026-10-05', monthLabel: 'October 2026 (Re-Enrollment)', amount: 450, mode: 'Cash' }
    ],
    attendanceRecords: [
      { id: 'att-401', date: '2026-11-05', status: 'Present', subjectTopic: 'Mathematics — Linear Equations in One Variable', shift: 'Morning Batch', markedBy: 'Vikash Kumar Jha' },
      { id: 'att-402', date: '2026-11-04', status: 'Present', subjectTopic: 'Science — Force, Pressure & Friction', shift: 'Morning Batch', markedBy: 'Sunil Kumar' },
      { id: 'att-403', date: '2026-11-02', status: 'Late', subjectTopic: 'English Grammar — Tenses & Voice Change', shift: 'Morning Batch', markedBy: 'Vikash Kumar Jha' },
      { id: 'att-404', date: '2026-10-31', status: 'Present', subjectTopic: 'Mathematics — Algebraic Identities & Factorisation', shift: 'Morning Batch', markedBy: 'Vikash Kumar Jha' }
    ],
    notes: 'Took break due to family relocation; re-enrolled in October 2026.'
  },
  {
    id: 'stu-5',
    studentIdCode: 'STU-2026-005',
    studentName: 'Aarav Raj',
    parentName: 'Santosh Kumar',
    phone: '9650112233',
    classLevel: 'Nursery, LKG & UKG',
    classNum: 0,
    batchId: 'b-nursery-m',
    batchCode: 'BATCH-M00',
    shift: 'Morning Batch',
    centreId: 'centre-3',
    board: 'CBSE',
    village: 'Saraigarh Station Chowk',
    enrollmentDate: '2026-08-01',
    disenrollmentDate: '2026-10-15',
    enrollmentStatus: 'Disenrolled',
    baseMonthlyFee: 250,
    discountType: 'Partial Charity Aid (50%)',
    discountPercent: 50,
    isCharitySeat: true,
    charityNote: '50% Welfare Aid',
    netMonthlyFee: 125,
    paidAmount: 350,
    feePayments: [
      { id: 'fp-9', receiptNo: 'REC-2026-219', date: '2026-08-01', monthLabel: 'Reg + Aug & Sep 2026', amount: 350, mode: 'Cash' }
    ],
    attendanceRecords: [
      { id: 'att-501', date: '2026-10-14', status: 'Present', subjectTopic: 'English Phonics (A-Z) & Hindi Varnamala', shift: 'Morning Batch', markedBy: 'Priyanka Kumari' },
      { id: 'att-502', date: '2026-10-13', status: 'Present', subjectTopic: 'Number Counting (1 to 50) & Cursive Tracing', shift: 'Morning Batch', markedBy: 'Priyanka Kumari' },
      { id: 'att-503', date: '2026-10-12', status: 'Authorized Leave', subjectTopic: 'Drawing, Colors & Rhymes Recitation', shift: 'Morning Batch', markedBy: 'Priyanka Kumari', remarks: 'Medical leave notified by parent' }
    ],
    notes: 'Temporarily disenrolled due to health reasons; eligible for instant re-enrollment.'
  }
];
