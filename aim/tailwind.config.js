/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ── Authentic Windows-XP / AIM-2000s palette ──────────────────
      colors: {
        // Classic Windows "3D" control surface
        win: {
          face: '#ece9d8',   // button / window face (XP tan-gray)
          light: '#ffffff',  // top-left bevel highlight
          shadow: '#808080',  // bottom-right bevel shadow
          dark: '#404040',   // deep bevel shadow
          frame: '#0a246a',  // active title-bar frame blue
        },
        // AIM buddy-list running-man yellow + status colors
        aim: {
          yellow: '#ffcc00',
          blue: '#245edb',      // XP start-button blue-gradient base
          bluetop: '#3f8cf3',   // gradient top
          bluebot: '#0a41c4',   // gradient bottom
          green: '#22b14c',     // Trusted / online
          amber: '#e8b000',     // Review
          orange: '#e07000',    // Probation
          red: '#c1272d',       // Blocked / revoked
          gray: '#9a9a9a',      // Offline
        },
        // Yahoo-yellow-pages / marquee accents
        retro: {
          desktop: '#3a6ea5',   // classic teal-blue desktop
          teal: '#008080',      // Win95 desktop teal
        },
      },
      fontFamily: {
        // MS Sans Serif / Tahoma stack
        sans: ['Tahoma', '"MS Sans Serif"', 'Geneva', 'Verdana', 'sans-serif'],
        pixel: ['"MS Sans Serif"', 'Tahoma', 'monospace'],
      },
      fontSize: {
        xxs: '10px',
        xs: '11px',
        sm: '12px',
      },
      borderRadius: {
        // Y2K UI has essentially zero rounded corners
        none: '0',
      },
      boxShadow: {
        // 3D beveled "raised" button (light top-left, dark bottom-right)
        'btn-out': 'inset -1px -1px 0 0 #404040, inset 1px 1px 0 0 #ffffff, inset -2px -2px 0 0 #808080, inset 2px 2px 0 0 #dfdfdf',
        // 3D "pressed" button
        'btn-in': 'inset 1px 1px 0 0 #404040, inset -1px -1px 0 0 #ffffff, inset 2px 2px 0 0 #808080, inset -2px -2px 0 0 #dfdfdf',
        // Sunken inset panel (text fields / list boxes)
        'sunken': 'inset -1px -1px 0 0 #ffffff, inset 1px 1px 0 0 #808080, inset -2px -2px 0 0 #dfdfdf, inset 2px 2px 0 0 #404040',
        // Raised window / group panel
        'raised': '-1px -1px 0 0 #808080, 1px 1px 0 0 #ffffff, inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
        // Window drop shadow
        'window': '2px 2px 6px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'title-active': 'linear-gradient(180deg, #0a41c4 0%, #245edb 50%, #3f8cf3 100%)',
        'title-inactive': 'linear-gradient(180deg, #7a7a7a 0%, #9a9a9a 100%)',
        'desktop': 'linear-gradient(180deg, #5a8fd6 0%, #3a6ea5 100%)',
      },
    },
  },
  plugins: [],
};
