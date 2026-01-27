import { PrismaClient, ItemType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const existingCount = await prisma.item.count();
  if (existingCount > 0) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  const folder1 = await prisma.item.create({
    data: {
      type: ItemType.FOLDER,
      name: 'Finance',
      createdBy: 'John Smith',
    },
  });

  const folder2 = await prisma.item.create({
    data: {
      type: ItemType.FOLDER,
      name: 'Human Resources',
      createdBy: 'Emily Chen',
    },
  });

  const folder3 = await prisma.item.create({
    data: {
      type: ItemType.FOLDER,
      name: 'Marketing',
      createdBy: 'Michael Brown',
    },
  });

  await prisma.item.create({
    data: {
      type: ItemType.DOCUMENT,
      name: 'Q4 Financial Report',
      parentId: folder1.id,
      createdBy: 'John Smith',
      fileSizeBytes: BigInt(2457600),
      mimeType: 'application/pdf',
      extension: 'pdf',
    },
  });

  await prisma.item.create({
    data: {
      type: ItemType.DOCUMENT,
      name: 'Budget Template 2024',
      parentId: folder1.id,
      createdBy: 'Sarah Wilson',
      fileSizeBytes: BigInt(102400),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
    },
  });

  const subFolder1 = await prisma.item.create({
    data: {
      type: ItemType.FOLDER,
      name: 'Tax Documents',
      parentId: folder1.id,
      createdBy: 'John Smith',
    },
  });

  await prisma.item.create({
    data: {
      type: ItemType.DOCUMENT,
      name: 'Tax Filing 2023',
      parentId: subFolder1.id,
      createdBy: 'John Smith',
      fileSizeBytes: BigInt(512000),
      mimeType: 'application/pdf',
      extension: 'pdf',
    },
  });

  await prisma.item.create({
    data: {
      type: ItemType.DOCUMENT,
      name: 'Employee Handbook',
      parentId: folder2.id,
      createdBy: 'Emily Chen',
      fileSizeBytes: BigInt(1048576),
      mimeType: 'application/pdf',
      extension: 'pdf',
    },
  });

  await prisma.item.create({
    data: {
      type: ItemType.DOCUMENT,
      name: 'Leave Policy',
      parentId: folder2.id,
      createdBy: 'Emily Chen',
      fileSizeBytes: BigInt(51200),
      mimeType: 'application/msword',
      extension: 'doc',
    },
  });

  await prisma.item.create({
    data: {
      type: ItemType.DOCUMENT,
      name: 'Brand Guidelines',
      parentId: folder3.id,
      createdBy: 'Michael Brown',
      fileSizeBytes: BigInt(8388608),
      mimeType: 'application/pdf',
      extension: 'pdf',
    },
  });

  await prisma.item.create({
    data: {
      type: ItemType.DOCUMENT,
      name: 'Social Media Calendar',
      parentId: folder3.id,
      createdBy: 'Lisa Anderson',
      fileSizeBytes: BigInt(204800),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
    },
  });

  await prisma.item.create({
    data: {
      type: ItemType.DOCUMENT,
      name: 'Company Overview',
      createdBy: 'Admin',
      fileSizeBytes: BigInt(1536000),
      mimeType: 'application/pdf',
      extension: 'pdf',
    },
  });

  await prisma.item.create({
    data: {
      type: ItemType.DOCUMENT,
      name: 'Org Chart',
      createdBy: 'Admin',
      fileSizeBytes: BigInt(256000),
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      extension: 'pptx',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
