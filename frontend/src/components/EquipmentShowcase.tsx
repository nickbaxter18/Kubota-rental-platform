'use client';

import { useEffect, useState } from 'react';

interface EquipmentShowcaseProps {
  className?: string;
}

export default function EquipmentShowcase({ className = '' }: EquipmentShowcaseProps) {
  const [activeView, setActiveView] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const equipmentViews = [
    {
      id: 'exterior',
      title: 'Kubota SVL-75',
      subtitle: 'Compact Track Loader',
      emoji: '🚜',
      bgGradient: 'from-gray-900 via-gray-800 to-black',
      specs: [
        { label: 'Operating Weight', value: '9,420 lbs', icon: '⚖️', color: 'from-[#E1BC56] to-yellow-500' },
        { label: 'Horsepower', value: '74.3 HP', icon: '⚡', color: 'from-[#E1BC56] to-yellow-500' },
        { label: 'Fuel Capacity', value: '27.7 gal', icon: '⛽', color: 'from-[#E1BC56] to-yellow-500' },
      ],
      features: [
        '⚡ 74.3 HP Diesel Engine',
        '🏗️ 9,420 lbs Operating Weight',
        '🔄 360° Rotation Capability',
        '🛡️ $120K Insurance Coverage'
      ]
    },
    {
      id: 'interior',
      title: 'Operator Cabin',
      subtitle: 'Comfort & Control',
      emoji: '👨‍💼',
      bgGradient: 'from-gray-900 via-gray-800 to-black',
      specs: [
        { label: 'Cab Type', value: 'Enclosed ROPS', icon: '🏠', color: 'from-[#E1BC56] to-yellow-500' },
        { label: 'Seat Type', value: 'Air Suspension', icon: '💺', color: 'from-[#E1BC56] to-yellow-500' },
        { label: 'Controls', value: 'Pilot Operated', icon: '🎛️', color: 'from-[#E1BC56] to-yellow-500' },
      ],
      features: [
        '🏠 Fully Enclosed ROPS Cabin',
        '💺 Premium Air Suspension Seat',
        '🎛️ Intuitive Pilot Controls',
        '🌡️ Climate Control System'
      ]
    },
    {
      id: 'performance',
      title: 'Performance',
      subtitle: 'Power & Precision',
      emoji: '💪',
      bgGradient: 'from-gray-900 via-gray-800 to-black',
      specs: [
        { label: 'Lift Capacity', value: '2,690 lbs', icon: '🏋️', color: 'from-[#E1BC56] to-yellow-500' },
        { label: 'Dig Depth', value: '13.5 ft', icon: '⛏️', color: 'from-[#E1BC56] to-yellow-500' },
        { label: 'Travel Speed', value: '7.1 mph', icon: '💨', color: 'from-[#E1BC56] to-yellow-500' },
      ],
      features: [
        '🏋️ 2,690 lbs Lift Capacity',
        '⛏️ 13.5 ft Dig Depth',
        '💨 7.1 mph Travel Speed',
        '🎯 Precision Hydraulic Controls'
      ]
    }
  ];

  // Auto-rotate through views
  useEffect(() => {
    if (!isAutoRotating) return;

    const interval = setInterval(() => {
      setActiveView((prev) => (prev + 1) % equipmentViews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoRotating, equipmentViews.length]);

  const currentView = equipmentViews[activeView];

  return (
    <div className={`equipment-showcase ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Enhanced with Modern Design */}
        <div className="text-center mb-16 relative">
          {/* Modern Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#E1BC56]/8 to-[#A90F0F]/8 rounded-3xl blur-3xl scale-110 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>

          {/* Floating Elements */}
          <div className="absolute top-8 left-8 w-4 h-4 bg-[#E1BC56] rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
          <div className="absolute top-16 right-12 w-3 h-3 bg-white rounded-full opacity-40 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
          <div className="absolute bottom-12 left-16 w-2 h-2 bg-[#A90F0F] rounded-full opacity-50 animate-bounce" style={{ animationDelay: '2s', animationDuration: '2.5s' }}></div>

          <div className="relative">
            {/* Modern Badge */}
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-secondary to-red-600 text-white rounded-full text-sm font-semibold mb-8 shadow-lg hover-lift border border-red-400/20">
              <span className="w-3 h-3 bg-brand-primary rounded-full mr-3 animate-pulse"></span>
              <span className="font-medium">Available Now - Book Today!</span>
              <div className="ml-2 flex space-x-1">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight animate-fade-in">
              Rent the{' '}
              <span className="bg-gradient-to-r from-[#E1BC56] via-yellow-400 to-[#E1BC56] bg-clip-text text-transparent font-black animate-pulse">
                Kubota SVL-75
              </span>
            </h1>

            <p className="text-xl text-gray-200 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Professional compact track loader rental in <span className="text-[#E1BC56] font-semibold bg-[#E1BC56]/10 px-2 py-1 rounded-md">Saint John, New Brunswick</span>. Get the power and versatility you need for your next project.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <span className="status-dot success"></span>
                <span className="text-white text-sm font-medium">Fully Licensed</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <span className="status-dot success"></span>
                <span className="text-white text-sm font-medium">$120K Insurance</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <span className="status-dot info"></span>
                <span className="text-white text-sm font-medium">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Equipment Display - Enhanced Modern Design */}
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden mb-16 modern-card">
          {/* Modern Background Effects */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #E1BC56 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>

          {/* Animated Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E1BC56]/5 to-transparent animate-pulse"></div>

          {/* Content */}
          <div className="relative p-8 md:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Side - Equipment Info */}
              <div className="text-center lg:text-left animate-slide-in-left">
                {/* Modern Equipment Icon */}
                <div className="relative mb-12">
                  <div className="text-8xl md:text-9xl text-[#E1BC56] animate-float inline-block">
                    {currentView.emoji}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#A90F0F] rounded-full animate-pulse border-2 border-white"></div>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                  {currentView.title}
                </h2>

                <p className="text-lg text-gray-300 mb-10 leading-relaxed font-light">
                  {currentView.subtitle}
                </p>

                {/* Enhanced Key Specifications */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                  {currentView.specs.map((spec, index) => (
                    <div key={index} className="group">
                      <div className="modern-card bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 border border-gray-600/50 hover:border-[#E1BC56]/50 hover:shadow-lg hover:shadow-[#E1BC56]/10 min-h-[140px] flex flex-col justify-center backdrop-blur-sm">
                        <div className="text-3xl mb-4 text-[#E1BC56] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 text-center">{spec.icon}</div>
                        <div className="text-xl font-bold text-white mb-2 text-center break-words">{spec.value}</div>
                        <div className="text-sm text-gray-400 text-center leading-tight font-medium">{spec.label}</div>

                        {/* Modern Progress Indicator */}
                        <div className="mt-3">
                          <div className="progress-modern">
                            <div
                              className="progress-fill-modern"
                              style={{ width: `${Math.min(100, (parseFloat(spec.value.replace(/[^\d.]/g, '')) / (index === 0 ? 100 : index === 1 ? 80 : 30)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Enhanced Actions & Features */}
              <div className="space-y-10 animate-slide-in-right">
                {/* Modern Action Buttons */}
                <div className="space-y-4">
                  <button className="w-full modern-button modern-button-primary text-xl font-bold py-6 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 text-center group">
                    <span className="flex items-center justify-center">
                      🚀 Book Now - Instant Quote
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>

                  <a href="tel:+15066431575" className="w-full modern-button modern-button-secondary text-xl font-bold py-6 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 text-center border-2 border-gray-600 hover:border-gray-500 group block">
                    <span className="flex items-center justify-center">
                      📞 Call (506) 643-1575
                      <svg className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                  </a>
                </div>

                {/* Enhanced Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentView.features.map((feature, index) => (
                    <div key={index} className="modern-card bg-gray-800/40 p-4 border border-gray-600/30 hover:border-gray-500/50 hover:bg-gray-800/60 transition-all duration-300 min-h-[70px] flex items-center group hover-lift">
                      <div className="flex items-start space-x-3 w-full">
                        <span className="text-[#E1BC56] group-hover:scale-110 transition-transform flex-shrink-0 mt-0.5">✨</span>
                        <div className="text-sm font-medium text-gray-200 leading-relaxed break-words">{feature}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Benefits */}
                <div className="space-y-4 p-6 bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded-2xl border border-gray-600/30">
                  <div className="flex items-center space-x-4 text-[#E1BC56] p-3 bg-[#E1BC56]/10 rounded-xl">
                    <span className="text-2xl animate-pulse">✅</span>
                    <span className="font-semibold text-lg">Fully Licensed & Insured</span>
                  </div>
                  <div className="flex items-center space-x-4 text-emerald-400 p-3 bg-emerald-500/10 rounded-xl">
                    <span className="text-2xl">🚚</span>
                    <span className="font-semibold text-lg">Same-Day Delivery Available</span>
                  </div>
                  <div className="flex items-center space-x-4 text-blue-400 p-3 bg-blue-500/10 rounded-xl">
                    <span className="text-2xl">🛠️</span>
                    <span className="font-semibold text-lg">24/7 Technical Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced View Selection - Modern Tabs */}
        <div className="flex justify-center">
          <div className="tabs-modern bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-2 shadow-lg">
            {equipmentViews.map((view, index) => (
              <button
                key={view.id}
                onClick={() => {
                  setActiveView(index);
                  setIsAutoRotating(false);
                }}
                className={`tab-modern flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 group ${
                  activeView === index
                    ? 'active bg-gradient-to-r from-[#E1BC56] to-yellow-500 text-black shadow-lg transform scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:scale-102'
                }`}
              >
                <span className={`text-xl group-hover:scale-110 transition-transform ${activeView === index ? 'animate-bounce' : ''}`}>
                  {view.emoji}
                </span>
                <span className="font-medium hidden sm:inline">{view.title.split(' ')[0]}</span>

                {/* Active Indicator */}
                {activeView === index && (
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-rotation Indicator */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <div className={`w-2 h-2 rounded-full transition-colors ${isAutoRotating ? 'bg-[#E1BC56] animate-pulse' : 'bg-gray-600'}`}></div>
            <span>Auto-rotating views</span>
            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className="ml-2 px-3 py-1 bg-gray-800/50 hover:bg-gray-700/50 rounded-full text-xs transition-colors border border-gray-600 hover:border-gray-500"
            >
              {isAutoRotating ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
