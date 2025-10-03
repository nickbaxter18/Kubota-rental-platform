
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
              <p className="text-gray-600">Last Updated: August 2025</p>
            </div>

            <div className="prose max-w-none">
              <p className="mb-6">
                Welcome to U-Dig It Rentals Inc. By renting equipment from us, you ("Customer") agree to the following Terms and Conditions. Please read carefully before booking. If you do not agree, you may not rent or use our equipment.
              </p>

              <h2 className="text-2xl font-bold mb-4 mt-8">1. Definitions</h2>
              <p className="mb-4">
                "Company," "we," "us," or "our" means U-Dig It Rentals Inc.<br />
                "Customer," "you," or "your" means the individual or entity renting equipment.<br />
                "Equipment" means any machinery, attachments, or accessories provided by U-Dig It Rentals Inc., including but not limited to our Kubota SVL-75 compact track loader.<br />
                "Rental Agreement" means the written or electronic confirmation of your booking, including dates, rates, deposits, and conditions.
              </p>

              <h2 className="text-2xl font-bold mb-4 mt-8">2. Eligibility</h2>
              <p className="mb-4">
                To rent equipment, you must:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Be at least 21 years of age</li>
                <li>Provide valid government-issued ID and accurate contact information</li>
                <li>Have the legal capacity and authority to enter into contracts</li>
                <li>Have valid insurance coverage meeting our requirements</li>
                <li>Provide a valid credit card in the renter's name for the $500 security deposit</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4 mt-8">3. Insurance Requirements</h2>
              <p className="mb-4">
                <strong>For skid steer rentals (approximate replacement value $120,000), Renter must maintain:</strong>
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Commercial General Liability insurance of not less than $2,000,000 per occurrence</li>
                <li>Insurance covering rented/leased equipment for its full replacement value ($120,000)</li>
                <li>U-Dig It Rentals Inc. must be named as Additional Insured and Loss Payee</li>
                <li>Waiver of Subrogation in favor of U-Dig It Rentals Inc.</li>
              </ul>

              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg my-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">🚨 Critical Requirement</h3>
                <p className="text-yellow-700">
                  <strong>No COI, No Release:</strong> Equipment will not be released without valid insurance documentation.
                  This requirement is strictly enforced for your safety and legal compliance.
                </p>
              </div>

              <h2 className="text-2xl font-bold mb-4 mt-8">4. Security Deposit</h2>
              <p className="mb-4">
                A refundable security deposit of <strong>$500</strong> is required on a valid credit card in the renter's name.
                The deposit must be authorized 1 week prior to equipment release.
              </p>

              <h2 className="text-2xl font-bold mb-4 mt-8">5. Fuel Policy</h2>
              <p className="mb-4">
                Equipment requires diesel fuel only. Use of gasoline or improper fuel will cause severe damage and the customer will be held fully liable for all resulting repair costs, which may include complete engine replacement.
              </p>

              <h2 className="text-2xl font-bold mb-4 mt-8">6. Service Areas</h2>
              <p className="mb-4">
                We deliver to: Saint John, Rothesay, Quispamsis, Grand Bay-Westfield, and Hampton.
                Additional fees may apply outside this area.
              </p>

              <h2 className="text-2xl font-bold mb-4 mt-8">7. Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p><strong>U-Dig It Rentals Inc.</strong></p>
                <p>945 Golden Grove Road</p>
                <p>Saint John, New Brunswick</p>
                <p>Canada, E2H 2X1</p>
                <p>Phone: <a href="tel:+15066431575" className="text-brand-secondary hover:underline">(506) 643-1575</a></p>
                <p>Email: <a href="mailto:nickbaxter@udigit.ca" className="text-brand-secondary hover:underline">nickbaxter@udigit.ca</a></p>
              </div>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">
                  <strong>Questions?</strong> Contact us directly for clarification on any terms or requirements.
                  We're here to help ensure a smooth rental experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
