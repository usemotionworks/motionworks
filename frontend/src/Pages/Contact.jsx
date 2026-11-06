import { Mail, Phone, MapPin } from "lucide-react";
import { useForm, ValidationError } from "@formspree/react";
import ContactForm from "../Components/ContactForm";
import useSEO from "../hooks/useSEO";

export default function Contact() {
  useSEO({
    title: "Contact Us",
    description:
      "Get in touch with Motion Works. We're here to help you with your music needs.",
  });

  return (
    <div className="p-6 md:p-12 text-[#B6B09F]">
      {/* Updated Contact Us heading to match About Us styling */}
      <div className="flex flex-col items-center justify-center mb-12">
        <h1 className="text-[#B6B09F] hover:text-[#EAE4D5] text-5xl md:text-6xl lg:text-7xl font-bold mb-6 transition duration-300">
          Contact Us
        </h1>
      </div>

      {/* First Div: Contact Info in Three Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-center">
        <div className="hover:text-[#EAE4D5] transition-colors duration-300">
          <Mail className="mx-auto mb-2" size={32} />
          <h3 className="text-lg font-semibold mb-1">Email</h3>
          <p>info@motionworks.com</p>
        </div>
        <div className="hover:text-[#EAE4D5] transition-colors duration-300">
          <Phone className="mx-auto mb-2" size={32} />
          <h3 className="text-lg font-semibold mb-1">Phone</h3>
          <p>+234(816) 231-7196</p>
          <p>+234(816) 813-8171</p>
        </div>
        <div className="hover:text-[#EAE4D5] transition-colors duration-300">
          <MapPin className="mx-auto mb-2" size={32} />
          <h3 className="text-lg font-semibold mb-1">Address</h3>
          <p>Lagos, Nigeria</p>
        </div>
      </div>

      {/* Second Div: Contact Form */}
      <ContactForm />
    </div>
  );
}
