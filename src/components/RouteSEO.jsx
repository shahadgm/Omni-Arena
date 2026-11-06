import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_METADATA = {
  '/': {
    title: 'OmniArena — Free Typing Contests, Map Quiz & Puzzles',
    description: 'Compete in live typing speed sprints, interactive India and world geography map challenges, crosswords, and logic puzzles on OmniArena. Join free today!'
  },
  '/dashboard': {
    title: 'Competitions Dashboard — OmniArena',
    description: 'Browse active typing sprints, map geography challenges, crosswords, and logic puzzle competitions on OmniArena.'
  },
  '/history': {
    title: 'My Competition History & Personal Bests — OmniArena',
    description: 'Review your past tournament scores, typing WPM speed progression, accuracy metrics, and completed challenges on OmniArena.'
  },
  '/feedback': {
    title: 'Community Feedback & Feature Requests — OmniArena',
    description: 'Share suggestions, report bugs, and vote on upcoming features for OmniArena educational competitions.'
  },
  '/tournament/create': {
    title: 'Host New Tournament — OmniArena',
    description: 'Create private or public competition rooms with instant PIN codes, custom question sets, and live podiums.'
  },
  '/admin/dashboard': {
    title: 'Organizer Management Portal — OmniArena',
    description: 'Administer tournaments, review candidate scores, and configure custom arena challenges.'
  }
};

/**
 * RouteSEO automatically syncs document.title, canonical URL, and description meta tag
 * as users and headless search crawlers navigate routes in the SPA.
 */
export default function RouteSEO() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    let meta = ROUTE_METADATA[pathname];

    if (!meta) {
      if (pathname.startsWith('/arena/')) {
        meta = {
          title: 'Live Arena Match — OmniArena',
          description: 'Compete in this live challenge arena on OmniArena. Test your speed, accuracy, and knowledge now!'
        };
      } else if (pathname.startsWith('/leaderboard/')) {
        meta = {
          title: 'Tournament Leaderboard & Podium — OmniArena',
          description: 'Real-time standings, fastest finish times, accuracy rankings, and medal winners on OmniArena.'
        };
      } else {
        meta = ROUTE_METADATA['/'];
      }
    }

    if (meta?.title) {
      document.title = meta.title;
    }

    // Update Meta Description
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.name = 'description';
      document.head.appendChild(descTag);
    }
    if (meta?.description) {
      descTag.setAttribute('content', meta.description);
    }

    // Update Canonical URL
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    const fullCanonical = `https://omni-arena.vercel.app${pathname === '/' ? '/' : pathname}`;
    canonicalTag.setAttribute('href', fullCanonical);
  }, [location.pathname]);

  return null;
}
