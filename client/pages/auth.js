import React, { useState, useEffect, useContext } from "react";
import Button from "../components/Button";
import { useGlobal } from "../contexts/Global";
import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisEVMAuth } from "@useorbis/db-sdk/auth";
import { useRouter } from 'next/router';

export default function Auth() {
    const { settings, setIsAdmin, setSessionJwt, isAdmin, getAdmin, init } = useGlobal();
    const router = useRouter();
    const [status, setStatus] = useState(0)

    /** Redirect user to home page if connected as admin */
    useEffect(() => {
        if(isAdmin) {
            router.push("/");
        }
    }, [isAdmin])

    async function login() {
        setStatus(1);
        let adminOrbisDB = new OrbisDB({
            ceramic: {
                gateway: settings?.configuration?.ceramic?.node,
            },
            nodes: [
              {
                  gateway: "http://localhost:7008"
              },
            ],
        });
        const auth = new OrbisEVMAuth(window.ethereum);

        // Connect with wallet using OrbisDB / Ceramic to retrieve address / DID
        const result = await adminOrbisDB.connectUser({ auth, saveSession: false });
        console.log("user:", result);

        // retrieve admins
        let resultAdmins = await getAdmin();
        console.log("resultAdmins:", resultAdmins);
         console.log("resultAdmins.admins?.includes(result.user.did)", resultAdmins?.includes(result.user.did));
        if(result?.user && resultAdmins?.includes(result.user.did)) {
            // Save admin session in localstorage
            localStorage.setItem("orbisdb-admin-session", result.session.session);
            init();
            //router.push('/');
        } else {
            setStatus(3);
            if(!result.user) {
                alert("Error connecting to the wallet.");
            } else {
                alert("User isn't one of the admins of the OrbisDB instance. Please connect with a different wallet.");
            }            
        }
    }

    return(
        <div className="flex justify-center">
            <div className="w-1/3 flex flex-col mt-12 bg-white border border-slate-200 p-6 rounded-md">
                <p className="font-medium text-center">Connect</p>
                <p className="text-base text-slate-600 mb-4 text-center">Please connect wit your admin DID in order to use this OrbisDB instance.</p>
                <Button title="Connect with Metamask" status={status} onClick={() => login()} />
            </div>
        </div>
    )
}