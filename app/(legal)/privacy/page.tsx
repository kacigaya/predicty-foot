import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/app/site";

const description = "How Predicty Foot handles browser storage, requests, and football data sent to its service providers.";

export const metadata: Metadata = {
  title: "Privacy policy",
  description,
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `Privacy policy · ${SITE_NAME}`,
    description,
    url: "/privacy",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${SITE_NAME} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Privacy policy · ${SITE_NAME}`,
    description,
    images: ["/og.png"],
  },
};

export default function PrivacyPage() {
  return (
    <>
      <header>
        <h1>Privacy policy</h1>
        <p className="mt-3 font-mono text-xs">Last updated: <time dateTime="2026-10-01">1 October 2026</time></p>
        <p className="mt-5">
          Predicty Foot is a football odds and prediction app maintained by Gaya Kaci.
          It has no user accounts, payment forms, analytics, or advertising trackers.
        </p>
      </header>

      <section>
        <h2>Information processed when you visit</h2>
        <p>
          Your browser sends technical information needed to serve the site, including
          your IP address, requested URL, and browser headers. The odds and team logo
          API routes and prediction requests use your IP address for rate limiting,
          with counters held in server memory during one-minute windows. Expired
          entries are removed once per window, or when the server restarts.
        </p>
        <p>
          The application logs service errors to help diagnose failures. Hosting and
          network services may also keep request or security logs. Their retention
          depends on the hosting configuration. Contact us for details about log
          retention or to make a data request.
        </p>
      </section>

      <section>
        <h2>Storage on your device</h2>
        <p>
          The app uses localStorage to remember your light or dark theme and cache
          club crest lookups. These values are not used to identify you or track
          activity across websites. See the <Link href="/cookies">cookie policy</Link>
          {" "}for storage contents, cache lifetimes, and removal instructions.
        </p>
      </section>

      <section>
        <h2>Football data and service providers</h2>
        <p>
          Our server requests fixture and bookmaker data from The Odds API. When you
          request a prediction, it sends fixture details, team names, kickoff time,
          event ID, and bookmaker odds to Google Gemini. The prediction prompt does
          not include your IP address, browser headers, or localStorage values.
          The server keeps each prediction in memory for up to 10 minutes and shows
          it to anyone who opens the same fixture; it is not linked to you.
          Provider API keys stay on the server.
        </p>
        <p>
          For clubs without a bundled crest, the server searches TheSportsDB using
          the team name. Crest images are served through this site&apos;s image optimizer.
          Fonts and bundled crests are served by this site.
        </p>
        <p>
          Providers process server requests under their own terms. Google&apos;s handling
          of prompts and responses depends on the service tier and region, as described
          in the <a href="https://ai.google.dev/gemini-api/terms">Gemini API terms</a>.
          Links to external websites take you to services with their own privacy policies.
        </p>
      </section>

      <section>
        <h2>Your choices and privacy questions</h2>
        <p>
          You can clear or block this site&apos;s browser storage through your browser
          settings. You can browse odds without requesting a Gemini prediction.
        </p>
        <p>
          For privacy questions or data requests, contact Gaya Kaci at
          {" "}<a className="break-all" href="mailto:contact@gaya.anonaddy.com">contact@gaya.anonaddy.com</a>.
          Do not post personal information in public issues.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          This page will be updated when the app&apos;s data handling changes.
          The date above identifies the latest revision.
        </p>
      </section>
    </>
  );
}
