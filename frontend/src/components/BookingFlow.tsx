'use client';

import { createBooking, type BookingFormData } from '@/app/book/actions';
import { useState, useTransition } from 'react';

interface ValidationErrors {
  startDate?: string;
  endDate?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  customerEmail?: string;
  customerName?: string;
  general?: string;
}

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>({
    startDate: '',
    endDate: '',
    deliveryAddress: '',
    deliveryCity: '',
    customerEmail: '',
    customerName: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [, _startTransition] = useTransition();

  const validateForm = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 1) {
      if (!formData.startDate) {
        newErrors.startDate = 'Start date is required';
      } else {
        const startDate = new Date(formData.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
          newErrors.startDate = 'Start date must be today or later';
        }
      }

      if (!formData.endDate) {
        newErrors.endDate = 'End date is required';
      } else if (formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        if (endDate <= startDate) {
          newErrors.endDate = 'End date must be after start date';
        }

        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 365) {
          newErrors.endDate = 'Maximum rental period is 1 year';
        }
      }
    }

    if (step === 2) {
      if (!formData.deliveryAddress.trim()) {
        newErrors.deliveryAddress = 'Delivery address is required';
      }

      if (!formData.deliveryCity.trim()) {
        newErrors.deliveryCity = 'City is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Create FormData for Server Action
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    _startTransition(async () => {
      try {
        const result = await createBooking(formDataToSend);

        if (result.success) {
          setBookingResult(result);
          setStep(4); // Move to success step
        } else {
          setErrors({ general: result.error });
        }
      } catch {
        setErrors({ general: 'Failed to create booking. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    });
  };

  const nextStep = () => {
    if (validateForm(step)) {
      if (step < 3) setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm sm:text-base ${
                  step >= stepNum
                    ? 'bg-brand-secondary text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`hidden sm:block w-8 sm:w-12 h-0.5 mx-2 ${
                  step > stepNum ? 'bg-brand-secondary' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            {step === 1 && 'Choose Rental Dates'}
            {step === 2 && 'Delivery Information'}
            {step === 3 && 'Review & Confirm'}
            {step === 4 && 'Booking Confirmed!'}
          </h2>
          <p className="text-gray-600">
            {step === 1 && 'Select when you need the Kubota SVL-75'}
            {step === 2 && 'Tell us where to deliver your equipment'}
            {step === 3 && 'Review your booking details and pricing'}
            {step === 4 && 'Your booking has been successfully created'}
          </p>
        </div>
      </div>

      {step === 4 && bookingResult ? (
        <div className="text-center">
          {bookingResult.success ? (
            <div className="space-y-6">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h3 className="text-2xl font-bold text-green-700">
                Booking Confirmed!
              </h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-lg mb-2">
                  <strong>Booking Number:</strong> {bookingResult.bookingNumber}
                </p>
                <p className="text-2xl font-bold text-brand-secondary mb-4">
                  Total: ${bookingResult.pricing.total.toFixed(2)}
                </p>

                <div className="text-left mb-6">
                  <h4 className="font-semibold mb-2">Next Steps:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="text-brand-secondary mr-2">1.</span>
                      Upload Certificate of Insurance
                    </li>
                    <li className="flex items-center">
                      <span className="text-brand-secondary mr-2">2.</span>
                      Complete payment ($500 security deposit)
                    </li>
                    <li className="flex items-center">
                      <span className="text-brand-secondary mr-2">3.</span>
                      Sign rental agreement electronically
                    </li>
                    <li className="flex items-center">
                      <span className="text-brand-secondary mr-2">4.</span>
                      Receive equipment delivery
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <button className="w-full btn-primary">
                    Upload Insurance Document
                  </button>
                  <button className="w-full btn-secondary">
                    Proceed to Payment
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-red-600">
              <div className="text-6xl mb-4">✗</div>
              <h3 className="text-2xl font-bold mb-4">Booking Failed</h3>
              <p>{bookingResult.error}</p>
              <button
                onClick={() => setStep(1)}
                className="mt-4 btn-primary"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">⚠</div>
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={`form-input ${errors.startDate ? 'border-red-500 focus:ring-red-500' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                {errors.startDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>
              <div>
                <label htmlFor="endDate" className="form-label">End Date</label>
                <input
                  id="endDate"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`form-input ${errors.endDate ? 'border-red-500 focus:ring-red-500' : ''}`}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  required
                />
                {errors.endDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="deliveryAddress" className="form-label">Delivery Address</label>
                <input
                  id="deliveryAddress"
                  type="text"
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleInputChange}
                  className={`form-input ${errors.deliveryAddress ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Street address"
                  required
                />
                {errors.deliveryAddress && (
                  <p className="text-red-600 text-sm mt-1">{errors.deliveryAddress}</p>
                )}
              </div>
              <div>
                <label htmlFor="deliveryCity" className="form-label">City</label>
                <input
                  id="deliveryCity"
                  type="text"
                  name="deliveryCity"
                  value={formData.deliveryCity}
                  onChange={handleInputChange}
                  className={`form-input ${errors.deliveryCity ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Saint John, Rothesay, etc."
                  required
                />
                {errors.deliveryCity && (
                  <p className="text-red-600 text-sm mt-1">{errors.deliveryCity}</p>
                )}
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Delivery Fee:</strong> $150 each way for service areas
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Booking Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Equipment:</span>
                    <span>Kubota SVL-75</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Start Date:</span>
                    <span>{formData.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>End Date:</span>
                    <span>{formData.endDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span>{formData.deliveryAddress}, {formData.deliveryCity}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Pricing Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Daily Rate:</span>
                    <span>$350.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days:</span>
                    <span>
                      {formData.startDate && formData.endDate
                        ? Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))
                        : 0
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>
                      ${formData.startDate && formData.endDate
                        ? (350 * Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes (15%):</span>
                    <span>
                      ${formData.startDate && formData.endDate
                        ? (350 * Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) * 0.15).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Float Fee:</span>
                    <span>{formData.deliveryCity ? '$150.00' : '$0.00'}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-brand-secondary">
                      ${formData.startDate && formData.endDate
                        ? (350 * Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) * 1.15 + (formData.deliveryCity ? 150 : 0)).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary order-2 sm:order-1"
              >
                Previous
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary order-1 sm:order-2 sm:ml-auto"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary order-1 sm:order-2 sm:ml-auto"
              >
                {isLoading ? 'Creating Booking...' : 'Confirm Booking'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
