import React, { useEffect, useState, useRef } from 'react';
import Carousel from "react-multi-carousel";
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import IconButton from '@mui/material/IconButton';
import { tokens } from '../../theme';
import './Slideshow.css';

export default function Slideshow({ images, onClose }) {
    const [active, setActive] = useState(true);
    const [autoPlay, setAutoPlay] = useState(false);
    const [interval, setInterval] = useState(5000); // default 5s
    const inactivityTimer = useRef(null);
    const carouselContainerRef = useRef(null);
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const resetInactivityTimer = () => {
        setActive(true);
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
            setActive(false);
        }, 2000); // 2 seconds inactivity = hide
    };

    const responsive = {
        desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
        tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
        mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
    };

    return (
        <div
            className="slideshow-overlay"
            onClick={onClose}
            onMouseMove={resetInactivityTimer}
        >
            <div className="slideshow-content" onClick={(e) => e.stopPropagation()}>

                <div className={`slideshow-menu ${active ? 'visible' : 'hidden'}`}>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{
                            width: "5em",
                            // Playing = muted/dark (Stop); idle = indigo primary (Start)
                            ...(autoPlay
                                ? { backgroundImage: 'none', backgroundColor: tokens.gray700, color: tokens.gray100, '&:hover': { backgroundColor: tokens.gray600 } }
                                : {}),
                        }}
                        onClick={() => {
                            setAutoPlay(!autoPlay);

                            // Force focus on carousel container
                            if (carouselContainerRef.current) {
                                carouselContainerRef.current.focus();
                            }
                        }}
                    >
                        {autoPlay ? "Stop" : "Start"}
                    </Button>


                    <div className="interval-control">
                        <div>
                            <label>Interval: {interval / 1000}s</label>
                        </div>
                        <Slider
                            min={2000}
                            max={15000}
                            step={1000}
                            value={interval}
                            onChange={(e, val) => setInterval(val)}
                            sx={{
                                width: "80%",
                                ml: 2,
                                color: tokens.indigo500,
                                '& .MuiSlider-thumb': {
                                    backgroundColor: tokens.indigo300,
                                },
                                '& .MuiSlider-rail': {
                                    backgroundColor: tokens.gray700,
                                },
                            }}
                        />
                    </div>
                </div>

                {/* --- CLOSE BUTTON --- */}
                <IconButton
                    onClick={onClose}
                    aria-label="Close slideshow"
                    className={`slideshow-close-button ${active ? 'visible' : 'hidden'}`}
                    sx={{
                        width: '32px !important',
                        height: '32px !important',
                        fontSize: '0.75rem',
                        color: tokens.gray200,
                        backgroundColor: tokens.gray800,
                        border: `1px solid ${tokens.gray700}`,
                        '&:hover': {
                            backgroundColor: tokens.gray700,
                        },
                    }}
                >
                    ✕
                </IconButton>

                {/* --- CAROUSEL --- */}
                <div
                    ref={carouselContainerRef}
                    tabIndex={-1} // makes it programmatically focusable
                    style={{ outline: 'none' }} // prevent focus ring
                >
                    <Carousel
                        responsive={responsive}
                        autoPlay={autoPlay}
                        autoPlaySpeed={interval}
                        pauseOnHover={false}
                        className="slideshow-carousel"
                        shouldResetAutoplay
                        infinite
                        arrows
                        renderButtonGroupOutside
                        customLeftArrow={
                            <button className={`custom-arrow left ${active ? 'visible' : 'hidden'}`}>
                                ‹
                            </button>
                        }
                        customRightArrow={
                            <button className={`custom-arrow right ${active ? 'visible' : 'hidden'}`}>
                                ›
                            </button>
                        }
                    >
                        {images.map((img, index) => (
                            <div key={index} className="slideshow-image-container">
                                <img src={img.url} alt={`slideshow-${index}`} />
                            </div>
                        ))}
                    </Carousel>
                </div>

            </div>
        </div>
    );
}
