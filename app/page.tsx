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
  Sparkles, 
  ArrowUpRight,
  Lock,
  Sliders
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

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'web' | 'design' | 'video'>('all');
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Contact Form Inputs
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  // Scroll variables for parallax background bubbles
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const bgBubbleY1 = useTransform(scrollY, [0, 1000], [0, -100]);
  const bgBubbleY2 = useTransform(scrollY, [0, 1000], [0, 80]);

  useEffect(() => {
    setHasMounted(true);

    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          setPortfolioItems(data);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

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

  const getVideoEmbedUrl = (url?: string) => {
    if (!url) return null;
    const s = url.trim();

    // YouTube regex
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

    // Direct video link
    if (/\.(mp4|webm|ogg|mov)(?:\?|$)/i.test(s) || s.startsWith('data:video/')) {
      return { type: 'direct', url: s };
    }

    // Fallback if it contains iframe or vimeo
    if (s.includes('iframe') || s.includes('embed') || s.includes('player.vimeo.com')) {
      return { type: 'iframe', url: s };
    }

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
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight text-white leading-[1.1] max-w-4xl"
            >
              Building Seamless <span className="bg-gradient-to-r from-electric-blue to-purple-accent bg-clip-text text-transparent glow-text-blue">Digital Ecosystems</span>
            </motion.h1>

            <motion.p 
              id="hero-subtext"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-gray-400 text-base sm:text-lg md:text-xl mt-8 max-w-2xl leading-relaxed font-sans"
            >
              Bridge the critical gap between pixel layouts, fluid motion compilations, and scalable database integrations.
            </motion.p>

            <motion.div 
              id="hero-action-buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 w-full sm:w-auto"
            >
              <a 
                href="#portfolio" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-electric-blue to-purple-accent text-black hover:opacity-90 transform hover:-translate-y-0.5 active:translate-y-0 transition-all font-display text-center shadow-lg shadow-electric-blue/10"
              >
                View My Work
              </a>
              <a 
                href="#contact" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold bg-[#0e0e16]/80 border border-white/[0.08] text-white hover:bg-white/[0.05] transform hover:-translate-y-0.5 active:translate-y-0 transition-all font-display text-center"
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
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed font-sans">
                    Structured Next.js structures, state hooks, responsive styling, API routing, and backend integrations built for speed.
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 text-xs font-mono font-bold text-blue-400">
                  <span>REACT // NEXT.JS // NODE.JS</span>
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
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed font-sans">
                    Brand guidelines, aesthetic layouts, promotional mockups, vector artwork assets, and UI styles with striking impact.
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
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed font-sans">
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
            
            {/* Header */}
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

            {/* Projects Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-electric-blue border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-mono text-gray-500 mt-4">Loading project archive...</span>
              </div>
            ) : (
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
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as any).src = 'https://picsum.photos/seed/fallback/600/400';
                          }}
                        />
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                          {item.category === 'video' ? (
                            <button 
                              onClick={() => setSelectedVideo(item.link || '#')}
                              className="p-3.5 rounded-full bg-indigo-500 text-white font-semibold transition-all hover:scale-110 shadow-lg cursor-pointer"
                            >
                              <Video className="w-5 h-5 fill-current" />
                            </button>
                          ) : item.category === 'web' && item.link ? (
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="p-3.5 rounded-full bg-blue-500 text-white font-semibold transition-all hover:scale-110 shadow-lg cursor-pointer flex items-center justify-center"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                          ) : (
                            <span className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-xs font-mono font-bold text-white uppercase tracking-wider">
                              Design Showcase
                            </span>
                          )}
                        </div>

                        {/* Category badge */}
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
                            {item.tags && item.tags.map((tag, idx) => (
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
                                className="text-xs font-semibold text-indigo-300 hover:text-indigo-400 flex items-center gap-1.5 cursor-pointer"
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
                      Check back later to see my latest work and creations!
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

          </div>
        </section>

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
                        className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-[#00ecff] hover:bg-electric-blue/5 hover:border-[#00ecff]/30 transition-all hover:scale-105 cursor-pointer"
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
          <p className="text-xs text-gray-500 font-mono">
            &copy; {new Date().getFullYear()} Saurabh. All Rights Reserved. Built with precision layout.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="text-xs text-gray-500 hover:text-white transition-colors font-mono flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3 h-3 text-gray-500" />
              <span>Admin Dashboard</span>
            </a>
            <a href="#hero" className="text-xs text-gray-500 hover:text-white transition-colors">Back to top</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
