// Filter out benign Framer Motion/React keys warning messages in this sandboxed environment
const originalError = console.error;
console.error = (...args) => {
  if (
    args[0] && 
    typeof args[0] === 'string' && 
    (args[0].includes('Framer Motion') || args[0].includes('Each child in a list'))
  ) {
    return;
  }
  originalError(...args);
};

// ----------------------------------------------------
// 1. FADING VIDEO COMPONENT (Cache-resistant HTML5 video)
// ----------------------------------------------------
const FadingVideo = ({ src, className, style }) => {
  const videoRef = React.useRef(null);
  const rAFRef = React.useRef(null);
  const fadingOutRef = React.useRef(false);
  
  // Keep the current rendering source in local state to allow fade-out prior to loading a new file
  const [currentSrc, setCurrentSrc] = React.useState(src);

  const FADE_MS = 500;
  const FADE_OUT_LEAD = 0.55; // seconds

  const fadeTo = (targetOpacity, duration) => {
    if (rAFRef.current) {
      cancelAnimationFrame(rAFRef.current);
    }

    const video = videoRef.current;
    if (!video) return;

    const currentOpacityStr = video.style.opacity;
    const startOpacity = currentOpacityStr !== "" ? parseFloat(currentOpacityStr) : 0;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const newOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
      video.style.opacity = newOpacity.toString();

      if (progress < 1) {
        rAFRef.current = requestAnimationFrame(animate);
      } else {
        rAFRef.current = null;
      }
    };

    rAFRef.current = requestAnimationFrame(animate);
  };

  const handleLoadedData = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.style.opacity = "0";
    video.play().catch(err => {
      console.log("Auto-play was prevented or interrupted:", err);
    });
    fadingOutRef.current = false;
    fadeTo(1, FADE_MS);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const { duration, currentTime } = video;
    if (duration && !fadingOutRef.current) {
      const timeLeft = duration - currentTime;
      if (timeLeft <= FADE_OUT_LEAD && timeLeft > 0) {
        fadingOutRef.current = true;
        fadeTo(0, FADE_MS);
      }
    }
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;

    video.style.opacity = "0";
    
    setTimeout(() => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.log("Play on ended interrupted:", err);
      });
      fadingOutRef.current = false;
      fadeTo(1, FADE_MS);
    }, 100);
  };

  // Add event listeners on mount
  React.useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);

      // Handle cached video: if readyState is already loaded, invoke immediately
      if (video.readyState >= 2) {
        handleLoadedData();
      }
    }

    return () => {
      if (rAFRef.current) {
        cancelAnimationFrame(rAFRef.current);
      }
      if (video) {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  // Monitor src changes for a smooth, high-fidelity crossfade
  React.useEffect(() => {
    if (src !== currentSrc) {
      // 1. Fade out current video
      fadeTo(0, 250);
      
      // 2. Wait for fade-out, then swap source in React state
      const timer = setTimeout(() => {
        setCurrentSrc(src);
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [src]);

  // Load the new source when currentSrc shifts
  React.useEffect(() => {
    const video = videoRef.current;
    if (video && currentSrc) {
      video.load();
      if (video.readyState >= 2) {
        handleLoadedData();
      }
    }
  }, [currentSrc]);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      preload="auto"
      className={className}
      style={{
        ...style,
        opacity: 0, // Starts fully transparent, fades in dynamically
      }}
      src={currentSrc}
    />
  );
};

// ----------------------------------------------------
// THEME CONFIGURATION presets with HSL glows & CDNs
// ----------------------------------------------------
const THEME_CONFIGS = {
  flower: {
    name: "Flora Space",
    icon: "🌸",
    accentGlow: "rgba(139, 92, 246, 0.12)",
    accentBorderColor: "rgba(139, 92, 246, 0.35)",
    themeColor: "#a78bfa", // Purple/Rose theme
    heroVideo: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4",
    secondaryVideo: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4"
  },
  car: {
    name: "Hyper Drive",
    icon: "🏎️",
    accentGlow: "rgba(239, 68, 68, 0.12)",
    accentBorderColor: "rgba(239, 68, 68, 0.35)",
    themeColor: "#f87171", // Crimson/Red theme
    heroVideo: "https://raw.githubusercontent.com/Gabsrol/TrackFicVideos/main/sample_periph_lyon.mp4",
    secondaryVideo: "https://github.com/intel-iot-devkit/sample-videos/raw/master/car-detection.mp4"
  },
  travel: {
    name: "Terra Voyage",
    icon: "✈️",
    accentGlow: "rgba(16, 185, 129, 0.12)",
    accentBorderColor: "rgba(16, 185, 129, 0.35)",
    themeColor: "#34d399", // Emerald/Teal theme
    heroVideo: "https://vjs.zencdn.net/v/oceans.mp4",
    secondaryVideo: "https://raw.githubusercontent.com/aimlapi/api-docs/main/reference-files/racoon-in-the-forest.mp4"
  },
  futuristic: {
    name: "Neo Horizon",
    icon: "🌌",
    accentGlow: "rgba(6, 182, 212, 0.12)",
    accentBorderColor: "rgba(6, 182, 212, 0.35)",
    themeColor: "#22d3ee", // Cyan/Electric Blue theme
    heroVideo: "https://media.w3.org/2010/05/sintel/trailer_hd.mp4",
    secondaryVideo: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4"
  }
};

// ----------------------------------------------------
// FLOATING ENVIRONMENT CUSTOMIZER COMPONENT
// ----------------------------------------------------
const ThemeCustomizer = ({ activeTheme, onChangeTheme }) => {
  const MotionGlobal = window.Motion || window.FramerMotion;
  const motion = MotionGlobal ? (MotionGlobal.motion || MotionGlobal) : null;
  const activeConfig = THEME_CONFIGS[activeTheme];

  const keys = Object.keys(THEME_CONFIGS);

  const customizerContent = (
    <div className="flex flex-col items-center gap-2">
      {/* HUD floating descriptor label */}
      <span className="text-[9px] font-mono tracking-[4px] text-white/50 uppercase font-semibold select-none">
        Deep-Space Environment Controller
      </span>

      {/* Selector Pill Container */}
      <div 
        className="flex items-center gap-1 p-1 rounded-full liquid-glass-strong border border-white/10 transition-all duration-500 pointer-events-auto"
        style={{
          boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 30px ${activeConfig.accentGlow}`
        }}
      >
        {keys.map((key) => {
          const cfg = THEME_CONFIGS[key];
          const isSelected = activeTheme === key;

          const buttonContent = (
            <button
              key={key}
              onClick={() => onChangeTheme(key)}
              className={`relative px-3.5 py-2 rounded-full text-xs font-semibold font-body transition-all duration-300 flex items-center gap-1.5 z-10 ${
                isSelected 
                  ? "text-black" 
                  : "text-white/60 hover:text-white hover:bg-white/5 active:scale-95"
              }`}
            >
              <span>{cfg.icon}</span>
              <span className="hidden sm:inline">{cfg.name}</span>
              
              {/* Pulsing indicator dot */}
              {isSelected && (
                <span 
                  className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
                  style={{ backgroundColor: cfg.themeColor }}
                />
              )}

              {/* Smooth sliding selection pill using Framer Motion layoutId */}
              {motion && isSelected && (
                <motion.div
                  layoutId="activeThemePill"
                  className="absolute inset-0 bg-white rounded-full -z-10 shadow-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );

          return buttonContent;
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[90vw] pointer-events-none">
      {customizerContent}
    </div>
  );
};


// ----------------------------------------------------
// 2. BLUR TEXT COMPONENT (Mount entrance words stagger)
// ----------------------------------------------------
const BlurText = ({ text, className = "" }) => {
  const words = text.split(" ");
  const MotionGlobal = window.Motion || window.FramerMotion;
  const motion = MotionGlobal ? (MotionGlobal.motion || MotionGlobal) : null;

  if (!motion) return <span className={className}>{text}</span>;

  return (
    <p
      className={`flex flex-wrap justify-center ${className}`}
      style={{ rowGap: "0.1em" }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: "blur(10px)", opacity: 0, y: 30 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            delay: i * 0.08
          }}
          style={{
            display: "inline-block",
            marginRight: "0.28em"
          }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
};

// ----------------------------------------------------
// 3. NAVBAR COMPONENT
// ----------------------------------------------------
const ArrowUpRightIcon = ({ className = "h-4 w-4" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 17L17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

const Navbar = ({ onExplore }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const links = ["Home", "Explore", "Voyages", "Worlds", "Innovation", "Plan Launch"];
  const MotionGlobal = window.Motion || window.FramerMotion;
  const motion = MotionGlobal ? (MotionGlobal.motion || MotionGlobal) : null;
  const AnimatePresence = MotionGlobal ? MotionGlobal.AnimatePresence : null;

  const toggleMenu = () => setIsOpen(!isOpen);

  const mobileMenuContent = motion ? (
    <motion.div
      initial={{ opacity: 0, y: -15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="md:hidden fixed top-20 left-4 right-4 p-5 rounded-[1.5rem] liquid-glass-strong z-50 flex flex-col gap-2 shadow-2xl border border-white/10"
    >
      {links.map((link, idx) => {
        if (link === "Explore") {
          return (
            <motion.button
              key={link}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.2 }}
              onClick={() => {
                setIsOpen(false);
                onExplore();
              }}
              className="w-full px-5 py-3.5 text-base font-medium font-body text-white/95 hover:text-white hover:bg-white/5 active:bg-white/10 rounded-full transition-all duration-300 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span>{link}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </span>
              <ArrowUpRightIcon className="h-4 w-4 text-white/40" />
            </motion.button>
          );
        }
        return (
          <motion.a
            key={link}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.2 }}
            href={`#${link.toLowerCase().replace(" ", "-")}`}
            onClick={() => setIsOpen(false)}
            className="w-full px-5 py-3.5 text-base font-medium font-body text-white/95 hover:text-white hover:bg-white/5 active:bg-white/10 rounded-full transition-all duration-300 flex items-center justify-between"
          >
            <span>{link}</span>
            <ArrowUpRightIcon className="h-4 w-4 text-white/40" />
          </motion.a>
        );
      })}
    </motion.div>
  ) : (
    <div className="md:hidden fixed top-20 left-4 right-4 p-5 rounded-[1.5rem] liquid-glass-strong z-50 flex flex-col gap-2 shadow-2xl border border-white/10">
      {links.map((link) => {
        if (link === "Explore") {
          return (
            <button
              key={link}
              onClick={() => {
                setIsOpen(false);
                onExplore();
              }}
              className="w-full px-5 py-3.5 text-base font-medium font-body text-white/95 hover:text-white hover:bg-white/5 active:bg-white/10 rounded-full transition-all duration-300 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span>{link}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </span>
              <ArrowUpRightIcon className="h-4 w-4 text-white/40" />
            </button>
          );
        }
        return (
          <a
            key={link}
            href={`#${link.toLowerCase().replace(" ", "-")}`}
            onClick={() => setIsOpen(false)}
            className="w-full px-5 py-3.5 text-base font-medium font-body text-white/95 hover:text-white hover:bg-white/5 active:bg-white/10 rounded-full transition-all duration-300 flex items-center justify-between"
          >
            <span>{link}</span>
            <ArrowUpRightIcon className="h-4 w-4 text-white/40" />
          </a>
        );
      })}
    </div>
  );

  const navContent = (
    <div className="fixed top-4 left-0 w-full z-50 px-4 md:px-8 lg:px-16 flex items-center justify-between">
      {/* Branding circular logo */}
      <a 
        href="#"
        className="w-12 h-12 rounded-full flex items-center justify-center liquid-glass text-2xl font-heading italic text-white select-none hover:bg-white/10 active:scale-95 transition-all duration-300"
        title="Aetheris Homepage"
      >
        a
      </a>

      {/* Central Navigation Bar */}
      <div className="hidden md:flex items-center gap-1.5 p-1.5 rounded-full liquid-glass">
        {links.map((link) => {
          if (link === "Explore") {
            return (
              <button
                key={link}
                onClick={onExplore}
                className="px-3 py-2 text-sm font-medium font-body text-white/90 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300 flex items-center gap-1.5"
              >
                <span>{link}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </button>
            );
          }
          return (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(" ", "-")}`}
              className="px-3 py-2 text-sm font-medium font-body text-white/90 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300"
            >
              {link}
            </a>
          );
        })}
        
        <a
          href="#claim-spot"
          className="ml-2 px-4 py-2 text-sm font-medium font-body bg-white text-black hover:bg-white/90 active:scale-95 rounded-full flex items-center gap-1.5 transition-all duration-300 shadow-lg whitespace-nowrap"
        >
          Claim a Spot
          <ArrowUpRightIcon className="h-4 w-4 text-black" />
        </a>
      </div>

      {/* Mobile action call & Hamburger */}
      <div className="flex md:hidden items-center gap-2">
        <a
          href="#claim-spot"
          className="px-3 py-1.5 text-xs font-medium font-body bg-white text-black rounded-full flex items-center gap-1 transition-all duration-300 shadow-md"
        >
          Claim Spot
        </a>
        <button
          onClick={toggleMenu}
          className="w-10 h-10 rounded-full flex items-center justify-center liquid-glass text-white focus:outline-none hover:bg-white/10 active:scale-95 transition-all duration-300"
          aria-label="Toggle Menu"
        >
          <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      <div className="hidden md:block w-12 h-12 pointer-events-none" />
      {AnimatePresence ? (
        <AnimatePresence>
          {isOpen && mobileMenuContent}
        </AnimatePresence>
      ) : (
        isOpen && mobileMenuContent
      )}
    </div>
  );

  if (!motion) return <nav>{navContent}</nav>;

  return (
    <motion.nav 
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {navContent}
    </motion.nav>
  );
};

// ----------------------------------------------------
// 4. HERO SECTION COMPONENT
// ----------------------------------------------------
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7 text-white">
    <circle cx="14" cy="14" r="11" />
    <path d="M14 7v7l4 4" />
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7 text-white">
    <circle cx="14" cy="14" r="11" />
    <path d="M3 14h22" />
    <path d="M14 3c2 3 2 8 0 11s-2 8 0 11" />
    <path d="M14 3c-2 3-2 8 0 11s2 8 0 11" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const Hero = ({ theme, onExplore }) => {
  const MotionGlobal = window.Motion || window.FramerMotion;
  const motion = MotionGlobal ? (MotionGlobal.motion || MotionGlobal) : null;

  const fadeInUpVariants = (delay) => ({
    hidden: { filter: "blur(10px)", opacity: 0, y: 20 },
    visible: { 
      filter: "blur(0px)", 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay
      }
    }
  });

  const badgeContent = (
    <div 
      className="inline-flex items-center p-1 rounded-full liquid-glass max-w-full transition-all duration-500"
      style={{ boxShadow: `0 0 20px var(--theme-accent-glow)` }}
    >
      <span 
        className="text-black px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider transition-all duration-500"
        style={{ backgroundColor: "var(--theme-accent)" }}
      >
        New
      </span>
      <span className="text-xs md:text-sm text-white/90 px-3 truncate font-body font-medium">
        Maiden Crewed Voyage to Mars Arrives 2026
      </span>
    </div>
  );

  const subHeadingContent = (
    <p className="mt-6 text-sm sm:text-base text-white/80 max-w-xl font-body font-light leading-relaxed px-2">
      Discover the universe in ways once unimaginable. Our pioneering vessels and breakthrough engineering bring deep-space exploration within reach—secure and extraordinary.
    </p>
  );

  const ctaContent = (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
      <a
        href="#voyages"
        className="liquid-glass-strong rounded-full px-5 py-3 text-sm font-medium text-white hover:bg-white/10 active:scale-95 flex items-center gap-2 border border-[var(--theme-border-color)] shadow-xl hover:shadow-[0_0_20px_var(--theme-accent-glow)] transition-all duration-500"
      >
        Start Your Voyage
        <ArrowUpRightIcon className="h-5 w-5 text-white" />
      </a>
      
      {/* Immersive 3D Space Explorer trigger button */}
      <button
        onClick={onExplore}
        className="px-5 py-3 text-sm font-medium bg-white text-black hover:bg-white/90 active:scale-95 rounded-full flex items-center gap-2 shadow-xl transition-all duration-300 relative group overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-1.5 font-semibold">
          Explore the Galaxy
          {/* Subtle radar pulsing icon */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      <a
        href="#liftoff"
        className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white active:scale-95 group transition-colors duration-300"
      >
        <span>View Liftoff</span>
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-all duration-300">
          <PlayIcon />
        </div>
      </a>
    </div>
  );

  const statsContent = (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 w-full max-w-lg px-2">
      <div className="liquid-glass p-5 w-full sm:w-[220px] rounded-[1.25rem] flex flex-col justify-between items-start text-left min-h-[140px] hover:bg-white/[0.03] border border-white/5 hover:border-[var(--theme-border-color)] hover:shadow-[0_0_25px_var(--theme-accent-glow)] transition-all duration-500 group">
        <ClockIcon />
        <div className="mt-4">
          <div className="text-4xl font-heading italic text-[var(--theme-accent)] tracking-[-1px] leading-none transition-colors duration-500">
            34.5 Min
          </div>
          <div className="text-xs text-white/60 font-body font-light mt-1.5 leading-none">
            Average Videos Watch Time
          </div>
        </div>
      </div>
      <div className="liquid-glass p-5 w-full sm:w-[220px] rounded-[1.25rem] flex flex-col justify-between items-start text-left min-h-[140px] hover:bg-white/[0.03] border border-white/5 hover:border-[var(--theme-border-color)] hover:shadow-[0_0_25px_var(--theme-accent-glow)] transition-all duration-500 group">
        <GlobeIcon />
        <div className="mt-4">
          <div className="text-4xl font-heading italic text-[var(--theme-accent)] tracking-[-1px] leading-none transition-colors duration-500">
            2.8B+
          </div>
          <div className="text-xs text-white/60 font-body font-light mt-1.5 leading-none">
            Users Across the Globe
          </div>
        </div>
      </div>
    </div>
  );

  const partnersContent = (
    <div className="relative z-10 flex flex-col items-center gap-4 pb-8 select-none">
      <span className="liquid-glass rounded-full px-3.5 py-1 text-[11px] font-medium tracking-wider text-white/70 uppercase">
        Collaborating with top aerospace pioneers globally
      </span>
      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mt-2 text-2xl md:text-3xl font-heading italic text-white/60 tracking-tight">
        {["Aeon", "Vela", "Apex", "Orbit", "Zeno"].map((partner) => (
          <span 
            key={partner} 
            className="hover:text-white cursor-default transition-colors duration-300"
          >
            {partner}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <section id="home" className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col justify-between">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <FadingVideo
          src={THEME_CONFIGS[theme].heroVideo}
          className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top"
          style={{ width: "120%", height: "120%" }}
        />
      </div>

      {/* Floating Navbar */}
      <Navbar onExplore={onExplore} />

      {/* Hero Core Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center pt-32 pb-12 px-4">
        
        {/* Floating Space Badge */}
        {motion ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUpVariants(0.4)}
          >
            {badgeContent}
          </motion.div>
        ) : badgeContent}

        {/* Cinematic Animated Headline */}
        <div className="mt-6 max-w-3xl">
          <BlurText
            text="Venture Past Our Sky Across the Universe"
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.85] tracking-[-4px]"
          />
        </div>

        {/* Detailed Space Exploration Subheading */}
        {motion ? (
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeInUpVariants(0.8)}
            className="mt-6 text-sm sm:text-base text-white/80 max-w-xl font-body font-light leading-relaxed px-2"
          >
            Discover the universe in ways once unimaginable. Our pioneering vessels and breakthrough engineering bring deep-space exploration within reach—secure and extraordinary.
          </motion.p>
        ) : subHeadingContent}

        {/* Action CTAs */}
        {motion ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUpVariants(1.1)}
          >
            {ctaContent}
          </motion.div>
        ) : ctaContent}

        {/* Performance Stats Rows */}
        {motion ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUpVariants(1.3)}
            className="w-full flex justify-center"
          >
            {statsContent}
          </motion.div>
        ) : statsContent}

      </div>

      {/* Collaboration / Partners Footer */}
      {motion ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariants(1.4)}
          className="relative z-10 w-full"
        >
          {partnersContent}
        </motion.div>
      ) : partnersContent}
    </section>
  );
};

// ----------------------------------------------------
// 5. CAPABILITIES SECTION COMPONENT
// ----------------------------------------------------
const AIImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
    <path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z" />
  </svg>
);

const BatchProductionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
    <path d="M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z" />
  </svg>
);

const SmartLightingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z" />
  </svg>
);

const Capabilities = ({ theme }) => {
  const MotionGlobal = window.Motion || window.FramerMotion;
  const motion = MotionGlobal ? (MotionGlobal.motion || MotionGlobal) : null;

  const cardData = [
    {
      title: "AI Scenery",
      body: "AI analyzes your product to create indistinguishable natural environments — from Icelandic cliffs to misty deserts.",
      icon: <AIImageIcon />,
      tags: ["Natural Context", "Photo Realism", "Infinite Settings", "Eco-Vibe"]
    },
    {
      title: "Batch Production",
      body: "Style your entire product line in minutes. Create a unified visual identity for catalogues and social media without weeks of retouching.",
      icon: <BatchProductionIcon />,
      tags: ["Scale Fast", "Visual Consistency", "Time Saver", "Ready to Post"]
    },
    {
      title: "Smart Lighting",
      body: "Automatic lighting and material adjustment. Achieve flawless integration with realistic shadows and sunlight.",
      icon: <SmartLightingIcon />,
      tags: ["Ray Tracing", "Physical Shadows", "Studio Quality", "Sunlight Sync"]
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const cardVariants = {
    hidden: { y: 40, opacity: 0, filter: "blur(8px)" },
    visible: { 
      y: 0, 
      opacity: 1, 
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: "easeOut" } 
    }
  };

  const headerVariants = {
    hidden: { y: -20, opacity: 0, filter: "blur(5px)" },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const headerContent = (
    <div className="mb-auto text-left">
      <div className="text-sm font-body font-medium tracking-wider text-white/80 uppercase mb-4">
        // Capabilities
      </div>
      <h2 className="font-heading italic text-white text-5xl md:text-7xl lg:text-[6rem] leading-[0.85] tracking-[-3px] max-w-xl">
        Production<br />evolved
      </h2>
    </div>
  );

  const cardsGridContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full">
      {cardData.map((card) => (
        <div
          key={card.title}
          className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col justify-between hover:bg-white/[0.02] hover:border-[var(--theme-border-color)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.3),_0_0_20px_var(--theme-accent-glow)] group transition-all duration-500"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-11 h-11 rounded-[0.75rem] flex items-center justify-center liquid-glass border border-white/10 group-hover:scale-105 group-hover:bg-white/5 group-hover:border-[var(--theme-border-color)] group-hover:shadow-[0_0_15px_var(--theme-accent-glow)] transition-all duration-300 flex-shrink-0">
              {card.icon}
            </div>
            <div className="flex flex-wrap justify-end gap-1.5 max-w-[75%]">
              {card.tags.map((tag) => (
                <span 
                  key={tag}
                  className="liquid-glass rounded-full px-2.5 py-0.5 text-[10px] md:text-[11px] text-white/90 font-body hover:bg-white/5 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1" />
          <div className="mt-6 text-left">
            <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none group-hover:translate-x-1 group-hover:text-[var(--theme-accent)] transition-all duration-300">
              {card.title}
            </h3>
            <p className="mt-3 text-xs md:text-sm text-white/70 font-body font-light leading-relaxed max-w-[32ch]">
              {card.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section id="voyages" className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col justify-between">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <FadingVideo
          src={THEME_CONFIGS[theme].secondaryVideo}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Main Content Pane */}
      <div className="relative z-10 px-6 md:px-16 lg:px-20 pt-24 pb-12 flex flex-col justify-between min-h-screen">
        
        {/* Header Block */}
        {motion ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={headerVariants}
            className="mb-auto text-left"
          >
            <div className="text-sm font-body font-medium tracking-wider text-white/80 uppercase mb-4">
              // Capabilities
            </div>
            <h2 className="font-heading italic text-white text-5xl md:text-7xl lg:text-[6rem] leading-[0.85] tracking-[-3px] max-w-xl">
              Production<br />evolved
            </h2>
          </motion.div>
        ) : headerContent}

        {/* Dynamic Cards Grid */}
        {motion ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full"
          >
            {cardData.map((card) => (
              <motion.div
                key={card.title}
                variants={cardVariants}
                className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col justify-between hover:bg-white/[0.02] hover:border-[var(--theme-border-color)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.3),_0_0_20px_var(--theme-accent-glow)] group transition-all duration-500"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="w-11 h-11 rounded-[0.75rem] flex items-center justify-center liquid-glass border border-white/10 group-hover:scale-105 group-hover:bg-white/5 group-hover:border-[var(--theme-border-color)] group-hover:shadow-[0_0_15px_var(--theme-accent-glow)] transition-all duration-300 flex-shrink-0">
                    {card.icon}
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5 max-w-[75%]">
                    {card.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="liquid-glass rounded-full px-2.5 py-0.5 text-[10px] md:text-[11px] text-white/90 font-body hover:bg-white/5 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-1" />

                <div className="mt-6 text-left">
                  <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none group-hover:translate-x-1 group-hover:text-[var(--theme-accent)] transition-all duration-300">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-xs md:text-sm text-white/70 font-body font-light leading-relaxed max-w-[32ch]">
                    {card.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : cardsGridContent}

      </div>
    </section>
  );
};

// ----------------------------------------------------
// 6. WORLDS SECTION COMPONENT (Interactive exoplanets)
// ----------------------------------------------------
const Worlds = ({ theme }) => {
  const [activePlanet, setActivePlanet] = React.useState(0);
  const [activeSim, setActiveSim] = React.useState(null); // 'distance' | 'voyage' | 'gravity' | null
  const [dropCompleted, setDropCompleted] = React.useState(false);
  const MotionGlobal = window.Motion || window.FramerMotion;
  const motion = MotionGlobal ? (MotionGlobal.motion || MotionGlobal) : null;

  const planets = [
    {
      name: "Mars",
      title: "The Red Frontier",
      description: "Our closest planetary neighbor, featuring colossal volcanic shield systems like Olympus Mons and vast ancient river valleys. The primary pioneer outpost for established multi-planetary human habitation.",
      distance: "225 Million km",
      travelTime: "9 Months",
      gravity: "0.38g",
      color: "rgba(239, 68, 68, 0.12)",
      borderColor: "rgba(239, 68, 68, 0.35)",
      textColor: "text-red-400"
    },
    {
      name: "Kepler-186f",
      title: "The Emerald Sanctuary",
      description: "The first validated Earth-sized exoplanet orbiting within the habitable zone of an M-dwarf star. An emerald sanctuary rich in atmospheric potential, pristine liquid oceans, and lush biological baselines.",
      distance: "582 Light Years",
      travelTime: "4.2 Years (Warp)",
      gravity: "1.1g",
      color: "rgba(16, 185, 129, 0.12)",
      borderColor: "rgba(16, 185, 129, 0.35)",
      textColor: "text-emerald-400"
    },
    {
      name: "Titan",
      title: "The Amber Cradle",
      description: "Saturn's giant hydrocarbon moon, shrouded in dense nitrogen atmospheres with amber-hued methane seas and prebiotic chemical models. A cryogenic explorer's dream for aerial craft exploration.",
      distance: "1.4 Billion km",
      travelTime: "3.2 Years",
      gravity: "0.14g",
      color: "rgba(245, 158, 11, 0.12)",
      borderColor: "rgba(245, 158, 11, 0.35)",
      textColor: "text-amber-400"
    }
  ];

  const handleSimToggle = (type) => {
    if (activeSim === type) {
      setActiveSim(null);
    } else {
      setActiveSim(type);
      if (type === 'gravity') {
        setDropCompleted(false);
        setTimeout(() => setDropCompleted(true), 100);
      }
    }
  };

  React.useEffect(() => {
    if (activeSim === 'gravity') {
      setDropCompleted(false);
      const timer = setTimeout(() => setDropCompleted(true), 150);
      return () => clearTimeout(timer);
    }
  }, [activePlanet, activeSim]);

  return (
    <section id="worlds" className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col justify-between py-24 px-6 md:px-16 lg:px-20 border-t border-white/5">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none opacity-25">
        <FadingVideo
          src={THEME_CONFIGS[theme].secondaryVideo}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col justify-between flex-1 gap-12">
        
        {/* Header Block */}
        <div className="text-left">
          <div className="text-sm font-body font-medium tracking-wider text-white/80 uppercase mb-4">
            // Exoplanetary Destinations
          </div>
          <h2 className="font-heading italic text-white text-5xl md:text-7xl lg:text-[6rem] leading-[0.85] tracking-[-3px] max-w-xl">
            Worlds<br />Beyond
          </h2>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-6">
          
          {/* Planet Navigation Side Panel */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-4">
            {planets.map((planet, index) => (
              <button
                key={planet.name}
                onClick={() => {
                  setActivePlanet(index);
                  setActiveSim(null);
                }}
                className={`p-6 rounded-[1.25rem] text-left transition-all duration-500 flex items-center justify-between group border ${
                  activePlanet === index
                    ? "liquid-glass border-white/20 shadow-2xl"
                    : "bg-white/[0.01] hover:bg-white/[0.03] border-transparent"
                }`}
                style={{
                  borderColor: activePlanet === index ? planet.borderColor : undefined,
                  boxShadow: activePlanet === index ? `0 0 40px ${planet.color}` : undefined
                }}
              >
                <div>
                  <span className={`text-xs uppercase tracking-wider font-semibold font-body ${planet.textColor}`}>
                    {planet.name}
                  </span>
                  <h3 className="font-heading italic text-2xl md:text-3xl text-white tracking-tight mt-1">
                    {planet.title}
                  </h3>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center liquid-glass border border-white/10 group-hover:scale-110 transition-all ${
                  activePlanet === index ? "bg-white text-black" : "text-white"
                }`}>
                  <ArrowUpRightIcon className={`h-4 w-4 ${activePlanet === index ? "text-black" : "text-white"}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Details Dashboard Container */}
          <div 
            className="lg:col-span-7 liquid-glass rounded-[1.5rem] p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-500 min-h-[380px]"
            style={{
              borderColor: planets[activePlanet].borderColor,
              boxShadow: `inset 0 0 60px ${planets[activePlanet].color}`
            }}
          >
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <span className="text-[10px] uppercase tracking-widest font-body text-white/50">// Planetary Coordinates</span>
                <span className={`text-[10px] font-semibold font-body uppercase px-2.5 py-0.5 rounded-full border border-white/15 bg-white/5 ${planets[activePlanet].textColor}`}>
                  Safe Entry Permitted
                </span>
              </div>

              <h3 className="font-heading italic text-white text-4xl md:text-5xl tracking-[-2px] leading-none mb-4">
                {planets[activePlanet].title}
              </h3>
              <p className="text-xs md:text-sm text-white/80 font-body font-light leading-relaxed max-w-2xl mb-8">
                {planets[activePlanet].description}
              </p>
            </div>

            {/* Interactive Simulation / Tooltip Bar */}
            {activeSim && (
              <div 
                className="mt-2 mb-6 p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs font-body animate-in fade-in slide-in-from-bottom-2 duration-300 relative"
                style={{ borderColor: planets[activePlanet].borderColor }}
              >
                {activeSim === 'distance' && (
                  <div>
                    <span className="font-semibold text-white block">Interstellar Distance Matrix</span>
                    <span className="text-white/60 block mt-1">
                      Warp pathway trajectory mapped successfully. Real-space distance is {planets[activePlanet].distance}. Sector clearance verified.
                    </span>
                  </div>
                )}
                {activeSim === 'voyage' && (
                  <div>
                    <span className="font-semibold text-white block">Flight Schedule Vector</span>
                    <span className="text-white/60 block mt-1">
                      Voyage duration is {planets[activePlanet].travelTime}. Includes planetary escape, orbit sync, and high-aerobrake atmospheric insertions.
                    </span>
                  </div>
                )}
                {activeSim === 'gravity' && (
                  <div className="w-full flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <span className="font-semibold text-white block">Gravity Simulation Node</span>
                      <span className="text-white/60 block mt-1">
                        Core gravity: <strong className={planets[activePlanet].textColor}>{planets[activePlanet].gravity}</strong>. Click "Drop" to launch a telemetry capsule in real-time space gravity.
                      </span>
                    </div>
                    {/* Visual Gravity Drop Chamber */}
                    <div className="w-16 h-20 bg-black/40 rounded-xl relative overflow-hidden border border-white/5 flex flex-col justify-between p-1">
                      <div className="text-[7px] text-white/30 text-center font-mono uppercase tracking-tighter">100m</div>
                      {/* Dropping Probe */}
                      <div 
                        className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#fff] transition-all"
                        style={{
                          top: dropCompleted ? 'calc(100% - 14px)' : '14px',
                          transitionDuration: dropCompleted ? 
                            (activePlanet === 0 ? '1.4s' : // Mars (0.38g)
                             activePlanet === 1 ? '0.7s' : // Kepler (1.1g)
                             '2.2s') : '0s',              // Titan (0.14g)
                          transitionTimingFunction: 'ease-in'
                        }}
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropCompleted(false);
                          setTimeout(() => setDropCompleted(true), 100);
                        }}
                        className="w-full text-[8px] bg-white/10 hover:bg-white/20 active:scale-95 py-0.5 rounded-full text-white/90 text-center font-mono mt-auto uppercase"
                      >
                        Drop
                      </button>
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => setActiveSim(null)}
                  className="absolute top-2 right-2 text-white/40 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Spec grid */}
            <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 mt-auto">
              <div 
                onClick={() => handleSimToggle('distance')}
                className={`flex flex-col cursor-pointer p-2 rounded-xl transition-all duration-300 ${
                  activeSim === 'distance' ? 'bg-white/5 border border-white/15' : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <span className="text-[9px] text-white/40 uppercase tracking-widest font-body">Distance</span>
                <span className="text-base md:text-xl font-heading italic text-white font-medium mt-1 select-none">
                  {planets[activePlanet].distance}
                </span>
              </div>
              <div 
                onClick={() => handleSimToggle('voyage')}
                className={`flex flex-col cursor-pointer p-2 rounded-xl transition-all duration-300 ${
                  activeSim === 'voyage' ? 'bg-white/5 border border-white/15' : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <span className="text-[9px] text-white/40 uppercase tracking-widest font-body">Est. Voyage</span>
                <span className="text-base md:text-xl font-heading italic text-white font-medium mt-1 select-none">
                  {planets[activePlanet].travelTime}
                </span>
              </div>
              <div 
                onClick={() => handleSimToggle('gravity')}
                className={`flex flex-col cursor-pointer p-2 rounded-xl transition-all duration-300 ${
                  activeSim === 'gravity' ? 'bg-white/5 border border-white/15' : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <span className="text-[9px] text-white/40 uppercase tracking-widest font-body">Core Gravity</span>
                <span className="text-base md:text-xl font-heading italic text-white font-medium mt-1 select-none flex items-center gap-1">
                  {planets[activePlanet].gravity}
                  <span className="text-[9px] opacity-40 font-body">simulate</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ----------------------------------------------------
// 7. INNOVATION SECTION COMPONENT (High-tech schematics)
// ----------------------------------------------------
const Innovation = ({ theme }) => {
  const [activeTech, setActiveTech] = React.useState(0);
  
  const techData = [
    {
      title: "Quantum Ion Fusion Engine",
      tag: "Propulsion System",
      desc: "Harnessing stabilized magnetic deuterium fusion loops to accelerate plasma particles close to light velocities. Reaches interstellar warp thresholds easily.",
      spec: "12,500 km/s Cruise Velocity"
    },
    {
      title: "Holographic Resonant Shields",
      tag: "Vessel Security",
      desc: "Harmonized static electromagnetic grid sheets capable of instantly vaporizing incoming orbital debris, cosmic dust, and hard solar radiation flares.",
      spec: "99.85% Deflection Coeff"
    },
    {
      title: "Closed-Loop Vascular Biosphere",
      tag: "Environmental Control",
      desc: "Genetically augmented indoor self-sustaining hydroponic biological systems. Handles carbon capture, gas conversion, and pure nutrient harvests continuously.",
      spec: "100% Regenerative Cycle"
    }
  ];

  return (
    <section id="innovation" className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col justify-between py-24 px-6 md:px-16 lg:px-20 border-t border-white/5">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none opacity-15">
        <FadingVideo
          src={THEME_CONFIGS[theme].heroVideo}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col justify-between flex-1 gap-12">
        
        {/* Header Block */}
        <div className="text-left">
          <div className="text-sm font-body font-medium tracking-wider text-white/80 uppercase mb-4">
            // Advanced Aerospace Architecture
          </div>
          <h2 className="font-heading italic text-white text-5xl md:text-7xl lg:text-[6rem] leading-[0.85] tracking-[-3px] max-w-xl">
            Innovation<br />unlocked
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-6">
          
          {/* Engineering Tabs Panel */}
          <div className="lg:col-span-6 flex flex-col justify-center gap-6">
            {techData.map((tech, index) => (
              <div
                key={tech.title}
                onClick={() => setActiveTech(index)}
                className={`p-6 rounded-[1.25rem] border transition-all duration-500 cursor-pointer ${
                  activeTech === index
                    ? "liquid-glass border-[var(--theme-border-color)] shadow-[0_0_25px_var(--theme-accent-glow)]"
                    : "bg-white/[0.01] hover:bg-white/[0.03] border-transparent"
                }`}
              >
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-body">
                  SYSTEM_0{index + 1} // {tech.tag}
                </span>
                <h3 className="font-heading italic text-2xl md:text-3xl text-white tracking-tight mt-1">
                  {tech.title}
                </h3>
                {activeTech === index && (
                  <p className="mt-3 text-xs md:text-sm text-white/70 font-body font-light leading-relaxed">
                    {tech.desc}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Interactive Mechanical Vector Graphics Terminal */}
          <div className="lg:col-span-6 liquid-glass rounded-[1.5rem] p-8 aspect-square flex items-center justify-center relative overflow-hidden max-w-[460px] mx-auto w-full">
            <svg viewBox="0 0 400 400" className="w-full h-full max-w-[320px] text-white/30 transition-all duration-1000">
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--theme-accent)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--theme-accent)" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="200" cy="200" r="160" fill="url(#glow)" stroke="rgba(255,255,255,0.06)" strokeDasharray="5,5" />
              <circle cx="200" cy="200" r="120" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <circle cx="200" cy="200" r="80" stroke="rgba(255,255,255,0.05)" />
              
              {/* Spinning Scanner Radial Line */}
              <line x1="200" y1="200" x2="350" y2="100" stroke="var(--theme-accent)" strokeWidth="1.5" className="origin-center animate-spin" style={{ animationDuration: "10s" }} />

              <g stroke="currentColor" strokeWidth="1" fill="none">
                {/* Ship wireframe HUD */}
                <polygon points="200,80 235,195 200,245 165,195" stroke="var(--theme-accent)" className="animate-pulse" />
                <line x1="200" y1="80" x2="200" y2="245" stroke="rgba(255, 255, 255, 0.15)" />
                <line x1="165" y1="195" x2="235" y2="195" stroke="rgba(255, 255, 255, 0.15)" />
                <polygon points="200,245 215,290 185,290" stroke="rgba(255, 255, 255, 0.25)" />

                {/* Deflector Shield Circle Hotspot (System 2) */}
                <g 
                  onClick={() => setActiveTech(1)}
                  className={`cursor-pointer transition-all duration-500 ${activeTech === 1 ? 'text-[var(--theme-accent)]' : 'text-white/30 hover:text-white/80'}`}
                >
                  <circle 
                    cx="200" 
                    cy="190" 
                    r={activeTech === 1 ? "106" : "90"} 
                    stroke="currentColor" 
                    strokeWidth={activeTech === 1 ? "1.8" : "1"} 
                    strokeDasharray="4,4" 
                    className="origin-center animate-spin" 
                    style={{ animationDuration: "25s" }} 
                  />
                  <text x="200" y="70" textAnchor="middle" fill="currentColor" className="text-[8px] font-mono tracking-widest uppercase font-semibold">Deflector</text>
                </g>

                {/* Propulsion Thruster Hotspot (System 1) */}
                <g 
                  onClick={() => setActiveTech(0)}
                  className={`cursor-pointer transition-all duration-500 ${activeTech === 0 ? 'text-[var(--theme-accent)]' : 'text-white/30 hover:text-white/80'}`}
                >
                  <ellipse 
                    cx="200" 
                    cy="300" 
                    rx={activeTech === 0 ? "28" : "16"} 
                    ry={activeTech === 0 ? "12" : "6"} 
                    fill={activeTech === 0 ? "var(--theme-accent-glow)" : "rgba(255,255,255,0.02)"} 
                    stroke="currentColor" 
                    strokeWidth={activeTech === 0 ? "1.8" : "1"} 
                    className="animate-pulse" 
                  />
                  <text x="200" y="325" textAnchor="middle" fill="currentColor" className="text-[8px] font-mono tracking-widest uppercase font-semibold">Propulsion</text>
                </g>

                {/* Biosphere Environment Core Hotspot (System 3) */}
                <g 
                  onClick={() => setActiveTech(2)}
                  className={`cursor-pointer transition-all duration-500 ${activeTech === 2 ? 'text-[var(--theme-accent)]' : 'text-white/30 hover:text-white/80'}`}
                >
                  <circle 
                    cx="200" 
                    cy="190" 
                    r={activeTech === 2 ? "36" : "24"} 
                    fill={activeTech === 2 ? "var(--theme-accent-glow)" : "rgba(255,255,255,0.02)"} 
                    stroke="currentColor" 
                    strokeWidth={activeTech === 2 ? "1.8" : "1"} 
                  />
                  <circle cx="200" cy="190" r="4" fill="currentColor" className="animate-ping" style={{ animationDuration: "3s" }} />
                  <text x="200" y="160" textAnchor="middle" fill="currentColor" className="text-[8px] font-mono tracking-widest uppercase font-semibold">Environment</text>
                </g>
              </g>

              {/* Data Telemetry Text */}
              <text x="200" y="365" textAnchor="middle" fill="var(--theme-accent)" className="text-[11px] font-mono tracking-widest uppercase font-semibold">
                SYSTEM_METRIC: {techData[activeTech].spec}
              </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

// ----------------------------------------------------
// 8. PLAN LAUNCH COMPONENT (Interactive Sci-Fi Ticket Booking)
// ----------------------------------------------------
const PlanLaunch = ({ theme }) => {
  const [formData, setFormData] = React.useState({
    name: "",
    destination: "Mars",
    tier: "Warp Cruise",
    astronauts: 1,
  });
  const [ticket, setTicket] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const ticketId = "AE-" + Math.floor(100000 + Math.random() * 900000);
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() + 90);
      const boardingDate = randomDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      setTicket({
        id: ticketId,
        name: formData.name,
        destination: formData.destination,
        tier: formData.tier,
        seats: formData.astronauts,
        boarding: boardingDate,
        gate: "Docking Ring 7A",
        seatNo: "E-" + Math.floor(10 + Math.random() * 89)
      });
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <section id="plan-launch" className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col justify-between py-24 px-6 md:px-16 lg:px-20 border-t border-white/5">
      {/* Invisible anchor to capture both Claim Spot variants */}
      <div id="claim-spot" className="absolute top-0 left-0 w-1 h-1 pointer-events-none" />

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none opacity-20">
        <FadingVideo
          src={THEME_CONFIGS[theme].secondaryVideo}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col justify-between flex-1 gap-12">
        
        {/* Header Block */}
        <div className="text-center md:text-left">
          <div className="text-sm font-body font-medium tracking-wider text-white/80 uppercase mb-4">
            // Reservation Portal
          </div>
          <h2 className="font-heading italic text-white text-5xl md:text-7xl lg:text-[6rem] leading-[0.85] tracking-[-3px]">
            Plan Launch
          </h2>
        </div>

        <div className="w-full max-w-xl mx-auto mt-6">
          {!ticket ? (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="liquid-glass rounded-[1.5rem] p-8 flex flex-col gap-6 text-left shadow-2xl">
              <div className="border-b border-white/10 pb-4 mb-2">
                <h3 className="font-heading italic text-2xl text-white">Reserve Departure Slot</h3>
                <p className="text-xs text-white/60 font-body mt-1">Book secure space-travel coordinates for personal crew sizes.</p>
              </div>

              {/* Full Name input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/60 font-body">Crew Commander Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commander Shepard"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 rounded-full border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent-glow)] transition-all font-body"
                />
              </div>

              {/* Destination & Travel Option pill groups */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/60 font-body">Sector Destination</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { val: "Mars", label: "Mars Outpost", color: "hover:border-red-500/40 active:bg-red-500/10 border-red-500/25 bg-red-500/5 text-red-300" },
                      { val: "Kepler-186f", label: "Kepler Sanctuary", color: "hover:border-emerald-500/40 active:bg-emerald-500/10 border-emerald-500/25 bg-emerald-500/5 text-emerald-300" },
                      { val: "Titan", label: "Titan Cryo-Cradle", color: "hover:border-amber-500/40 active:bg-amber-500/10 border-amber-500/25 bg-amber-500/5 text-amber-300" }
                    ].map((dest) => {
                      const isSelected = formData.destination === dest.val;
                      return (
                        <button
                          key={dest.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, destination: dest.val })}
                          className={`w-full px-4 py-2.5 text-xs font-semibold rounded-full border transition-all duration-300 text-left flex items-center justify-between ${
                            isSelected 
                              ? dest.color + ' border-opacity-100 shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{dest.label}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/60 font-body">Travel Option</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { val: "Warp Cruise", label: "Warp Speed Cruise (Premium)" },
                      { val: "Cryo Sleep", label: "Cryo Sleep Deep-Voyage" },
                      { val: "Quantum Sail", label: "Solar Sail Cruise (Standard)" }
                    ].map((opt) => {
                      const isSelected = formData.tier === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, tier: opt.val })}
                          className={`w-full px-4 py-2.5 text-xs font-semibold rounded-full border transition-all duration-300 text-left flex items-center justify-between ${
                            isSelected 
                              ? 'bg-[var(--theme-accent)] text-black border-[var(--theme-accent)] shadow-[0_0_20px_var(--theme-accent-glow)]' 
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-black"></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Counter for Astronaut Seats */}
              <div className="flex items-center justify-between py-2 border-t border-b border-white/5 my-2">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-white/60 font-body">Astronaut Seats</span>
                  <span className="text-xs text-white/40 font-body mt-0.5">Maximum 4 seats per flight</span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={formData.astronauts <= 1}
                    onClick={() => setFormData({ ...formData, astronauts: formData.astronauts - 1 })}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-lg font-bold font-body text-white w-4 text-center">{formData.astronauts}</span>
                  <button
                    type="button"
                    disabled={formData.astronauts >= 4}
                    onClick={() => setFormData({ ...formData, astronauts: formData.astronauts + 1 })}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 bg-[var(--theme-accent)] text-black font-semibold font-body text-sm rounded-full hover:shadow-[0_0_25px_var(--theme-accent-glow)] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                    <span>Resolving Frequencies...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Launch Reserve</span>
                    <ArrowUpRightIcon className="h-4 w-4 text-black" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Sci-Fi Boarding Pass Receipt */
            <div className="liquid-glass rounded-[1.5rem] p-8 border border-[var(--theme-border-color)] shadow-[0_0_50px_var(--theme-accent-glow)] relative overflow-hidden text-left flex flex-col gap-6">
              <div className="absolute top-0 right-0 p-4 bg-[var(--theme-accent-glow)] text-[var(--theme-accent)] text-[10px] font-bold tracking-widest uppercase rounded-bl-[1rem] border-l border-b border-[var(--theme-border-color)]">
                Reservation Confirmed
              </div>

              <div className="border-b border-white/10 pb-4">
                <span className="text-[10px] tracking-widest uppercase font-body text-[var(--theme-accent)]">Voyage Authorization Receipt</span>
                <h3 className="font-heading italic text-3xl text-white mt-1">Aetheris Boarding Pass</h3>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 block">Crew Commander</span>
                  <span className="font-body font-semibold text-white mt-1 block truncate">{ticket.name}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 block">Sector Target</span>
                  <span className={`font-body font-semibold mt-1 block ${ticket.destination === "Mars" ? "text-red-400" : ticket.destination === "Kepler-186f" ? "text-emerald-400" : "text-amber-400"}`}>{ticket.destination} Outpost</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 block">Boarding Node</span>
                  <span className="font-body font-semibold text-white mt-1 block">{ticket.gate}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 block">Seat/Berth allocation</span>
                  <span className="font-body font-semibold text-white mt-1 block">{ticket.seatNo} (x{ticket.seats})</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] uppercase tracking-widest text-white/40 block">Launch Windows (Est.)</span>
                  <span className="font-body font-semibold text-white mt-1 block">{ticket.boarding} // SOL-9</span>
                </div>
              </div>

              {/* Glowing vector barcode */}
              <div className="mt-4 flex flex-col gap-1.5 items-center justify-center py-4 bg-white/[0.02] border border-white/5 rounded-[0.75rem]">
                <div className="h-10 w-full max-w-[280px] flex items-center justify-between px-4 opacity-75">
                  {Array.from({ length: 42 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white h-full"
                      style={{
                        width: (idx % 3 === 0 ? "1px" : idx % 5 === 0 ? "4px" : "2px"),
                        opacity: (idx % 7 === 0 ? "0.3" : "0.9")
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono tracking-[4px] text-white/40">{ticket.id}</span>
              </div>

              <button
                type="button"
                onClick={() => setTicket(null)}
                className="w-full mt-2 py-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-white font-medium font-body text-xs rounded-full transition-all"
              >
                Schedule Another Window
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// ----------------------------------------------------
// 9. HIGH-FIDELITY PROCEDURAL PLANET TEXTURE & LABEL GENERATORS
// ----------------------------------------------------

// Custom rounded rect draw utility for Canvas 2D
const drawPillPath = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

// Procedural texture engine creating highly realistic planetary maps on the fly
const createProceduralPlanetTexture = (name, deviceMode) => {
  const canvas = document.createElement('canvas');
  const isMobile = deviceMode === 'mobile';
  canvas.width = isMobile ? 256 : 512;
  canvas.height = isMobile ? 128 : 256;
  const ctx = canvas.getContext('2d');
  
  // Logical resolution remains 512x256 so that all coordinate-based curves map perfectly.
  const w = 512;
  const h = 256;
  
  if (isMobile) {
    ctx.scale(0.5, 0.5);
  }

  // Local helper to add atmospheric/grain noise for organic planet texture feel
  const addGrainNoise = (opacity, density) => {
    // Read the actual physical size of the canvas for device-pixel noise mapping
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < density) {
        const factor = (Math.random() - 0.5) * 255 * opacity;
        data[i] = Math.max(0, Math.min(255, data[i] + factor));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + factor));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + factor));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  if (name === "Sun") {
    // Dynamic solar flares, convection granules & magnetic lines
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#ffa200');
    grad.addColorStop(0.5, '#ff3700');
    grad.addColorStop(1, '#ffa200');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Convective plasma hotspots
    ctx.fillStyle = 'rgba(255, 235, 120, 0.2)';
    for (let i = 0; i < 45; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 35 + 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(120, 10, 0, 0.25)';
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 20 + 5, 0, Math.PI * 2);
      ctx.fill();
    }
    addGrainNoise(0.18, 0.45);

  } else if (name === "Mercury") {
    // Heavily cratered concrete gray rock
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(0, 0, w, h);

    // Dark iron plains (Marias)
    ctx.fillStyle = '#545454';
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 70 + 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rocky impact craters with highlights and shadows
    for (let i = 0; i < 90; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const cr = Math.random() * 8 + 2;

      // Crater shadows (left)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx - 1, cy - 1, cr, 0, Math.PI * 2);
      ctx.stroke();

      // Crater highlights (right)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(cx + 1, cy + 1, cr, 0, Math.PI * 2);
      ctx.stroke();

      // Basin depth fill
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.beginPath();
      ctx.arc(cx, cy, cr - 1, 0, Math.PI * 2);
      ctx.fill();
    }
    addGrainNoise(0.2, 0.35);

  } else if (name === "Venus") {
    // Dense, swirling orange-yellow sulfuric greenhouse atmosphere
    ctx.fillStyle = '#dcb274';
    ctx.fillRect(0, 0, w, h);

    // horizontal swirling wind waves
    for (let y = 0; y < h; y += 4) {
      const amp = Math.sin(y * 0.08) * 16;
      ctx.fillStyle = `rgba(165, 100, 45, ${Math.random() * 0.22 + 0.06})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 12) {
        const offset = Math.sin(x * 0.035 + y * 0.1) * amp;
        ctx.lineTo(x, y + offset);
      }
      ctx.lineTo(w, y + 25);
      ctx.lineTo(0, y + 25);
      ctx.fill();
    }

    // Swirling bright high-temp clouds
    ctx.fillStyle = 'rgba(255, 240, 195, 0.18)';
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, Math.random() * 110 + 50, Math.random() * 14 + 6, Math.PI / 5, 0, Math.PI * 2);
      ctx.fill();
    }
    addGrainNoise(0.06, 0.2);

  } else if (name === "Earth") {
    // Highly authentic Earth: Deep blue oceans, custom green continents, polar ice caps, and dynamic clouds
    ctx.fillStyle = '#0f328a'; // oceans
    ctx.fillRect(0, 0, w, h);

    // Procedural organic continental shapes (Green/Brown)
    ctx.fillStyle = '#3c823c';

    // Continent 1: Africa & Eurasia
    ctx.beginPath();
    ctx.moveTo(110, 45);
    ctx.bezierCurveTo(155, 25, 205, 55, 225, 75);
    ctx.bezierCurveTo(255, 95, 285, 125, 275, 175);
    ctx.bezierCurveTo(245, 215, 215, 205, 185, 225);
    ctx.bezierCurveTo(145, 195, 155, 135, 135, 115);
    ctx.bezierCurveTo(115, 105, 85, 75, 110, 45);
    ctx.closePath();
    ctx.fill();

    // Continent 2: Americas (North & South)
    ctx.fillStyle = '#2f732f';
    ctx.beginPath();
    ctx.moveTo(360, 55);
    ctx.bezierCurveTo(400, 45, 430, 85, 440, 115);
    ctx.bezierCurveTo(410, 135, 390, 125, 400, 155);
    ctx.bezierCurveTo(420, 195, 460, 215, 430, 245);
    ctx.bezierCurveTo(390, 225, 370, 185, 360, 145);
    ctx.bezierCurveTo(340, 125, 330, 85, 360, 55);
    ctx.closePath();
    ctx.fill();

    // Continent 3: Australia
    ctx.beginPath();
    ctx.ellipse(290, 205, 28, 16, Math.PI / 12, 0, Math.PI * 2);
    ctx.fill();

    // Dessert plains inside Continent 1
    ctx.fillStyle = '#7a6745';
    ctx.beginPath();
    ctx.moveTo(160, 85);
    ctx.lineTo(215, 95);
    ctx.lineTo(205, 145);
    ctx.lineTo(165, 135);
    ctx.closePath();
    ctx.fill();

    // Arctic and Antarctic glacier ice caps (White)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, 16);
    ctx.fillRect(0, h - 22, w, 22);

    // Earth's Atmospheric Clouds (Semi-transparent organic white curls)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
    for (let i = 0; i < 20; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * (h - 60) + 30;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.random() * 85 + 35, Math.random() * 13 + 3, Math.PI / 12, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (name === "Mars") {
    // Iron-oxide dust deserts + dark basalt splotches + polar ice caps
    ctx.fillStyle = '#bf431d';
    ctx.fillRect(0, 0, w, h);

    // Dark volcanic/basalt plains (Syrtis Major & Acidalia Planitia splotches)
    ctx.fillStyle = '#652918';
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, Math.random() * 115 + 35, Math.random() * 45 + 15, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lighter sand dunes (Iron oxide dust)
    ctx.fillStyle = '#d56839';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 45 + 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mars Polar Ice Caps (White carbon dioxide/water ice)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(w / 2, 4, 40, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(w / 2, h - 4, 30, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    addGrainNoise(0.12, 0.32);

  } else if (name === "Jupiter") {
    // Beautiful gas giant atmospheric bands + the Great Red Spot
    ctx.fillStyle = '#c98950';
    ctx.fillRect(0, 0, w, h);

    // Band colors representing complex ammonia/sulfur compounds
    const colors = [
      'rgba(240, 222, 192, 0.55)', // sand cream
      'rgba(135, 75, 35, 0.45)',   // deep crimson brown
      'rgba(175, 105, 55, 0.35)',  // orange belt
      'rgba(215, 172, 125, 0.45)', // pale yellow
      'rgba(85, 45, 15, 0.4)'      // dark brown abyss
    ];

    for (let y = 10; y < h - 10; y += 7) {
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      const amp = Math.random() * 7 + 2;
      const freq = Math.random() * 0.045 + 0.015;
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 10) {
        const offset = Math.sin(x * freq + y) * amp;
        ctx.lineTo(x, y + offset);
      }
      ctx.lineTo(w, y + 14);
      ctx.lineTo(0, y + 14);
      ctx.closePath();
      ctx.fill();
    }

    // Great Red Spot (Southern gas giant storm, x=290, y=170)
    const rx = 290;
    const ry = 170;
    const rw = 38;
    const rh = 22;

    // Dark red perimeter
    ctx.fillStyle = '#a03214';
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();

    // Swirling warm core
    ctx.fillStyle = '#d56422';
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw * 0.75, rh * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // White eye storm details
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(rx - 5, ry - 2, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    addGrainNoise(0.05, 0.22);

  } else if (name === "Saturn") {
    // Soft, golden gas belts
    ctx.fillStyle = '#dbb983';
    ctx.fillRect(0, 0, w, h);

    const saturnBelts = [
      'rgba(242, 228, 198, 0.5)',  // cream gold
      'rgba(182, 149, 102, 0.35)', // dark caramel
      'rgba(212, 178, 126, 0.45)'  // golden beige
    ];

    for (let y = 10; y < h - 10; y += 10) {
      ctx.fillStyle = saturnBelts[Math.floor(Math.random() * saturnBelts.length)];
      ctx.fillRect(0, y, w, Math.random() * 12 + 5);
    }
    addGrainNoise(0.04, 0.18);

  } else if (name === "Uranus") {
    // Sleek ice-blue gradient with very faint atmospheric bands
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#519fc4');
    grad.addColorStop(0.5, '#74bbd8');
    grad.addColorStop(1, '#519fc4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle pale horizontal cloud hazes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, h * 0.36, w, h * 0.12);
    ctx.fillRect(0, h * 0.62, w, h * 0.09);

  } else if (name === "Neptune") {
    // Deep azure blue atmosphere with white methane cirrus cloud streaks & Great Dark Spot
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1939ad');
    grad.addColorStop(0.5, '#274cd1');
    grad.addColorStop(1, '#1939ad');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Gaseous bands
    ctx.fillStyle = 'rgba(12, 25, 105, 0.28)';
    ctx.fillRect(0, h * 0.18, w, 14);
    ctx.fillRect(0, h * 0.72, w, 18);

    // Neptune Great Dark Spot (supersonic cyclonic storm)
    ctx.fillStyle = '#0f2277';
    ctx.beginPath();
    ctx.ellipse(150, 115, 30, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    // High altitude white methane cloud wisps (Scooter)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(35, 75);
    ctx.bezierCurveTo(85, 70, 135, 80, 195, 75);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(240, 155);
    ctx.bezierCurveTo(300, 150, 360, 160, 420, 155);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
};

// Always-visible 3D Dynamic Label Sprite Creator
const createLabelSprite = (text, textColor) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Pill Background (Liquid-Glass style)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  drawPillPath(ctx, 10, 10, 236, 44, 22);
  ctx.fill();

  // Glass-like translucent border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Glowing signature colored indicator circle
  ctx.fillStyle = textColor;
  ctx.shadowColor = textColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(32, 32, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Reset shadow for text legibility
  ctx.shadowBlur = 0;

  // Render planet name (Barlow capital letter typography)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Barlow", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text.toUpperCase(), 48, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, sizeAttenuation: true });
  const sprite = new THREE.Sprite(material);
  
  // Aspect ratio 4:1 scale
  sprite.scale.set(4.5, 1.125, 1.0);
  return sprite;
};

// ----------------------------------------------------
// 10. INTERACTIVE 3D GALAXY EXPLORER (THREE.JS + ORBITCONTROLS)
// ----------------------------------------------------
const GalaxyExplorer = ({ onClose, theme, deviceMode }) => {
  const mountRef = React.useRef(null);
  
  // State for selected planet details card overlay
  const [selectedPlanet, setSelectedPlanet] = React.useState(null);
  const selectedPlanetRef = React.useRef(null);

  // Sync state with React ref for the WebGL loop so we don't rebuild geometries on state shift
  React.useEffect(() => {
    selectedPlanetRef.current = selectedPlanet;
  }, [selectedPlanet]);

  // Orbit speed modifier states
  const [isPaused, setIsPaused] = React.useState(false);
  const [orbitSpeedFactor, setOrbitSpeedFactor] = React.useState(1.0);
  const orbitSpeedRef = React.useRef(1.0);

  React.useEffect(() => {
    orbitSpeedRef.current = isPaused ? 0.0 : orbitSpeedFactor;
  }, [isPaused, orbitSpeedFactor]);

  // High-fidelity standard astronomical specs
  const planetsData = [
    {
      name: "Sun",
      title: "The Golden Star",
      diameter: "1,392,700 km",
      orbitPeriod: "Galaxy Center",
      orbitSpeed: "0 km/s (Static)",
      moons: "8 Planets",
      temp: "5,500°C",
      description: "The heart of our Solar System. A nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core. It accounts for 99.86% of the total mass of the Solar System.",
      color: "#ffa200",
      radius: 3.5,
      orbitRadius: 0,
      selfRotationSpeed: 0.002,
      textColor: "text-yellow-400"
    },
    {
      name: "Mercury",
      title: "The Scorched Core",
      diameter: "4,879 km",
      orbitPeriod: "88 Days",
      orbitSpeed: "47.4 km/s",
      moons: "0",
      temp: "-173°C to 427°C",
      description: "The smallest and closest planet to the Sun, Mercury is a cracked, craggy world with no atmosphere and extreme temperature swings.",
      color: "#8e8e8e",
      radius: 0.5,
      orbitRadius: 7,
      orbitSpeedVal: 0.04,
      selfRotationSpeed: 0.01,
      textColor: "text-gray-400"
    },
    {
      name: "Venus",
      title: "The Acid Greenhouse",
      diameter: "12,104 km",
      orbitPeriod: "225 Days",
      orbitSpeed: "35.0 km/s",
      moons: "0",
      temp: "462°C",
      description: "Shrouded in dense, sulfurous acid clouds, Venus suffers an intense greenhouse effect making its surface hot enough to melt lead.",
      color: "#dcb274",
      radius: 0.8,
      orbitRadius: 10,
      orbitSpeedVal: 0.015,
      selfRotationSpeed: 0.002,
      textColor: "text-amber-500"
    },
    {
      name: "Earth",
      title: "The Sapphire Cradle",
      diameter: "12,742 km",
      orbitPeriod: "365.25 Days",
      orbitSpeed: "29.8 km/s",
      moons: "1 (Luna)",
      temp: "-88°C to 58°C",
      description: "Our sanctuary. The only known world harboring liquid surface water, an active plate tectonic system, a dynamic magnetosphere, and thriving organic life.",
      color: "#287ab5",
      radius: 0.9,
      orbitRadius: 14,
      orbitSpeedVal: 0.01,
      selfRotationSpeed: 0.02,
      hasMoon: true,
      textColor: "text-blue-400"
    },
    {
      name: "Mars",
      title: "The Red Frontier",
      diameter: "6,779 km",
      orbitPeriod: "687 Days",
      orbitSpeed: "24.1 km/s",
      moons: "2 (Phobos, Deimos)",
      temp: "-153°C to 20°C",
      description: "A frozen desert world with a thin carbon dioxide atmosphere, featuring giant extinct shield volcanoes and dry river channels.",
      color: "#bf431d",
      radius: 0.6,
      orbitRadius: 18,
      orbitSpeedVal: 0.008,
      selfRotationSpeed: 0.018,
      textColor: "text-red-500"
    },
    {
      name: "Jupiter",
      title: "The Gas Sovereign",
      diameter: "139,820 km",
      orbitPeriod: "12 Years",
      orbitSpeed: "13.1 km/s",
      moons: "95",
      temp: "-108°C",
      description: "A colossal gas giant containing more than twice the mass of all other planets combined, marked by beautiful cloud belts and the giant centuries-old storm: the Great Red Spot.",
      color: "#c98950",
      radius: 1.8,
      orbitRadius: 23,
      orbitSpeedVal: 0.004,
      selfRotationSpeed: 0.04,
      textColor: "text-orange-300"
    },
    {
      name: "Saturn",
      title: "The Ringed Jewel",
      diameter: "116,460 km",
      orbitPeriod: "29 Years",
      orbitSpeed: "9.7 km/s",
      moons: "146",
      temp: "-139°C",
      description: "A majestic gas giant adorned with a spectacular, extensive ring system composed of billions of water ice particles and cosmic dust grains.",
      color: "#dbb983",
      radius: 1.5,
      orbitRadius: 29,
      orbitSpeedVal: 0.002,
      selfRotationSpeed: 0.035,
      hasRings: true,
      textColor: "text-yellow-200"
    },
    {
      name: "Uranus",
      title: "The Pale Ice Giant",
      diameter: "50,724 km",
      orbitPeriod: "84 Years",
      orbitSpeed: "6.8 km/s",
      moons: "28",
      temp: "-197°C",
      description: "An icy gas giant that orbits on its side with an extreme 98-degree axial tilt. It features faint, dark vertical rings and a pale cyan hue from methane absorption.",
      color: "#74bbd8",
      radius: 1.1,
      orbitRadius: 34,
      orbitSpeedVal: 0.001,
      selfRotationSpeed: 0.02,
      hasUranusRings: true,
      textColor: "text-cyan-300"
    },
    {
      name: "Neptune",
      title: "The Wind-Swept Abyss",
      diameter: "49,244 km",
      orbitPeriod: "165 Years",
      orbitSpeed: "5.4 km/s",
      moons: "16",
      temp: "-201°C",
      description: "A cold, deep blue world swept by the most violent winds in the solar system, peaking at supersonic speeds up to 2,100 km/h.",
      color: "#274cd1",
      radius: 1.0,
      orbitRadius: 39,
      orbitSpeedVal: 0.0007,
      selfRotationSpeed: 0.022,
      textColor: "text-blue-500"
    }
  ];

  React.useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 30, 60);

    // 3. Renderer setup
    const isMobile = deviceMode === 'mobile';
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile, 
      powerPreference: "high-performance" 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.2) : Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. OrbitControls setup
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 150;
    controls.minDistance = 2;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffddaa, 3, 300, 0.8);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    
    const sunLightWhite = new THREE.PointLight(0xffffff, 1.8, 300, 1.0);
    sunLightWhite.position.set(0, 0, 0);
    scene.add(sunLightWhite);

    // 6. Twinkling Starfield
    const starGeometry = new THREE.BufferGeometry();
    const starCount = isMobile ? 1500 : 4500;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 220 + Math.random() * 280;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = radius * Math.cos(phi);

      const rand = Math.random();
      if (rand > 0.85) {
        starColors[i] = 0.8;
        starColors[i + 1] = 0.9;
        starColors[i + 2] = 1.0;
      } else if (rand > 0.7) {
        starColors[i] = 1.0;
        starColors[i + 1] = 0.95;
        starColors[i + 2] = 0.8;
      } else {
        starColors[i] = 1.0;
        starColors[i + 1] = 1.0;
        starColors[i + 2] = 1.0;
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.8,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });

    const starfield = new THREE.Points(starGeometry, starMaterial);
    scene.add(starfield);

    // 7. Render Celestial Bodies
    const selectableObjects = [];
    const planetsRefs = [];

    const sphereGeometry64 = new THREE.SphereGeometry(1, isMobile ? 32 : 64, isMobile ? 32 : 64);
    const sphereGeometry32 = new THREE.SphereGeometry(1, isMobile ? 16 : 32, isMobile ? 16 : 32);

    planetsData.forEach((pData) => {
      const pGroup = new THREE.Group();
      scene.add(pGroup);

      let pMesh;
      const proceduralTexture = createProceduralPlanetTexture(pData.name, deviceMode);

      if (pData.name === "Sun") {
        const sunMaterial = new THREE.MeshBasicMaterial({
          map: proceduralTexture
        });
        pMesh = new THREE.Mesh(sphereGeometry64, sunMaterial);
        pMesh.scale.setScalar(pData.radius);
        pGroup.add(pMesh);
        
        // Solar Corona Ring
        const coronaGeo = new THREE.RingGeometry(pData.radius * 1.02, pData.radius * 1.25, 64);
        const coronaMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(0xff8800),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3
        });
        const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
        coronaMesh.lookAt(camera.position);
        pGroup.add(coronaMesh);
      } else {
        // High fidelity custom materials based on planet specs
        const isEarth = pData.name === "Earth";
        const isGasGiant = pData.name === "Jupiter" || pData.name === "Saturn";
        const pMaterial = new THREE.MeshStandardMaterial({
          map: proceduralTexture,
          roughness: isEarth ? 0.35 : (isGasGiant ? 0.75 : 0.6),
          metalness: isEarth ? 0.12 : 0.05
        });

        pMesh = new THREE.Mesh(sphereGeometry32, pMaterial);
        pMesh.scale.setScalar(pData.radius);
        pMesh.position.set(pData.orbitRadius, 0, 0);
        pGroup.add(pMesh);

        // Orbital line ring
        const orbitPoints = [];
        for (let i = 0; i <= 128; i++) {
          const theta = (i / 128) * Math.PI * 2;
          orbitPoints.push(new THREE.Vector3(Math.cos(theta) * pData.orbitRadius, 0, Math.sin(theta) * pData.orbitRadius));
        }
        const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitMat = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.12
        });
        const orbitLine = new THREE.Line(orbitGeom, orbitMat);
        scene.add(orbitLine);

        // Saturn Rings
        if (pData.hasRings) {
          const ringGeom = new THREE.RingGeometry(pData.radius * 1.3, pData.radius * 2.4, 64);
          ringGeom.rotateX(-Math.PI / 2);
          const ringMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xd2b785),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
            roughness: 0.8
          });
          const ringMesh = new THREE.Mesh(ringGeom, ringMat);
          ringMesh.position.copy(pMesh.position);
          pGroup.add(ringMesh);
          pGroup.saturnRingsMesh = ringMesh;
        }

        // Uranus Rings
        if (pData.hasUranusRings) {
          const ringGeom = new THREE.RingGeometry(pData.radius * 1.3, pData.radius * 1.6, 64);
          ringGeom.rotateY(Math.PI / 6);
          const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x76b5df),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4
          });
          const ringMesh = new THREE.Mesh(ringGeom, ringMat);
          ringMesh.position.copy(pMesh.position);
          pGroup.add(ringMesh);
          pGroup.uranusRingsMesh = ringMesh;
        }

        // Moon
        if (pData.hasMoon) {
          const moonMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xaaaaaa),
            roughness: 0.9,
            metalness: 0.0
          });
          const moonMesh = new THREE.Mesh(sphereGeometry32, moonMat);
          moonMesh.scale.setScalar(0.2);
          pGroup.add(moonMesh);
          pGroup.moonMesh = moonMesh;
        }
      }

      // Add always-visible attached dynamic floating label
      const labelSprite = createLabelSprite(pData.name, pData.color);
      labelSprite.position.set(pData.orbitRadius, pData.radius + 1.25, 0);
      pGroup.add(labelSprite);
      pGroup.labelSprite = labelSprite;

      pMesh.userData = { name: pData.name };
      selectableObjects.push(pMesh);

      planetsRefs.push({
        name: pData.name,
        group: pGroup,
        mesh: pMesh,
        orbitRadius: pData.orbitRadius,
        orbitSpeed: pData.orbitSpeedVal || 0,
        selfRotationSpeed: pData.selfRotationSpeed,
        theta: Math.random() * Math.PI * 2,
        moonTheta: 0
      });
    });

    let pRefsCorona = null;
    const sunRef = planetsRefs.find(r => r.name === "Sun");
    if (sunRef) {
      pRefsCorona = sunRef.group.children.find(c => c.geometry.type === "RingGeometry");
    }

    // 8. Raycasting clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(selectableObjects);

      if (intersects.length > 0) {
        const targetName = intersects[0].object.userData.name;
        setSelectedPlanet(targetName);
      } else {
        setSelectedPlanet(null);
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    // 9. Resize handler
    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation loop variables
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      
      starfield.rotation.y += 0.0001;
      starfield.rotation.x += 0.00005;

      planetsRefs.forEach((p) => {
        // Slow down orbits if a planet is selected
        const currentSpeedFactor = selectedPlanetRef.current ? 0.04 : orbitSpeedRef.current;
        
        p.theta += p.orbitSpeed * currentSpeedFactor * delta * 50;
        
        if (p.name !== "Sun") {
          const x = Math.cos(p.theta) * p.orbitRadius;
          const z = Math.sin(p.theta) * p.orbitRadius;
          
          p.mesh.position.set(x, 0, z);

          if (p.name === "Saturn" && p.group.saturnRingsMesh) {
            p.group.saturnRingsMesh.position.copy(p.mesh.position);
          }
          if (p.name === "Uranus" && p.group.uranusRingsMesh) {
            p.group.uranusRingsMesh.position.copy(p.mesh.position);
          }

          if (p.name === "Earth" && p.group.moonMesh) {
            p.moonTheta += 0.05 * (selectedPlanetRef.current ? 0.1 : 1.0);
            p.group.moonMesh.position.set(
              p.mesh.position.x + Math.cos(p.moonTheta) * 1.5,
              0.1,
              p.mesh.position.z + Math.sin(p.moonTheta) * 1.5
            );
          }

          if (p.group.labelSprite) {
            p.group.labelSprite.position.set(x, p.mesh.scale.x + 1.25, z);
            p.group.labelSprite.material.opacity = selectedPlanetRef.current === p.name ? 0.15 : 0.95;
          }
        } else {
          // Static Sun label
          if (p.group.labelSprite) {
            p.group.labelSprite.material.opacity = selectedPlanetRef.current === p.name ? 0.15 : 0.95;
          }
        }

        p.mesh.rotation.y += p.selfRotationSpeed * (selectedPlanetRef.current ? 0.1 : 1.0);
      });

      if (pRefsCorona) {
        pRefsCorona.lookAt(camera.position);
      }

      // Smooth camera interpolation towards selected planet
      const currentSelected = selectedPlanetRef.current;
      if (currentSelected) {
        const targetObj = planetsRefs.find(r => r.name === currentSelected);
        if (targetObj) {
          const worldPos = new THREE.Vector3();
          targetObj.mesh.getWorldPosition(worldPos);

          controls.target.lerp(worldPos, 0.08);

          const desiredDist = targetObj.name === "Sun" ? 11.5 : targetObj.mesh.scale.x * 4.2;
          const camDir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
          const currentDist = camera.position.distanceTo(controls.target);
          
          if (Math.abs(currentDist - desiredDist) > 0.01) {
            const nextDist = THREE.MathUtils.lerp(currentDist, desiredDist, 0.05);
            camera.position.copy(controls.target).addScaledVector(camDir, nextDist);
          }
        }
      } else {
        controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup WebGL pipeline on unmount (CRITICAL to avoid GPU memory leaks)
    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('resize', handleResize);

      starGeometry.dispose();
      starMaterial.dispose();
      sphereGeometry64.dispose();
      sphereGeometry32.dispose();

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // Re-bind strictly once on mount

  const handleSelectPlanet = (name) => {
    setSelectedPlanet(name === selectedPlanet ? null : name);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white font-body flex overflow-hidden">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing animate-in fade-in duration-700" />
      
      {/* Sleek Top Overlay Bar */}
      <div className="absolute top-0 inset-x-0 p-4 md:p-6 flex items-center justify-between z-10 pointer-events-none">
        <div className="liquid-glass rounded-full px-5 py-2 flex items-center gap-3 border border-white/10 pointer-events-auto shadow-lg">
          <span className="text-lg font-heading italic tracking-tighter text-cyan-400 select-none">Aetheris</span>
          <span className="h-4 w-px bg-white/20" />
          <span className="text-[10px] font-mono tracking-[4px] text-white/60 uppercase select-none">Solar System Scope v2.1</span>
        </div>
        
        <button
          onClick={onClose}
          className="liquid-glass-strong rounded-full px-5 py-2.5 text-xs font-semibold text-white/90 hover:text-white hover:border-white/30 border border-white/10 flex items-center gap-1.5 pointer-events-auto active:scale-95 transition-all duration-300 shadow-lg"
        >
          <span>Exit Explorer</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Floating Speed Control HUD Panel */}
      <div className="absolute top-20 right-6 z-10 pointer-events-auto hidden md:flex flex-col gap-2">
        <div className="liquid-glass p-4 rounded-2xl border border-white/10 shadow-xl flex items-center gap-4 text-xs font-mono select-none">
          <span className="text-white/50">Orbit Speed:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-3 py-1.5 rounded-full border transition-all duration-300 ${
                isPaused 
                  ? "bg-cyan-500 border-cyan-400 text-black font-semibold"
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
              }`}
            >
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button
              onClick={() => {
                setIsPaused(false);
                setOrbitSpeedFactor(0.2);
              }}
              className={`px-3 py-1.5 rounded-full border transition-all duration-300 ${
                !isPaused && orbitSpeedFactor === 0.2
                  ? "bg-cyan-500 border-cyan-400 text-black font-semibold"
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
              }`}
            >
              0.2x
            </button>
            <button
              onClick={() => {
                setIsPaused(false);
                setOrbitSpeedFactor(1.0);
              }}
              className={`px-3 py-1.5 rounded-full border transition-all duration-300 ${
                !isPaused && orbitSpeedFactor === 1.0
                  ? "bg-cyan-500 border-cyan-400 text-black font-semibold"
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
              }`}
            >
              1x
            </button>
            <button
              onClick={() => {
                setIsPaused(false);
                setOrbitSpeedFactor(2.5);
              }}
              className={`px-3 py-1.5 rounded-full border transition-all duration-300 ${
                !isPaused && orbitSpeedFactor === 2.5
                  ? "bg-cyan-500 border-cyan-400 text-black font-semibold"
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
              }`}
            >
              2.5x
            </button>
          </div>
        </div>
      </div>

      {/* Sleek Floating Bottom Control Guide */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden md:block">
        <div className="liquid-glass rounded-full px-4 py-2 text-[10px] font-mono tracking-wider text-white/60 uppercase border border-white/5 shadow-md flex items-center gap-3">
          <span>🖱️ Left-Click & Drag to Rotate</span>
          <span className="h-2 w-px bg-white/10" />
          <span>🎡 Scroll to Zoom</span>
          <span className="h-2 w-px bg-white/10" />
          <span>🪐 Click planet to focus</span>
        </div>
      </div>

      {/* Left Sidebar - Planets Selector */}
      <div className="absolute left-4 top-24 bottom-6 w-56 hidden md:flex flex-col gap-2 z-10 pointer-events-none justify-center">
        <div className="liquid-glass-strong p-4 rounded-[1.5rem] border border-white/10 pointer-events-auto flex flex-col gap-1.5 shadow-2xl max-h-[75vh] overflow-y-auto">
          <span className="text-[9px] font-mono tracking-wider text-white/40 uppercase mb-2 font-semibold text-center select-none">// Celestial System</span>
          {planetsData.map((p) => {
            const isSelected = selectedPlanet === p.name;
            return (
              <button
                key={p.name}
                onClick={() => handleSelectPlanet(p.name)}
                className={`w-full py-2 px-4 rounded-full text-xs font-semibold text-left transition-all duration-300 flex items-center justify-between border ${
                  isSelected
                    ? "bg-white text-black border-white shadow-lg"
                    : "bg-white/5 text-white/70 hover:text-white border-transparent hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>{p.name}</span>
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Horizontal Planet List for Mobile */}
      <div className="absolute bottom-4 inset-x-4 md:hidden z-10 flex gap-2 overflow-x-auto pb-2 pointer-events-auto no-scrollbar">
        {planetsData.map((p) => {
          const isSelected = selectedPlanet === p.name;
          return (
            <button
              key={p.name}
              onClick={() => handleSelectPlanet(p.name)}
              className={`py-1.5 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 border ${
                isSelected
                  ? "bg-white text-black border-white shadow-lg"
                  : "bg-black/80 backdrop-blur-md text-white/70 border-white/10 hover:text-white"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: p.color }}
              />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Right Telemetry Details Card */}
      {selectedPlanet && (
        <div className="absolute right-4 top-24 bottom-6 w-96 hidden md:flex flex-col z-10 pointer-events-auto justify-center animate-in fade-in slide-in-from-right-8 duration-500">
          {(() => {
            const p = planetsData.find(x => x.name === selectedPlanet);
            if (!p) return null;
            return (
              <div 
                className="liquid-glass-strong p-6 rounded-[1.5rem] border border-white/10 flex flex-col gap-6 shadow-2xl max-h-[80vh] overflow-y-auto"
                style={{
                  borderColor: `${p.color}44`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.6), inset 0 0 30px ${p.color}15`
                }}
              >
                {/* Header */}
                <div className="border-b border-white/10 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase">// Orbital Telemetry</span>
                    <button
                      onClick={() => setSelectedPlanet(null)}
                      className="text-white/40 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-white/5 transition-colors font-mono"
                    >
                      Deselect ✕
                    </button>
                  </div>
                  <h3 className="font-heading italic text-white text-4xl tracking-tight mt-1 leading-none">
                    {p.name}
                  </h3>
                  <span className={`text-[10px] font-mono tracking-wider font-semibold uppercase ${p.textColor}`}>
                    {p.title}
                  </span>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-4 text-xs font-body">
                  <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-white/40">Diameter</span>
                    <span className="font-semibold text-white truncate">{p.diameter}</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-white/40">Orbit Period</span>
                    <span className="font-semibold text-white truncate">{p.orbitPeriod}</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-white/40">Orbit Speed</span>
                    <span className="font-semibold text-white truncate">{p.orbitSpeed}</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-white/40">Satellites</span>
                    <span className="font-semibold text-white truncate">{p.moons}</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col col-span-2 gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-white/40">Surface Temp (Est)</span>
                    <span className="font-semibold text-white">{p.temp}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-white/80 font-body font-light leading-relaxed">
                  {p.description}
                </p>

                {/* CTA Action */}
                <div className="mt-2 border-t border-white/10 pt-4 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      alert(`Initiating secure interstellar comm-link with established telemetry coordinates at ${p.name}...`);
                    }}
                    className="w-full py-2.5 rounded-full bg-white text-black font-semibold font-body text-xs text-center hover:bg-white/90 active:scale-95 transition-all shadow-md"
                  >
                    Establish Quantum Link
                  </button>
                  <button
                    onClick={() => setSelectedPlanet(null)}
                    className="w-full py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-white font-medium font-body text-[11px] text-center transition-all"
                  >
                    Back to System View
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Floating Bottom Drawer Details Card for Mobile */}
      {selectedPlanet && (
        <div className="absolute bottom-16 inset-x-4 md:hidden z-20 pointer-events-auto">
          {(() => {
            const p = planetsData.find(x => x.name === selectedPlanet);
            if (!p) return null;
            return (
              <div 
                className="liquid-glass-strong p-5 rounded-[1.5rem] border border-white/10 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-8 duration-500 max-h-[50vh] overflow-y-auto"
                style={{
                  borderColor: `${p.color}44`,
                  boxShadow: `0 10px 40px rgba(0,0,0,0.7), inset 0 0 20px ${p.color}10`
                }}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div>
                    <h3 className="font-heading italic text-white text-2xl tracking-tight leading-none">
                      {p.name}
                    </h3>
                    <span className={`text-[8px] font-mono uppercase tracking-wider ${p.textColor}`}>
                      {p.title}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedPlanet(null)}
                    className="text-white/50 hover:text-white text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-[8px] uppercase tracking-widest text-white/40 block">Diameter</span>
                    <span className="font-semibold text-white">{p.diameter}</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-[8px] uppercase tracking-widest text-white/40 block">Orbit Period</span>
                    <span className="font-semibold text-white">{p.orbitPeriod}</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-[8px] uppercase tracking-widest text-white/40 block">Moons</span>
                    <span className="font-semibold text-white">{p.moons}</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-[8px] uppercase tracking-widest text-white/40 block">Temp</span>
                    <span className="font-semibold text-white">{p.temp}</span>
                  </div>
                </div>

                <p className="text-[11px] text-white/80 font-light leading-relaxed">
                  {p.description}
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 10. MAIN APPLICATION SHELL
// ----------------------------------------------------
const App = () => {
  const [theme, setTheme] = React.useState("flower");
  const [exploreMode, setExploreMode] = React.useState(false);
  const [deviceMode, setDeviceMode] = React.useState(null); // 'mobile' | 'pc'
  const [toast, setToast] = React.useState(null); // { message: string }

  // Auto-clear custom toast after 6 seconds
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDeviceSelection = (selection) => {
    const isDesktopDevice = window.innerWidth >= 1024;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isProbablyMobile = !isDesktopDevice || hasTouch;

    setDeviceMode(selection);

    if (selection === "mobile" && isDesktopDevice) {
      setToast({
        message: "Optimized Mobile Mode active on Desktop (1,500 stars, fast shading). Reload & choose PC Mode for full 4K visual assets."
      });
    } else if (selection === "pc" && isProbablyMobile) {
      setToast({
        message: "Cinematic PC Mode active on Mobile. If you encounter frame rate drops, reload and choose Mobile Mode."
      });
    }
  };

  if (exploreMode) {
    return <GalaxyExplorer onClose={() => setExploreMode(false)} theme={theme} deviceMode={deviceMode} />;
  }

  return (
    <main 
      className="relative w-full min-h-screen bg-black text-white overflow-x-hidden transition-all duration-500"
      style={{
        "--theme-accent": THEME_CONFIGS[theme].themeColor,
        "--theme-accent-glow": THEME_CONFIGS[theme].accentGlow,
        "--theme-border-color": THEME_CONFIGS[theme].accentBorderColor
      }}
    >
      <Hero theme={theme} onExplore={() => setExploreMode(true)} />
      <Capabilities theme={theme} />
      <Worlds theme={theme} />
      <Innovation theme={theme} />
      <PlanLaunch theme={theme} />
      <ThemeCustomizer activeTheme={theme} onChangeTheme={setTheme} />

      {/* Floating Dynamic Custom Glassmorphic Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] max-w-md w-11/12 text-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="liquid-glass-strong px-5 py-3 rounded-full border border-yellow-500/20 text-yellow-300 text-xs font-semibold tracking-wide shadow-xl inline-flex items-center gap-3 backdrop-blur-xl">
            <span className="text-sm">⚠️</span>
            <span className="text-left leading-normal">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="pointer-events-auto text-white/40 hover:text-white ml-2 text-[10px] font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* First-Load First Popup Device Selection Modal */}
      {deviceMode === null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-3xl px-4 animate-in fade-in duration-500">
          <div className="liquid-glass-strong p-8 md:p-10 rounded-[2.5rem] max-w-md w-full text-center border border-white/10 shadow-2xl flex flex-col gap-6 relative">
            
            {/* Decorative top orbit dot */}
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-400 text-xl font-heading animate-pulse">
              🪐
            </div>
            
            <div>
              <h2 className="font-heading italic text-3xl md:text-4xl text-white tracking-tight leading-none mb-2">
                Choose Your Journey
              </h2>
              <p className="text-[10px] font-mono tracking-[4px] text-white/40 uppercase select-none">
                System Telemetry Selection
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={() => handleDeviceSelection("pc")}
                className="w-full py-4 px-6 rounded-2xl bg-white text-black font-bold text-sm transition-all duration-300 hover:bg-white/90 active:scale-95 shadow-lg flex items-center justify-between border border-transparent"
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">💻</span>
                  <span className="text-left font-body">
                    <span className="block font-bold">Laptop / PC Viewer</span>
                    <span className="block text-[10px] text-black/50 font-medium leading-none mt-0.5">Full 4K Cinematic Experience</span>
                  </span>
                </span>
                <span className="text-xs font-bold text-black/60">➔</span>
              </button>

              <button
                onClick={() => handleDeviceSelection("mobile")}
                className="w-full py-4 px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all duration-300 active:scale-95 flex items-center justify-between"
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">📱</span>
                  <span className="text-left font-body">
                    <span className="block font-bold text-white/90">Mobile / Tablet Viewer</span>
                    <span className="block text-[10px] text-white/40 font-medium leading-none mt-0.5">Optimized 0-Lag Smooth Shading</span>
                  </span>
                </span>
                <span className="text-xs text-white/60 font-bold">➔</span>
              </button>
            </div>

            {/* Suggestions & Recommendations */}
            <div className="border-t border-white/5 pt-4 mt-2">
              <p className="text-[11px] text-cyan-300/80 font-medium font-body leading-relaxed">
                ✨ Suggestion: View on a laptop or desktop computer for the absolute best cinematic visual experience.
              </p>
            </div>
            
          </div>
        </div>
      )}
    </main>
  );
};

// Boot React Application
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
