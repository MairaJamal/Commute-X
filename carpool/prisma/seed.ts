import { PrismaClient } from '@prisma/client';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const adapter = new PrismaBetterSQLite3({ url: `file:${path.join(__dirname, 'dev.db')}` });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = 'commutex123'; // demo-only credential for all seeded accounts

async function main() {
  // Clear existing database (child tables first)
  await prisma.session.deleteMany({});
  await prisma.sosLocation.deleteMany({});
  await prisma.rideLocation.deleteMany({});
  await prisma.sosEvent.deleteMany({});
  await prisma.rideParticipant.deleteMany({});
  await prisma.ride.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.commuteRequest.deleteMany({});
  await prisma.verificationDocument.deleteMany({});
  await prisma.emergencyContact.deleteMany({});
  await prisma.userPreferences.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // 1. Aisha Kapoor (Main Profile User)
  const aisha = await prisma.user.create({
    data: {
      passwordHash,
      name: 'Aisha Kapoor',
      email: 'aisha@nitc.ac.in',
      phone: '+91 9876543210',
      role: 'student',
      gender: 'female',
      verificationStatus: 'verified',
      avatarText: 'AK',
      rating: 4.9,
      ridesCompleted: 128,
      memberSince: 'Jan 2025',
      userPreferences: {
        create: {
          usualRoute: 'Hostel Sector 17 → Tech Park',
          chatStyle: 'Quiet / headphones',
          musicStyle: "Okay with driver's choice",
          womenOnlyMode: true,
          willingToDrive: false,
        },
      },
      emergencyContacts: {
        create: [
          { name: 'Papa', phone: '+91 9988776655' },
          { name: 'Hostel Warden', phone: '+91 9944332211' },
        ],
      },
      verificationDocuments: {
        create: [
          { documentType: 'Student Card', fileUrl: '/uploads/aisha_student_card.jpg', status: 'verified' },
          { documentType: 'Govt ID', fileUrl: '/uploads/aisha_govt_id.jpg', status: 'verified' },
        ],
      },
      commuteRequests: {
        create: [
          {
            pickupAddress: 'Sector 17 Hostel, Block C',
            pickupLat: 11.25,
            pickupLng: 75.78,
            destAddress: 'Tech Park, Gate 3',
            destLat: 11.35,
            destLng: 75.88,
            departureTime: '08:10',
            flexibilityWindow: '± 15 minutes',
            frequency: 'daily',
            daysOfWeek: 'M,T,W,T,F',
            womenOnly: true,
            willingToDrive: false,
          },
        ],
      },
    },
    include: { commuteRequests: true },
  });

  // 2. Priya Menon (AI Match)
  const priya = await prisma.user.create({
    data: {
      passwordHash,
      name: 'Priya Menon',
      email: 'priya@commutex.com',
      phone: '+91 9812345678',
      role: 'office_worker',
      gender: 'female',
      verificationStatus: 'verified',
      avatarText: 'PM',
      rating: 4.8,
      ridesCompleted: 203,
      memberSince: 'Mar 2024',
      userPreferences: {
        create: {
          usualRoute: 'Hostel Sector 17 → Tech Park',
          chatStyle: 'Friendly',
          musicStyle: 'Quiet',
          womenOnlyMode: true,
          willingToDrive: true,
        },
      },
      commuteRequests: {
        create: [
          {
            pickupAddress: 'Sector 17 Hostel',
            pickupLat: 11.25,
            pickupLng: 75.78,
            destAddress: 'Tech Park, Wing B',
            destLat: 11.36,
            destLng: 75.89,
            departureTime: '08:10',
            flexibilityWindow: '± 10 minutes',
            frequency: 'daily',
            daysOfWeek: 'M,T,W,T,F',
            womenOnly: true,
            willingToDrive: true,
          },
        ],
      },
    },
  });

  // 3. Sara Fernandes (AI Match)
  const sara = await prisma.user.create({
    data: {
      passwordHash,
      name: 'Sara Fernandes',
      email: 'sara@nitc.ac.in',
      phone: '+91 9823456789',
      role: 'student',
      gender: 'female',
      verificationStatus: 'verified',
      avatarText: 'SF',
      rating: 4.9,
      ridesCompleted: 341,
      memberSince: 'Jun 2024',
      userPreferences: {
        create: {
          usualRoute: 'Hostel Sector 17 → Tech Park',
          chatStyle: 'Music okay',
          musicStyle: 'Pop/Rock',
          womenOnlyMode: true,
          willingToDrive: true,
        },
      },
      commuteRequests: {
        create: [
          {
            pickupAddress: 'Sector 17 Hostel, Block A',
            pickupLat: 11.255,
            pickupLng: 75.782,
            destAddress: 'Tech Park, Gate 1',
            destLat: 11.348,
            destLng: 75.878,
            departureTime: '08:15',
            flexibilityWindow: '± 20 minutes',
            frequency: 'daily',
            daysOfWeek: 'M,T,W,T,F',
            womenOnly: true,
            willingToDrive: true,
          },
        ],
      },
    },
  });

  // 4. Divya Rao (AI Match)
  const divya = await prisma.user.create({
    data: {
      passwordHash,
      name: 'Divya Rao',
      email: 'divya@commutex.com',
      phone: '+91 9834567890',
      role: 'office_worker',
      gender: 'female',
      verificationStatus: 'verified',
      avatarText: 'DR',
      rating: 4.6,
      ridesCompleted: 97,
      memberSince: 'Nov 2024',
      userPreferences: {
        create: {
          usualRoute: 'Hostel Sector 17 → Tech Park',
          chatStyle: 'Chatty',
          musicStyle: 'Any',
          womenOnlyMode: true,
          willingToDrive: false,
        },
      },
      commuteRequests: {
        create: [
          {
            pickupAddress: 'Sector 17 Hostel, Warden Office',
            pickupLat: 11.248,
            pickupLng: 75.778,
            destAddress: 'Tech Park, Gate 3',
            destLat: 11.35,
            destLng: 75.88,
            departureTime: '08:05',
            flexibilityWindow: '± 15 minutes',
            frequency: 'daily',
            daysOfWeek: 'M,T,W,T,F',
            womenOnly: true,
            willingToDrive: false,
          },
        ],
      },
    },
  });

  // 5. Rohan Sharma (Male Student - testing filtering)
  await prisma.user.create({
    data: {
      passwordHash,
      name: 'Rohan Sharma',
      email: 'rohan@nitc.ac.in',
      phone: '+91 9845678901',
      role: 'student',
      gender: 'male',
      verificationStatus: 'verified',
      avatarText: 'RS',
      rating: 4.7,
      ridesCompleted: 50,
      memberSince: 'Feb 2025',
      userPreferences: {
        create: {
          usualRoute: 'Hostel Sector 17 → City Center',
          chatStyle: 'Quiet',
          musicStyle: 'Any',
          womenOnlyMode: false,
          willingToDrive: true,
        },
      },
      commuteRequests: {
        create: [
          {
            pickupAddress: 'Sector 17 Hostel, Block D',
            pickupLat: 11.252,
            pickupLng: 75.781,
            destAddress: 'City Center, Gate A',
            destLat: 11.29,
            destLng: 75.72,
            departureTime: '08:30',
            flexibilityWindow: '± 15 minutes',
            frequency: 'daily',
            daysOfWeek: 'M,T,W,T,F',
            womenOnly: false,
            willingToDrive: true,
          },
        ],
      },
    },
  });

  const aishaRequestId = aisha.commuteRequests[0].id;

  // Seed chat threads matching the former mockup
  await prisma.message.createMany({
    data: [
      // Priya thread
      {
        senderId: priya.id,
        receiverId: aisha.id,
        requestId: aishaRequestId,
        content: 'Hey! Saw we matched for the Sector 17 → Tech Park route 🙂',
        createdAt: new Date('2026-07-20T07:00:00Z'),
      },
      {
        senderId: aisha.id,
        receiverId: priya.id,
        requestId: aishaRequestId,
        content: 'Hi Priya! Yes, I usually leave around 8:10. Does that work?',
        createdAt: new Date('2026-07-20T07:01:00Z'),
      },
      {
        senderId: priya.id,
        receiverId: aisha.id,
        requestId: aishaRequestId,
        content: "Perfect, I'm out the door by then anyway. Want me to pick you up outside Block C?",
        createdAt: new Date('2026-07-20T07:02:00Z'),
      },
      {
        senderId: aisha.id,
        receiverId: priya.id,
        requestId: aishaRequestId,
        content: 'Sounds good. Splitting the fare 3 ways like the app suggested?',
        createdAt: new Date('2026-07-20T07:03:00Z'),
      },
      {
        senderId: priya.id,
        receiverId: aisha.id,
        requestId: aishaRequestId,
        content: "Yep, ₹38 each. Let's lock it in for tomorrow.",
        createdAt: new Date('2026-07-20T07:04:00Z'),
      },
      // Sara thread
      {
        senderId: aisha.id,
        receiverId: sara.id,
        requestId: aishaRequestId,
        content: 'Hey Sara! Are you driving tomorrow?',
        createdAt: new Date('2026-07-19T18:00:00Z'),
      },
      {
        senderId: sara.id,
        receiverId: aisha.id,
        requestId: aishaRequestId,
        content: 'Yes, leaving at 8:05. Fits your schedule?',
        createdAt: new Date('2026-07-19T18:01:00Z'),
      },
      {
        senderId: aisha.id,
        receiverId: sara.id,
        requestId: aishaRequestId,
        content: 'Yes, perfect!',
        createdAt: new Date('2026-07-19T18:02:00Z'),
      },
      {
        senderId: sara.id,
        receiverId: aisha.id,
        requestId: aishaRequestId,
        content: 'Sounds good, see you at 8!',
        createdAt: new Date('2026-07-19T18:03:00Z'),
      },
      // Divya thread
      {
        senderId: aisha.id,
        receiverId: divya.id,
        requestId: aishaRequestId,
        content: 'Hey Divya! Are you comfortable with quiet commute?',
        createdAt: new Date('2026-07-18T10:00:00Z'),
      },
      {
        senderId: divya.id,
        receiverId: aisha.id,
        requestId: aishaRequestId,
        content: 'Yes, absolutely, I usually listen to podcasts.',
        createdAt: new Date('2026-07-18T10:01:00Z'),
      },
      {
        senderId: divya.id,
        receiverId: aisha.id,
        requestId: aishaRequestId,
        content: 'Confirmed for Monday',
        createdAt: new Date('2026-07-18T10:02:00Z'),
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
