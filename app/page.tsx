'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  motion, 
  AnimatePresence, 
  useScroll, 
  useTransform 
} from 'motion/react';
import { 
  Code, 
  Palette, 
  Video, 
  ExternalLink, 
  Mail, 
  Github, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Menu, 
  X, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Upload, 
  Sliders, 
  Layers, 
  ArrowUpRight,
  Folder,
  Lock,
  Unlock,
  LogIn,
  LogOut
} from 'lucide-react';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: 'web' | 'design' | 'video';
  image: string;
  link?: string;
  tags: string[];
}

const DEFAULT_PORTFOLIO: PortfolioItem[] = [];

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
    }
  }
};

// High-capacity IndexedDB Database Helper for large uploads (videos, audio, heavy base64 graphics)
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported or server-side rendering scope'));
      return;
    }
    const request = window.indexedDB.open('SaurabhPortfolioDB', 1);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('portfolio')) {
        db.createObjectStore('portfolio');
      }
    };
    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };
    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
};

const dbGet = <T extends unknown>(key: string): Promise<T | null> => {
  return openDB()
    .then((db) => {
      return new Promise<T | null>((resolve, reject) => {
        const transaction = db.transaction('portfolio', 'readonly');
        const store = transaction.objectStore('portfolio');
        const request = store.get(key);
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    })
    .catch((err) => {
      console.warn('IndexedDB read failed, falling back:', err);
      return null;
    });
};

const dbSet = <T extends unknown>(key: string, value: T): Promise<void> => {
  return openDB()
    .then((db) => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('portfolio', 'readwrite');
        const store = transaction.objectStore('portfolio');
        const request = store.put(value, key);
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    })
    .catch((err) => {
      console.warn('IndexedDB write failed:', err);
    });
};

const dbRemove = (key: string): Promise<void> => {
  return openDB()
    .then((db) => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('portfolio', 'readwrite');
        const store = transaction.objectStore('portfolio');
        const request = store.delete(key);
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    })
    .catch((err) => {
      console.warn('IndexedDB delete failed:', err);
    });
};

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  // Admin Mode States
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      const saved = safeLocalStorage.getItem('saurabh_portfolio_is_admin');
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Mobile navigation open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'web' | 'design' | 'video'>('all');

  // Portfolio items state, loading from IndexedDB / LocalStorage if present
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(() => {
    try {
      const savedLocal = safeLocalStorage.getItem('saurabh_portfolio_items');
      if (savedLocal) {
        const items = JSON.parse(savedLocal);
        if (Array.isArray(items) && items.length > 0) {
          return items;
        }
      }
    } catch (e) {
      console.warn('Error fetching initial portfolio items:', e);
    }
    return DEFAULT_PORTFOLIO;
  });
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Manage Showcase Panel status
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // New Project Form Inputs initialized with lazy initial state from safe draft storage
  const [newTitle, setNewTitle] = useState<string>(() => {
    try {
      const savedDraft = safeLocalStorage.getItem('saurabh_draft_portfolio_item');
      if (savedDraft) {
        return JSON.parse(savedDraft).title || '';
      }
    } catch (e) {}
    return '';
  });
  const [newDesc, setNewDesc] = useState<string>(() => {
    try {
      const savedDraft = safeLocalStorage.getItem('saurabh_draft_portfolio_item');
      if (savedDraft) {
        return JSON.parse(savedDraft).desc || '';
      }
    } catch (e) {}
    return '';
  });
  const [newCategory, setNewCategory] = useState<'web' | 'design' | 'video'>(() => {
    try {
      const savedDraft = safeLocalStorage.getItem('saurabh_draft_portfolio_item');
      if (savedDraft) {
        return JSON.parse(savedDraft).category || 'web';
      }
    } catch (e) {}
    return 'web';
  });
  const [newImage, setNewImage] = useState<string>(() => {
    try {
      const savedDraft = safeLocalStorage.getItem('saurabh_draft_portfolio_item');
      if (savedDraft) {
        return JSON.parse(savedDraft).image || '';
      }
    } catch (e) {}
    return '';
  });
  const [newLink, setNewLink] = useState<string>(() => {
    try {
      const savedDraft = safeLocalStorage.getItem('saurabh_draft_portfolio_item');
      if (savedDraft) {
        return JSON.parse(savedDraft).link || '';
      }
    } catch (e) {}
    return '';
  });
  const [newTagsString, setNewTagsString] = useState<string>(() => {
    try {
      const savedDraft = safeLocalStorage.getItem('saurabh_draft_portfolio_item');
      if (savedDraft) {
        return JSON.parse(savedDraft).tagsString || '';
      }
    } catch (e) {}
    return '';
  });
  const [newVideoFile, setNewVideoFile] = useState<string>(() => {
    try {
      const savedDraft = safeLocalStorage.getItem('saurabh_draft_portfolio_item');
      if (savedDraft) {
        return JSON.parse(savedDraft).videoFile || '';
      }
    } catch (e) {}
    return '';
  });
  const [isDragging, setIsDragging] = useState(false);

  // Contact Form Inputs
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  // Toast State for actions feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scroll variables for parallax background bubbles
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const bgBubbleY1 = useTransform(scrollY, [0, 1000], [0, -100]);
  const bgBubbleY2 = useTransform(scrollY, [0, 1000], [0, 80]);

  // Load portfolio from safe localStorage immediately on mount, and try high-capacity IndexedDB async with fallback timeout
  useEffect(() => {
    let active = true;

    // Set hasMounted asynchronously via microtask to comply with set-state-in-effect lint guidelines
    Promise.resolve().then(() => {
      if (active) {
        setHasMounted(true);
      }
    });

    // A helper to impose a strict timeout on potentially pending/stuck IndexedDB promises inside partitioned iframe contexts
    const withTimeout = <T extends unknown>(promise: Promise<T>, ms: number): Promise<T> => {
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('IndexedDB execution timed out within iframe runtime.'));
        }, ms);
      });
      return Promise.race([promise, timeoutPromise]).then((res) => {
        clearTimeout(timer);
        return res;
      }, (err) => {
        clearTimeout(timer);
        throw err;
      });
    };

    // Query IndexedDB asynchronously in a non-blocking background task
    const loadFromIndexedDB = async () => {
      try {
        const idbItems = await withTimeout(dbGet<PortfolioItem[]>('saurabh_portfolio_items'), 250);
        if (idbItems && Array.isArray(idbItems) && active) {
          setPortfolioItems(idbItems);
        }
      } catch (e) {
        console.info('IndexedDB list load timed out or sandboxed, using localStorage state cache completely:', e);
      }

      try {
        const idbDraft = await withTimeout(dbGet<any>('saurabh_draft_portfolio_item'), 250);
        if (idbDraft && active) {
          if (idbDraft.title) setNewTitle(idbDraft.title);
          if (idbDraft.desc) setNewDesc(idbDraft.desc);
          if (idbDraft.category) setNewCategory(idbDraft.category);
          if (idbDraft.image) setNewImage(idbDraft.image);
          if (idbDraft.link) setNewLink(idbDraft.link);
          if (idbDraft.tagsString) setNewTagsString(idbDraft.tagsString);
          if (idbDraft.videoFile) setNewVideoFile(idbDraft.videoFile);
        }
      } catch (e) {}
    };

    loadFromIndexedDB();

    return () => {
      active = false;
    };
  }, []);

  // Save to IndexedDB (and best-effort localStorage fallback) whenever items change
  const savePortfolio = (items: PortfolioItem[]) => {
    setPortfolioItems(items);
    
    // Save to IndexedDB (Up to hundreds of MB space, perfectly stores heavy base64 data)
    dbSet('saurabh_portfolio_items', items);

    // Save to localStorage best-effort (fails silently if quota is exceeded due to giant base64s)
    try {
      safeLocalStorage.setItem('saurabh_portfolio_items', JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage limit exceeded, falling back to database engine:', e);
    }
  };

  // Save product draft to IndexedDB (and best-effort localStorage) automatically as the user types
  useEffect(() => {
    if (!hasMounted) return;
    const draft = {
      title: newTitle,
      desc: newDesc,
      category: newCategory,
      image: newImage,
      link: newLink,
      tagsString: newTagsString,
      videoFile: newVideoFile,
    };
    const allEmpty = !newTitle && !newDesc && !newImage && !newLink && !newTagsString && !newVideoFile;
    if (allEmpty) {
      try {
        safeLocalStorage.removeItem('saurabh_draft_portfolio_item');
      } catch (e) {}
      dbRemove('saurabh_draft_portfolio_item');
    } else {
      try {
        safeLocalStorage.setItem('saurabh_draft_portfolio_item', JSON.stringify(draft));
      } catch (e) {
        // Safe to ignore as IndexedDB covers the high capacity write
      }
      dbSet('saurabh_draft_portfolio_item', draft);
    }
  }, [newTitle, newDesc, newCategory, newImage, newLink, newTagsString, newVideoFile, hasMounted]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync isAdmin state to localStorage
  useEffect(() => {
    if (isAdmin) {
      safeLocalStorage.setItem('saurabh_portfolio_is_admin', 'true');
    } else {
      safeLocalStorage.removeItem('saurabh_portfolio_is_admin');
    }
  }, [isAdmin]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    if (adminPasswordInput === correctPassword) {
      setIsAdmin(true);
      setIsLoginOpen(false);
      setAdminPasswordInput('');
      setLoginError(null);
      triggerToast('Welcome Saurabh! Admin mode active. 🚀');
    } else {
      setLoginError('Invalid administrator credentials.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setCustomizerOpen(false);
    triggerToast('Logged out of admin mode.');
  };

  // Helper to extract a representative frame from an uploaded video file
  const extractVideoFrame = (videoUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0.5; // Seek into the video a bit to avoid black screen

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

      video.onerror = () => {
        resolve('');
      };
    });
  };

  // Drag and Drop files upload handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processUploadedFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewImage(event.target.result as string);
          triggerToast('Thumbnail image uploaded successfully! ✔');
        }
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      if (file.size > 12 * 1024 * 1024) {
        triggerToast('Video file size is over 12MB. Processing may take some time!');
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const videoDataUrl = event.target.result as string;
          setNewVideoFile(videoDataUrl);
          setNewCategory('video'); // Auto-select video editing category
          triggerToast('Video file uploaded! Generating thumbnail frame... 📽');
          
          try {
            const frame = await extractVideoFrame(videoDataUrl);
            if (frame) {
              setNewImage(frame);
              triggerToast('Video thumbnail generated from first frame! ✔');
            }
          } catch (err) {
            console.error('Error generating frame:', err);
          }
        }
      };
      reader.readAsDataURL(file);
    } else {
      triggerToast('Unsupported style format! Select an image or video file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Add Item to state and localStorage
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      triggerToast('Please fill out the Title and Description.');
      return;
    }

    // Default placeholder thumbnail if none uploaded
    let finalImg = newImage;
    if (!finalImg) {
      if (newCategory === 'video' && newLink) {
        const linkStr = newLink.trim();
        // YouTube ID extraction
        const ytReg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const ytMatch = linkStr.match(ytReg);
        if (ytMatch && ytMatch[2].length === 11) {
          finalImg = `https://img.youtube.com/vi/${ytMatch[2]}/0.jpg`;
        } else if (linkStr.includes('drive.google.com')) {
          finalImg = 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=600&auto=format&fit=crop'; // Abstract cinema artwork
        } else {
          finalImg = 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop'; // Cinematic camera look
        }
      } else {
        const seed = Math.floor(Math.random() * 1000);
        finalImg = `https://picsum.photos/seed/${seed}/600/400`;
      }
    }

    const newItem: PortfolioItem = {
      id: `${newCategory}-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      image: finalImg,
      link: (newCategory === 'video' && newVideoFile) ? newVideoFile : (newLink.trim() || undefined),
      tags: newTagsString
        ? newTagsString.split(',').map(t => t.trim()).filter(Boolean)
        : [newCategory === 'web' ? 'Web Dev' : newCategory === 'design' ? 'Graphic' : 'Video Edit']
    };

    const updated = [newItem, ...portfolioItems];
    savePortfolio(updated);
    triggerToast(`"${newTitle}" added successfully!`);

    // Reset Form Fields
    setNewTitle('');
    setNewDesc('');
    setNewImage('');
    setNewLink('');
    setNewTagsString('');
    setNewVideoFile('');
  };

  // Remove Project from showcase
  const handleRemoveProject = (id: string) => {
    const updated = portfolioItems.filter(item => item.id !== id);
    savePortfolio(updated);
    triggerToast('Project removed successfully.');
  };

  // Reset to default portfolio data
  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to revert to the default creative showcase? All custom projects will be cleared.')) {
      savePortfolio(DEFAULT_PORTFOLIO);
      triggerToast('Showcase reverted to beautiful defaults.');
    }
  };

  // Submit Contact Form handler
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setFormFeedback('Please fill in all requested fields.');
      return;
    }

    setSendingMessage(true);
    setFormFeedback(null);

    // Simulate nice network posting delay
    setTimeout(() => {
      setSendingMessage(false);
      setFormFeedback('Message received successfully! Saurabh will get back to you shortly.');
      
      // Clear contact state
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 1800);
  };

  // Parse YouTube video ID from URL for embed player
  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // Support YouTube, Google Drive, Vimeo, and direct links
  const getVideoEmbedUrl = (url?: string) => {
    if (!url) return null;
    const s = url.trim();

    // YouTube regex (matching standard watch URLs, shorts, embed URLs, youtu.be, etc.)
    const ytReg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const ytMatch = s.match(ytReg);
    if (ytMatch && ytMatch[2].length === 11) {
      return { type: 'youtube', url: `https://www.youtube.com/embed/${ytMatch[2]}` };
    }

    // Google Drive check
    const gdReg = /drive\.google\.com\/(?:file\/d\/|open\?id=)([^/\s?&]+)/;
    const gdMatch = s.match(gdReg);
    if (gdMatch && gdMatch[1]) {
      return { type: 'drive', url: `https://drive.google.com/file/d/${gdMatch[1]}/preview` };
    }

    // Direct video link (mp4, webm, ogg, mov)
    if (/\.(mp4|webm|ogg|mov)(?:\?|$)/i.test(s) || s.startsWith('data:video/')) {
      return { type: 'direct', url: s };
    }

    // Fallback if it contains iframe, embed, or vimeo
    if (s.includes('iframe') || s.includes('embed') || s.includes('player.vimeo.com')) {
      return { type: 'iframe', url: s };
    }

    // General link fallback as iframe if it starts with http/https
    if (s.startsWith('http://') || s.startsWith('https://')) {
      return { type: 'iframe', url: s };
    }

    return null;
  };

  const filteredItems = activeTab === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeTab);

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-[#050508] text-slate-100 flex items-center justify-center font-display font-black text-xl">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#00ecff] to-[#a855f7] animate-pulse flex items-center justify-center text-black">
          S
        </div>
      </div>
    );
  }

  return (
    <div id="landing-root" className="relative font-sans min-h-screen selection:bg-electric-blue/20 selection:text-electric-blue antialiased flex flex-col justify-between overflow-x-hidden" ref={containerRef}>
      
      {/* Dynamic Absolute Background Glow Bubbles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div 
          style={{ y: bgBubbleY1 }}
          className="absolute top-[20%] right-[-15%] w-[450px] sm:w-[550px] h-[450px] sm:h-[550px] bg-electric-blue/5 rounded-full filter blur-[100px]"
        />
        <motion.div 
          style={{ y: bgBubbleY2 }}
          className="absolute top-[60%] left-[-15%] w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-purple-accent/5 rounded-full filter blur-[120px]"
        />
        <div className="absolute bottom-[5%] right-[5%] w-[350px] h-[350px] bg-indigo-500/5 rounded-full filter blur-[90px]" />
      </div>

      {/* Persistent Action-Feedback Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            id="toast-notification"
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

      {/* Navigation Header */}
      <header id="portfolio-header" className="sticky top-0 z-40 w-full border-b border-white/[0.05] bg-[#050508]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          
          <motion.a 
            id="brand-logo"
            href="#hero" 
            className="relative flex items-center gap-2 group cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-electric-blue to-purple-accent flex items-center justify-center font-display font-black text-xl text-black shadow-lg shadow-electric-blue/15">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black tracking-tight text-white leading-none">SAURABH</span>
              <span className="text-[10px] font-mono tracking-widest text-[#00ecff] uppercase leading-none mt-1">Creator</span>
            </div>
          </motion.a>

          {/* Desktop Links */}
          <nav id="desktop-nav" className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">About</a>
            <a href="#services" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Services</a>
            <a href="#portfolio" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Portfolio</a>
            <a href="#contact" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Contact</a>
          </nav>

          {/* Social Links & Sandbox Trigger */}
          {isAdmin && (
            <div id="header-social-hub" className="hidden md:flex items-center gap-4">
              <button 
                id="sandbox-header-toggle"
                onClick={() => {
                  setCustomizerOpen(true);
                  triggerToast('Customizer sandbox loaded. 🛠');
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border border-[#00ecff]/25 text-[#00ecff] bg-electric-blue/5 hover:bg-electric-blue/10 transition-all shadow-[0_0_15px_rgba(0,236,255,0.05)]"
              >
                <Sliders className="w-3 h-3 animate-spin-[spin_3s_linear_infinite]" />
                <span>Modify Portfolio</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button 
            id="mobile-nav-toggle"
            className="p-3 md:hidden text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-nav-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-white/[0.05] bg-[#07070c] px-6 py-6 flex flex-col gap-5 overflow-hidden"
            >
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-gray-300 hover:text-electric-blue text-md font-semibold"
              >
                About
              </a>
              <a 
                href="#services" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-gray-300 hover:text-electric-blue text-md font-semibold"
              >
                Services
              </a>
              <a 
                href="#portfolio" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-gray-300 hover:text-electric-blue text-md font-semibold"
              >
                Portfolio
              </a>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-gray-300 hover:text-electric-blue text-md font-semibold"
              >
                Contact
              </a>
              <hr className="border-white/[0.05] my-2" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <a href="https://github.com/saurabhpn03" target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-electric-blue">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-electric-blue">
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
                {isAdmin && (
                  <button 
                    id="mobile-sandbox-toggle"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setCustomizerOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border border-electric-blue/20 text-[#00ecff] bg-electric-blue/5"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Modify Showcase</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full relative z-10">

        {/* HERO SECTION */}
        <section 
          id="hero" 
          className="relative min-h-[calc(100vh-80px)] xl:min-h-[85vh] flex items-center justify-center px-6 sm:px-8 py-16 sm:py-24"
        >
          <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center relative z-10">
            
            {/* Visual Decorative Accent Badge */}
            <motion.div
              id="hero-badge"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.05] bg-white/[0.02] backdrop-blur-md mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[#00ecff] animate-pulse glow-border" />
              <span className="text-xs font-mono tracking-wider text-gray-400 font-semibold uppercase">Available for freelance contracts</span>
            </motion.div>

            {/* Display Header */}
            <motion.h1 
              id="hero-main-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-5xl sm:text-7xl lg:text-8xl font-display font-black tracking-tight leading-tight text-white"
            >
              Designing Pixels.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-electric-blue via-violet-400 to-purple-accent glow-text-blue">
                Engineering Code.
              </span>
            </motion.h1>

            {/* Multi-Discipline Tagline */}
            <motion.p 
              id="hero-tagline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-8 text-xl sm:text-2xl font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400"
            >
              Web Developer <span className="text-purple-accent font-light">|</span> Graphic Designer <span className="text-purple-accent font-light">|</span> Video Editor
            </motion.p>

            {/* Hero Short Bio */}
            <motion.p 
              id="hero-bio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="mt-6 text-gray-400 max-w-2xl text-md sm:text-base leading-relaxed font-sans"
            >
              Hi, I&apos;m Saurabh. I bring ideas to life through code, design and visual storytelling. Whether it&apos;s launching clean user-centric software, developing identities, or editing videos, I engineer high-end digital experiences.
            </motion.p>

            {/* Action CTAs */}
            <motion.div 
              id="hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto"
            >
              <a 
                href="#portfolio" 
                className="px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-electric-blue to-purple-accent text-black hover:opacity-90 transform hover:-translate-y-0.5 active:translate-y-0 transition-all font-display text-center shadow-lg shadow-electric-blue/15"
              >
                View My Work
              </a>
              <a 
                href="#contact" 
                className="px-8 py-4 rounded-xl font-semibold bg-[#0e0e16]/80 border border-white/[0.08] text-white hover:bg-white/[0.05] transform hover:-translate-y-0.5 active:translate-y-0 transition-all font-display text-center"
              >
                Contact Me
              </a>
            </motion.div>

          </div>

          {/* Abstract Wireframe Interactive Grid on bottom of section */}
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(0,236,255,0.02)_0,rgba(5,5,8,0)_50%)] bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] mask-image-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        </section>

        {/* ABOUT SECTION */}
        <section 
          id="about" 
          className="relative px-6 sm:px-8 py-24 border-t border-white/[0.03] bg-gradient-to-b from-[#050508] to-[#08080f]"
        >
          <div className="max-w-6xl mx-auto">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Professional Disciplines Showcase */}
              <motion.div 
                id="about-visual"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-5 space-y-6"
              >
                {[
                  { 
                    icon: Code, 
                    title: "Creative Engineering", 
                    desc: "Interactive user interfaces and high-performance React architectures optimized for smooth, fluid user flows." 
                  },
                  { 
                    icon: Palette, 
                    title: "Visual Hierarchy", 
                    desc: "Branding materials, editorial layout grids, and fine typography pairs that command attention." 
                  },
                  { 
                    icon: Video, 
                    title: "Motion & Editing", 
                    desc: "Cinematic transition pipelines, promo assets, and fine-tuned dynamic layouts that animate titles and screens." 
                  }
                ].map((item, idx) => (
                  <div key={idx} className="glass-card p-6 rounded-2xl border border-white/[0.05] relative overflow-hidden group hover:border-electric-blue/30 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-tr from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-electric-blue shrink-0 group-hover:text-white transition-colors">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-white font-display font-bold tracking-tight">{item.title}</h4>
                        <p className="text-gray-400 text-sm mt-1 leading-relaxed font-sans">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Bio & Skills */}
              <motion.div 
                id="about-content"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-7 flex flex-col justify-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-[1px] bg-electric-blue" />
                  <span className="text-xs font-mono font-bold tracking-widest text-electric-blue uppercase">Behind the Screens</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white mt-4">
                  Crafting Digital Masterpieces
                </h2>
                
                <p className="text-gray-400 mt-6 leading-relaxed font-sans">
                  I specialize in structuring clean database interfaces and fluid user-facing code. My engineering foundation, combined with visual branding chops, allows me to bridge the critical gap between conceptual styling and robust product shipping.
                </p>
                <p className="text-gray-400 mt-4 leading-relaxed font-sans">
                  From framing complete React layouts and design grids to syncing cinematic transitions in promo reels, I love the entire creation pipeline.
                </p>

                {/* Skills Container */}
                <div className="mt-8 border-t border-white/[0.05] pt-8">
                  <h3 className="text-sm font-mono font-bold tracking-wider text-white uppercase mb-4">Core Skillset</h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'HTML & CSS', category: 'web' },
                      { name: 'JavaScript', category: 'web' },
                      { name: 'TypeScript', category: 'web' },
                      { name: 'Photoshop', category: 'design' },
                      { name: 'Illustrator', category: 'design' },
                      { name: 'Premiere Pro', category: 'video' },
                      { name: 'After Effects', category: 'video' }
                    ].map((skill, index) => (
                      <span 
                        key={index}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold border ${
                          skill.category === 'web' 
                            ? 'bg-blue-500/5 text-blue-400 border-blue-500/10'
                            : skill.category === 'design'
                            ? 'bg-purple-500/5 text-purple-400 border-purple-500/10'
                            : 'bg-indigo-500/5 text-indigo-400 border-indigo-500/10'
                        }`}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>

              </motion.div>

            </div>

          </div>
        </section>

        {/* SERVICES SECTION */}
        <section 
          id="services" 
          className="relative px-6 sm:px-8 py-24 border-t border-white/[0.03] bg-gradient-to-b from-[#08080f] to-[#050508]"
        >
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-mono font-bold tracking-widest text-[#00ecff] uppercase">Services Suite</span>
              <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white mt-4">
                Full-Service Digital Solutions
              </h2>
              <p className="text-gray-400 text-sm mt-3">
                I assist with product pipelines from pixel design to final production live build.
              </p>
            </div>

            {/* Services Cards Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Service 1: Web Development */}
              <motion.div
                id="service-web"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -6 }}
                className="rounded-2xl border border-white/[0.05] p-8 glass-card flex flex-col justify-between group relative overflow-hidden transition-all duration-300 hover:border-blue-500/30"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-[40px] group-hover:bg-blue-500/10 transition-colors" />
                
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 duration-300 transition-transform">
                    <Code className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-display font-black text-white">Web Development</h3>
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                    Building responsive, high-speed single page applications. Structuring cleanly documented React structures, custom state integration, and fast micro-interactions.
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 text-xs font-mono font-bold text-blue-400">
                  <span>HTML // CSS // JS // TS</span>
                </div>
              </motion.div>

              {/* Service 2: Graphic Design */}
              <motion.div
                id="service-design"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover={{ y: -6 }}
                className="rounded-2xl border border-white/[0.05] p-8 glass-card flex flex-col justify-between group relative overflow-hidden transition-all duration-300 hover:border-purple-accent/30"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-accent/5 rounded-full filter blur-[40px] group-hover:bg-purple-accent/10 transition-colors" />
                
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-accent/10 border border-purple-accent/20 flex items-center justify-center text-purple-accent mb-6 group-hover:scale-110 duration-300 transition-transform">
                    <Palette className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-display font-black text-white">Graphic Design</h3>
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                    Drafting stellar social media visuals, brand marketing identities, layout typography systems, vector mockups, and publication media.
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 text-xs font-mono font-bold text-purple-accent">
                  <span>PHOTOSHOP // ILLUSTRATOR</span>
                </div>
              </motion.div>

              {/* Service 3: Video Editing */}
              <motion.div
                id="service-video"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -6 }}
                className="rounded-2xl border border-white/[0.05] p-8 glass-card flex flex-col justify-between group relative overflow-hidden transition-all duration-300 hover:border-indigo-500/30"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-[40px] group-hover:bg-indigo-500/10 transition-colors" />
                
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 duration-300 transition-transform">
                    <Video className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-display font-black text-white">Video Editing</h3>
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                    Cinematic montage assembly, fluid pacing transitions, sound syncing, color grading, multi-cam timeline management, and sound enhancement.
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 text-xs font-mono font-bold text-indigo-400">
                  <span>PREMIERE // AFTER EFFECTS</span>
                </div>
              </motion.div>

            </div>

          </div>
        </section>

        {/* PORTFOLIO SHOWCASE SECTION */}
        <section 
          id="portfolio" 
          className="relative px-6 sm:px-8 py-24 border-t border-white/[0.03] bg-gradient-to-b from-[#050508] to-[#07070b]"
        >
          <div className="max-w-6xl mx-auto">
            
            {/* Header with customization trigger */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-[#00ecff] uppercase">Featured Showcase</span>
                <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white mt-4">
                  My Creative Vault
                </h2>
                <p className="text-gray-400 text-sm mt-2 max-w-xl">
                  Filter by craft layout to explore code repositories, vector posters, or premium edits.
                </p>
              </div>

              {/* Modify Showcase Trigger on UI */}
              {isAdmin && (
                <motion.button
                  id="modify-showcase-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCustomizerOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#00ecff]/30 text-xs font-semibold text-[#00ecff] bg-electric-blue/5 hover:bg-electric-blue/10 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,236,255,0.06)]"
                >
                  <Sliders className="w-4 h-4 text-electric-blue animate-pulse" />
                  <span>Customize Portfolio Grid</span>
                </motion.button>
              )}
            </div>

            {/* Tab Controllers */}
            <div id="portfolio-tabs" className="flex flex-wrap items-center gap-2 mb-10 border-b border-white/[0.05] pb-6">
              {[
                { id: 'all', label: 'All Projects' },
                { id: 'web', label: 'Web Development' },
                { id: 'design', label: 'Graphic Design' },
                { id: 'video', label: 'Video Editing' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="active-tab-indicator"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-electric-blue/15 to-purple-accent/15 border border-purple-accent/30 z-0"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Embedded Active Video Overlay */}
            <AnimatePresence>
              {selectedVideo && (() => {
                const embedInfo = getVideoEmbedUrl(selectedVideo);
                if (!embedInfo) return null;
                return (
                  <motion.div
                    id="video-player-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
                  >
                    <div className="absolute inset-0" onClick={() => setSelectedVideo(null)} />
                    <div className="relative w-full max-w-4xl max-h-[85vh] aspect-video glass-card border border-white/[0.08] rounded-2xl overflow-hidden z-10 shadow-2xl">
                      <button 
                        onClick={() => setSelectedVideo(null)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-all border border-white/10 z-20"
                        title="Close player"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      {embedInfo.type === 'direct' ? (
                        <video
                          src={embedInfo.url}
                          className="w-full h-full object-contain"
                          controls
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <iframe
                          src={embedInfo.url}
                          className="w-full h-full"
                          allowFullScreen
                          allow="autoplay; encrypted-media"
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* Projects Grid Grid */}
            <motion.div 
              id="portfolio-grid"
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="group rounded-2xl border border-white/[0.05] bg-[#0c0c14] overflow-hidden flex flex-col justify-between h-[420px] relative transition-all hover:border-[#00ecff]/30 hover:shadow-[0_0_30px_rgba(0,236,255,0.08)]"
                  >
                    {/* Upper Thumbnail Area */}
                    <div className="relative h-48 w-full overflow-hidden bg-[#09090f] flex items-center justify-center">
                      {/* Check if thumbnail is a raw base64 or normal url */}
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback custom graphics
                          (e.target as any).src = 'https://picsum.photos/seed/fallback/600/400';
                        }}
                      />
                      
                      {/* Hover Overlay Visual Indicator */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                        {item.category === 'video' ? (
                          <button 
                            onClick={() => setSelectedVideo(item.link || '#')}
                            className="p-3.5 rounded-full bg-indigo-500 text-white font-semibold transition-all hover:scale-110 shadow-lg"
                          >
                            <Video className="w-5 h-5 fill-current" />
                          </button>
                        ) : item.category === 'web' && item.link ? (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="p-3.5 rounded-full bg-blue-500 text-white font-semibold transition-all hover:scale-110 shadow-lg"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        ) : (
                          <span className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-xs font-mono font-bold text-white uppercase tracking-wider">
                            Design Showcase
                          </span>
                        )}
                      </div>

                      {/* Hover dynamic tag label */}
                      <span className={`absolute top-4 left-4 text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded border ${
                        item.category === 'web' 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : item.category === 'design' 
                          ? 'bg-purple-accent/10 text-purple-accent border-purple-accent/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {item.category === 'web' ? 'Web' : item.category === 'design' ? 'Design' : 'Video'}
                      </span>
                    </div>

                    {/* Lower Card Info */}
                    <div className="p-6 flex-1 flex flex-col justify-between bg-[#0e0e18]">
                      <div>
                        <h3 className="text-lg font-display font-black text-white group-hover:text-electric-blue duration-300">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed font-sans">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4">
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {item.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] sm:text-[11px] font-mono text-gray-500">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Action Link Row */}
                        <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
                          {item.category === 'video' ? (
                            <button 
                              onClick={() => setSelectedVideo(item.link || '#')}
                              className="text-xs font-semibold text-indigo-300 hover:text-indigo-400 flex items-center gap-1.5"
                            >
                              <span>Watch video reel</span>
                              <Video className="w-3.5 h-3.5" />
                            </button>
                          ) : item.category === 'web' ? (
                            <a 
                              href={item.link || 'https://github.com/saurabhpn03'} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <span>Launch live site</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-[10px] font-mono text-gray-400">
                              Custom illustration artwork
                            </span>
                          )}

                          {/* Quick delete marker only if sandbox mode or customizer clicked */}
                          {customizerOpen && isAdmin && (
                            <button
                              onClick={() => handleRemoveProject(item.id)}
                              className="p-1 px-2 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-semibold flex items-center gap-1"
                              title="Delete from list"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredItems.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]"
                >
                  <Sliders className="w-10 h-10 text-gray-500 mb-4 animate-pulse" />
                  <h3 className="text-lg font-display font-medium text-gray-200">No projects listed yet</h3>
                  <p className="text-sm text-gray-400 mt-2 max-w-sm">
                    {isAdmin 
                      ? "Customize your portfolio using the button above to upload and highlight your custom developments, graphic visuals, or edit compilations!"
                      : "Check back later to see my latest work and creations!"}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setCustomizerOpen(true)}
                      className="mt-6 px-4 py-2 text-xs font-semibold rounded-lg bg-electric-blue text-black hover:opacity-90 transition-all font-display hover:scale-[1.03] active:scale-95 cursor-pointer"
                    >
                      Add Your First Project
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>

          </div>
        </section>

        {/* WORKSPACE SANDBOX / CUSTOMIZER SIDEBAR DRAWER PANEL */}
        <AnimatePresence>
          {customizerOpen && isAdmin && (
            <div id="sandbox-modal-container" className="fixed inset-0 z-50 flex justify-end">
              {/* Dark Overlay backdrop */}
              <motion.div 
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCustomizerOpen(false)}
              />

              {/* Slider Content */}
              <motion.div
                id="sandbox-drawer"
                className="relative w-full max-w-lg h-full bg-[#090910] border-l border-white/[0.08] p-6 sm:p-8 flex flex-col justify-between z-15 shadow-2xl overflow-y-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              >
                <div>
                  
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-display font-black text-white flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-electric-blue" />
                        <span>Dynamic Showcase Customizer</span>
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Upload work directly. Everything is instantly saved in your local workspace.
                      </p>
                    </div>
                    <button 
                      onClick={() => setCustomizerOpen(false)}
                      className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drag and Drop Zone + Image selector */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-2">
                        1. Upload Thumbnail or Video File (Optional)
                      </label>
                      
                      <div
                        id="dropzone"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                          isDragging 
                            ? 'border-electric-blue bg-electric-blue/5' 
                            : (newVideoFile || newImage) 
                            ? 'border-[#00ecff]/60 bg-[#00ecff]/5' 
                            : 'border-white/[0.08] hover:border-gray-500'
                        }`}
                      >
                        {newVideoFile ? (
                          <div className="flex flex-col items-center">
                            {newImage && (
                              <img 
                                src={newImage} 
                                alt="Generated Video Thumbnail" 
                                className="w-24 h-16 object-cover rounded-lg border border-white/10 mb-2" 
                              />
                            )}
                            <div className="flex items-center gap-1.5 text-[10px] text-[#00ecff] font-semibold font-mono">
                              <Video className="w-3.5 h-3.5 animate-pulse" />
                              <span>Local Video & Thumbnail Loaded! ✔</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setNewVideoFile(''); 
                                setNewImage(''); 
                              }}
                              className="text-[10px] text-red-400 hover:text-red-300 underline mt-1.5"
                            >
                              Clear video selection
                            </button>
                          </div>
                        ) : newImage ? (
                          <div className="flex flex-col items-center">
                            <img 
                              src={newImage} 
                              alt="Thumbnail loading preview" 
                              className="w-24 h-16 object-cover rounded-lg border border-white/10 mb-2" 
                            />
                            <p className="text-[10px] text-[#00ecff] font-semibold font-mono">Image saved in memory! ✔</p>
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); setNewImage(''); }}
                              className="text-[10px] text-red-500 hover:text-red-400 underline mt-1"
                            >
                              Clear image Selection
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-500 mb-2 animate-bounce" />
                            <p className="text-xs text-gray-400 font-medium">
                              Drag and drop thumbnail or video file, or
                            </p>
                            <label className="mt-2 text-xs text-electric-blue underline cursor-pointer hover:text-white uppercase font-mono font-bold">
                              Browse local files
                              <input 
                                type="file" 
                                accept="image/*,video/*" 
                                className="hidden" 
                                onChange={handleImageSelect} 
                              />
                            </label>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Standard form inputs */}
                    <form onSubmit={handleAddProject} className="space-y-4">
                      
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-1.5">
                          Project Category
                        </label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as any)}
                          className="w-full px-4 py-2.5 rounded-lg bg-[#111119] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue"
                        >
                          <option value="web">Web Development</option>
                          <option value="design">Graphic Design</option>
                          <option value="video">Video Editing</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-1.5">
                          Project Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Modern Admin Interface"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-[#111119] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-1.5">
                          Project Description *
                        </label>
                        <textarea
                          required
                          placeholder="Brief paragraph of technologies used and purpose..."
                          value={newDesc}
                          rows={3}
                          onChange={(e) => setNewDesc(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-[#111119] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue resize-none"
                        />
                      </div>

                      {newVideoFile ? (
                        <div>
                          <label className="block text-xs font-mono font-bold uppercase text-gray-500 mb-1.5">
                            External Link (Video or Site Link)
                          </label>
                          <div className="w-full px-4 py-2.5 rounded-lg bg-[#111119]/50 border border-white/[0.03] text-gray-400 text-sm flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-mono text-xs text-[#00ecff]">
                              <Video className="w-3.5 h-3.5" />
                              Using live local video file
                            </span>
                            <button
                              type="button"
                              onClick={() => setNewVideoFile('')}
                              className="text-xs text-red-400 hover:text-red-300 underline font-mono font-bold uppercase"
                            >
                              Use Link Instead
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-1.5">
                            External Link (Video or Site Link)
                          </label>
                          <input
                            type="url"
                            placeholder={newCategory === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://github.com/...'}
                            value={newLink}
                            onChange={(e) => setNewLink(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-[#111119] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-1.5">
                          Skills Tags (Comma Separated)
                        </label>
                        <input
                          type="text"
                          placeholder="Next.js, Tailwind CSS, Figma"
                          value={newTagsString}
                          onChange={(e) => setNewTagsString(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-[#111119] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-[#00ecff]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider text-black bg-[#00ecff] hover:opacity-90 transition-all cursor-pointer mt-4"
                      >
                        Publish Project to Grid
                      </button>

                    </form>
                  </div>

                </div>

                {/* Drawer Footer Actions */}
                <div className="border-t border-white/[0.05] pt-4 mt-8 flex items-center justify-between gap-4">
                  <button
                    onClick={handleResetDefaults}
                    className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear & Restore Defaults</span>
                  </button>
                  <button
                    onClick={() => setCustomizerOpen(false)}
                    className="py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CONTACT SECTION */}
        <section 
          id="contact" 
          className="relative px-6 sm:px-8 py-24 border-t border-white/[0.03] bg-gradient-to-b from-[#07070b] to-[#040407]"
        >
          <div className="max-w-6xl mx-auto">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Info Column */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-[1px] bg-electric-blue" />
                    <span className="text-xs font-mono font-bold tracking-widest text-[#00ecff] uppercase">Connect</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white mt-4">
                    Let&apos;s Build Something Incredible
                  </h2>
                  <p className="text-gray-400 mt-6 leading-relaxed text-sm">
                    Have an idea for a clean utility application? Or looking for cinematic visual treatments? Describe your project details and I&apos;ll reach out to schedule a consultation.
                  </p>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-electric-blue">
                        <Mail className="w-5 h-5" />
                      </div>
                      <a href="mailto:thegoatone03@gmail.com" className="hover:text-electric-blue transition-colors">
                        thegoatone03@gmail.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Social links row */}
                <div className="mt-12 lg:mt-0">
                  <h3 className="text-xs font-mono font-bold tracking-wider text-gray-400 uppercase mb-4">Follow Active Feeds</h3>
                  
                  <div className="flex items-center gap-2">
                    {[
                      { icon: Github, link: 'https://github.com/saurabhpn03', name: 'GitHub' },
                      { icon: Linkedin, link: 'https://linkedin.com', name: 'LinkedIn' },
                      { icon: Twitter, link: 'https://twitter.com', name: 'Twitter' },
                      { icon: Instagram, link: 'https://www.instagram.com/rarerender.co?igsh=bHhic3ZqdGI4aDY4', name: 'Instagram' }
                    ].map((platform, idx) => (
                      <a
                        key={idx}
                        href={platform.link}
                        target="_blank"
                        rel="noreferrer"
                        className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-[#00ecff] hover:bg-electric-blue/5 hover:border-[#00ecff]/30 transition-all hover:scale-105"
                        title={platform.name}
                      >
                        <platform.icon className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>

              </div>

              {/* Form Column */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl border border-white/[0.05] p-6 sm:p-8 glass-card">
                  
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-1.5">
                        Message Content
                      </label>
                      <textarea
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Describe your design mockup, video reel guidelines, or site parameters..."
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue resize-none animate-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingMessage}
                      className="w-full py-4 rounded-xl text-xs font-bold font-display uppercase tracking-widest text-[#00ecff] border border-electric-blue/30 bg-electric-blue/5 hover:bg-electric-blue/10 active:opacity-90 transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {sendingMessage ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-electric-blue border-t-transparent animate-spin" />
                          <span>Dispatching mail...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-electric-blue" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>

                  </form>

                  {/* Contact form response feedback overlay */}
                  <AnimatePresence>
                    {formFeedback && (
                      <motion.div
                        id="form-feedback"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`mt-4 p-4 rounded-xl text-xs sm:text-sm border ${
                          formFeedback.includes('successfully')
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        }`}
                      >
                        {formFeedback}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>

            </div>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer id="portfolio-footer" className="w-full border-t border-white/[0.03] bg-[#030305] py-8 z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} Saurabh. All Rights Reserved.</span>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold tracking-wide">
                Admin Mode
              </span>
            )}
          </p>
          <div className="flex items-center gap-4">
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer font-mono flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout Admin</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer font-mono flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                <span>Admin Login</span>
              </button>
            )}
            <a href="#hero" className="text-xs text-gray-500 hover:text-white transition-colors">Back to top</a>
          </div>
        </div>
      </footer>

      {/* Admin Login Password Modal */}
      <AnimatePresence>
        {isLoginOpen && (
          <motion.div
            id="admin-login-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="absolute inset-0" onClick={() => { setIsLoginOpen(false); setAdminPasswordInput(''); setLoginError(null); }} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0c0c14] p-6 sm:p-8 glass-card z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#00ecff]" />
                  <h3 className="text-lg font-display font-black text-white uppercase tracking-wider">
                    Admin Authentication
                  </h3>
                </div>
                <button
                  onClick={() => { setIsLoginOpen(false); setAdminPasswordInput(''); setLoginError(null); }}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-gray-400 mb-2">
                    Enter Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="••••••••"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.06] text-white text-sm focus:outline-none focus:border-electric-blue font-mono"
                  />
                </div>

                {loginError && (
                  <p className="text-xs text-red-400 font-mono flex items-center gap-1.5">
                    <span>⚠</span> {loginError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.05] mt-6">
                  <button
                    type="button"
                    onClick={() => { setIsLoginOpen(false); setAdminPasswordInput(''); setLoginError(null); }}
                    className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl text-xs font-bold uppercase tracking-wider text-black bg-[#00ecff] hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
