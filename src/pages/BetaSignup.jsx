import React, { useState } from 'react';
import { Mail, User, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const BetaSignup = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/beta-signup.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setStatus('success');
                setFormData({ name: '', email: '', message: '' });
            } else {
                setStatus('error');
                setErrorMessage(data.message || 'Något gick fel. Försök igen.');
            }
        } catch (err) {
            setStatus('error');
            setErrorMessage('Kunde inte skicka anmälan. Kontrollera din internetanslutning och försök igen.');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
                    <Sparkles size={32} className="text-accent" />
                </div>
                <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">
                    Välkommen till vår slutna beta!
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Första kapitlet är just nu i en sluten beta-fas. Vi bygger en unik plattform för bokälskare
                    och söker entusiastiska beta-testare som vill vara med och forma framtidens läsupplevelse.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                    Varför bli beta-testare?
                </h2>
                <ul className="space-y-3 text-gray-700 mb-6">
                    <li className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-accent flex-shrink-0 mt-0.5" />
                        <span>Få tidig tillgång till alla funktioner</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-accent flex-shrink-0 mt-0.5" />
                        <span>Påverka utvecklingen med din feedback</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-accent flex-shrink-0 mt-0.5" />
                        <span>Bli en del av vår community av bokälskare</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-accent flex-shrink-0 mt-0.5" />
                        <span>Gratis premiumfunktioner under betatiden</span>
                    </li>
                </ul>
            </div>

            {status === 'success' ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Tack för din anmälan!
                    </h3>
                    <p className="text-gray-700 mb-4">
                        Vi har tagit emot din anmälan och kommer att kontakta dig inom kort med mer information.
                    </p>
                    <button
                        onClick={() => setStatus('idle')}
                        className="text-accent hover:underline font-medium"
                    >
                        Anmäl någon annan
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
                        Anmäl dig som beta-testare
                    </h2>

                    {status === 'error' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800 text-sm">{errorMessage}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Namn
                            </label>
                            <div className="relative">
                                <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                    placeholder="Ditt namn"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                E-postadress
                            </label>
                            <div className="relative">
                                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                    placeholder="din@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Berätta om dig själv (valfritt)
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                                placeholder="Varför vill du bli beta-testare? Vad läser du helst?"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? 'Skickar...' : 'Skicka anmälan'}
                        </button>
                    </form>

                    <p className="mt-6 text-xs text-gray-500 text-center">
                        Genom att anmäla dig godkänner du att vi kontaktar dig via e-post angående beta-programmet.
                    </p>
                </div>
            )}
        </div>
    );
};

export default BetaSignup;
