import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

export const PrivacyPage = () => {
  return (
    <div className="pb-24 pt-12">
      <div className="container max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>

        <div className="border-b border-line pb-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent">
            <Lock className="h-4 w-4" />
            <span>Data Protection & Trust</span>
          </div>
          <h1 className="display-serif mt-3 text-display-lg font-semibold text-ink">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted">
            Effective Date: July 1, 2026 · Compliant with the Digital Personal Data Protection (DPDP) Act, 2023
          </p>
        </div>

        <div className="prose prose-neutral max-w-none mt-10 space-y-10 text-muted leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">1. Our Commitment to Your Privacy</h2>
            <p>
              Aurene (“we,” “us,” or “our”) is dedicated to safeguarding your personal data and respecting your individual privacy rights. This Privacy Policy details how we collect, process, store, encrypt, and protect your information when you interact with our auction platform, mobile views, and related services.
            </p>
            <p>
              We adhere strictly to the provisions of the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> of India, the Information Technology Act, 2000, and international data protection standards.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">2. Information We Collect</h2>
            <p>We only collect information strictly necessary to provide a secure and authentic auction experience:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Identity & Contact Information:</strong> Your full name, verified email address, phone number, and account avatar.
              </li>
              <li>
                <strong>Encrypted Payout Details:</strong> When linking a payout destination to sell or bid, we collect your bank account number, account holder name, and IFSC code. <em>Your bank account number is encrypted at rest using industry-standard AES-256-GCM encryption with a dedicated hardware-isolated key; only the last four digits are ever visible in the interface or logs.</em>
              </li>
              <li>
                <strong>Auction & Bidding Records:</strong> Immutable timestamps of your bids, auction creation details, settlement transactions, and wallet balance updates.
              </li>
              <li>
                <strong>Device & Network Data:</strong> IP address, device fingerprints, and browser user-agent collected solely for fraud mitigation, session security, and anti-sniping verification.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">3. Payment Information Security</h2>
            <div className="rounded-xl border border-line bg-subtle/50 p-5 space-y-2 text-sm text-ink">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <span>Zero Cardholder Data Stored on Aurene Servers</span>
              </div>
              <p className="text-muted text-xs leading-normal">
                All payment processing is handled directly by <strong>Razorpay</strong>, an RBI-licensed payment aggregator and PCI-DSS Level 1 compliant entity.
              </p>
            </div>
            <p>
              Aurene never receives, captures, or stores your credit card numbers, debit card numbers, expiration dates, or CVV codes. When checking out, transactions occur via Razorpay's end-to-end encrypted checkout modal. Our servers only receive cryptographically signed order tokens and webhook receipts confirming settlement.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">4. How We Use Your Information</h2>
            <p>We process your data exclusively for lawful purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Facilitating real-time bidding, anti-sniping countdowns, and auction resolution.</li>
              <li>Executing seller wallet payouts and ledger reconciliation.</li>
              <li>Sending transactional notifications (e.g. outbid alerts, winning notices, payment reminders).</li>
              <li>Preventing illegal activities including counterfeit garment distribution, money laundering, and shill bidding.</li>
              <li>Complying with statutory tax withholdings (TCS/GST) and regulatory accounting mandates.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">5. Data Sharing & Third-Party Processors</h2>
            <p>
              <strong>We do not sell, rent, or monetize your personal information to third-party advertisers or data brokers.</strong>
            </p>
            <p>Data is shared solely with trusted operational infrastructure partners under strict confidentiality agreements:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Razorpay:</strong> Payment processing and IFSC directory verification.</li>
              <li><strong>Neon & AWS:</strong> Encrypted cloud database hosting with automated backups and firewall protection.</li>
              <li><strong>Resend:</strong> Secure transactional email dispatch for authentication codes and receipt confirmations.</li>
              <li><strong>Courier Partners:</strong> Buyer delivery addresses are provided to the designated seller and logistics provider strictly to fulfill delivery.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">6. Security Architecture</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Argon2id Password Hashing:</strong> Passwords are hashed using the state-of-the-art Argon2id cryptographic algorithm with memory-hard parameters.
              </li>
              <li>
                <strong>Rotating Refresh Tokens:</strong> Authentication utilizes short-lived 15-minute access JWTs coupled with rotating HTTP-only refresh cookies that are hashed in our database.
              </li>
              <li>
                <strong>Transport Layer Security:</strong> All API communication is enforced over HTTPS with TLS 1.3 encryption.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">7. Your Rights under the DPDP Act</h2>
            <p>As a data principal, you have the following enforceable rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Right to Access:</strong> Request a copy of all personal data held about you by Aurene.</li>
              <li><strong>Right to Correction:</strong> Update or rectify incomplete, inaccurate, or outdated information.</li>
              <li><strong>Right to Erasure:</strong> Request the deletion of your account and personal data, subject to statutory retention requirements for financial and tax audits.</li>
              <li><strong>Right to Withdraw Consent:</strong> Revoke consent for discretionary marketing communications at any time.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">8. Grievance Redressal Officer</h2>
            <p>
              In accordance with the Information Technology Act, 2000, and the DPDP Act, 2023, the details of our appointed Grievance Officer are as follows:
            </p>
            <div className="rounded-xl border border-line bg-card p-5 space-y-1 text-sm text-ink">
              <div className="font-semibold">Grievance Redressal Officer</div>
              <div>Aurene Marketplace Private Limited</div>
              <div>Indiranagar, 100 Feet Road, Bengaluru, Karnataka 560038, India</div>
              <div>Email: <span className="font-mono text-accent">grievance@aurenefashions.in</span></div>
              <div className="text-xs text-muted mt-2">Response time: Within 48 business hours</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
