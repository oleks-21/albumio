import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import Typography from '@mui/material/Typography';
import './MainPage.css';
import { tokens, gradients, cardSurface } from '../../theme';
import SectionContainer from '../common/SectionContainer';
import GradientHeading from '../common/GradientHeading';
import Reveal from '../common/Reveal';

// On-brand placeholder shown when a (hot-linked) remote image fails to load,
// so the landing page degrades gracefully instead of showing broken-image icons.
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#111827"/><stop offset="1" stop-color="#1f2937"/>' +
      '</linearGradient></defs>' +
      '<rect width="400" height="220" fill="url(#g)"/>' +
      '<text x="50%" y="50%" fill="#6366f1" font-family="Inter,Arial,sans-serif" ' +
      'font-size="14" text-anchor="middle" dominant-baseline="middle">Image unavailable</text>' +
    '</svg>'
  );

export default function MainPage() {
  const responsive = {
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
    tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
    mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
  };
  const albumImages = [
    'https://www.befunky.com/images/wp/wp-2023-05-Photo-Album-7.png?auto=avif,webp&format=jpg&width=944',
    'https://static.vecteezy.com/system/resources/thumbnails/071/840/363/small/modern-art-gallery-interior-showcases-vibrant-abstract-paintings-on-white-walls-with-a-blank-canvas-space-highlighting-a-contemporary-artistic-ambiance-photo.jpg',
    'https://static01.nyt.com/images/2019/04/10/technology/personaltech/10TECHTIP_TOP/10TECHTIP_TOP-superJumbo.jpg',
  ]
  const editingImages = [
    'https://www.breathingcolor.com/cdn/shop/articles/the-neglected-art-of-cropping-994454_1024x1024.jpg?v=1702700444',
    'https://greenwebpage.com/community/wp-content/uploads/2024/03/word-image-11067-8.png',
    'https://media.istockphoto.com/id/530721229/photo/35mm-movie-reel-and-scissors-for-the-final-cut.jpg?s=612x612&w=0&k=20&c=pvAQnzjZUX9KvN-JQYVw098A9PiWeM-a59wYGaqciSE=',
    'https://cdn.fstoppers.com/styles/large-16-9/s3/lead/2022/07/cover_1.jpg'
  ]
  const shareImages = [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBMAkzoyUo2BnKVAOrOxkpru3leOqfN54EPQ&s',
    'https://www.adobe.com/products/photoshop-lightroom/media_12b765fe058d34909326491b26b18b26515048029.png?width=750&format=png&optimize=medium',
    'https://media.istockphoto.com/id/1000173680/photo/business-people-are-exchanging-document.jpg?s=612x612&w=0&k=20&c=z0zd7r8guK5vAr6I5MzSf09nYrLu3utQSEE7-ZF-Nm8=',
    'https://www.ellisandco.co.uk/wp-content/uploads/2024/05/shutterstock_677561335.jpg'
  ]
  const sunsetImages = [
    'https://t3.ftcdn.net/jpg/03/23/43/70/360_F_323437030_50R1ab1yLRShdXtijImeTGdMtZtkfnPa.jpg',
    'https://images.unsplash.com/photo-1506138979136-a74b54936c90?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3Vuc2V0JTIwc2lsaG91ZXR0ZXxlbnwwfHwwfHx8MA%3D%3D',
    'https://i.etsystatic.com/13981758/r/il/bd9e50/1752425734/il_570xN.1752425734_dlnm.jpg',
    'https://ichef.bbci.co.uk/ace/standard/3840/cpsprodpb/4ee5/live/b0924ce0-596d-11ef-8a89-bbbee37e7303.jpg',
    'https://t4.ftcdn.net/jpg/01/93/74/95/360_F_193749563_BCjYurGfpZ88kmlb88kZqL8qnlS22jg4.jpg'
  ]

  // Feature cards (same image data as before, driven from one config)
  const features = [
    {
      images: albumImages,
      caption:
        'Store beautiful photos and display them later with the use of our respository tools. Retrieving and casting them on your TV, tablet, laptop etc. is quick, simple and convenient.'
    },
    {
      images: editingImages,
      caption:
        'Give a bold touch to your images using our edtiting software. Crop, combine and delete to create truly unique compositions.'
    },
    {
      images: shareImages,
      caption:
        'Memories are best shared - give others a chance to see your vignettes. Exchanges individual pictures and complete works to become inspired.'
    },
    {
      images: sunsetImages,
      caption:
        'Arrange your images by themes and display them in tandem with other similar pictures. Keep your albums sorted, as well as organized. Build up your personal collections now!'
    }
  ];

  return (
    <div>
      {/* Hero */}
      <Box
        component="section"
        sx={{ position: 'relative', overflow: 'hidden', pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 10 } }}
      >
        {/* Indigo glow behind the heading */}
        <Box aria-hidden className="hero-glow" />
        <SectionContainer sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Reveal>
            <GradientHeading
              variant="h1"
              component="h1"
              sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, pb: 2.5 }}
            >
              Create Your Own Albums
            </GradientHeading>
          </Reveal>
          <Reveal delay={150}>
            <Typography
              sx={{
                maxWidth: 720,
                mx: 'auto',
                color: tokens.mutedText,
                fontSize: { xs: '1.125rem', md: '1.25rem' },
                lineHeight: 1.5
              }}
            >
              This web service allows users to store images to view them later. Preview them and start a slideshow with your collections.
            </Typography>
          </Reveal>
        </SectionContainer>
      </Box>

      {/* Feature cards */}
      <Box component="section" sx={{ pb: { xs: 8, md: 14 } }}>
        <SectionContainer>
          <Box
            sx={{
              pt: { xs: 6, md: 10 },
              borderTop: '1px solid',
              borderImageSource: gradients.divider,
              borderImageSlice: 1
            }}
          >
            {/* Section header */}
            <Box sx={{ maxWidth: 720, mx: 'auto', textAlign: 'center', mb: { xs: 5, md: 8 } }}>
              <Reveal>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 1.5,
                    '&::before, &::after': {
                      content: '""',
                      height: '1px',
                      width: 32,
                      background: 'linear-gradient(to right, transparent, rgba(199,210,254,0.5))'
                    },
                    '&::after': {
                      background: 'linear-gradient(to left, transparent, rgba(199,210,254,0.5))'
                    }
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      backgroundImage: `linear-gradient(to right, ${tokens.indigo500}, ${tokens.indigo200})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      WebkitTextFillColor: 'transparent',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    Everything in one place
                  </Box>
                </Box>
                <GradientHeading
                  variant="h2"
                  sx={{ display: 'block', fontSize: { xs: '1.75rem', md: '2.5rem' }, pb: 1.5 }}
                >
                  Built for your memories
                </GradientHeading>
                <Typography sx={{ color: tokens.mutedText, fontSize: '1.125rem', lineHeight: 1.5 }}>
                  Store, edit, share and relive your photos — organized into collections and ready for a fullscreen slideshow whenever you are.
                </Typography>
              </Reveal>
            </Box>

            {/* Cards */}
            <Grid container spacing={4}>
              {features.map((feature, i) => (
                <Grid size={{ xs: 12, md: 6 }} key={i}>
                  <Reveal delay={(i % 2) * 150}>
                    <Box sx={{ ...cardSurface, p: 2, height: '100%' }}>
                      <Box sx={{ borderRadius: '10px', overflow: 'hidden', backgroundColor: tokens.gray950 }}>
                        <Carousel
                          responsive={responsive}
                          infinite
                          autoPlay
                          autoPlaySpeed={3000}
                          arrows={false}
                          showDots={false}
                          containerClass="carousel-container"
                          itemClass="carousel-item-padding"
                        >
                          {feature.images.map((url) => (
                            <div key={url}>
                              <img
                                src={url}
                                alt=""
                                width={400}
                                height={220}
                                loading="lazy"
                                onError={(e) => {
                                  // Swap once to the placeholder; guard against loops.
                                  if (e.currentTarget.dataset.fallback) return;
                                  e.currentTarget.dataset.fallback = 'true';
                                  e.currentTarget.src = FALLBACK_IMAGE;
                                }}
                                style={{
                                  width: '100%',
                                  height: '220px',
                                  objectFit: 'cover',
                                  display: 'block'
                                }}
                              />
                            </div>
                          ))}
                        </Carousel>
                      </Box>
                      <Typography
                        variant="body1"
                        sx={{ mt: 2, px: 0.5, color: tokens.mutedText, textAlign: 'left', lineHeight: 1.5 }}
                      >
                        {feature.caption}
                      </Typography>
                    </Box>
                  </Reveal>
                </Grid>
              ))}
            </Grid>
          </Box>
        </SectionContainer>
      </Box>
    </div>
  );
}
