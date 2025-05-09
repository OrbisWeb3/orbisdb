import Image from 'next/image'
import Link from 'next/link'
import ceramicLogo from "../public/ceramicLogo.png"

import { FaHome, FaUser, FaHashtag } from "react-icons/fa";
import { SidebarProps } from '../types';



export const Sidebar = ({name, username, id}: SidebarProps) => {

  return (
    <div className="sidebar">
      <div className="top">
        <div className="logoContainer">
          <Image
            src={ceramicLogo}
          />
        </div>
        <Link href = "/">
          <a>
            <FaHome /> Home
          </a>
        </Link>
        <Link href = {`/profile`}>
          <a>
            <FaUser /> Profile
          </a>
        </Link>
        <Link href = "/explore">
          <a>
            <FaHashtag /> Explore
          </a>
        </Link>
      </div>
      <div className="bottom">
        {name !== undefined ? (
          <div className="you">
            <b>{name}</b> <br />
            <Link href = {`user/${id}`}>
              <a>
              @{username}
              </a>
            </Link>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};
