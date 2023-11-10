import Link from 'next/link';
import { useRouter } from 'next/router';
import { DashIcon } from "./Icons";

export default function Header() {
  // Define navigation items and their paths
  const navItems = [
    { title: 'Projects', path: '/', type: "equal" },
    { title: 'Plugins', path: '/plugins', type: "includes" },
    { title: 'Data', path: '/data', type: "includes" },
    { title: 'Models', path: '/models', type: "includes" },
    { title: 'Settings', path: '/settings', type: "equal" }
  ];

  return(
    <div className="bg-white px-12 border-b border-slate-200 w-full flex flex-row items-center">
      <p className="font-monospace mr-4 font-medium">orbisDB</p>
      <DashIcon />
      <div className="flex space-x-9 flex-row items-center ml-6 text-sm text-slate-500 h-full">
        {navItems.map((item) => (
          <NavItem key={item.title} item={item} />
        ))}
      </div>
    </div>
  )
}

const NavItem = ({ item, href }) => {
  const router = useRouter();

  // Determine whether the current route matches the item's link
  let selected = false;
  if(item.type == "equal") {
    selected = router.pathname === item.path;
  } else if(item.type == "includes") {
    selected = router.pathname.includes(item.path);
  }

  if (selected) {
    return (
      <Link href={item.path} passHref>
        <div className="text-slate-900 text-base border-b border-slate-900 h-full py-4">{item.title}</div>
      </Link>
    );
  } else {
    return (
      <Link href={item.path} passHref>
        <div className="cursor-pointer hover:text-slate-800 h-full py-4">{item.title}</div>
      </Link>
    );
  }
};
