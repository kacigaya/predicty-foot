import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, THEME_STORAGE_KEY } from "@/app/site";

const description = "Cookies and localStorage in Predicty Foot: the theme preference and how to clear site data.";

export const metadata: Metadata = {
  title: "Cookie policy",
  description,
  alternates: { canonical: "/cookies" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `Cookie policy · ${SITE_NAME}`,
    description,
    url: "/cookies",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${SITE_NAME} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Cookie policy · ${SITE_NAME}`,
    description,
    images: ["/og.png"],
  },
};

export default function CookiesPage() {
  return (
    <>
      <header>
        <h1>Cookie policy</h1>
        <p className="mt-3 font-mono text-xs">Last updated: <time dateTime="2026-10-01">1 October 2026</time></p>
        <p className="mt-5">
          Predicty Foot does not set application cookies or use analytics or advertising
          trackers. It uses localStorage for the one feature described below.
        </p>
      </header>

      <section>
        <h2>Cookies and localStorage</h2>
        <p>
          Cookies can be sent with browser requests. localStorage stays in your browser
          and is read by the site&apos;s JavaScript. Unlike cookies, it is not automatically
          sent to our server with each request.
        </p>
      </section>

      <section>
        <h2>Theme preference</h2>
        <p>
          When you toggle the theme, <code className="break-all font-mono text-xs">{THEME_STORAGE_KEY}</code>
          {" "}stores either &quot;light&quot; or &quot;dark&quot;. This lets the site apply your choice
          on later visits. It has no automatic expiry and remains until you clear the
          site&apos;s storage. Before you choose a theme, the app follows your system setting.
        </p>
      </section>

      <section>
        <h2>Former crest cache</h2>
        <p>
          Earlier versions cached club crest lookups under keys beginning with
          {" "}<code className="break-all font-mono text-xs">predicty_foot_crests_v</code>. Crests
          now ship with the site, so the app no longer reads or writes these keys and
          deletes them on your next visit. Images and other site resources may still be
          held in your browser&apos;s normal HTTP cache.
        </p>
      </section>

      <section>
        <h2>Manage stored data</h2>
        <p>
          Open your browser&apos;s privacy or site settings, find this site, and clear its
          site data to remove localStorage values. Clear cached files too if you want
          to remove downloaded images and resources.
        </p>
        <p>
          Clearing storage resets your theme to the system preference. Blocking storage
          still lets you use the app, but your theme choice will not persist between
          visits.
        </p>
        <p>
          For server requests and service providers, read the <Link href="/privacy">privacy policy</Link>.
        </p>
      </section>
    </>
  );
}
