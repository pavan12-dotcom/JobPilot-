'use client';
// app/dashboard/resume/page.jsx
import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, Code2, User, Briefcase, GraduationCap, Trash2, RefreshCw, Edit2, Check, X, Star } from 'lucide-react';
import { resumeApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ResumePage() {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newResumeLabel, setNewResumeLabel] = useState('');
  
  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  async function fetchResumes(selectId = null) {
    setLoading(true);
    try {
      const res = await resumeApi.getAll();
      const list = res.data || [];
      setResumes(list);
      
      // Auto-select a resume for preview
      if (selectId) {
        const found = list.find((r) => r.id === selectId);
        if (found) setSelectedResume(found);
      } else if (list.length > 0) {
        // Prefer active, else fallback to first
        const active = list.find((r) => r.is_active);
        setSelectedResume(active || list[0]);
      } else {
        setSelectedResume(null);
      }
    } catch (err) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  }

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
    }, 200);

    try {
      const label = newResumeLabel.trim() || file.name.replace(/\.pdf$/i, '');
      const res = await resumeApi.upload(file, label);
      setUploadProgress(100);
      toast.success('Resume uploaded and parsed successfully!');
      setNewResumeLabel('');
      await fetchResumes(res.data?.id);
    } catch (err) {
      toast.error(err.message || 'Failed to upload resume');
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [newResumeLabel]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  async function handleSetActive(id) {
    try {
      await resumeApi.setActive(id);
      toast.success('Active resume updated');
      await fetchResumes(id);
    } catch (err) {
      toast.error('Failed to update active resume');
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeApi.delete(id);
      toast.success('Resume deleted');
      await fetchResumes();
    } catch (err) {
      toast.error('Failed to delete resume');
    }
  }

  async function handleReparse() {
    if (!selectedResume) return;
    setReparsing(true);
    try {
      const res = await resumeApi.reparse(selectedResume.id);
      toast.success('Resume reparsed successfully!');
      await fetchResumes(selectedResume.id);
    } catch (err) {
      toast.error('Reparsing failed');
    } finally {
      setReparsing(false);
    }
  }

  async function handleSaveRename(id) {
    if (!editLabel.trim()) return;
    try {
      await resumeApi.update(id, { label: editLabel.trim() });
      toast.success('Label updated');
      setEditingId(null);
      await fetchResumes(id);
    } catch (err) {
      toast.error('Failed to update label');
    }
  }

  function startRename(resume, e) {
    e.stopPropagation();
    setEditingId(resume.id);
    setEditLabel(resume.label || resume.file_name);
  }

  const parsed = selectedResume?.parsed_data;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text">Resumes</h2>
        <p className="text-text-muted text-sm">Upload and manage multiple resume profiles for A/B testing & scoring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Manage & Upload */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Upload Zone with custom label */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-text text-sm">Upload New Version</h3>
            
            <div className="space-y-2">
              <label className="text-xs text-text-muted font-medium">Resume Label (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Frontend Specialist, ML Engineer"
                value={newResumeLabel}
                onChange={(e) => setNewResumeLabel(e.target.value)}
                className="input-field text-sm py-1.5"
              />
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-surface'
              }`}
            >
              <input {...getInputProps()} id="resume-upload" />
              {uploading ? (
                <div className="space-y-3">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-text">Analyzing & parsing...</p>
                    <div className="progress-bar max-w-xs mx-auto mt-2">
                      <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-semibold text-text">
                    {isDragActive ? 'Drop PDF here' : 'Drag & drop resume PDF'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">or click to browse</p>
                </>
              )}
            </div>
          </div>

          {/* Resume List */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-text text-sm">Your Resumes ({resumes.length})</h3>
            
            {loading && resumes.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" /> Loading resumes...
              </div>
            ) : resumes.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">
                No resumes uploaded yet. Upload your first resume above.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedResume(r)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-2 relative ${
                      selectedResume?.id === r.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-border-hover bg-surface/50'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        {editingId === r.id ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className="input-field py-0.5 px-1.5 text-xs font-semibold"
                            />
                            <button onClick={() => handleSaveRename(r.id)} className="text-success hover:text-success-hover">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-error hover:text-error-hover">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group">
                            <span className="font-semibold text-text text-sm truncate">{r.label || r.file_name}</span>
                            <button
                              onClick={(e) => startRename(r, e)}
                              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text transition-all"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-text-muted truncate">{r.file_name}</p>
                      </div>
                      
                      {/* Active badge / Star */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!r.is_active) handleSetActive(r.id);
                        }}
                        className={`p-1 rounded-md transition-all ${
                          r.is_active 
                            ? 'text-warning bg-warning/10' 
                            : 'text-text-subtle hover:text-warning hover:bg-surface'
                        }`}
                        title={r.is_active ? 'Active Profile' : 'Click to make active'}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border/50">
                      <span>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : 'Unknown Date'}</span>
                      <div className="flex items-center gap-2">
                        {r.is_active && (
                          <span className="text-success font-medium flex items-center gap-0.5 text-[10px]">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDelete(r.id, e)}
                          className="text-text-subtle hover:text-error p-0.5 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Preview */}
        <div className="lg:col-span-2 space-y-6">
          {selectedResume ? (
            <div className="space-y-4">
              
              {/* Profile Card Header */}
              <div className="card flex items-center gap-4 bg-surface/50 border border-border">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text text-lg truncate">{selectedResume.label || selectedResume.file_name}</h3>
                  <p className="text-xs text-text-muted truncate">Filename: {selectedResume.file_name}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleReparse} disabled={reparsing} className="btn-secondary text-xs gap-1.5">
                    <RefreshCw className={`w-3.5 h-3.5 ${reparsing ? 'animate-spin' : ''}`} />
                    Re-parse
                  </button>
                  {selectedResume.is_active ? (
                    <span className="flex items-center gap-1 text-success text-xs font-semibold px-2 py-1 bg-success/10 rounded-full border border-success/20">
                      <CheckCircle className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : (
                    <button onClick={() => handleSetActive(selectedResume.id)} className="btn-primary text-xs py-1 px-3">
                      Make Active
                    </button>
                  )}
                </div>
              </div>

              {/* Parsed AI Data */}
              {parsed ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Summary */}
                  <div className="card md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <User className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-text text-sm uppercase tracking-wider">Profile Overview</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-surface p-3 rounded-lg border border-border/40">
                        <p className="text-text-muted text-[11px] uppercase tracking-wider font-semibold mb-1">Current Role</p>
                        <p className="text-text font-bold text-base">{parsed.current_role || 'Not parsed'}</p>
                      </div>
                      <div className="bg-surface p-3 rounded-lg border border-border/40">
                        <p className="text-text-muted text-[11px] uppercase tracking-wider font-semibold mb-1">Years of Experience</p>
                        <p className="text-text font-bold text-base">{parsed.total_experience_years} Years</p>
                      </div>
                      <div className="bg-surface p-3 rounded-lg border border-border/40">
                        <p className="text-text-muted text-[11px] uppercase tracking-wider font-semibold mb-1">Email Contact</p>
                        <p className="text-text font-bold text-base truncate" title={parsed.email}>{parsed.email || 'None'}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-text-muted text-xs font-semibold">AI Professional Summary</p>
                      <p className="text-sm text-text-muted leading-relaxed">{parsed.summary}</p>
                    </div>
                  </div>

                  {/* Skills List */}
                  <div className="card space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <Code2 className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-text text-sm uppercase tracking-wider">Skills & Tech Stack</h4>
                      <span className="badge-gray ml-auto text-xs px-2 py-0.5">{parsed.skills?.length || 0}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                      {parsed.skills?.map((skill) => (
                        <span key={skill} className="badge-blue text-xs font-medium py-1 px-2.5">{skill}</span>
                      ))}
                    </div>
                  </div>

                  {/* Professional Experience */}
                  <div className="card space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-text text-sm uppercase tracking-wider">Experience History</h4>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {parsed.experience && parsed.experience.length > 0 ? (
                        parsed.experience.map((exp, i) => (
                          <div key={i} className="border-l-2 border-primary/40 pl-3 space-y-1">
                            <p className="font-bold text-text text-sm">{exp.role}</p>
                            <p className="text-text-muted text-xs font-medium">{exp.company} · {exp.years} yrs</p>
                            <p className="text-text-subtle text-xs leading-relaxed mt-1">{exp.description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-text-muted italic">No professional experience parsed.</p>
                      )}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="card md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-text text-sm uppercase tracking-wider">Education Background</h4>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {parsed.education && parsed.education.length > 0 ? (
                        parsed.education.map((edu, i) => (
                          <div key={i} className="bg-surface border border-border/80 rounded-xl px-4 py-3 min-w-[200px] space-y-1">
                            <p className="font-bold text-text text-sm">{edu.degree}</p>
                            <p className="text-text-muted text-xs font-medium">{edu.college}</p>
                            <p className="text-text-subtle text-[11px]">Graduated: {edu.year}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-text-muted italic">No education history parsed.</p>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="card text-center py-12 text-text-muted text-sm border-dashed">
                  This resume has no parsed data. Click "Re-parse" to analyze it using Claude AI.
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-16 text-text-muted border-dashed flex flex-col items-center justify-center gap-3">
              <FileText className="w-12 h-12 text-text-subtle" />
              <div>
                <h4 className="font-bold text-text">No Resume Selected</h4>
                <p className="text-sm text-text-muted mt-1">Select an existing resume or upload a new version on the left.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
