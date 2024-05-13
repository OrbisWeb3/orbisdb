import { useEffect, useState } from "react";

export default function CryptoLibCheck() {
  const [hasCrypto, setHasCrypto] = useState(true);

  useEffect(
    () => setHasCrypto(typeof window.crypto.subtle !== "undefined"),
    []
  );

  if (hasCrypto) {
    return;
  }

  return (
    <div
      className={`rounded-md border-dashed border px-6 py-2 justify-center flex bg-red-50 border-red-200 text-red-800`}
    >
      <span className="text-center">
        OrbisDB is unable to access crypto libraries. This is most likely due to
        common browser security requirements.
        <br />
        If you're running this site in the cloud, make sure you've set up SSL
        and are accessing it via https://.
      </span>
    </div>
  );
}
