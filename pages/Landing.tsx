
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/UI';
import { ArrowRight, CheckCircle, TrendingUp, ShieldCheck, Truck, Users, Sprout } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Hero Section */}
      <section className="bg-agri-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625246333195-58197bd47d19?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-agri-900 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-agri-800 bg-opacity-80 px-4 py-1.5 rounded-full border border-agri-600 mb-6">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-sm font-medium text-green-100">Live Mandi Prices Available</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                    Harvest Gold, <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">Sell Bold.</span>
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-lg mx-auto md:mx-0">
                    Join India's premium Agri-Trade network. Connect directly with verified buyers, secure payments via Escrow, and manage logistics in one click.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold border-none px-8 py-4 h-auto text-lg" onClick={() => navigate('/post-order')}>
                        Start Selling
                    </Button>
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-agri-900 px-8 py-4 h-auto text-lg" onClick={() => navigate('/browse')}>
                        Browse Mandi
                    </Button>
                </div>
            </div>
            {/* Hero Image / Stats */}
            <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
                    <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                        <h3 className="font-bold text-lg">Live Market Stats</h3>
                        <span className="text-green-400 text-sm flex items-center"><TrendingUp className="w-4 h-4 mr-1"/> +12% today</span>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: "Basmati 1121", price: "₹4,200", trend: "up" },
                            { label: "Sharbati Wheat", price: "₹3,100", trend: "up" },
                            { label: "Mustard", price: "₹5,400", trend: "stable" },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                                <span className="font-medium">{item.label}</span>
                                <span className="font-bold text-yellow-400">{item.price}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Trust Markers */}
      <section className="bg-white py-10 border-b">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all">
              {['NABARD Supported', 'Digital India', 'Secure Payments', 'ISO Certified'].map((t, i) => (
                  <span key={i} className="font-bold text-xl text-gray-400 flex items-center"><ShieldCheck className="w-6 h-6 mr-2"/> {t}</span>
              ))}
          </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why KisanSetu?</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">We solve the biggest problems in agriculture trading: Trust, Payment Security, and Logistics.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "100% Secure Payments", desc: "Payments are held in Escrow until you confirm delivery. No more delayed payments." },
              { icon: Truck, title: "Integrated Logistics", desc: "Don't worry about transport. We arrange trucks from farm to mandi at fixed rates." },
              { icon: Users, title: "Verified Network", desc: "Every buyer and farmer completes a strict KYC process with Aadhaar and Bank verification." }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="w-14 h-14 bg-agri-50 rounded-xl flex items-center justify-center mb-6 text-agri-600 group-hover:bg-agri-600 group-hover:text-white transition-colors">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <Sprout className="w-16 h-16 text-green-500 mx-auto mb-6" />
           <h2 className="text-4xl font-bold mb-6">Empowering the Indian Farmer</h2>
           <p className="text-gray-400 mb-10 text-lg">Join 50,000+ members who are getting better prices every day.</p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Button onClick={() => navigate('/auth')} className="bg-agri-600 hover:bg-agri-500 text-white px-8 h-12 text-lg">
                 Create Free Account
               </Button>
               <Button variant="outline" className="border-gray-600 text-gray-300 hover:text-white hover:border-white h-12 text-lg">
                 Contact Support
               </Button>
           </div>
        </div>
      </section>
    </div>
  );
};
