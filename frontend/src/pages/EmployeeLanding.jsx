import { useNavigate } from "react-router-dom";

// Static client configuration.
// Drop PNGs with these names into /public/client-logos to update logos.
const CLIENTS = [
  { id: "infinite", label: "Infinite", customerName: "Infinite", logo: "/client-logos/Infinite.png" },
  { id: "vip", label: "VIP", customerName: "VIP", logo: "/client-logos/VIP.png" },
  { id: "routeware", label: "Routeware", customerName: "Routeware", logo: "/client-logos/Routeware.png" },
  { id: "nasuni", label: "Nasuni", customerName: "Nasuni", logo: "/client-logos/Nasuni.png" },
  { id: "acumatica", label: "Acumatica", customerName: "Acumatica", logo: "/client-logos/Acumatica.png" },
  { id: "alkami", label: "Alkami", customerName: "Alkami", logo: "/client-logos/Alkami.png" },
  { id: "comply", label: "Comply", customerName: "Comply", logo: "/client-logos/Comply.png" },
];

export default function EmployeeLanding() {
  const navigate = useNavigate();

  const handleSelect = (client) => {
    const name = client.customerName || client.label;
    const search = new URLSearchParams({ customerName: name }).toString();
    navigate(`/dashboard?${search}`);
  };

  return (
    <div className="employee-landing-page">
      <div className="employee-landing-mountains">
        <div className="employee-mountain-layer back" />
        <div className="employee-mountain-layer mid" />
        <div className="employee-mountain-layer front" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 text-center flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
        <h1 className="text-3xl font-semibold mb-2 text-gray-900">Select Customer</h1>
        <p className="mb-8 text-sm text-gray-700">
          Choose a customer to view their dashboards and trackers.
        </p>

        {/* Centered logo grid that can spread out slightly but remains as one block */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 justify-items-center">
          {CLIENTS.map((client) => {
            const label = client.label;
            const initial = (label[0] || "C").toUpperCase();
            return (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelect(client)}
                className="bg-white hover:bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transition p-4 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                <div className="w-20 h-20 flex items-center justify-center mb-3">
                  {client.logo ? (
                    <img
                      src={client.logo}
                      alt={client.label}
                      className="max-h-20 max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xl font-semibold">
                      {initial}
                    </div>
                  )}
                </div>
                <span className="font-medium text-gray-900 text-sm">
                  {client.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
