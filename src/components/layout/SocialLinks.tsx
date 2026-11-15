import { Code2, Github, Linkedin, Mail } from 'lucide-react';
import { PROFILE_LINKS, PUBLIC_EMAIL } from '../../lib/profile';
import './SocialLinks.css';

export default function SocialLinks() {
  const links = [
    { label: 'GitHub', href: PROFILE_LINKS.github, Icon: Github },
    { label: 'Email', href: `mailto:${PUBLIC_EMAIL}`, Icon: Mail },
    { label: 'LinkedIn', href: PROFILE_LINKS.linkedin, Icon: Linkedin },
    { label: 'LeetCode', href: PROFILE_LINKS.leetcode, Icon: Code2 },
  ];

  return (
    <nav className="social-links" aria-label="Social profiles">
      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          target={label === 'Email' ? undefined : '_blank'}
          rel={label === 'Email' ? undefined : 'noopener noreferrer'}
        >
          <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
          <span className="social-tooltip" aria-hidden="true">
            {label}
          </span>
        </a>
      ))}
    </nav>
  );
}
