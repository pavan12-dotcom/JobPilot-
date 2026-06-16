'use client';

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

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 10, 90));
    }, 200);

    try {
      const label = newResumeLabel.trim() || file.name.replace(/\.pdf$/i, '');
      const res = await resumeApi.upload(file, label);
      setUploadProgress(100);
      toast.success('Resume uploaded and parsed!');
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
      toast.success('Active profile updated');
      await fetchResumes(id);
    } catch (err) {
      toast.error('Failed to update active resume');
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('Delete this resume version?')) return;
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
    <div className="flex-1 flex flex-col space-y-4 px-5 pt-3">
      {/* Upload Box */}
      <div className="card space-y-3 bg-[#1C2B1C]">
        <h3 className="font-bold text-[#F0F5E8] text-xs">Upload New Resume</h3>
        
        <input
          type="text"
          placeholder="Label e.g. Frontend Specialist"
          value={newResumeLabel}
          onChange={(e) => setNewResumeLabel(e.target.value)}
          className="input-field text-xs bg-[#141F14] border-[rgba(184,240,35,0.1)] py-1.5"
        />

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-[#B8F023] bg-[#B8F023]/5'
              : 'border-[rgba(184,240,35,0.15)] hover:border-[#B8F023]/40 hover:bg-[#141F14]'
          }`}
        >
          <input {...getInputProps()} id="resume-upload" />
          {uploading ? (
            <div className="space-y-2">
              <RefreshCw className="w-6 h-6 text-[#B8F023] animate-spin mx-auto" />
              <p className="text-xs text-[#8BA882]">Parsing resume data...</p>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 text-[#B8F023] mx-auto mb-1" />
              <p className="text-xs font-bold text-[#F0F5E8]">Drag & drop resume PDF</p>
              <p className="text-[10px] text-[#556B52] mt-0.5">or click to browse files</p>
            </>
          )}
        </div>
      </div>

      {/* Resume List */}
      <div className="space-y-2">
        <h3 className="font-bold text-[#8BA882] text-xs uppercase tracking-wider px-1">Your Resumes ({resumes.length})</h3>
        
        {loading && resumes.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#8BA882]">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-[#B8F023]" /> Loading...
          </div>
        ) : resumes.length === 0 ? (
          <p className="text-xs text-[#556B52] italic px-1">No resumes uploaded yet.</p>
        ) : (
          <div className="space-y-2.5">
            {resumes.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedResume(r)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 relative ${
                  selectedResume?.id === r.id
                    ? 'border-[#B8F023] bg-[#1C2B1C] shadow-sm'
                    : 'border-[rgba(184,240,35,0.08)] hover:border-[rgba(184,240,35,0.15)] bg-[#1C2B1C]/50'
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
                          className="input-field py-1 px-2 text-xs bg-[#141F14] border-[#B8F023]/40"
                        />
                        <button onClick={() => handleSaveRename(r.id)} className="text-[#4ADE80] hover:text-[#4ADE80]/80 bg-transparent border-none">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-[#F87171] hover:text-[#F87171]/80 bg-transparent border-none">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 group">
                        <span className="font-bold text-[#F0F5E8] text-xs truncate">{r.label || r.file_name}</span>
                        <button
                          onClick={(e) => startRename(r, e)}
                          className="text-[#556B52] hover:text-[#8BA882] transition-all bg-transparent border-none cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-[#556B52] truncate">{r.file_name}</p>
                  </div>
                  
                  {/* Active Profile Pin */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!r.is_active) handleSetActive(r.id);
                    }}
                    className={`p-1 rounded-md transition-all border-none bg-transparent ${
                      r.is_active 
                        ? 'text-[#B8F023]' 
                        : 'text-[#556B52] hover:text-[#B8F023]'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${r.is_active ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between text-[9px] text-[#556B52] pt-1.5 border-t border-[rgba(184,240,35,0.06)]">
                  <span>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : 'Unknown Date'}</span>
                  <div className="flex items-center gap-2">
                    {r.is_active && (
                      <span className="text-[#4ADE80] font-bold flex items-center gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5" /> Active
                      </span>
                    )}
                    <button
                      onClick={(e) => handleDelete(r.id, e)}
                      className="text-[#556B52] hover:text-[#F87171] p-0.5 rounded transition-all bg-transparent border-none cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Detailed Preview */}
      {selectedResume && (
        <div className="card space-y-4 bg-[#1C2B1C]/50 border-[rgba(184,240,35,0.08)]">
          <div className="flex items-center justify-between border-b border-[rgba(184,240,35,0.08)] pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B8F023]" />
              <span className="text-xs font-bold text-[#F0F5E8]">AI Parsed Details</span>
            </div>
            <button onClick={handleReparse} disabled={reparsing} className="text-[10px] text-[#B8F023] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1 font-bold">
              <RefreshCw className={`w-3 h-3 ${reparsing ? 'animate-spin' : ''}`} /> Re-parse
            </button>
          </div>

          {parsed ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-[#1C2B1C] border border-[rgba(184,240,35,0.08)] p-2 rounded-xl">
                  <span className="text-[9px] text-[#556B52] uppercase font-bold block mb-0.5">Parsed Role</span>
                  <span className="text-[#F0F5E8] font-bold block truncate">{parsed.current_role || 'Not parsed'}</span>
                </div>
                <div className="bg-[#1C2B1C] border border-[rgba(184,240,35,0.08)] p-2 rounded-xl">
                  <span className="text-[9px] text-[#556B52] uppercase font-bold block mb-0.5">Experience</span>
                  <span className="text-[#F0F5E8] font-bold block">{parsed.total_experience_years || 0} Years</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8BA882] block">AI Summary</span>
                <p className="text-[#8BA882] leading-relaxed italic text-[11px]">"{parsed.summary}"</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8BA882] block">Extracted Skills</span>
                <div className="flex flex-wrap gap-1">
                  {parsed.skills?.slice(0, 10).map((skill) => (
                    <span key={skill} className="badge-blue text-[9px] py-0.5 px-2 font-bold">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[#556B52] italic">
              No parsed records. Click re-parse to sync with Claude AI.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
