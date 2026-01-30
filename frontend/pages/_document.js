import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                {/* Favicon - Using logo-icon.png */}
                <link rel="icon" href="/assets/images/logo-icon.png" type="image/png" />
                <link rel="shortcut icon" href="/assets/images/logo-icon.png" type="image/png" />
                <link rel="apple-touch-icon" href="/assets/images/logo-icon.png" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
