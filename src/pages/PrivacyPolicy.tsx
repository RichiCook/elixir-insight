/**
 * Privacy Policy for the Classy Cocktails Digital Product Passport.
 *
 * IMPORTANT: This is a template. Before going live, have your legal counsel
 * review and complete the sections marked [TODO]. In particular:
 *   - Confirm the legal entity name and registered address
 *   - Confirm data retention periods
 *   - Add DPA references for Supabase and Google/Lovable AI
 *   - Add a contact email / DPO details
 */
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#fafaf8] px-6 py-12 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-normal text-[#2a2a2a] mb-2">Privacy Policy</h1>
      <p className="text-xs text-[#9a9a9a] mb-8">Last updated: May 2026</p>

      <div className="space-y-6 font-sans-consumer text-sm text-[#5a5a5a] leading-relaxed">

        <section>
          <h2 className="font-medium text-[#2a2a2a] mb-2">1. Who We Are</h2>
          <p>
            This Digital Product Passport is operated by <strong>Classy Cocktails</strong>{' '}
            [TODO: add legal entity name, registered address, and company number].
            We are the data controller for the personal data described in this policy.
          </p>
          <p className="mt-2">
            For data-related enquiries, contact us at:{' '}
            <a href="mailto:privacy@classycocktails.com" className="underline text-[#b8975a]">
              privacy@classycocktails.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-medium text-[#2a2a2a] mb-2">2. Data We Collect</h2>
          <p>When you interact with this product page we may collect:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Analytics data</strong> — page views, section interactions, language preference, browser type, referring URL. Collected only with your consent.</li>
            <li><strong>Lead data</strong> — name, email address, and/or phone number, if you choose to submit a promotional form. Collected only with your explicit consent.</li>
            <li><strong>Session identifier</strong> — a randomly generated ID stored in your browser session to link your interactions. Deleted when you close the tab.</li>
          </ul>
          <p className="mt-2">We do <strong>not</strong> collect precise location data, financial information, or data from minors under 18.</p>
        </section>

        <section>
          <h2 className="font-medium text-[#2a2a2a] mb-2">3. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Analytics</strong>: To understand how consumers engage with this product page and improve our content. Legal basis: consent (GDPR Art. 6(1)(a)).</li>
            <li><strong>Lead capture</strong>: To process your promotional entry and deliver any reward or follow-up communication you requested. Legal basis: consent (GDPR Art. 6(1)(a)).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-medium text-[#2a2a2a] mb-2">4. Data Processors</h2>
          <p>We use the following third-party processors. Each has a Data Processing Agreement with us:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Supabase Inc.</strong> (USA) — database and authentication hosting. Data transferred under Standard Contractual Clauses.</li>
            <li><strong>Google / Lovable AI</strong> — AI content generation for product descriptions. Admin-only; does not process consumer personal data.</li>
          </ul>
          <p className="mt-2">[TODO: complete sub-processor register]</p>
        </section>

        <section>
          <h2 className="font-medium text-[#2a2a2a] mb-2">5. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Analytics events (page views, interactions): deleted after 12 months.</li>
            <li>Lead capture submissions: deleted after 24 months, or sooner on request.</li>
            <li>Session identifiers: deleted when you close the browser tab.</li>
          </ul>
          <p className="mt-2">[TODO: confirm periods with legal counsel]</p>
        </section>

        <section>
          <h2 className="font-medium text-[#2a2a2a] mb-2">6. Your Rights</h2>
          <p>Under GDPR you have the right to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Access</strong> the personal data we hold about you.</li>
            <li><strong>Rectify</strong> inaccurate data.</li>
            <li><strong>Erase</strong> your data ("right to be forgotten").</li>
            <li><strong>Restrict</strong> or <strong>object</strong> to processing.</li>
            <li><strong>Data portability</strong> — receive your data in a machine-readable format.</li>
            <li><strong>Withdraw consent</strong> at any time without affecting the lawfulness of prior processing.</li>
            <li><strong>Lodge a complaint</strong> with your national supervisory authority (e.g. Garante Privacy in Italy, ICO in the UK).</li>
          </ul>
          <p className="mt-2">
            To exercise any right, email{' '}
            <a href="mailto:privacy@classycocktails.com" className="underline text-[#b8975a]">
              privacy@classycocktails.com
            </a>. We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-[#2a2a2a] mb-2">7. Cookies & Local Storage</h2>
          <p>This page uses browser local storage (not traditional cookies) for the following purposes:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>cc_tracking_consent</strong> — stores your analytics consent choice. Persists until cleared.</li>
            <li><strong>cc_session</strong> (session storage) — a temporary session ID for analytics. Deleted on tab close.</li>
            <li><strong>cc_age_verified</strong> (session storage) — records that you confirmed you are 18+. Deleted on tab close.</li>
          </ul>
          <p className="mt-2">No third-party tracking scripts or advertising cookies are used on this page.</p>
        </section>

        <section>
          <h2 className="font-medium text-[#2a2a2a] mb-2">8. Changes to This Policy</h2>
          <p>
            We may update this policy. The "Last updated" date at the top will reflect any changes.
            Continued use of this page after an update constitutes acceptance of the revised policy.
          </p>
        </section>

        <div className="pt-4 border-t border-[#e5e0d8]">
          <a href="javascript:history.back()" className="text-xs text-[#b8975a] underline">← Back</a>
        </div>
      </div>
    </div>
  );
}
