
import React, { useRef, useEffect, useState } from 'react';
import { ChannelData } from '../types';
import { TelegramIcon, AIIcon } from './Icons';
import { ArrowLeft, FolderOpen } from 'lucide-react';

interface ChannelCardProps {
  channel: ChannelData;
  index: number;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({ channel, index }) => {
  const textRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  let bgClass = "bg-sky-500/10";
  let iconClass = "w-5 h-5 drop-shadow-md";

  if (channel.iconType === 'ai') {
    bgClass = "bg-violet-500/10";
    iconClass = "w-5 h-5 text-violet-400";
  } else if (channel.isFolder) {
    bgClass = "bg-amber-500/10";
  }

  useEffect(() => {
    const measure = () => {
      if (textRef.current && containerRef.current) {
        if (textRef.current.scrollWidth > containerRef.current.clientWidth) {
          setShouldAnimate(true);
        } else {
          setShouldAnimate(false);
        }
      }
    };
    
    // Initial check and on resize
    const timeout = setTimeout(measure, 100);
    window.addEventListener('resize', measure);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', measure);
    };
  }, [channel.description]);

  return (
    <a
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-center p-2.5 bg-slate-800/40 border border-slate-700/50 rounded-xl mb-2 transition-all duration-300 hover:bg-slate-700/60 hover:scale-[1.01] hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/10 animate-slide-up overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Icon Container - Miniaturized */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center shadow-inner ${bgClass} z-10`}>
        {channel.iconType === 'ai' ? (
          <AIIcon className={iconClass} />
        ) : channel.isFolder ? (
           <FolderOpen className="w-4 h-4 text-amber-500" />
        ) : (
           <TelegramIcon className={iconClass} />
        )}
      </div>

      {/* Text Content */}
      <div className="flex-grow mr-2.5 text-right overflow-hidden relative z-10 w-full min-w-0">
        <h3 className="text-sm font-bold text-slate-100 group-hover:text-sky-400 transition-colors truncate leading-tight">
          {channel.name}
        </h3>
        
        {/* Conditional Scrolling Description Container */}
        <div className="w-full overflow-hidden h-3.5 relative mt-0.5" ref={containerRef}>
           <div 
             ref={textRef}
             className={`whitespace-nowrap text-[10px] text-slate-400 group-hover:text-slate-300 absolute right-0 ${shouldAnimate ? 'animate-marquee pl-4' : ''}`}
           >
              {channel.description}
           </div>
        </div>
      </div>

      {/* Action Arrow */}
      <div className="flex-shrink-0 opacity-50 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-300 z-10 pl-1">
        <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400" />
      </div>
      
      {/* Glossy Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </a>
  );
};
