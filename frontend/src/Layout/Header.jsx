import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/motion.png";
import { useUserStore } from "../store/useUserStore";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useUserStore(); // Removed logout since we're taking out the button

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Logic for the CTA path
  const getDistributePath = () => {
    if (!user) return "/login";
    return user.role === "admin" ? "/admin" : "/dashboard";
  };

  const navLinks = [
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  // Shared classes for the Distribute button to keep code DRY
  const ctaClasses =
    "bg-[#EAE4D5] text-[#0a0a0a] px-5 py-2 rounded-lg font-bold text-sm hover:bg-white transition duration-300 ease-in-out uppercase tracking-wider text-center";

  return (
    <header className="border-b border-[#B6B09F]/10 bg-[#050505]">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="font-bold">
              <img className="h-20 w-auto" src={logo} alt="Logo" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-[#B6B09F] hover:text-[#EAE4D5] font-medium transition duration-300"
              >
                {link.name}
              </Link>
            ))}

            {/* Distribute With Us CTA */}
            <Link to={getDistributePath()} className={ctaClasses}>
              {user ? "My Dashboard" : "Distribute With Us"}
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden focus:outline-none" onClick={toggleMenu}>
            <svg
              className="w-6 h-6 text-[#B6B09F]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-[#B6B09F]/10">
            <div className="flex flex-col space-y-4 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-[#B6B09F] hover:text-[#EAE4D5] font-medium py-1 transition duration-300"
                  onClick={toggleMenu}
                >
                  {link.name}
                </Link>
              ))}
              {/* 👈 Updated this line to match desktop logic */}
              <Link
                to={getDistributePath()}
                className={ctaClasses}
                onClick={toggleMenu}
              >
                {user ? "My Dashboard" : "Distribute With Us"}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
