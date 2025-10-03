'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    // Quick Quote Calculator
    const rentalDays = document.getElementById('rentalDays') as HTMLSelectElement | null;
    const deliveryOption = document.getElementById('deliveryOption') as HTMLSelectElement | null;

    if (!rentalDays || !deliveryOption) return;

    const updateQuote = () => {
      const days = parseInt(rentalDays.value);
      const hasDelivery = deliveryOption.value === 'delivery';

      const dailyRate = 350;
      const subtotal = dailyRate * days;
      const taxes = subtotal * 0.15;
      const deliveryFee = hasDelivery ? 150 : 0;
      const total = subtotal + taxes + deliveryFee;

      const quoteDays = document.getElementById('quoteDays');
      const quoteSubtotal = document.getElementById('quoteSubtotal');
      const quoteTaxes = document.getElementById('quoteTaxes');
      const quoteDelivery = document.getElementById('quoteDelivery');
      const quoteTotal = document.getElementById('quoteTotal');

      if (quoteDays) quoteDays.textContent = days.toString();
      if (quoteSubtotal) quoteSubtotal.textContent = `$${subtotal.toFixed(2)}`;
      if (quoteTaxes) quoteTaxes.textContent = `$${taxes.toFixed(2)}`;
      if (quoteDelivery) quoteDelivery.textContent = `$${deliveryFee.toFixed(2)}`;
      if (quoteTotal) quoteTotal.textContent = `$${total.toFixed(2)}`;
    };

    rentalDays.addEventListener('change', updateQuote);
    deliveryOption.addEventListener('change', updateQuote);
    updateQuote(); // Initial calculation

    return () => {
      rentalDays.removeEventListener('change', updateQuote);
      deliveryOption.removeEventListener('change', updateQuote);
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-20"></div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Rent the <span className="text-yellow-400">Kubota SVL-75</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              Professional compact track loader rental in Saint John, New Brunswick
            </p>

            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold text-yellow-400 mb-2">74.3 HP</div>
                <div className="text-sm">Diesel Power</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold text-yellow-400 mb-2">9,420 lbs</div>
                <div className="text-sm">Operating Weight</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold text-yellow-400 mb-2">24/7</div>
                <div className="text-sm">Support</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/book"
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                Book Now - Instant Quote
              </Link>
              <a
                href="tel:+15066431575"
                className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                Call (506) 643-1575
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Quote Calculator */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-8">Get a Quick Quote</h2>

            <div className="bg-gray-50 rounded-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2">Rental Days</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg" id="rentalDays">
                    <option value="1">1 Day</option>
                    <option value="2">2 Days</option>
                    <option value="3">3 Days</option>
                    <option value="7">1 Week</option>
                    <option value="14">2 Weeks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Delivery Option</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg" id="deliveryOption">
                    <option value="pickup">Pickup (No Fee)</option>
                    <option value="delivery">Delivery (+$150 each way)</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border">
                <h3 className="font-semibold mb-4">Estimated Cost</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Daily Rate:</span>
                    <span>$350.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days:</span>
                    <span id="quoteDays">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span id="quoteSubtotal">$350.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes (15%):</span>
                    <span id="quoteTaxes">$52.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span id="quoteDelivery">$0.00</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-yellow-600" id="quoteTotal">$402.50</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link href="/book" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold">
                  Proceed to Booking
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Equipment Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Powerful Engine', desc: '74.3 HP diesel engine for demanding applications' },
              { title: 'Heavy Duty', desc: '9,420 lbs operating weight with enclosed cab' },
              { title: 'Versatile', desc: 'Multiple attachment options available' },
              { title: 'Insured', desc: '$120,000 equipment coverage included' },
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insurance Requirements */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-8">Insurance Requirements</h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
              <h3 className="text-2xl font-semibold mb-4 text-yellow-800">Required Coverage</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <span className="text-green-600 mr-3">✓</span>
                  <span><strong>$2,000,000</strong> Commercial General Liability</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-3">✓</span>
                  <span><strong>$120,000</strong> Rented Equipment Coverage</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-3">✓</span>
                  <span>U-Dig It Rentals Inc. as <strong>Additional Insured</strong></span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-3">✓</span>
                  <span>U-Dig It Rentals Inc. as <strong>Loss Payee</strong></span>
                </li>
              </ul>

              <div className="text-center">
                <Link
                  href="/getting-insurance"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Need Insurance? Get Help Here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Ready to Book?</h2>
            <p className="text-xl mb-8">
              Contact us today to reserve the Kubota SVL-75 for your project
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-3xl mb-2">📞</div>
                <div className="font-semibold">Call Us</div>
                <a href="tel:+15066431575" className="text-yellow-400 hover:text-yellow-300 text-lg">
                  (506) 643-1575
                </a>
              </div>

              <div>
                <div className="text-3xl mb-2">📧</div>
                <div className="font-semibold">Email Us</div>
                <a href="mailto:nickbaxter@udigit.ca" className="text-yellow-400 hover:text-yellow-300 text-lg">
                  nickbaxter@udigit.ca
                </a>
              </div>

              <div>
                <div className="text-3xl mb-2">📍</div>
                <div className="font-semibold">Location</div>
                <div className="text-gray-300 text-sm">
                  Saint John, New Brunswick
                </div>
              </div>
            </div>

            <Link
              href="/book"
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 rounded-lg font-bold text-lg"
            >
              Start Your Booking
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
