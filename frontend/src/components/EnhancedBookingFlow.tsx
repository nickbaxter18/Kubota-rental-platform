'use client';

import { createBooking, type BookingFormData } from '@/app/book/actions';
import { useToast } from '@/hooks/useToast';
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

interface SmartDefaults {
  suggestWeekends: boolean;
  recommendDelivery: boolean;
  showSeasonalPricing: boolean;
}

interface EnhancedBookingFlowProps {
  smartDefaults?: SmartDefaults;
  progressIndicator?: 'animated' | 'simple' | 'none';
  className?: string;
}

export default function EnhancedBookingFlow({
  smartDefaults = {
    suggestWeekends: true,
    recommendDelivery: true,
    showSeasonalPricing: true
  },
  progressIndicator = 'animated',
  className = ''
}: EnhancedBookingFlowProps) {
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
  const [, startTransition] = useTransition();

  const { toasts, success, error: showError } = useToast();

  // Smart date suggestions
  const getSmartDateSuggestions = () => {
    const suggestions = [];
    const today = new Date();

    // Suggest next weekend
    if (smartDefaults.suggestWeekends) {
      const nextSaturday = new Date(today);
      nextSaturday.setDate(today.getDate() + (6 - today.getDay()));
      suggestions.push({
        label: 'Next Weekend',
        startDate: nextSaturday.toISOString().split('T')[0],
        endDate: new Date(nextSaturday.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    // Suggest mid-week (often cheaper)
    const midWeek = new Date(today);
    midWeek.setDate(today.getDate() + 3);
    if (midWeek.getDay() !== 0 && midWeek.getDay() !== 6) {
      suggestions.push({
        label: 'Mid-Week Special',
        startDate: midWeek.toISOString().split('T')[0],
        endDate: new Date(midWeek.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    return suggestions;
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    startTransition(async () => {
      try {
        const result = await createBooking(formDataToSend);

        if (result.success) {
          setBookingResult(result);
          success('Booking Confirmed!', `Your booking #${result.bookingNumber} has been created successfully.`);
          setStep(4); // Move to success step
        } else {
          showError('Booking Failed', result.error);
          setErrors({ general: result.error });
        }
      } catch {
        showError('Booking Error', 'Failed to create booking. Please try again.');
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

  const applySmartSuggestion = (suggestion: { startDate: string; endDate: string }) => {
    setFormData(prev => ({
      ...prev,
      startDate: suggestion.startDate,
      endDate: suggestion.endDate,
    }));
  };

  const getStepProgress = () => {
    return ((step - 1) / 2) * 100;
  };

  return (
    <div className={`smart-form max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-8 ${className}`}>
      {/* Progress Indicator */}
      {progressIndicator === 'animated' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`booking-step ${
                    step >= stepNum ? 'active' : step > stepNum ? 'completed' : 'inactive'
                  }`}
                >
                  {step > stepNum ? '✓' : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`hidden sm:block w-8 sm:w-12 h-0.5 mx-2 ${
                    step > stepNum ? 'bg-[#E1BC56]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="progress-fill h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getStepProgress()}%` }}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="heading-lg mb-2">
          {step === 1 && 'Choose Rental Dates'}
          {step === 2 && 'Delivery Information'}
          {step === 3 && 'Review & Confirm'}
          {step === 4 && 'Booking Confirmed!'}
        </h2>
        <p className="body-md text-gray-600">
          {step === 1 && 'Select when you need the Kubota SVL-75'}
          {step === 2 && 'Tell us where to deliver your equipment'}
          {step === 3 && 'Review your booking details and pricing'}
          {step === 4 && 'Your booking has been successfully created'}
        </p>
      </div>

      {/* Smart Date Suggestions */}
      {step === 1 && smartDefaults.suggestWeekends && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3">🎯 Smart Suggestions</h3>
          <div className="space-y-2">
            {getSmartDateSuggestions().map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySmartSuggestion(suggestion)}
                className="w-full text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-blue-800">{suggestion.label}</div>
                <div className="text-sm text-blue-600">
                  {suggestion.startDate} to {suggestion.endDate}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && bookingResult ? (
        <div className="text-center">
          {bookingResult.success ? (
            <div className="space-y-6">
              <div className="text-green-600 text-6xl mb-4 animate-bounce">✓</div>
              <h3 className="heading-md text-green-700">
                Booking Confirmed!
              </h3>
              <div className="enhanced-card p-6">
                <p className="body-lg mb-2">
                  <strong>Booking Number:</strong> {bookingResult.bookingNumber}
                </p>
                <p className="text-3xl font-bold text-[#E1BC56] mb-4">
                  Total: ${bookingResult.pricing.total.toFixed(2)}
                </p>

                <div className="text-left mb-6">
                  <h4 className="font-semibold mb-2">Next Steps:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="text-[#E1BC56] mr-2">1.</span>
                      Upload Certificate of Insurance
                    </li>
                    <li className="flex items-center">
                      <span className="text-[#E1BC56] mr-2">2.</span>
                      Complete payment ($500 security deposit)
                    </li>
                    <li className="flex items-center">
                      <span className="text-[#E1BC56] mr-2">3.</span>
                      Sign rental agreement electronically
                    </li>
                    <li className="flex items-center">
                      <span className="text-[#E1BC56] mr-2">4.</span>
                      Receive equipment delivery
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <button className="w-full btn-gradient">
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
              <h3 className="heading-md mb-4">Booking Failed</h3>
              <p>{bookingResult.error}</p>
              <button
                onClick={() => setStep(1)}
                className="mt-4 btn-gradient"
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`form-group ${errors.startDate ? 'has-error' : ''}`}>
                  <label className="form-label">Start Date</label>
                  <input
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

                <div className={`form-group ${errors.endDate ? 'has-error' : ''}`}>
                  <label className="form-label">End Date</label>
                  <input
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

              {/* Rental Duration Calculator */}
              {formData.startDate && formData.endDate && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Rental Duration:</span>
                    <span className="text-lg font-bold text-[#E1BC56]">
                      {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className={`form-group ${errors.deliveryAddress ? 'has-error' : ''}`}>
                <label className="form-label">Delivery Address</label>
                <input
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

              <div className={`form-group ${errors.deliveryCity ? 'has-error' : ''}`}>
                <label className="form-label">City</label>
                <select
                  name="deliveryCity"
                  value={formData.deliveryCity}
                  onChange={handleInputChange}
                  className={`form-input ${errors.deliveryCity ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                >
                  <option value="">Select your city</option>
                  <option value="Saint John">Saint John</option>
                  <option value="Rothesay">Rothesay</option>
                  <option value="Quispamsis">Quispamsis</option>
                  <option value="Grand Bay-Westfield">Grand Bay-Westfield</option>
                  <option value="Hampton">Hampton</option>
                  <option value="Other">Other (may have additional fees)</option>
                </select>
                {errors.deliveryCity && (
                  <p className="text-red-600 text-sm mt-1">{errors.deliveryCity}</p>
                )}
              </div>

              {smartDefaults.recommendDelivery && formData.deliveryCity && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">💡</span>
                    <p className="text-green-800 text-sm">
                      <strong>Pro Tip:</strong> Delivery service available for ${formData.deliveryCity !== 'Other' ? '150' : '200'} each way in your area!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="enhanced-card p-6">
                <h3 className="font-semibold mb-4">Booking Summary</h3>
                <div className="space-y-3">
                  <div className="spec-item">
                    <span className="spec-label">Equipment:</span>
                    <span className="spec-value">Kubota SVL-75</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Start Date:</span>
                    <span className="spec-value">{formData.startDate}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">End Date:</span>
                    <span className="spec-value">{formData.endDate}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Delivery:</span>
                    <span className="spec-value">{formData.deliveryAddress}, {formData.deliveryCity}</span>
                  </div>
                </div>
              </div>

              <div className="enhanced-card p-6">
                <h3 className="font-semibold mb-4">Pricing Breakdown</h3>
                <div className="space-y-3">
                  <div className="spec-item">
                    <span className="spec-label">Daily Rate:</span>
                    <span className="spec-value">$350.00</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Days:</span>
                    <span className="spec-value">
                      {formData.startDate && formData.endDate
                        ? Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))
                        : 0
                      }
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Subtotal:</span>
                    <span className="spec-value">
                      ${formData.startDate && formData.endDate
                        ? (350 * Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Taxes (15%):</span>
                    <span className="spec-value">
                      ${formData.startDate && formData.endDate
                        ? (350 * Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) * 0.15).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Delivery Fee:</span>
                    <span className="spec-value">
                      ${formData.deliveryCity && formData.deliveryCity !== 'Other' ? '150.00' : formData.deliveryCity === 'Other' ? '200.00' : '0.00'}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="spec-item">
                      <span className="spec-label font-bold text-lg">Total:</span>
                      <span className="spec-value font-bold text-lg text-[#E1BC56]">
                        ${formData.startDate && formData.endDate
                          ? (350 * Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) * 1.15 + (formData.deliveryCity && formData.deliveryCity !== 'Other' ? 150 : formData.deliveryCity === 'Other' ? 200 : 0)).toFixed(2)
                          : '0.00'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {smartDefaults.showSeasonalPricing && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    <strong>Seasonal Note:</strong> Current period may have adjusted pricing. Contact us for special rates on longer rentals!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
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
                className="btn-gradient order-1 sm:order-2 sm:ml-auto"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="btn-gradient order-1 sm:order-2 sm:ml-auto"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="spinner w-4 h-4 mr-2"></div>
                    Creating Booking...
                  </span>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            )}
          </div>
        </form>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-lg font-bold">
                  {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠' : toast.type === 'warning' ? '!' : 'ℹ'}
                </span>
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium">{toast.title}</p>
                {toast.message && (
                  <p className="mt-1 text-sm opacity-90">{toast.message}</p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => toast.onClose(toast.id)}
                  className="inline-flex rounded-md opacity-75 hover:opacity-100 focus:outline-none transition-opacity"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
