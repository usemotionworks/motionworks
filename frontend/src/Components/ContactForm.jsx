import { useForm, ValidationError } from "@formspree/react";

function ContactForm() {
  const [state, handleSubmit] = useForm("mrerdzgv");
  if (state.succeeded) {
    return (
      <p className="text-[#EAE4D5] text-center">Thanks for your message!</p>
    );
  }
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto space-y-6 text-[#B6B09F]"
    >
      <div>
        <label htmlFor="name" className="block mb-1 text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="name"
          name="name"
          required
          className="w-full p-3 bg-transparent border border-[#B6B09F] rounded-md text-[#B6B09F] placeholder-[#B6B09F] focus:outline-none focus:ring-2 focus:ring-[#EAE4D5]"
        />
        <ValidationError
          prefix="Full Name"
          field="name"
          errors={state.errors}
          className="text-red-400 mt-1 text-sm"
        />
      </div>
      <div>
        <label htmlFor="email" className="block mb-1 text-sm font-medium">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          className="w-full p-3 bg-transparent border border-[#B6B09F] rounded-md text-[#B6B09F] placeholder-[#B6B09F] focus:outline-none focus:ring-2 focus:ring-[#EAE4D5]"
        />
        <ValidationError
          prefix="Email"
          field="email"
          errors={state.errors}
          className="text-red-400 mt-1 text-sm"
        />
      </div>

      <div>
        <label htmlFor="message" className="block mb-1 text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows="5"
          className="w-full p-3 bg-transparent border border-[#B6B09F] rounded-md text-[#B6B09F] placeholder-[#B6B09F] focus:outline-none focus:ring-2 focus:ring-[#EAE4D5]"
        />
        <ValidationError
          prefix="Message"
          field="message"
          errors={state.errors}
          className="text-red-400 mt-1 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={state.submitting}
        className="px-6 py-3 border border-[#B6B09F] text-[#B6B09F] hover:text-[#EAE4D5] hover:border-[#EAE4D5] rounded-md transition-colors duration-300 disabled:opacity-50"
      >
        {state.submitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}

export default ContactForm;
