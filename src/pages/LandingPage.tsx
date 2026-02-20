import { Link } from "react-router-dom";
import {
    CheckCircle2,
    Star,
    Menu,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import KrishiScroll from "@/components/KrishiScroll";
import { motion, useScroll, useTransform } from "framer-motion";

// Partner logos - using text placeholders
const partners = [
    "The Times of India",
    "agFunder",
    "agriBazaar",
    "YourStory",
    "ICRISAT"
];

// Benefits
const benefits = [
    {
        title: "Reduce Water & Fertilizer Waste",
        description: "KrishiSense optimizes usage based on real needs."
    },
    {
        title: "Increase Yield Stability",
        description: "Improves crop consistency and health."
    },
    {
        title: "Reduce Manual Effort",
        description: "Automates observations & actions."
    }
];

// Testimonials
const testimonials = [
    {
        name: "Mahesh",
        rating: 5,
        text: "KrishiSense helped me reduce fertilizer usage by 30% and improved my crop yield, amazingly. It's like having a smart assistant.",
        avatar: "M"
    },
    {
        name: "Ananya",
        rating: 4,
        text: "It's amazing to see how KrishiSense adapts to my farm's needs. I save time and water, and my crops are healthier.",
        avatar: "A"
    }
];

const LandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Parallax Logic
    const benefitsRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: benefitsRef,
        offset: ["start end", "end start"]
    });

    // Background moves slower than scroll (depth effect)
    const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
    // Text moves slightly faster/upward to create separation
    const textY = useTransform(scrollYProgress, [0, 1], ["0px", "-120px"]);

    return (
        <div className="min-h-screen bg-[#fdfcf7]" style={{ fontFamily: "'Roboto', sans-serif" }}>
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/25 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="KrishiSense" className="h-8 w-8" />
                            <span className="font-display font-bold text-xl text-[#2d5a27]">KrishiSense</span>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#home" className="text-sm font-medium text-gray-700 hover:text-[#2d5a27] transition-colors">Home</a>
                            <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-[#2d5a27] transition-colors">How It Works</a>
                            <a href="#features" className="text-sm font-medium text-gray-700 hover:text-[#2d5a27] transition-colors">Features</a>
                            <a href="#testimonials" className="text-sm font-medium text-gray-700 hover:text-[#2d5a27] transition-colors">Testimonials</a>
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center gap-3">
                            <Button variant="ghost" className="text-gray-700">Log In</Button>
                            <Link to="/dashboard">
                                <Button className="bg-[#2d5a27] hover:bg-[#1e3d1a] text-white rounded-full px-6">
                                    Get Started
                                </Button>
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden p-2"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4">
                        <div className="flex flex-col gap-4">
                            <a href="#home" className="text-sm font-medium text-gray-700">Home</a>
                            <a href="#how-it-works" className="text-sm font-medium text-gray-700">How It Works</a>
                            <a href="#features" className="text-sm font-medium text-gray-700">Features</a>
                            <a href="#testimonials" className="text-sm font-medium text-gray-700">Testimonials</a>
                            <Link to="/dashboard">
                                <Button className="w-full bg-[#2d5a27] hover:bg-[#1e3d1a] text-white rounded-full">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section id="home" className="relative min-h-screen flex items-start pt-32 lg:pt-40 overflow-hidden">
                {/* Background Image - full opacity */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/herobg.png')" }}
                />

                {/* Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full">
                    <div className="max-w-2xl">
                        <h1
                            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight mb-6"
                            style={{ fontFamily: "'Roboto', sans-serif" }}
                        >
                            Transforming Farms<br />
                            <span className="text-[#2d5a27]">Into Intelligent Systems</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-lg">
                            KrishiSense continuously learns and adapts to make smarter irrigation and fertilization decisions, tailored for your farm.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap gap-4">
                            <Link to="/dashboard">
                                <Button
                                    size="lg"
                                    className="bg-[#2d5a27]/80 hover:bg-[#2d5a27] text-white rounded-xl px-10 py-6 h-14 text-base font-semibold shadow-lg"
                                >
                                    Get Started
                                </Button>
                            </Link>
                            <a href="#how-it-works">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="rounded-xl px-10 py-6 h-14 text-base font-semibold border-2 border-gray-300 bg-white/50 hover:bg-white/80 hover:border-[#2d5a27] hover:text-[#2d5a27]"
                                >
                                    <span className="mr-2">👁️</span> See How It Works
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works - Scrollytelling Section */}
            <KrishiScroll />

            {/* Key Benefits Section (Parallax) */}
            <section ref={benefitsRef} id="features" className="relative min-h-screen flex items-center overflow-hidden">
                {/* Parallax Background */}
                <motion.div
                    className="absolute w-full h-[140%] -top-[20%] bg-cover bg-center will-change-transform"
                    style={{
                        backgroundImage: "url('/benefits.png')",
                        y: bgY
                    }}
                />

                <motion.div
                    style={{ y: textY }}
                    className="relative z-10 w-full max-w-7xl ml-[15%] px-4 sm:px-6 lg:px-8 py-20"
                >
                    <div>
                        {/* Content */}
                        <div className="max-w-xl">
                            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                Key Benefits of <span className="text-[#2d5a27]">KrishiSense</span>
                            </h2>
                            <p className="text-white mb-8">
                                KrishiSense optimizes usage based on real needs.
                            </p>

                            <div className="space-y-6 mb-10">
                                {benefits.map((benefit) => (
                                    <div key={benefit.title} className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2d5a27] flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">{benefit.title}</h4>
                                            <p className="text-sm text-white/80">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* App Store Buttons */}
                            <div className="flex gap-4">
                                <button className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                    </svg>
                                    <div className="text-left">
                                        <div className="text-[10px] opacity-80">Download on the</div>
                                        <div className="text-sm font-semibold">App Store</div>
                                    </div>
                                </button>
                                <button className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                                    </svg>
                                    <div className="text-left">
                                        <div className="text-[10px] opacity-80">Get it on</div>
                                        <div className="text-sm font-semibold">Google Play</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="relative py-20 overflow-hidden">
                {/* Background - Upper half of image */}
                <div
                    className="absolute inset-0 w-full h-full bg-cover bg-top"
                    style={{ backgroundImage: "url('/feedback.png')" }}
                />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Hear From Farmers Using <span className="text-[#2d5a27]">KrishiSense</span>
                        </h2>
                        <p className="text-gray-600">
                            Turn your farm into a learning, adaptive system.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.name}
                                className="bg-[#f8f7f2] rounded-2xl p-8"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-[#2d5a27] flex items-center justify-center text-white font-bold text-lg">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    "{testimonial.text}"
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#2d5a27] text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="KrishiSense" className="h-8 w-8 brightness-0 invert" />
                            <span className="font-display font-bold text-xl">KrishiSense</span>
                        </div>
                        <p className="text-sm text-white/70">
                            Built with ❤️ by Team GRAVITON
                        </p>
                        <div className="flex gap-6">
                            <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Terms</a>
                            <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
