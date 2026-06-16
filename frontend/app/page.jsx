'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('applyai_token');
    if (token) {
      router.push('/dashboard');
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="splash flex flex-col justify-center items-center text-center p-8 min-h-full bg-[#141F14]">
      {/* Animated Splash Ring */}
      <div className="splash-ring w-[180px] h-[180px] rounded-full border border-[rgba(184,240,35,0.20)] flex items-center justify-center mb-8 bg-[rgba(184,240,35,0.12)] relative">
        <div className="inner w-[120px] h-[120px] rounded-full bg-[rgba(184,240,35,0.22)] flex items-center justify-center shadow-lg">
          <i className="ti ti-briefcase text-[52px] text-[#B8F023] animate-pulse"></i>
        </div>
      </div>

      {/* Splash Titles */}
      <h1 className="splash-title text-[28px] font-extrabold text-[#F0F5E8] leading-tight mb-3">
        Find Your <em className="text-[#B8F023] not-italic font-extrabold">Dream Job</em> Faster
      </h1>
      
      <p className="splash-sub text-xs text-[#8BA882] leading-relaxed mb-10 max-w-xs">
        AI-powered matching, daily refreshed roles, and automated browser applications built for you.
      </p>

      {/* Action Buttons */}
      <button 
        onClick={() => router.push('/register')} 
        className="splash-btn w-full bg-[#B8F023] hover:bg-[#CEFF4A] text-[#141F14] border-none py-4 rounded-full text-[15px] font-extrabold transition-all duration-200 cursor-pointer shadow-md transform hover:scale-[1.01]"
      >
        Get started →
      </button>

      <div 
        onClick={() => router.push('/login')} 
        className="splash-skip text-xs text-[#556B52] hover:text-[#8BA882] transition-colors cursor-pointer font-medium mt-3"
      >
        Already have an account? Sign in
      </div>
    </div>
  );
}
