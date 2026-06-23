const prisma = require('./src/db/prisma');

async function dumpResume() {
  try {
    const userId = '7ac94a01-3b00-4129-9de7-f45700f8c75b'; // pt6182086@gmail.com
    const resumes = await prisma.resume.findMany({
      where: { user_id: userId }
    });

    console.log(`Found ${resumes.length} resumes for user:`);
    resumes.forEach((resume, idx) => {
      console.log(`\nResume ${idx + 1}:`);
      console.log('ID:', resume.id);
      console.log('Label:', resume.label);
      console.log('Active:', resume.is_active);
      console.log('File Name:', resume.file_name);
      console.log('Created At:', resume.created_at.toISOString());
      console.log('Parsed Data:', JSON.stringify(resume.parsed_data, null, 2));
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

dumpResume();
