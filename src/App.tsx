import React, { useState, useEffect, useMemo } from 'react';
import { Download } from 'lucide-react';
import { CopyLinkIcon, CheckIcon } from './components/SectionIcons';
import { UserConfig } from './types/magnetio';
import { DEFAULT_USER_CONFIG, encodeConfig, decodeConfig } from './utils/configEncoder';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AddonConfigForm } from './components/AddonConfigForm';
import { BottomInstallSection } from './components/BottomInstallSection';

export default function App() {
  const [config, setConfig] = useState<UserConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        // 1. Try reading from pathname (e.g. /:token/configure or /:token)
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0 && pathSegments[0] !== 'configure' && pathSegments[0] !== 'api') {
          const decoded = decodeConfig(pathSegments[0]);
          if (decoded && decoded.version) return decoded;
        }

        // 2. Try reading from hash (e.g. #/configure/:token or #:token)
        if (window.location.hash.length > 2) {
          const token = window.location.hash.replace('#/configure/', '').replace('#', '');
          if (token) {
            const decoded = decodeConfig(token);
            if (decoded && decoded.version) return decoded;
          }
        }
      } catch (e) {
        console.warn('Could not parse initial config from URL', e);
      }
    }
    return DEFAULT_USER_CONFIG;
  });

  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Compute active config token & Stremio manifest URLs
  const configToken = useMemo(() => encodeConfig(config), [config]);

  const manifestUrl = useMemo(() => {
    const base = origin || 'https://magnetio.addon';
    return `${base}/${configToken}/manifest.json`;
  }, [origin, configToken]);

  const stremioDeepLink = useMemo(() => {
    // Stremio deep link protocol strips https:// and replaces with stremio://
    const cleanUrl = manifestUrl.replace(/^https?:\/\//, '');
    return `stremio://${cleanUrl}`;
  }, [manifestUrl]);

  // Update hash for easy bookmarking without reload (debounced to avoid any browser scroll jumps)
  useEffect(() => {
    if (typeof window !== 'undefined' && configToken) {
      const timer = setTimeout(() => {
        const targetHash = `#/configure/${configToken}`;
        if (window.location.hash !== targetHash) {
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${targetHash}`);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [configToken]);

  const [showFloatingInstall, setShowFloatingInstall] = useState(false);

  // Monitor scroll position to show a sleek floating quick-install bar when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 380;
      const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 320;
      setShowFloatingInstall(scrolled && !nearBottom);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(manifestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#FFFFFF] flex flex-col selection:bg-[#5B6EF5]/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Hero Header */}
      <Hero />

      {/* Main Configurator Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-7">
        {/* 7-Step Configuration Form */}
        <AddonConfigForm
          config={config}
          onChange={(updated) => setConfig(updated)}
        />

        {/* Bottom Manifest Input Field & Action Buttons */}
        <BottomInstallSection
          manifestUrl={manifestUrl}
          stremioDeepLink={stremioDeepLink}
          onCopyUrl={handleCopyUrl}
          copied={copied}
        />
      </main>

      {/* Quick Action Floating Bar when scrolled down */}
      {showFloatingInstall && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 p-1.5 rounded-full bg-[#161616]/90 backdrop-blur-xl border border-white/[0.14] shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex items-center gap-2 max-w-[calc(100vw-24px)] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <a
            href={stremioDeepLink}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#5B6EF5] hover:bg-[#4d60e6] text-white font-medium text-xs sm:text-sm transition-all active:scale-[0.98] shadow-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Install in Stremio</span>
          </a>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#222222] hover:bg-[#2a2a2a] border border-white/[0.12] text-[#FFFFFF] font-medium text-xs sm:text-sm transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            {copied ? (
              <>
                <CheckIcon size={18} className="text-[#FFFFFF] shrink-0" />
                <span className="text-[#FFFFFF]">Copied</span>
              </>
            ) : (
              <>
                <CopyLinkIcon size={18} className="text-[#C1C1C1] shrink-0" />
                <span>Copy Manifest</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 px-4 py-2.5 rounded-full bg-[#222222] border border-white/[0.16] shadow-2xl text-xs font-medium text-[#FFFFFF] flex items-center gap-2 max-w-[calc(100vw-32px)] truncate animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <span className="w-2 h-2 rounded-full bg-[#5B6EF5] animate-pulse shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Footer - Quiet Apple / Duck style */}
      <footer className="border-t border-white/[0.06] bg-[#0B0B0B] py-8 px-4 sm:px-6 text-xs text-[#C1C1C1]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-normal text-[#FFFFFF]">Magnetio</span>
            <span className="text-white/20">•</span>
            <span>Unified Stremio Addon Aggregator</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#C1C1C1]">
            <a
              href="https://stremio.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#5B6EF5] hover:underline transition-colors"
            >
              Official Stremio
            </a>
            <span className="text-white/15">|</span>
            <a
              href="https://stremio.github.io/stremio-addon-sdk/"
              target="_blank"
              rel="noreferrer"
              className="text-[#5B6EF5] hover:underline transition-colors"
            >
              Addon Protocol SDK
            </a>
            <span className="text-white/15">|</span>
            <button
              onClick={() => {
                setConfig(DEFAULT_USER_CONFIG);
                showToast('Configuration reset to defaults.');
              }}
              className="hover:text-[#FFFFFF] transition-colors cursor-pointer"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
