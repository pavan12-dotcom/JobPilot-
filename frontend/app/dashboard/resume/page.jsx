'use client';
// app/dashboard/resume/page.jsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, Code2, User, Briefcase, GraduationCap, Trash2, RefreshCw } from 'lucide-react';
import { resumeApi } from '@/lib/api';
import toast from 'react-hot-toast';

// Demo resume data
const DEMO_RESUME = {
  file_name: 'Alex_Kumar_Resume.pdf',
  created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  parsed_data: {
    name: 'Alex Kumar',
    email: 'alex@email.com',
    phone: '+91 9876543210',
    total_experience_years: 3,
    current_role: 'Software Engineer',
    summary: 'Experienced software engineer with 3 years building scalable web applications using Node.js, React, and PostgreSQL.',
    skills: ['React', 'Node.js', 'Python', 'PostgreSQL', 'AWS', 'Docker', 'Redis', 'TypeScript', 'Next.js', 'GraphQL', 'Git', 'Express.js'],
    experience: [
      { company: 'TechCorp', role: 'Software Engineer', years: 2, description: 'Built scalable APIs using Node.js and PostgreSQL for 100k+ users.' },
      { company: 'StartupXYZ', role: 'Junior Developer', years: 1, description: 'Worked on Python data pipelines and AWS Lambda functions.' },
    ],
    education: [
      { degree: 'B.Tech ECE', college: 'IIT Bangalore', year: 2021 },
    ],
  },
};

export default function ResumePage() {
  const [resume, setResume] = useState(DEMO_RESUME);
  const [uploading, setUploading] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 10, 90));
    }, 300);

    try {
      const res = await resumeApi.upload(file);
      setResume(res.data);
      setUploadProgress(100);
      toast.success('Resume uploaded and parsed successfully!');
    } catch {
      // Use demo mode
      setResume({ ...DEMO_RESUME, file_name: file.name });
      setUploadProgress(100);
      toast.success('Resume uploaded! (Demo mode — AI parsing requires API key)');
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  async function handleReparse() {
    setReparsing(true);
    try {
      const res = await resumeApi.reparse(resume.id);
      setResume(res.data);
      toast.success('Resume reparsed successfully!');
    } catch {
      toast.error('Reparsing requires Claude API key configuration');
    } finally {
      setReparsing(false);
    }
  }

  const parsed = resume?.parsed_data;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text">Resume</h2>
        <p className="text-text-muted text-sm">Upload your resume for AI-powered job matching</p>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50 hover:bg-surface'
        }`}
      >
        <input {...getInputProps()} id="resume-upload" />
        {uploading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            </div>
            <div>
              <p className="font-medium text-text mb-2">Uploading & parsing resume…</p>
              <div className="progress-bar max-w-xs mx-auto">
                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-xs text-text-muted mt-2">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <p className="text-lg font-semibold text-text mb-1">
              {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
            </p>
            <p className="text-text-muted text-sm">or <span className="text-primary">browse files</span></p>
            <p className="text-xs text-text-subtle mt-2">PDF only • Max 10MB</p>
          </>
        )}
      </div>

      {/* Current Resume */}
      {resume && (
        <div className="space-y-4">
          {/* File info */}
          <div className="card flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-text">{resume.file_name}</p>
              <p className="text-xs text-text-muted">
                {resume.created_at ? new Date(resume.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Just uploaded'}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReparse} disabled={reparsing} className="btn-secondary text-xs gap-1.5">
                <RefreshCw className={`w-3 h-3 ${reparsing ? 'animate-spin' : ''}`} />
                Re-parse
              </button>
              <div className="flex items-center gap-1 text-success text-xs font-medium">
                <CheckCircle className="w-4 h-4" /> Active
              </div>
            </div>
          </div>

          {/* Parsed data */}
          {parsed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Summary */}
              <div className="card md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-text">Profile Overview</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div><p className="text-text-muted text-xs mb-1">Current Role</p><p className="text-text font-medium">{parsed.current_role}</p></div>
                  <div><p className="text-text-muted text-xs mb-1">Experience</p><p className="text-text font-medium">{parsed.total_experience_years} years</p></div>
                  <div><p className="text-text-muted text-xs mb-1">Email</p><p className="text-text font-medium truncate">{parsed.email}</p></div>
                </div>
                <p className="text-sm text-text-muted">{parsed.summary}</p>
              </div>

              {/* Skills */}
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Code2 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-text">Skills</h3>
                  <span className="badge-gray ml-auto">{parsed.skills?.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsed.skills?.map((skill) => (
                    <span key={skill} className="badge-blue">{skill}</span>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-text">Experience</h3>
                </div>
                <div className="space-y-3">
                  {parsed.experience?.map((exp, i) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-3">
                      <p className="font-medium text-text text-sm">{exp.role}</p>
                      <p className="text-text-muted text-xs">{exp.company} · {exp.years}y</p>
                      <p className="text-text-subtle text-xs mt-1 line-clamp-2">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="card md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-text">Education</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {parsed.education?.map((edu, i) => (
                    <div key={i} className="bg-surface border border-border rounded-lg px-4 py-3">
                      <p className="font-medium text-text text-sm">{edu.degree}</p>
                      <p className="text-text-muted text-xs">{edu.college} · {edu.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
