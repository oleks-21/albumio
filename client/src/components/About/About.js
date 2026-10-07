import { Link as RouterLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import "./About.css";

export default function About() {
  return (
    <div className="about">
      <article className="about__card">
        <h1 className="about__title">About Albumio</h1>
        <p>
          Albumio is a small personal photo gallery. Upload photos into named
          collections, browse and search them, and play any selection back as a
          slideshow.
        </p>
        <h2 className="about__subtitle">What you can do</h2>
        <ul>
          <li>Upload photos and group them into collections</li>
          <li>Search, sort and filter your library by collection</li>
          <li>Rename photos and move them between collections</li>
          <li>Draw on, crop and adjust the color of a photo</li>
          <li>Save a selection of photos as a slideshow and play it full screen</li>
        </ul>
        <h2 className="about__subtitle">How it’s built</h2>
        <p>
          The app is built with React and Material UI. Photos are stored with
          ImageKit, and account and saved-slideshow data is kept in Google Sheets.
        </p>
        <Button variant="contained" component={RouterLink} to="/" sx={{ mt: 2 }}>
          Back to home
        </Button>
      </article>
    </div>
  );
}
