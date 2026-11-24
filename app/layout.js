import './globals.css';

export const metadata = {
  title: 'RWA Pulse',
  description: 'Tokenized funds and real-world assets across markets',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
