/**
 * Internal Login Page - Corporate Internal System
 * Intersnack Cashew Company
 */

import { useRouter } from 'next/router';
import { useState, useRef } from 'react';
import Head from 'next/head';
import { useAuth } from '../components/AuthProvider';
import { Mail, Lock, Shield, Database, Users, FileText } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { login } = useAuth();
  const formRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const handleSSOLogin = () => {
    // In production, this would redirect to Azure AD/SSO
    setError('SSO authentication not configured. Please use alternative sign-in.');
    setShowFallback(true);
  };

  const handleFallbackLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate email domain
      if (!email.endsWith('@intersnack.com') && !email.endsWith('@intersnack.com.vn')) {
        setError('Authentication failed. Please use corporate SSO or contact the system administrator.');
        setLoading(false);
        return;
      }

      // Check password (simple length check, real validation on backend)
      if (password.length < 5) {
        setError('Authentication failed. Please use corporate SSO or contact the system administrator.');
        setLoading(false);
        return;
      }

      // Login successful
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Authentication failed. Please use corporate SSO or contact the system administrator.');
      setLoading(false);
    }
  };

  const triggerFormSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <>
      <Head>
        <title>Internal Login - Intersnack Cashew Company</title>
        <meta name="description" content="Internal forecasting and market intelligence system" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-white relative overflow-x-hidden font-sans flex flex-col">
        {/* Background Image - Mandatory use of BG_landingpage.png - Increased clarity */}
        <div
          className="fixed inset-0 z-0 opacity-100 select-none pointer-events-none"
          style={{
            backgroundImage: 'url(/assets/images/bg-landing.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Content Container - No blur/overlay for maximum background image clarity */}
        <div className="relative z-10 flex-1 flex flex-col bg-transparent">

          {/* Header */}
          <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md shrink-0">
            <div className="w-full max-w-[1800px] mx-auto px-6 lg:px-12">
              <div className="flex items-center justify-between h-14">
                {/* Logo & Branding */}
                <div className="flex items-center gap-3">
                  <img src="/assets/images/logo-icon.png" alt="Intersnack" className="h-8 w-8" />
                  <div className="border-l border-slate-300 pl-3">
                    <div className="text-[#1D222C] font-bold text-base leading-tight tracking-tight">Intersnack Cashew Company</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Internal Portal</div>
                  </div>
                </div>

                {/* Non-clickable informational labels */}
                <nav className="hidden lg:flex items-center gap-6">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
                    Forecasting Modules
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
                    Market Intelligence
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
                    Parity Tool
                  </span>
                </nav>

                {/* Right side text */}
                <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-[#CC3236]" />
                  <span className="hidden sm:inline">Internal Access</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content - Centered but scrollable if zoom is high */}
          <main className="flex-1 flex flex-col justify-center py-5 lg:py-8">
            <div className="w-full max-w-[1800px] mx-auto px-6 lg:px-12">
              <div className="grid lg:grid-cols-12 gap-8 xl:gap-16 items-center">

                {/* Left Column - 60% (3/5) */}
                <div className="w-full lg:col-span-6 space-y-6 lg:space-y-8 max-w-2xl xl:max-w-4xl">
                  {/* Updated Headline - Cashew Analytics Platform */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#1D222C] leading-[1.1] tracking-tight">
                    Cashew Analytics Platform
                    <br />
                    <span className="text-[#CC3236] font-semibold opacity-90 text-xl sm:text-2xl lg:text-2xl xl:text-3xl">Strategic Decisions</span>
                  </h1>

                  {/* Supporting description */}
                  <p className="text-base sm:text-lg lg:text-xl text-slate-700 leading-relaxed font-medium bg-white/30 p-2 rounded-lg inline-block">
                    Consolidation of global market signals, historical pricing data,
                    and predictive insights for procurement planning.
                  </p>

                  {/* Functional Label */}
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#1D222C] text-white font-bold text-[10px] uppercase tracking-widest rounded-md shadow-lg">
                      <Shield className="w-4 h-4 text-[#CC3236]" />
                      AUTHORIZED ACCESS ONLY
                    </div>
                  </div>
                </div>

                {/* Right Column - 40% (2/5) - Login Panel */}
                <div id="auth-panel" className="lg:col-span-6 w-full max-w-sm ml-auto lg:max-w-md">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-br from-[#CC3236]/10 to-transparent rounded-[2rem] blur-2xl opacity-40" />

                    <div className="relative bg-white/70 backdrop-blur-md border border-white/20 rounded-[1.5rem] shadow-2xl p-6 sm:p-10">
                      {/* Access title */}
                      <div className="text-center mb-6">
                        <h3 className="text-lg sm:text-xl font-bold text-[#1D222C] mb-1 uppercase tracking-tight">
                          Identity Verification
                        </h3>
                        <p className="text-xs text-slate-600 font-semibold">
                          Restricted to Intersnack identity accounts.
                        </p>
                      </div>

                      {/* Primary SSO Button */}
                      <button
                        onClick={() => window.location.href = '/api/v1/auth/azure/login'}
                        className="w-full py-4 bg-[#CC3236] text-white font-bold rounded-xl shadow-lg shadow-[#CC3236]/20 hover:shadow-xl hover:bg-[#B02D31] transition-all flex items-center justify-center gap-3 mb-6 text-sm sm:text-base active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21">
                          <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                          <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                          <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                          <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                        </svg>
                        Sign in with Microsoft
                      </button>

                      {/* Divider */}
                      <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center text-[9px] font-bold uppercase tracking-widest">
                          <span className="px-3 bg-white/0 text-slate-500">Authentication Gateway</span>
                        </div>
                      </div>

                      {/* Secondary Access - More distinct */}
                      <div className="space-y-4">
                        <button
                          onClick={() => setShowFallback(!showFallback)}
                          className="w-full text-[10px] text-slate-700 hover:text-[#CC3236] font-bold uppercase tracking-widest transition-colors py-2 border border-white/40 rounded-lg hover:bg-white/50"
                        >
                          {showFallback ? "Back to SSO" : "Alternative verification"}
                        </button>

                        {/* Fallback form */}
                        {showFallback && (
                          <form ref={formRef} onSubmit={handleFallbackLogin} className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Intersnack identity domain"
                                required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#CC3236]/10 focus:border-[#CC3236] transition-all outline-none font-medium text-xs"
                              />
                            </div>

                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Access Credentials"
                                required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#CC3236]/10 focus:border-[#CC3236] transition-all outline-none font-medium text-xs"
                              />
                            </div>

                            {error && (
                              <div className="bg-red-50 border border-red-100 text-[#CC3236] px-3 py-2.5 rounded-lg text-[10px] font-bold leading-relaxed text-center">
                                {error}
                              </div>
                            )}

                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full py-3.5 bg-[#1D222C] text-white font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50 text-[11px] uppercase tracking-widest active:scale-95"
                            >
                              {loading ? 'Verifying...' : 'Authorize Access'}
                            </button>
                          </form>
                        )}
                      </div>

                      {/* Status Footer */}
                      <div className="mt-8 pt-4 border-t border-slate-50 text-center">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                          Domain-Locked Security Environment
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Factual System Indicators */}
              <div className="mt-12 lg:mt-24">
                <div className="bg-white/40 backdrop-blur-[2px] border border-white/30 rounded-[1.5rem] p-4 lg:p-6 max-w-7xl mx-auto shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">

                    <div className="flex flex-col items-start pt-6 md:pt-0 first:pt-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <Database className="w-5 h-5 text-slate-700" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">System Scope</span>
                      </div>
                      <p className="text-[12px] text-slate-600 font-semibold leading-relaxed">
                        Raw material monitoring and forecasting.
                      </p>
                    </div>

                    <div className="flex flex-col items-start md:pl-8 pt-6 md:pt-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <FileText className="w-5 h-5 text-slate-700" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Market Data</span>
                      </div>
                      <p className="text-[12px] text-slate-600 font-semibold leading-relaxed">
                        Market pricing and intelligence data.
                      </p>
                    </div>

                    <div className="flex flex-col items-start md:pl-8 pt-6 md:pt-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <Users className="w-5 h-5 text-slate-700" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Maintenance</span>
                      </div>
                      <p className="text-[12px] text-slate-600 font-semibold leading-relaxed">
                        Restricted operational access.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Minimal Footer */}
          <footer className="py-4 border-t border-slate-100 bg-white/80 text-center shrink-0">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Intersnack Cashew Company - Internal Use Only
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
