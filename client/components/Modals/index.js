import React, { useRef, useContext, useState } from "react";
import useOutsideClick from "../../hooks/useOutsideClick";

export default function Modal({
  hide,
  children,
  title,
  description,
  style,
  className,
}) {
  const wrapperRef = useRef(null);

  /** Is triggered when clicked outside the component */
  useOutsideClick(wrapperRef, () => hide());

  return (
    <div
      className={"relative z-10"}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      style={style}
    >
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity blur-md backdrop-blur-sm cursor-pointer"></div>
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div
          className={
            "flex min-h-full items-start justify-center p-6 text-center sm:p-0 "
          }
        >
          <div
            className={
              "relative transform rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 w-96 sm:p-6 " +
              className
            }
            ref={wrapperRef}
          >
            {title && (
              <h2 className="text-center font-medium mb-1 w-full">{title}</h2>
            )}
            {description && (
              <p className="text-slate-500 text-base w-full text-center mb-1">
                {description}
              </p>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
