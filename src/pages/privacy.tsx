export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-slate-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">
        Last updated: May 22, 2026
      </p>

      <section className="space-y-4 mb-8">
        <p>
          This Privacy Policy explains how Cognivate (&ldquo;we&rdquo;,
          &ldquo;our&rdquo;) collects, uses, and protects information when
          you use the Cognivate application and website at{" "}
          <a href="https://cognivate.co" className="text-indigo-600 underline">
            cognivate.co
          </a>{" "}
          (collectively, the &ldquo;Service&rdquo;).
        </p>
      </section>

      <Section title="Information We Collect">
        <p>
          <strong>Account information.</strong> When you create an account we
          collect your email address and authentication credentials through our
          identity provider, Clerk. We do not store your password directly.
        </p>
        <p>
          <strong>Study materials you upload.</strong> Files you upload
          (PDFs, slides, notes, images, text) are stored in your private
          environment and used only to generate study materials for you.
        </p>
        <p>
          <strong>Generated content.</strong> Outlines, vocabulary, formulas,
          quizzes, practice problems, and tutor conversations created from your
          materials.
        </p>
        <p>
          <strong>Usage data.</strong> Basic telemetry such as feature usage,
          error logs, and device type to help us operate and improve the
          Service.
        </p>
      </Section>

      <Section title="How We Use Your Information">
        <ul className="list-disc pl-6 space-y-1">
          <li>To provide the Service and the features you use.</li>
          <li>
            To generate personalized study materials from content you upload.
          </li>
          <li>To authenticate you and keep your account secure.</li>
          <li>To diagnose issues and improve reliability and performance.</li>
          <li>To communicate with you about your account or the Service.</li>
        </ul>
      </Section>

      <Section title="Third-Party Services">
        <p>
          We use third-party services to operate Cognivate. These providers
          process your data on our behalf under their own privacy policies:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Clerk</strong> &ndash; authentication and user management.
          </li>
          <li>
            <strong>Anthropic</strong> &ndash; generating study content from your
            uploaded materials. Material you upload is sent to Anthropic
            (the maker of Claude) for analysis; Anthropic does not use
            this data to train its models when accessed through our API
            integration.
          </li>
          <li>
            <strong>Railway</strong> &ndash; application hosting and compute.
          </li>
          <li>
            <strong>Google Cloud Storage</strong> &ndash; storage of your
            uploaded files.
          </li>
          <li>
            <strong>Sentry</strong> &ndash; crash reporting and performance
            diagnostics.
          </li>
        </ul>
      </Section>

      <Section title="Data Retention">
        <p>
          We retain your account and study materials for as long as your
          account is active. You can delete individual study environments at
          any time. When you delete your account, we delete your data within
          30 days, except where retention is required for legal or audit
          purposes.
        </p>
      </Section>

      <Section title="Your Rights">
        <p>
          You have the right to access, correct, export, or delete your data.
          You can perform most of these actions from the Account screen in the
          app, or by contacting us at the email below.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Cognivate is not directed to children under 13. If you believe a
          child has provided us personal information, please contact us and we
          will delete the account.
        </p>
      </Section>

      <Section title="Security">
        <p>
          We use industry-standard measures to protect your data in transit
          (HTTPS) and at rest. No method of transmission or storage is 100%
          secure, but we work continuously to protect your information.
        </p>
      </Section>

      <Section title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will post
          changes here with a new &ldquo;Last updated&rdquo; date. Material
          changes will be communicated by email or in-app notice.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions or requests can be sent to{" "}
          <a
            href="mailto:support@cognivate.co"
            className="text-indigo-600 underline"
          >
            support@cognivate.co
          </a>
          .
        </p>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}
