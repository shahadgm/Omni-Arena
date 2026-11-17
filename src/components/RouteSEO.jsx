import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_METADATA = {
  '/': {
    title: 'Omni Arena | Official Website — Free Online Typing, Map Quiz & Puzzles',
    description: 'Welcome to the official Omni Arena website. Compete in live multiplayer speed typing sprints, interactive geography map quizzes, crossword puzzles, and logic games free online.'
  },
  '/geography': {
    title: 'Interactive India & World Map Geography Quiz — Omni Arena',
    description: 'Test geography skills on Omni Arena. Interactive map quizzes covering Indian states, 60+ major cities, heritage monuments, and global capitals. Play free online!'
  },
  '/typing': {
    title: 'Speed Typing Competition Online — Omni Arena Official',
    description: 'Race in real-time speed typing sprints on the official Omni Arena platform. English, Arabic, and Nastaliq Urdu tests with live WPM tracking and anti-cheat.'
  },
  '/puzzles': {
    title: 'Daily Online Crosswords, Sudoku & Logic Puzzles — Omni Arena',
    description: 'Solve free daily crossword grids, 9x9 Sudoku challenges, and Nonogram picture logic games on the official Omni Arena platform.'
  },
  '/dashboard': {
    title: 'Competitions & Tournament Dashboard — Omni Arena',
    description: 'Browse active speed typing sprints, map geography challenges, crosswords, and logic puzzle competitions on Omni Arena.'
  },
  '/history': {
    title: 'Player History & Personal Bests — Omni Arena',
    description: 'Review your past tournament scores, typing WPM speed progression, accuracy metrics, and completed challenges on Omni Arena.'
  },
  '/feedback': {
    title: 'Community Feedback & Feature Requests — Omni Arena',
    description: 'Share suggestions, report bugs, and vote on upcoming features for Omni Arena educational and esports competitions.'
  },
  '/tournament/create': {
    title: 'Host New Tournament (PIN Access) — Omni Arena',
    description: 'Create private or public competition rooms with instant PIN codes, custom question sets, and live Olympic podiums on Omni Arena.'
  },
  '/admin/dashboard': {
    title: 'Organizer Management Portal — Omni Arena',
    description: 'Administer tournaments, review candidate scores, and configure custom arena challenges on the official Omni Arena platform.'
  }
};

/**
 * RouteSEO automatically syncs document.title, canonical URL, description meta tag,
 * and Open Graph / Twitter Card tags as users and search crawlers navigate routes in the SPA.
 */
export default function RouteSEO() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    let meta = ROUTE_METADATA[pathname];

    if (!meta) {
      if (pathname.startsWith('/arena/')) {
        meta = {
          title: 'Live Arena Match — Omni Arena',
          description: 'Compete in this live challenge arena on the official Omni Arena platform. Test your speed, accuracy, and knowledge now!'
        };
      } else if (pathname.startsWith('/leaderboard/')) {
        meta = {
          title: 'Tournament Leaderboard & Podium — Omni Arena',
          description: 'Real-time standings, fastest finish times, accuracy rankings, and medal winners on Omni Arena.'
        };
      } else {
        meta = ROUTE_METADATA['/'];
      }
    }

    if (meta?.title) {
      document.title = meta.title;

      // Update Open Graph and Twitter titles
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', meta.title);

      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute('content', meta.title);
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

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', meta.description);

      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute('content', meta.description);
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

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', fullCanonical);

    const twUrl = document.querySelector('meta[name="twitter:url"]');
    if (twUrl) twUrl.setAttribute('content', fullCanonical);
  }, [location.pathname]);

  return null;
}
