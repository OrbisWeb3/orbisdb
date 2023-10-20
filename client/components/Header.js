import Link from 'next/link';
import { useRouter } from 'next/router';
import { DashIcon } from "./Icons";

export default function Header() {
  // Define navigation items and their paths
  const navItems = [
    { title: 'Project', path: '/' },
    { title: 'Data', path: '/data' },
    { title: 'Contexts', path: '/contexts' },
    { title: 'Plugins', path: '/plugins' },
    { title: 'Settings', path: '/settings' }
  ];

  return(
    <div className="bg-white px-12 border-b border-slate-200 w-full flex flex-row items-center">
      <p className="font-monospace mr-4 font-medium">orbisDB</p>
      <DashIcon />
      <div className="flex space-x-9 flex-row items-center ml-6 text-sm text-slate-500 h-full">
        {navItems.map((item) => (
          <NavItem key={item.title} title={item.title} href={item.path} />
        ))}
      </div>
    </div>
  )
}

const NavItem = ({ title, href }) => {
  const router = useRouter();

  // Determine whether the current route matches the item's link
  const selected = router.pathname === href;

  if (selected) {
    return (
      <div className="text-slate-900 text-base border-b border-slate-900 h-full py-4">{title}</div>
    );
  } else {
    return (
      <Link href={href} passHref>
        <div className="cursor-pointer hover:text-slate-800 h-full py-4">{title}</div>
      </Link>
    );
  }
};
