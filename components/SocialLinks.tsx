
import React from 'react';
import { SocialData } from '../types';
import { FacebookIcon, InstagramIcon, TiktokIcon, YoutubeIcon } from './Icons';

interface SocialLinksProps {
  links: SocialData[];
}

export const SocialLinks: React.FC<SocialLinksProps> = ({ links }) => {
  const getIcon = (platform: string) => {
    switch (platform) {
      case 'Facebook': return <FacebookIcon className="w-5 h-5" />;
      case 'Instagram': return <InstagramIcon className="w-5 h-5" />;
      case 'TikTok': return <TiktokIcon className="w-5 h-5" />;
      case 'YouTube': return <YoutubeIcon className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="flex justify-center items-center gap-6 mt-6 mb-8 py-4 border-t border-slate-800/50 w-full animate-fade-in">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
          aria-label={link.platform}
        >
          {getIcon(link.platform)}
        </a>
      ))}
    </div>
  );
};
