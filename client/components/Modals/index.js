import React, { useRef, useContext, useState } from "react";
import useOutsideClick from "../../hooks/useOutsideClick";

export default function Modal({hide, children}) {
  const wrapperRef = useRef(null);

  /** Is triggered when clicked outside the component */
  useOutsideClick(wrapperRef, () => hide());

  return(
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity blur-md backdrop-blur-sm cursor-pointer"></div>
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6" ref={wrapperRef}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
