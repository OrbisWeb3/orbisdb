import React from "react";

export default function InternalNavigation({ items = [], nav, setNav }) {
  return (
    <div className="flex flex-row items-center rounded-full bg-white border border-slate-200 px-6 py-1.5 space-x-8">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => item.active && setNav(item.label)}
          disabled={!item.active}
          className={`text-sm focus:outline-none flex flex-row items-center space-x-1
             ${item.label === nav ? "text-[#4483FD] font-medium" : "text-[#666666] cursor-pointer hover:underline"}
             ${!item.active ? "text-[#C2C2C2] cursor-not-allowed" : ""}`}
        >
          {item.title ? item.title : item.label}
        </button>
      ))}
    </div>
  );
}
