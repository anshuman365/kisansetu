import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/UI';
import { ArrowRight, CheckCircle, TrendingUp, ShieldCheck } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-agri-900 via-agri-800 to-agri-700 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-agri-600 bg-opacity-50 border border-agri-400 text-agri-100 text-sm font-semibold mb-6">
            Trusted by 50,000+ Farmers
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Apni Fasal, <br className="sm:hidden" />
            <span className="text-yellow-400">Apni Keemat.</span>
          </h1>
          <p className="text-xl text-agri-100 max-w-2xl mx-auto mb-10">
            India's most trusted digital mandi. Sell your crop directly to buyers at the best market rates. Secure, Transparent, and Fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold border-none" onClick={() => navigate('/post-order')}>
              Sell Crop Now
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-agri-900" onClick={() => navigate('/browse')}>
              Browse Market
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: TrendingUp, title: "Best Rates", desc: "Get competitive bidding from multiple verified traders." },
              { icon: ShieldCheck, title: "Secure Deals", desc: "Escrow payment protection for every transaction." },
              { icon: CheckCircle, title: "Easy Verification", desc: "Simple KYC process to build your trust score." }
            ].map((f, i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-agri-600">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <h2 className="text-2xl font-bold mb-4">Ready to get the best price?</h2>
           <p className="text-gray-400 mb-8">Join thousands of farmers improving their livelihood with KisanSetu.</p>
           <Button onClick={() => navigate('/auth')} className="bg-agri-600 hover:bg-agri-500 text-white">
             Join Now <ArrowRight className="ml-2 w-4 h-4"/>
           </Button>
        </div>
      </section>
    </div>
  );
};