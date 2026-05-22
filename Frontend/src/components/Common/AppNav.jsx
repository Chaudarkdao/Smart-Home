import { Link } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/iot", key: "iot", label: "📡 IoT" },
  { to: "/logsensor", key: "logsensor", label: "📊 Log Sensor" },
  { to: "/face", key: "face", label: "👤 Recognition" },
  { to: "/face/register", key: "face-register", label: "📝 Register" },
];

export default function AppNav({ active }) {
  return (
    <div className="iot-top-actions">
      {NAV_ITEMS.map(({ to, key, label }) => (
        <Link
          key={key}
          to={to}
          className={`iot-nav-pill${active === key ? " active" : ""}`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
