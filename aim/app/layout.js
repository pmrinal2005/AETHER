import './globals.css';

export const metadata = {
  title: 'A.I.M. — Agent Instant Messenger & Identity Manager',
  description:
    'W3C DID + Verifiable Credential Agent Passport, Trust Score & Revocation infrastructure — "The Switzerland of Agent Trust, dressed as your old Buddy List."',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
