import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

function Sidebar() {
  const location = useLocation();
  const search = location.search || "";

  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`, {
          withCredentials: true,
        });
        if (mounted) setUser(res.data);
      } catch {
        if (mounted) setUser(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className="fixed top-0 left-0 w-52 bg-gray-900 text-white h-screen p-4">
      <h2 className="text-lg font-semibold mb-6">Navigation</h2>

      <nav className="space-y-3">
        <Link
          to={{ pathname: "/dashboard", search }}
          className="block hover:text-gray-300"
        >
          Dashboard
        </Link>

        {/* Hide detailed trackers for customers; they see only Dashboard */}
        {user?.role !== "customer" && (
          <>
            <Link
              to={{ pathname: "/tracker", search }}
              className="block hover:text-gray-300"
            >
              Tracker
            </Link>

            <Link
              to={{ pathname: "/program-intelligence", search }}
              className="block hover:text-gray-300"
            >
              Program Intelligence
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
