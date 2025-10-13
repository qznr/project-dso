import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      username: 'testuser1',
      email: 'user1@example.com',
      password: hashedPassword,
      bio: 'Ini adalah bio dari testuser1',
      profile_picture_path: 'profiles/testuser1.jpg', 
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      username: 'testuser2',
      email: 'user2@example.com',
      password: hashedPassword, 
      bio: 'Bio user kedua',
    },
  });

  console.log(`Created users: ${user1.username} and ${user2.username}`);

  const thread1 = await prisma.thread.create({
    data: {
      user_id: user1.user_id,
      title: 'Selamat Datang di Thread 1',
      content: 'Ini adalah thread pertama yang dibuat oleh testuser1.',
    },
  });

  const thread2 = await prisma.thread.create({
    data: {
      user_id: user2.user_id,
      title: 'Thread Milik User Kedua',
      content: 'Isi konten ini akan kita gunakan untuk uji BAC.',
    },
  });

  console.log(`Created threads: ${thread1.title} and ${thread2.title}`);

  await prisma.post.create({
    data: {
      user_id: user2.user_id,
      thread_id: thread1.thread_id,
      content: 'Balasan pertama dari user2 di thread user1.',
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
