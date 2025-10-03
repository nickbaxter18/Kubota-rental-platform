export default function GettingInsurancePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Getting Insurance Coverage</h1>
              <p className="text-xl text-gray-600">
                Step-by-step guide to obtaining the required insurance coverage for renting the Kubota SVL-75
              </p>
            </div>

            <div className="prose max-w-none">
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Insurance Requirements Summary</h3>
                <ul className="text-blue-700 space-y-1">
                  <li>• <strong>$2,000,000</strong> Commercial General Liability per occurrence</li>
                  <li>• <strong>$120,000</strong> Rented Equipment Coverage (replacement value)</li>
                  <li>• U-Dig It Rentals Inc. named as <strong>Additional Insured</strong></li>
                  <li>• U-Dig It Rentals Inc. named as <strong>Loss Payee</strong></li>
                  <li>• <strong>Waiver of Subrogation</strong> in favor of U-Dig It Rentals Inc.</li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold mb-4 mt-8">Option 1: Contact Your Current Insurance Broker</h2>
              <p className="mb-4">
                The fastest way to get coverage is through your existing insurance broker or agent.
                Most commercial insurance policies can be easily amended to include the required coverage.
              </p>

              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-4">📧 Email Template for Your Broker</h3>
                <div className="bg-white p-4 rounded border">
                  <p className="mb-2"><strong>Subject:</strong> Insurance Requirements for Equipment Rental - Kubota SVL-75</p>
                  <p className="mb-4"><strong>Dear [Broker Name],</strong></p>
                  <p className="mb-4">
                    I need to rent a Kubota SVL-75 compact track loader from U-Dig It Rentals Inc.
                    To proceed with the rental, I need to add the following coverage to my existing policy:
                  </p>
                  <ul className="list-disc pl-6 mb-4">
                    <li><strong>$2,000,000</strong> Commercial General Liability per occurrence</li>
                    <li><strong>$120,000</strong> Rented/Leased Equipment Coverage</li>
                    <li>U-Dig It Rentals Inc. as Additional Insured</li>
                    <li>U-Dig It Rentals Inc. as Loss Payee</li>
                    <li>Waiver of Subrogation in favor of U-Dig It Rentals Inc.</li>
                  </ul>
                  <p className="mb-4">
                    <strong>Equipment Owner:</strong> U-Dig It Rentals Inc.<br />
                    <strong>Address:</strong> 945 Golden Grove Road, Saint John, New Brunswick, E2H 2X1<br />
                    <strong>Phone:</strong> (506) 643-1575<br />
                    <strong>Email:</strong> nickbaxter@udigit.ca
                  </p>
                  <p className="mb-4">
                    The rental period is [insert dates]. Can you please provide a Certificate of Insurance
                    showing this coverage? I need this as soon as possible to secure the equipment rental.
                  </p>
                  <p>Thank you for your assistance.</p>
                  <p><strong>Best regards,<br />[Your Name]</strong></p>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-4 mt-8">Option 2: Short-Term Rental Insurance</h2>
              <p className="mb-4">
                If you don't have existing commercial insurance, you can obtain short-term coverage
                specifically for equipment rental. This is often available on a same-day basis.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="border border-gray-200 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Local Insurance Brokers</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>Commercial Insurance Broker</strong></li>
                    <li>• <strong>Business Insurance Specialist</strong></li>
                    <li>• <strong>Equipment Rental Insurance</strong></li>
                  </ul>
                </div>

                <div className="border border-gray-200 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Online Options</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>Equipment Rental Insurance</strong></li>
                    <li>• <strong>Short-term Commercial Coverage</strong></li>
                    <li>• <strong>Event/Job-specific Policies</strong></li>
                  </ul>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-4 mt-8">What You'll Need</h2>
              <ul className="list-disc pl-6 mb-6">
                <li><strong>Equipment Value:</strong> $120,000 (replacement cost)</li>
                <li><strong>Equipment Type:</strong> 2025 Kubota SVL75-3 Compact Track Loader</li>
                <li><strong>Usage:</strong> Construction/landscaping equipment rental</li>
                <li><strong>Duration:</strong> Specific rental period dates</li>
                <li><strong>Additional Insured:</strong> U-Dig It Rentals Inc., 945 Golden Grove Road, Saint John, NB</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4 mt-8">Timeline</h2>
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">⏰ Processing Time</h3>
                <ul className="text-green-700 space-y-1">
                  <li>• <strong>Existing Policy:</strong> Same day to 24 hours</li>
                  <li>• <strong>New Short-term Policy:</strong> Same day if arranged early</li>
                  <li>• <strong>Complex Cases:</strong> 2-3 business days</li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold mb-4 mt-8">Questions?</h2>
              <p className="mb-4">
                We're here to help! Contact us if you need assistance with insurance requirements or recommendations.
              </p>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Contact U-Dig It Rentals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Phone:</strong> <a href="tel:+15066431575" className="text-brand-secondary hover:underline">(506) 643-1575</a></p>
                    <p><strong>Email:</strong> <a href="mailto:nickbaxter@udigit.ca" className="text-brand-secondary hover:underline">nickbaxter@udigit.ca</a></p>
                  </div>
                  <div>
                    <p><strong>Address:</strong></p>
                    <p>945 Golden Grove Road</p>
                    <p>Saint John, New Brunswick</p>
                    <p>Canada, E2H 2X1</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Important Note</h3>
                <p className="text-yellow-700">
                  <strong>Equipment will not be released without valid insurance documentation.</strong>
                  Please ensure your Certificate of Insurance meets all requirements and is current
                  for the entire rental period. We recommend starting this process as early as possible
                  to avoid delays in your project timeline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
