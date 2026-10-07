import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import './MainPage.css';
import { tokens, fonts } from '../../theme';
import SectionContainer from '../common/SectionContainer';
import Reveal from '../common/Reveal';
import BrandMark from '../common/BrandMark';
import { useResolvedScheme } from '../common/ColorModeToggle';

const IMG = `${process.env.PUBLIC_URL}/images`;

// White button on the turquoise-to-blue band, in both color schemes.
const ctaButtonSx = { flexShrink: 0, bgcolor: '#FFFFFF', color: '#0E2A35', '&:hover': { bgcolor: '#EAF6FD' } };

const STEPS = [
  {
    title: 'Add photos',
    text: 'Choose a batch of photos, give them a collection name, and watch each one upload.',
    image: (scheme) => `${IMG}/walkthrough/add-photos-${scheme}.jpg`,
    alt: 'The Albumio upload dialog with three chosen photos and a collection name filled in',
  },
  {
    title: 'Organize collections',
    text: 'Filter by collection, search by name, and rename or re-file any photo from its viewer.',
    image: (scheme) => `${IMG}/walkthrough/organize-${scheme}.jpg`,
    alt: 'The Albumio library showing a collections sidebar beside a grid of photos',
  },
  {
    title: 'Enjoy a slideshow',
    text: 'Play every photo, a few collections, or a saved selection full screen at your own pace.',
    // The slideshow is dark in both color schemes.
    image: () => `${IMG}/walkthrough/slideshow.jpg`,
    alt: 'An Albumio slideshow showing one photo on a dark stage with playback controls',
  },
];

const GALLERY = [
  { src: 'fjord.jpg', alt: 'A deep blue fjord between steep cliffs', w: 1000, h: 667, className: 'home-gallery__item--big' },
  { src: 'harbour-lane.jpg', alt: 'A narrow stone lane opening onto the sea', w: 800, h: 1200, className: 'home-gallery__item--tall' },
  { src: 'fawn.jpg', alt: 'A young deer in a sunlit forest', w: 800, h: 1200, className: 'home-gallery__item--tall' },
  { src: 'valley.jpg', alt: 'Sunlit pines in a valley under granite walls', w: 1000, h: 667 },
  { src: 'jetty.jpg', alt: 'A wooden jetty leading to a pavilion over calm water', w: 800, h: 541 },
  { src: 'coastline.jpg', alt: 'Turquoise sea below pale sandstone cliffs', w: 1000, h: 667, className: 'home-gallery__item--wide' },
];

export default function MainPage({ onOpenAuth }) {
  const isLoggedIn = useSelector(state => state.user.isLoggedIn);
  const location = useLocation();
  // Product screenshots match the color scheme on screen.
  const { resolved: scheme } = useResolvedScheme();

  // Honour /#how-it-works links from the header and other pages.
  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ block: 'start' });
  }, [location.hash]);

  const primaryAction = isLoggedIn ? (
    <Button variant="contained" size="large" component={RouterLink} to="/album_display">
      Open your library
    </Button>
  ) : (
    <Button variant="contained" size="large" onClick={() => onOpenAuth?.('register')}>
      Create your gallery
    </Button>
  );

  return (
    <div className="home">
      {/* Hero */}
      <Box component="section" aria-labelledby="home-title" sx={{ pt: { xs: 3, md: 8 }, pb: { xs: 7, md: 12 }, background: `linear-gradient(180deg, ${tokens.skySoft} 0%, ${tokens.page} 100%)` }}>
        <SectionContainer>
          <div className="home-hero">
            <div className="home-hero__copy">
              <Typography
                component="p"
                sx={{ color: tokens.accent, fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.08em', textTransform: 'uppercase', mb: { xs: 1.5, md: 2 } }}
              >
                Your personal photo gallery
              </Typography>
              <Typography
                id="home-title"
                variant="h1"
                sx={{ fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3.5rem' }, mb: { xs: 1.5, md: 2.5 } }}
              >
                Your photos. Beautifully together.
              </Typography>
              <Typography sx={{ color: tokens.textSecondary, fontSize: { xs: '1rem', md: '1.1875rem' }, maxWidth: 480, mb: { xs: 2.5, md: 4 } }}>
                Organize your photos into collections, make a few edits, and enjoy them as a slideshow.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {primaryAction}
                <Button variant="outlined" size="large" href="#how-it-works" endIcon={<ArrowDownwardIcon />}>
                  See how it works
                </Button>
              </Box>
            </div>

            <div className="home-hero__art">
              <figure className="home-frame home-frame--main">
                <img
                  src={`${IMG}/samples/lake-canoe.jpg`}
                  alt="A person in a red jacket canoeing across a calm turquoise lake"
                  width={1600}
                  height={1067}
                  fetchPriority="high"
                />
              </figure>
              <figure className="home-frame home-frame--small home-frame--a">
                <img
                  src={`${IMG}/samples/beach-walk.jpg`}
                  alt="A parent carrying a small child along a sandy beach"
                  width={800}
                  height={533}
                />
              </figure>
              <figure className="home-frame home-frame--small home-frame--b">
                <img
                  src={`${IMG}/samples/blanket-pug.jpg`}
                  alt="A pug wrapped in a checked blanket on a forest path"
                  width={800}
                  height={533}
                />
              </figure>
              <p className="home-hero__label" aria-hidden="true">
                <span className="home-hero__label-dot" />
                Lake weekend
              </p>
            </div>
          </div>
        </SectionContainer>
      </Box>

      {/* Walkthrough */}
      <Box
        component="section"
        id="how-it-works"
        aria-labelledby="how-title"
        sx={{ py: { xs: 7, md: 12 }, backgroundColor: tokens.surface, borderTop: `1px solid ${tokens.border}`, borderBottom: `1px solid ${tokens.border}` }}
      >
        <SectionContainer>
          <Reveal>
            <Typography id="how-title" variant="h2" sx={{ fontSize: { xs: '1.875rem', md: '2.5rem' }, mb: 1.5 }}>
              How Albumio works
            </Typography>
            <Typography sx={{ color: tokens.textSecondary, maxWidth: 560, mb: { xs: 4, md: 6 } }}>
              Three steps from a folder of pictures to an evening of looking back.
            </Typography>
          </Reveal>
          <ol className="home-steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="home-steps__item">
                <Reveal delay={i * 100}>
                  <div className="home-steps__shot">
                    <img src={step.image(scheme)} alt={step.alt} width={1200} height={900} loading="lazy" />
                  </div>
                  <Typography variant="h3" component="h3" sx={{ fontSize: '1.25rem', mt: 2.5, mb: 0.75, display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Box component="span" sx={{ fontFamily: fonts.serif, fontWeight: 400, color: tokens.accent }}>{i + 1}.</Box>
                    {step.title}
                  </Typography>
                  <Typography sx={{ color: tokens.textSecondary }}>{step.text}</Typography>
                </Reveal>
              </li>
            ))}
          </ol>
        </SectionContainer>
      </Box>

      {/* Sample gallery */}
      <Box component="section" aria-labelledby="gallery-title" sx={{ py: { xs: 7, md: 12 } }}>
        <SectionContainer>
          <Reveal>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, mb: { xs: 3, md: 5 } }}>
              <Box sx={{ maxWidth: 620 }}>
                <Typography id="gallery-title" variant="h2" sx={{ fontSize: { xs: '1.875rem', md: '2.5rem' }, mb: 1.5 }}>
                  Made for looking, not managing
                </Typography>
                <Typography sx={{ color: tokens.textSecondary }}>
                  Photos fill the page and open large. When one needs a touch-up, draw on it, crop it, or adjust its color without leaving your library.
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
                Sample collection · Coast &amp; forest
              </Typography>
            </Box>
          </Reveal>
          <div className="home-gallery">
            {GALLERY.map((photo) => (
              <figure key={photo.src} className={`home-gallery__item ${photo.className || ''}`}>
                <img src={`${IMG}/samples/${photo.src}`} alt={photo.alt} width={photo.w} height={photo.h} loading="lazy" />
              </figure>
            ))}
          </div>
        </SectionContainer>
      </Box>

      {/* Closing action */}
      <Box component="section" aria-labelledby="cta-title" sx={{ pb: { xs: 7, md: 12 } }}>
        <SectionContainer>
          <Box
            sx={{
              background: `linear-gradient(120deg, ${tokens.bandStart} 0%, ${tokens.bandEnd} 100%)`,
              color: '#FFFFFF',
              borderRadius: 4,
              px: { xs: 3, md: 8 },
              py: { xs: 5, md: 7 },
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 3,
            }}
          >
            <Box>
              <Typography id="cta-title" variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 1 }}>
                {isLoggedIn ? 'Your library is waiting.' : 'Start your gallery today.'}
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.88)' }}>
                {isLoggedIn
                  ? 'Pick up where you left off with your collections and saved slideshows.'
                  : 'Create an account, add a few photos, and play them back tonight.'}
              </Typography>
            </Box>
            {isLoggedIn ? (
              <Button variant="contained" size="large" component={RouterLink} to="/album_display" sx={ctaButtonSx}>
                Open your library
              </Button>
            ) : (
              <Button variant="contained" size="large" onClick={() => onOpenAuth?.('register')} sx={ctaButtonSx}>
                Create your gallery
              </Button>
            )}
          </Box>
        </SectionContainer>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ borderTop: `1px solid ${tokens.border}`, py: 4 }}>
        <SectionContainer sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <BrandMark size={24} />
          <Box component="nav" aria-label="Footer" sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, sm: 3 } }}>
            <Link href="#how-it-works" color="text.secondary" underline="hover">How it works</Link>
            <Link component={RouterLink} to="/about" color="text.secondary" underline="hover">About</Link>
            <Link href="https://unsplash.com/license" color="text.secondary" underline="hover" target="_blank" rel="noopener noreferrer">
              Sample photos via Unsplash
            </Link>
          </Box>
        </SectionContainer>
      </Box>
    </div>
  );
}
