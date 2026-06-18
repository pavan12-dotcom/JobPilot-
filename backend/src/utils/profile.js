const prisma = require('../db/prisma');

async function getProfileCompletion(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
      profile: true,
      resumes: { where: { is_active: true }, take: 1 },
    },
  });

  if (!user) return { percent: 0, isComplete: false, missing: ['User not found'] };

  const missing = [];
  let filledFields = 0;

  // 1. Full Name
  if (user.name && user.name.trim()) {
    filledFields++;
  } else {
    missing.push('Full Name');
  }

  // 2. Email
  if (user.email && user.email.trim()) {
    filledFields++;
  } else {
    missing.push('Email');
  }

  // 3. Preferences: Target Role
  if (user.preferences && user.preferences.target_roles && user.preferences.target_roles.length > 0 && user.preferences.target_roles[0].trim()) {
    filledFields++;
  } else {
    missing.push('Target Role');
  }

  // 4. Preferences: Preferred Location
  if (user.preferences && user.preferences.target_locations && user.preferences.target_locations.length > 0 && user.preferences.target_locations[0].trim()) {
    filledFields++;
  } else {
    missing.push('Preferred Location');
  }

  // Resume check
  const activeResume = user.resumes[0];
  const profile = user.profile;

  if (activeResume) {
    filledFields++; // Resume file uploaded
  } else {
    missing.push('Resume File Uploaded');
  }

  // 5. Phone Number
  const phoneVal = profile?.phone || activeResume?.parsed_data?.phone;
  if (phoneVal && phoneVal.trim()) {
    filledFields++;
  } else {
    missing.push('Phone Number');
  }

  // 6. LinkedIn URL
  const linkedinVal = profile?.linkedin_url || activeResume?.parsed_data?.linkedin_url || activeResume?.parsed_data?.linkedin;
  if (linkedinVal && linkedinVal.trim()) {
    filledFields++;
  } else {
    missing.push('LinkedIn URL');
  }

  // 7. GitHub URL
  const githubVal = profile?.github_url || activeResume?.parsed_data?.github_url || activeResume?.parsed_data?.github;
  if (githubVal && githubVal.trim()) {
    filledFields++;
  } else {
    missing.push('GitHub URL');
  }

  // 8. Portfolio URL
  const portfolioVal = profile?.portfolio_url || activeResume?.parsed_data?.portfolio_url || activeResume?.parsed_data?.portfolio;
  if (portfolioVal && portfolioVal.trim()) {
    filledFields++;
  } else {
    missing.push('Portfolio URL');
  }

  // 9. Current Location
  const currentLocVal = (profile?.city || profile?.state || profile?.country)
    ? `${profile.city || ''} ${profile.state || ''} ${profile.country || ''}`.trim()
    : (activeResume?.parsed_data?.current_location || activeResume?.parsed_data?.location);
  if (currentLocVal && currentLocVal.trim()) {
    filledFields++;
  } else {
    missing.push('Current Location');
  }

  // 10. Skills
  const skillsVal = (profile?.skills && profile.skills.length > 0)
    ? profile.skills
    : activeResume?.parsed_data?.skills;
  if (skillsVal && Array.isArray(skillsVal) && skillsVal.length > 0) {
    filledFields++;
  } else {
    missing.push('Skills');
  }

  // 11. Cover Letter
  const coverLetterVal = profile?.cover_letter_template || activeResume?.parsed_data?.cover_letter;
  if (coverLetterVal && coverLetterVal.trim()) {
    filledFields++;
  } else {
    missing.push('Cover Letter');
  }

  const percent = Math.round((filledFields / 12) * 100);

  return {
    percent: Math.min(percent, 100),
    isComplete: missing.length === 0,
    missing,
  };
}

module.exports = { getProfileCompletion };
