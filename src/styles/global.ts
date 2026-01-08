import { Platform } from 'react-native';

// Global styles for web platform
export const globalStyles = Platform.OS === 'web' ? `
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }

  /* Focus styles for accessibility */
  *:focus-visible {
    outline: 2px solid #3949ab;
    outline-offset: 2px;
  }

  /* Custom scrollbar for web */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }

  /* Dark mode scrollbar */
  @media (prefers-color-scheme: dark) {
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }

    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  /* Selection styles */
  ::selection {
    background: rgba(57, 73, 171, 0.3);
    color: inherit;
  }

  /* Container queries support (if available) */
  @container (min-width: 768px) {
    .responsive-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
  }

  @container (min-width: 1024px) {
    .responsive-container {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* Print styles */
  @media print {
    * {
      background: white !important;
      color: black !important;
    }
  }
` : '';

// Inject global styles on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = globalStyles;
  document.head.appendChild(styleElement);
}
