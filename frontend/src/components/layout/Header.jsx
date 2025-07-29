import React, { useState, useRef, useEffect } from "react";
import { FaBell } from "react-icons/fa";

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
;

  return (
    <header className="w-full px-4 sm:px-8 py-3 bg-gray-100">
      <div className="bg-rose-300 text-white rounded-2xl shadow-md px-6 py-4 flex justify-between items-center">
        {/* Título */}
        <h1 className="text-lg sm:text-xl font-bold">Bienvenido a Marriott_presst</h1>
      </div>
    </header>
  );
}
