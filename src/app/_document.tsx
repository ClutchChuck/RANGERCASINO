// pages/_document.tsx

import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" />

          {/* Meta Tags for SEO */}
          <meta name="description" content="Texas Ranger Casino is a leading decentralized casino DApp offering a range of exciting games and secure blockchain-based transactions." />
          <meta name="keywords" content="Texas Ranger Casino, decentralized casino, casino DApp, blockchain casino, gambling DApp, secure casino" />
          <meta name="author" content="Chuck Norris" />
          
          {/* Open Graph Meta Tags for Social Media */}
          <meta property="og:title" content="Texas Ranger Casino - Decentralized Casino DApp" />
          <meta property="og:description" content="Join Texas Ranger Casino for an unparalleled gambling experience with secure blockchain technology." />
          <meta property="og:image" content="https://yourdomain.com/path/to/og-image.jpg" />
          <meta property="og:url" content="https://yourdomain.com" />
          <meta property="og:type" content="website" />
          
          {/* Twitter Card Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Texas Ranger Casino - Decentralized Casino DApp" />
          <meta name="twitter:description" content="Experience secure and exciting gambling with Texas Ranger Casino's decentralized platform." />
          <meta name="twitter:image" content="https://yourdomain.com/path/to/twitter-image.jpg" />

          {/* Structured Data Markup */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Texas Ranger Casino",
            "url": "https://yourdomain.com",
            "logo": "https://yourdomain.com/logo.png",
            "sameAs": [
              "https://www.facebook.com/yourpage",
              "https://twitter.com/yourprofile",
              "https://www.linkedin.com/company/yourcompany"
            ]
          }
          `}} />

          {/* Link to Google Fonts */}
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" />

          {/* Inline CSS for basic styling */}
          <style>{`
            body {
              margin: 0;
              font-family: 'Roboto', sans-serif;
            }
            header, footer {
              text-align: center;
              padding: 1em;
              background: #222;
              color: #fff;
            }
            main {
              padding: 1em;
            }
            a {
              color: #0070f3;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
          `}</style>
        </Head>
        <body>
          <header>
            <h1>Welcome to Texas Ranger Casino</h1>
            <p>Your premier decentralized casino DApp</p>
          </header>
          <Main />
          <NextScript />
          <footer>
            <p>&copy; 2025 Texas Ranger Casino. All rights reserved.</p>
          </footer>
        </body>
      </Html>
    );
  }
}

export default MyDocument;