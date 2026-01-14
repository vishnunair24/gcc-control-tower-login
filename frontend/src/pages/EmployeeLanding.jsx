import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import customerLogo from "../assets/customer-logo.png";

// Simple employee landing page that lets an employee
// pick a customer (Infinite, VIP, Routeware, etc.).
// Clicking a tile routes into the app with ?customerName=...

export default function EmployeeLanding() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("http://localhost:3001/auth/customers", {
          withCredentials: true,
        });
        setCustomers(res.data || []);
      } catch (err) {
        console.error("Failed to load customers", err);
        setError("Failed to load customers");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSelect = (c) => {
    const name = c.customerName || c.name || "";
    if (!name) return;
    const search = new URLSearchParams({ customerName: name }).toString();
    navigate(`/dashboard?${search}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-2xl font-semibold mb-6">Select Customer</h1>
      {loading && <p>Loading customers…</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {customers.map((c) => {
          const label = c.customerName || c.name || "Customer";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c)}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              <img
                src={customerLogo}
                alt={label}
                className="h-16 mb-3 object-contain"
              />
              <span className="font-medium text-gray-800">{label}</span>
            </button>
          );
        })}

        {!loading && !error && customers.length === 0 && (
          <p className="text-gray-600 col-span-full">
            No customers found. Please ask an admin to create customer accounts.
          </p>
        )}
      </div>
    </div>
  );
}
