'use client';

import React, { useState, useEffect } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Lock, 
  Unlock, 
  LogIn, 
  LogOut, 
  Sliders, 
  Plus, 
  Trash2, 
  Edit, 
  Upload, 
  Video, 
  Check, 
  ExternalLink, 
  Sparkles,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: 'web' | 'design' | 'video';
  image: string;
  link?: string;
  tags: string[];
}

export default function AdminDashboard() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Login State
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Projects State
  const [projects, setProjects] = useState<PortfolioItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'web' | 'design' | 'video'>('web');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [tagsString, setTagsString] = useState('');
  const [videoFileUrl, setVideoFileUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setHasMounted(true);
    checkSession();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const checkSession = async () => {
    try {
      const res = await fetch('/api/admin/session');
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
        if (data.authenticated) {
          fetchProjects();
        }
      }
    } catch (e) {
      console.error('Session check failed:', e);
    } finally {
      setCheckingSession(false);
    }
  };

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        setIsAuthenticated(true);
        setPassword('');
        fetchProjects();
        triggerToast('Welcome Saurabh! Dashboard unlocked. 🚀');
      } else {
        const data = await res.json();
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Server error during login.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/admin/logout', { method: 'POST' });
      if (res.ok) {
        setIsAuthenticated(false);
        triggerToast('Logged out successfully.');
      }
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const extractVideoFrame = (videoUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0.5; // Seek into the video a bit

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve('');
          }
        } catch (err) {
          console.error('Error drawing video frame to canvas:', err);
          resolve('');
        }
      };
      video.onerror = () => resolve('');
    });
  };

  const base64ToBlob = (base64: string, mime: string) => {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
  };

  const uploadFileToSupabase = async (file: File | Blob, path: string): Promise<string | null> => {
    if (!isSupabaseConfigured) {
      return null;
    }
    try {
      const { data, error } = await supabase.storage
        .from('portfolio-media')
        .upload(path, file, { upsert: true });

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('portfolio-media')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Supabase upload error:', err);
      return null;
    }
  };

  const processUploadedFile = async (file: File) => {
    setIsUploading(true);
    setFormError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const fileName = `${uniqueId}.${fileExt}`;

      if (file.type.startsWith('image/')) {
        // Upload image directly
        if (isSupabaseConfigured) {
          const publicUrl = await uploadFileToSupabase(file, `thumbnails/${fileName}`);
          if (publicUrl) {
            setImage(publicUrl);
            triggerToast('Thumbnail uploaded to Cloud Storage! ✔');
          } else {
            setFormError('Cloud upload failed. Checking bucket parameters.');
          }
        } else {
          // Local base64 fallback for testing before configuring Supabase
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setImage(e.target.result as string);
              triggerToast('Local base64 fallback loaded. (Supabase not configured)');
            }
          };
          reader.readAsDataURL(file);
        }
      } else if (file.type.startsWith('video/')) {
        // Handle Video Upload
        if (isSupabaseConfigured) {
          const publicUrl = await uploadFileToSupabase(file, `videos/${fileName}`);
          if (publicUrl) {
            setVideoFileUrl(publicUrl);
            setCategory('video');
            triggerToast('Video uploaded to Cloud Storage! Generating thumbnail... 📽');
            
            // Extract and upload thumbnail frame
            try {
              const frameBase64 = await extractVideoFrame(publicUrl);
              if (frameBase64) {
                const blob = base64ToBlob(frameBase64, 'image/jpeg');
                const thumbnailName = `thumb-${uniqueId}.jpg`;
                const thumbUrl = await uploadFileToSupabase(blob, `thumbnails/${thumbnailName}`);
                if (thumbUrl) {
                  setImage(thumbUrl);
                  triggerToast('Thumbnail generated and uploaded to Cloud! ✔');
                }
              }
            } catch (err) {
              console.error('Failed to generate thumbnail frame:', err);
            }
          } else {
            setFormError('Video cloud upload failed.');
          }
        } else {
          // Local base64 fallback
          const reader = new FileReader();
          reader.onload = async (e) => {
            if (e.target?.result) {
              const videoDataUrl = e.target.result as string;
              setVideoFileUrl(videoDataUrl);
              setCategory('video');
              triggerToast('Video file loaded! Generating thumbnail... 📽');
              
              try {
                const frame = await extractVideoFrame(videoDataUrl);
                if (frame) setImage(frame);
              } catch (err) {
                console.error(err);
              }
            }
          };
          reader.readAsDataURL(file);
        }
      } else {
        setFormError('Invalid file format. Select an image or video file.');
      }
    } catch (e: any) {
      setFormError(e.message || 'File processing failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !description.trim()) {
      setFormError('Please fill out the Title and Description.');
      return;
    }

    let finalImg = image;
    if (!finalImg) {
      if (category === 'video' && link) {
        const linkStr = link.trim();
        const ytReg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const ytMatch = linkStr.match(ytReg);
        if (ytMatch && ytMatch[2].length === 11) {
          finalImg = `https://img.youtube.com/vi/${ytMatch[2]}/0.jpg`;
        } else {
          finalImg = 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600';
        }
      } else {
        finalImg = `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/600/400`;
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      image: finalImg,
      link: (category === 'video' && videoFileUrl) ? videoFileUrl : (link.trim() || undefined),
      tags: tagsString
        ? tagsString.split(',').map(t => t.trim()).filter(Boolean)
        : [category === 'web' ? 'Web Dev' : category === 'design' ? 'Graphic' : 'Video Edit']
    };

    try {
      const isEditing = !!editingId;
      const url = '/api/projects';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing ? { id: editingId, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        triggerToast(isEditing ? 'Project edited successfully! ✔' : 'New project added to vault! ✔');
        resetForm();
        fetchProjects();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Server rejected request.');
      }
    } catch (err) {
      setFormError('API submission failed.');
    }
  };

  const handleEditClick = (item: PortfolioItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setCategory(item.category);
    setImage(item.image);
    
    // Determine links
    if (item.category === 'video' && item.link?.startsWith('http') && !item.link.includes('youtube.com') && !item.link.includes('drive.google.com') && !item.link.includes('vimeo')) {
      setVideoFileUrl(item.link);
      setLink('');
    } else {
      setVideoFileUrl('');
      setLink(item.link || '');
    }
    
    setTagsString(item.tags.join(', '));
    // Scroll form into view
    document.getElementById('project-form-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This will remove it permanently for all visitors.')) {
      return;
    }
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('Project deleted successfully.');
        fetchProjects();
      } else {
        triggerToast('Delete request failed.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('web');
    setImage('');
    setLink('');
    setVideoFileUrl('');
    setTagsString('');
    setFormError(null);
  };

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-[#050508] text-slate-100 flex items-center justify-center font-display font-black text-xl">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#00ecff] to-[#a855f7] animate-pulse flex items-center justify-center text-black">
          S
        </div>
      </div>
    );
  }

  // Session checking loading state
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#050508] text-slate-100 flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-8 h-8 text-electric-blue animate-spin" />
        <span className="text-xs font-mono text-gray-500">Checking credentials...</span>
      </div>
    );
  }

  // 1. Password Protection Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glow Bubbles */}
        <div className="absolute top-[20%] right-[-10%] w-[350px] h-[350px] bg-electric-blue/5 rounded-full filter blur-[80px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[350px] h-[350px] bg-purple-accent/5 rounded-full filter blur-[80px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0c0c14] p-8 glass-card z-10 shadow-2xl"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-electric-blue to-purple-accent flex items-center justify-center font-display font-black text-2xl text-black shadow-lg shadow-electric-blue/15 mb-4">
              S
            </div>
            <h2 className="text-2xl font-display font-black text-white uppercase tracking-wider">
              Admin Gateway
            </h2>
            <p className="text-xs text-gray-400 mt-2">
              Provide credentials to unlock the portfolio management workspace.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-gray-400 mb-2">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue font-mono"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {loginError && (
              <p className="text-xs text-red-400 font-mono flex items-center gap-1.5 justify-center">
                <span>⚠</span> {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider text-black bg-[#00ecff] hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loggingIn ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Authenticate</span>
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-white/[0.05] text-center">
            <a href="/" className="text-xs text-gray-500 hover:text-white transition-colors">
              Return to Homepage
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Authenticated Dashboard Screen
  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 flex flex-col justify-between overflow-x-hidden antialiased">
      
      {/* Glow Bubbles */}
      <div className="absolute top-[20%] right-[-15%] w-[550px] h-[550px] bg-electric-blue/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-15%] w-[500px] h-[500px] bg-purple-accent/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Action toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg border border-purple-accent/30 bg-black/90 text-sm font-medium shadow-[0_0_30px_rgba(168,85,247,0.2)]"
          >
            <Sparkles className="w-4 h-4 text-electric-blue animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-white/[0.05] bg-[#050508]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-electric-blue to-purple-accent flex items-center justify-center font-display font-black text-xl text-black">
              S
            </div>
            <div>
              <span className="font-display font-black tracking-tight text-white block leading-none">SAURABH</span>
              <span className="text-[9px] font-mono tracking-widest text-[#00ecff] uppercase mt-1 block">Management Vault</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="/" 
              target="_blank" 
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors font-mono"
            >
              <span>View Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-semibold rounded-full border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Console</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column */}
        <div id="project-form-container" className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-white/[0.08] p-6 glass-card shadow-xl sticky top-28">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-6">
              <h3 className="text-lg font-display font-black text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-electric-blue" />
                <span>{editingId ? 'Edit Showcase Project' : 'Add Project to Grid'}</span>
              </h3>
              {editingId && (
                <button 
                  onClick={resetForm}
                  className="text-xs text-[#00ecff] hover:underline"
                >
                  Create New Instead
                </button>
              )}
            </div>

            {/* Config warning if Supabase is missing */}
            {!isSupabaseConfigured && (
              <div className="p-3 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 leading-relaxed font-mono">
                ⚠️ Supabase credentials are not configured in your .env variables. Data will fall back to local mock arrays. Configure Supabase variables on Vercel to store live entries.
              </div>
            )}

            {formError && (
              <div className="p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {formError}
              </div>
            )}

            {/* Media Upload Area */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-gray-400 mb-2">
                  1. Project Media Upload (Image or Video)
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-all relative min-h-[140px] ${
                    isDragging 
                      ? 'border-electric-blue bg-electric-blue/5' 
                      : (videoFileUrl || image) 
                      ? 'border-[#00ecff]/60 bg-[#00ecff]/5' 
                      : 'border-white/[0.08] hover:border-gray-500'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 text-electric-blue animate-spin" />
                      <span className="text-[10px] font-mono text-gray-400">Uploading to cloud bucket...</span>
                    </div>
                  ) : videoFileUrl ? (
                    <div className="flex flex-col items-center">
                      {image && (
                        <img 
                          src={image} 
                          alt="Video Thumbnail Frame" 
                          className="w-24 h-16 object-cover rounded-lg border border-white/10 mb-2" 
                        />
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-[#00ecff] font-semibold font-mono">
                        <Video className="w-3.5 h-3.5 animate-pulse" />
                        <span>Cloud Video Uploaded! ✔</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { setVideoFileUrl(''); setImage(''); }}
                        className="text-[10px] text-red-400 hover:text-red-300 underline mt-1.5 cursor-pointer"
                      >
                        Clear media selection
                      </button>
                    </div>
                  ) : image ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={image} 
                        alt="Thumbnail" 
                        className="w-24 h-16 object-cover rounded-lg border border-white/10 mb-2" 
                      />
                      <p className="text-[10px] text-[#00ecff] font-semibold font-mono">Cloud Thumbnail Uploaded! ✔</p>
                      <button 
                        type="button" 
                        onClick={() => setImage('')}
                        className="text-[10px] text-red-500 hover:text-red-400 underline mt-1 cursor-pointer"
                      >
                        Clear image
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-500 mb-2 animate-bounce" />
                      <p className="text-[11px] text-gray-400 font-medium">
                        Drag & Drop image or video, or
                      </p>
                      <label className="mt-2 text-xs text-electric-blue underline cursor-pointer hover:text-white uppercase font-mono font-bold">
                        Browse files
                        <input 
                          type="file" 
                          accept="image/*,video/*" 
                          className="hidden" 
                          onChange={handleFileSelect} 
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleSubmitProject} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-gray-400 mb-1.5">
                    Category Type *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#111119] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue"
                  >
                    <option value="web">Web Development</option>
                    <option value="design">Graphic Design</option>
                    <option value="video">Video Editing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-gray-400 mb-1.5">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Portfolio Web Platform"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#111119] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-gray-400 mb-1.5">
                    Description Details *
                  </label>
                  <textarea
                    required
                    placeholder="Describe tools, stacks, client scope..."
                    value={description}
                    rows={3}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#111119] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue resize-none"
                  />
                </div>

                {videoFileUrl ? (
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-gray-500 mb-1.5">
                      External Link (Video or Site Link)
                    </label>
                    <div className="w-full px-4 py-2.5 rounded-lg bg-[#111119]/50 border border-white/[0.03] text-gray-400 text-sm flex items-center justify-between font-mono text-xs text-[#00ecff]">
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Using uploaded video
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-gray-400 mb-1.5">
                      External Link (Video or Site Link)
                    </label>
                    <input
                      type="url"
                      placeholder={category === 'video' ? 'https://youtube.com/watch?v=...' : 'https://github.com/...'}
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[#111119] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-gray-400 mb-1.5">
                    Skills tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Next.js, Supabase, Design"
                    value={tagsString}
                    onChange={(e) => setTagsString(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#111119] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 py-3 rounded-xl border border-white/[0.08] text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider text-black bg-[#00ecff] hover:opacity-90 transition-all cursor-pointer"
                  >
                    {editingId ? 'Save Project' : 'Publish Project'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>

        {/* Dashboard Vault Listing Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-black text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-accent" />
              <span>Project Catalog ({projects.length})</span>
            </h3>
            <button 
              onClick={fetchProjects}
              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Reload catalog"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingProjects ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
              <RefreshCw className="w-6 h-6 text-purple-accent animate-spin" />
              <span className="text-xs font-mono text-gray-500 mt-2">Loading active entries...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
              <p className="text-sm text-gray-500 font-mono">The cloud portfolio vault is currently empty. Publish your first project using the form.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div 
                  key={proj.id}
                  className="rounded-xl border border-white/[0.05] bg-[#0c0c14] overflow-hidden flex flex-col justify-between h-[280px]"
                >
                  <div className="relative h-28 bg-[#09090f] overflow-hidden flex items-center justify-center">
                    <img 
                      src={proj.image} 
                      alt={proj.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = 'https://picsum.photos/seed/fallback/600/400';
                      }}
                    />
                    <span className="absolute top-2 left-2 text-[9px] font-mono font-bold tracking-wider uppercase bg-black/60 border border-white/10 px-2 py-0.5 rounded text-gray-300">
                      {proj.category}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{proj.title}</h4>
                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">{proj.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-2 mt-2">
                      <div className="flex flex-wrap gap-1 max-w-[60%]">
                        {proj.tags && proj.tags.slice(0, 2).map((t, i) => (
                          <span key={i} className="text-[9px] font-mono text-gray-500">#{t}</span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(proj)}
                          className="p-1.5 rounded bg-white/5 border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
                          title="Edit project"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(proj.id)}
                          className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/20 cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.03] bg-[#030305] py-6 text-center">
        <p className="text-xs text-gray-500 font-mono">
          Saurabh Console Center &copy; {new Date().getFullYear()}
        </p>
      </footer>

    </div>
  );
}
