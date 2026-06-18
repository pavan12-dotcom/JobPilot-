const prisma = require('../db/prisma');

async function getProfileCompletion(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
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

  // Resume checks
  const activeResume = user.resumes[0];
  if (activeResume) {
    filledFields++; // Resume file uploaded
    
    const p = activeResume.parsed_data || {};
    
    // 5. Phone Number
    if (p.phone && p.phone.trim()) {
      filledFields++;
    } else {
      missing.push('Phone Number');
    }

    // 6. LinkedIn URL
    const linkedin = p.linkedin_url || p.linkedin;
    if (linkedin && linkedin.trim()) {
      filledFields++;
    } else {
      missing.push('LinkedIn URL');
    }

    // 7. GitHub URL
    const github = p.github_url || p.github;
    if (github && github.trim()) {
      filledFields++;
    } else {
      missing.push('GitHub URL');
    }

    // 8. Portfolio URL
    const portfolio = p.portfolio_url || p.portfolio;
    if (portfolio && portfolio.trim()) {
      filledFields++;
    } else {
      missing.push('Portfolio URL');
    }

    // 9. Current Location
    const currentLoc = p.current_location || p.location;
    if (currentLoc && currentLoc.trim()) {
      filledFields++;
    } else {
      missing.push('Current Location');
    }

    // 10. Skills
    if (p.skills && Array.isArray(p.skills) && p.skills.length > 0) {
      filledFields++;
    } else {
      missing.push('Skills');
    }

    // 11. Cover Letter
    if (p.cover_letter && p.cover_letter.trim()) {
      filledFields++;
    } else {
      missing.push('Cover Letter');
    }
  } else {
    missing.push('Resume File Uploaded', 'Phone Number', 'LinkedIn URL', 'GitHub URL', 'Portfolio URL', 'Current Location', 'Skills', 'Cover Letter');
  }

  const percent = Math.round((filledFields / 12) * 100);

  return {
    percent: Math.min(percent, 100),
    isComplete: missing.length === 0,
    missing,
  };
}

module.exports = { getProfileCompletion };
