import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

export const TermsPage = () => {
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
            <FileText className="h-4 w-4" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="display-serif mt-3 text-display-lg font-semibold text-ink">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted">
            Effective Date: July 1, 2026 · Last updated: September 2026
          </p>
        </div>

        <div className="prose prose-neutral max-w-none mt-10 space-y-10 text-muted leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">1. Acceptance of Terms</h2>
            <p>
              Welcome to <strong>Aurene</strong> (“we,” “our,” or “the Platform”). By creating an account, browsing listings, placing a bid, or listing a garment for auction, you agree to be bound by these Terms of Service (“Terms”) and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Platform.
            </p>
            <p>
              Aurene acts as a curated online auction venue connecting independent sellers with prospective buyers of designer, archival, and vintage garments. Aurene is not the manufacturer, distributor, or direct retailer of goods listed by third-party sellers unless explicitly marked as an Aurene Archive drop.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">2. User Eligibility & Payout Methods</h2>
            <p>
              You must be at least 18 years of age to register and participate in auctions on Aurene. To maintain marketplace integrity and compliance:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Verification:</strong> Users must verify their email address and provide authentic personal details.
              </li>
              <li>
                <strong>Seller Payout Methods:</strong> To claim and withdraw earnings from completed sales, sellers must link a valid verified Indian bank account or active UPI ID (GPay, PhonePe, Paytm, BHIM).
              </li>
              <li>
                <strong>One Person, One Account:</strong> Maintaining duplicate accounts to manipulate bids or circumvent suspensions is strictly prohibited and subject to immediate account closure.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">3. The Auction Protocol & Binding Bids</h2>
            <div className="rounded-xl border border-line bg-subtle/50 p-5 space-y-2 text-sm text-ink">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>Every bid placed on Aurene constitutes a legally binding purchase contract.</span>
              </div>
              <p className="text-muted text-xs leading-normal">
                Placing a bid is an irrevocable offer to purchase the item at the bid amount if you emerge as the winning bidder or an eligible fallback winner.
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>No Bid Retraction:</strong> Bids cannot be canceled or modified once submitted. Please verify all item measurements, photographs, and condition details prior to placing a bid.
              </li>
              <li>
                <strong>Minimum Increment:</strong> Every bid must exceed the current highest bid by at least the specified minimum increment set by the seller.
              </li>
              <li>
                <strong>Anti-Sniping Clock Extension:</strong> If a bid is placed within the final 30 seconds of an auction, the auction deadline automatically extends by an additional 30 seconds. This extension repeats until 30 continuous seconds pass without any new bids.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">4. Settlement, Payment Window & Fallback Winner Cascade</h2>
            <p>
              When an auction concludes, an official Settlement record is generated:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>24-Hour Payment Window:</strong> The highest bidder has exactly twenty-four (24) hours from the auction's end time to complete checkout through our secure payment processor (Razorpay).
              </li>
              <li>
                <strong>Default & Forfeiture:</strong> If the highest bidder fails to pay or explicitly declines within the 24-hour window, their winning status is forfeited. Repeated non-payment defaults result in permanent account suspension and loss of bidding privileges.
              </li>
              <li>
                <strong>Fallback Promotion Chain:</strong> Upon forfeiture of the winner, the auction automatically cascades to the second-highest bidder, granting them a fresh 24-hour window to purchase the garment at their obligated bid amount. This progression continues down the bid ladder until settled or exhausted.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">5. Seller Obligations & Authenticity Guarantee</h2>
            <p>
              Sellers on Aurene are held to rigorous standards:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Strict Authenticity Warranty:</strong> Sellers expressly warrant that all listed garments are 100% genuine and authentic. Offering counterfeit, replica, or illegally altered goods is illegal and results in immediate forfeiture of funds, account bans, and referral to competent legal authorities.
              </li>
              <li>
                <strong>Accurate Representations:</strong> Sellers must disclose all known flaws, alterations, stains, tears, missing hardware, or fabric distress. High-resolution photographs of care tags, brand tags, and unique markings must be provided.
              </li>
              <li>
                <strong>Dispatch Timeline:</strong> Once payment is confirmed, sellers are required to pack and dispatch the item with a trackable courier service within three (3) business days.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">6. Platform Economics, 10% Commission & Escrow Settlement</h2>
            <p>
              Aurene operates on a transparent, success-only commission model:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>10% Platform Commission:</strong> Aurene charges a flat commission of <strong>10% (ten percent)</strong> on the final hammer/sold price of each successfully concluded auction. We charge zero listing fees and zero buyer's premiums.
              </li>
              <li>
                <strong>Escrow Protection Hold:</strong> 100% of buyer payments are initially held securely in Escrow. Funds remain held throughout shipping and for a mandatory 48-hour delivery inspection window upon verified receipt by the buyer.
              </li>
              <li>
                <strong>Automatic 90/10 Release:</strong> Upon explicit buyer confirmation or upon expiration of the 48-hour inspection period without a reported issue, the escrow funds automatically release:
                <ul className="list-disc pl-6 mt-1 space-y-1">
                  <li><strong>90% (Net Proceeds)</strong> is credited to the seller’s Aurene Wallet balance.</li>
                  <li><strong>10% (Platform Commission)</strong> is credited to the Aurene Admin Commission account for curation, hosting, and escrow protection.</li>
                </ul>
              </li>
              <li>
                <strong>Disputes & 100% Full Refunds:</strong> If the buyer raises a dispute within the 48-hour window with valid proof (e.g., counterfeit item, shipping damage, or material discrepancy) and the dispute is validated, the buyer is issued a 100% full refund and no commission is retained.
              </li>
              <li>
                <strong>Wallet Withdrawals:</strong> Sellers may request withdrawal of their available wallet balance to their linked bank account or UPI ID at any time (minimum ₹100). All withdrawals are verified and settled via manual bank transfer with an official UTR number.
              </li>
              <li>
                <strong>Currency:</strong> All prices, bids, deposits, and settlements are strictly in Indian Rupees (INR).
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">7. Prohibited Conduct</h2>
            <p>Users shall not engage in:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Shill Bidding:</strong> Bidding on your own auction or coordinating with third parties to artificially inflate prices.
              </li>
              <li>
                <strong>Off-Platform Circumvention:</strong> Soliciting buyers or sellers to conduct transactions outside Aurene to evade platform fees or protection protocols.
              </li>
              <li>
                <strong>Automated Scraping or Bot Bidding:</strong> Using automated scripts, bots, or unauthorized API endpoints to monitor or submit bids.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">8. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes, claims, or controversies arising out of or relating to the Platform or these Terms shall be subject to the exclusive jurisdiction of the courts located in Bengaluru, Karnataka, India.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-ink">9. Contact & Support</h2>
            <p>
              For legal inquiries, dispute notifications, or questions regarding these Terms, contact our legal compliance team at <span className="font-medium text-ink">legal@aurenefashions.in</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
