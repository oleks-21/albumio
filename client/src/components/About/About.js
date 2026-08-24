import React from "react";
import "./About.css";

export default function About() {
  return (
    <div className="about-container">
      <div className="about-card">
        <h1 className="about-title">About This Project</h1>
        <p className="about-text">
          This project is a simple image management and slideshow application.
          It allows users to select, save, and organize images into presets,
          and view them in a fullscreen slideshow with smooth transitions.
        </p>

        <p className="about-text">
          The app is built with <strong>React</strong> and <strong>Material-UI</strong> for 
          a modern responsive design, with Google Sheets integration to store
          presets and ImageKit for image handling.
        </p>

        <p className="about-text">
          Features include:
        </p>
        <ul className="about-list">
          <li>Preset creation and management</li>
          <li>Image selection and organization</li>
          <li>Fullscreen slideshow with auto-play</li>
          <li>Smooth fade-in/fade-out controls</li>
        </ul>

        <p className="about-footer">
          Developed by in {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
