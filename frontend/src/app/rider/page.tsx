export default function RiderPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Equipment-Specific Rider</h1>
              <p className="text-gray-600">2025 Kubota SVL75-3 Compact Track Loader</p>
              <p className="text-sm text-gray-500 mt-2">Document ID: UDIR-SVL75-3-RIDER | Version: 1.0 | Effective: Aug 22, 2025</p>
            </div>

            <div className="prose max-w-none">
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚖️ Legal Notice</h3>
                <p className="text-yellow-700">
                  This Equipment-Specific Rider is incorporated into and forms part of the U-Dig It Rentals Inc. Rental Agreement.
                  All renters must read and acknowledge this document before equipment release.
                </p>
              </div>

              <h2 className="text-2xl font-bold mb-4 mt-8">1. Unit Details</h2>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Equipment:</strong> 2025 Kubota SVL75-3 (Compact Track Loader)</li>
                <li><strong>Replacement Value:</strong> $120,000 CAD</li>
                <li><strong>Operating Weight:</strong> 9,190 lb (4,169 kg) open cab / 9,420 lb (4,273 kg) closed cab</li>
                <li><strong>Included Hour Allowance:</strong> 8 engine-hours/day, 40/week; excess billed at $65/hr</li>
                <li><strong>Float/Delivery Fee:</strong> $150 each way (total $300)</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4 mt-8">2. Insurance Requirements</h2>
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">🚨 NO COI, NO RELEASE</h3>
                <p className="text-red-700 mb-4">
                  <strong>Renter must maintain and provide evidence of insurance coverage before release:</strong>
                </p>
              </div>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>CGL:</strong> ≥ $2,000,000 per occurrence, U-Dig It Rentals Inc. as Additional Insured</li>
                <li><strong>Equipment Coverage:</strong> ≥ $120,000 (full replacement value), U-Dig It Rentals Inc. as Loss Payee</li>
                <li><strong>Automobile Liability:</strong> ≥ $1,000,000 if transporting equipment</li>
                <li><strong>Notice of Cancellation:</strong> Insurer must provide notice to U-Dig It Rentals Inc.</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4 mt-8">3. Transport & Tie-Down Requirements</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>Professional loading/unloading only - no one in cab during load/unload</li>
                <li>Trailer, hitch, tow vehicle, chains/binders & straps must be properly rated</li>
                <li>Minimum 4-point tie-down on the machine; secure attachments separately</li>
                <li>Verify overhead/bridge/width/weight limits; obtain permits where required</li>
                <li>No public-road operation of the machine unless legally permitted</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4 mt-8">4. Operating Limits & Safety</h2>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Maximum grade/slope:</strong> ≤ 25°. Travel straight up/down; avoid side-hilling</li>
                <li><strong>No riders:</strong> Never lift/carry people; use manufacturer arm support/lock</li>
                <li><strong>PPE required:</strong> CSA boots, hi-viz, eye/ear protection; hard hat where overhead hazards exist</li>
                <li><strong>Utility locates:</strong> Must be completed and on site before ground disturbance</li>
                <li><strong>Competent operators:</strong> 21+ years old only; no impairment (alcohol/cannabis/drugs)</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4 mt-8">5. Prohibited Uses</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>Demolition beyond rated capability; impact/ramming; lifting people</li>
                <li>Hazmat/contamination (fuel spills, sewage, creosote, asbestos, etc.)</li>
                <li>Operation in saltwater/surf, deep mud beyond track height, or fire areas</li>
                <li>Alterations, disabling safety devices, or removing telematics/GPS</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4 mt-8">6. Financial Terms</h2>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Security Deposit:</strong> $500 pre-authorization (not a cap on liability)</li>
                <li><strong>Fuel Policy:</strong> Return full; otherwise $100 refuel charge + actual fuel cost</li>
                <li><strong>Cleaning:</strong> Excessive mud/debris removal billed at $100 flat rate</li>
                <li><strong>Over-hours:</strong> Additional hours billed at $65/hr</li>
                <li><strong>Late Return:</strong> Additional day(s) automatically billed at current rates</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4 mt-8">7. Initials Required</h2>
              <p className="mb-4">
                By proceeding with this rental, you acknowledge that you have read and understood the following sections:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border border-gray-300 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Section 2 - Insurance</h3>
                  <p className="text-sm text-gray-600 mb-3">Required insurance coverage and "No COI, No Release" policy</p>
                  <div className="border-b border-gray-300 w-full mb-2"></div>
                  <p className="text-center text-sm text-gray-500">Customer Initials: ________</p>
                </div>

                <div className="border border-gray-300 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Section 3 - Transport & Tie-Down</h3>
                  <p className="text-sm text-gray-600 mb-3">Professional loading and securement requirements</p>
                  <div className="border-b border-gray-300 w-full mb-2"></div>
                  <p className="text-center text-sm text-gray-500">Customer Initials: ________</p>
                </div>

                <div className="border border-gray-300 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Section 4 - Operating Limits & Safety</h3>
                  <p className="text-sm text-gray-600 mb-3">Maximum slope, PPE, and safety requirements</p>
                  <div className="border-b border-gray-300 w-full mb-2"></div>
                  <p className="text-center text-sm text-gray-500">Customer Initials: ________</p>
                </div>

                <div className="border border-gray-300 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Section 5 - Prohibited Uses</h3>
                  <p className="text-sm text-gray-600 mb-3">Activities that are not permitted</p>
                  <div className="border-b border-gray-300 w-full mb-2"></div>
                  <p className="text-center text-sm text-gray-500">Customer Initials: ________</p>
                </div>

                <div className="border border-gray-300 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Section 8 - Financial Terms</h3>
                  <p className="text-sm text-gray-600 mb-3">Security deposit, fuel, and cleaning policies</p>
                  <div className="border-b border-gray-300 w-full mb-2"></div>
                  <p className="text-center text-sm text-gray-500">Customer Initials: ________</p>
                </div>

                <div className="border border-gray-300 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Final Acceptance</h3>
                  <p className="text-sm text-gray-600 mb-3">Agreement to all terms and conditions</p>
                  <div className="border-b border-gray-300 w-full mb-2"></div>
                  <p className="text-center text-sm text-gray-500">Customer Initials: ________</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-4 mt-8">8. Governing Law</h2>
              <p className="mb-4">
                This Rider and the Rental Agreement are governed by the laws of the Province of New Brunswick, Canada.
              </p>

              <h2 className="text-2xl font-bold mb-4 mt-8">9. Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p><strong>U-Dig It Rentals Inc.</strong></p>
                <p>945 Golden Grove Road</p>
                <p>Saint John, New Brunswick</p>
                <p>Canada, E2H 2X1</p>
                <p>Phone: <a href="tel:+15066431575" className="text-brand-secondary hover:underline">(506) 643-1575</a></p>
                <p>Email: <a href="mailto:nickbaxter@udigit.ca" className="text-brand-secondary hover:underline">nickbaxter@udigit.ca</a></p>
              </div>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Acknowledgment Required</h3>
                <p className="text-blue-700 mb-4">
                  By proceeding with your rental booking, you acknowledge that you have read, understood, and agree to comply with all sections of this Equipment-Specific Rider.
                </p>
                <p className="text-blue-700">
                  <strong>Failure to comply with any section of this Rider may result in additional charges, termination of rental, or legal action.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
