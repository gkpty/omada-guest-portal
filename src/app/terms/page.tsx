export default function TermsPage() {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="mb-4">
          By accessing and using our Wi-Fi network, you agree to the following
          terms...
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>No illegal or harmful activity is allowed.</li>
          <li>Do not share the network with unauthorized users.</li>
          <li>Your activity may be monitored for security purposes.</li>
          <li>We are not responsible for data loss or interruptions.</li>
          <li>Respect bandwidth limits and other users.</li>
        </ul>
        <p className="mt-6 text-sm text-gray-500">
          If you do not agree to these terms, please do not use the Wi-Fi
          service.
        </p>
      </div>
    );
  }